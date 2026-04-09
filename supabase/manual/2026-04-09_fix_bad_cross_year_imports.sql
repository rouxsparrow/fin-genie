-- Manual remediation for the Citibank SG fallback Dec/Jan rollover bug.
--
-- Problem shape:
-- - A statement that should span Dec 2025 -> Jan 2026 was imported with some
--   December rows stored as 2026-12-xx.
-- - The safest remediation is to identify the affected import(s), export a
--   snapshot, delete those import(s), deploy the parser fix, then re-import the
--   original PDF(s).
--
-- This file is intentionally NOT a migration. Run sections manually after
-- reviewing the result sets.

-- ============================================================================
-- 1. Audit candidate imports
-- ============================================================================
--
-- This finds imports that contain both January 2026 rows and December 2026 rows,
-- which is the suspicious signature for the broken Jan 2026 statement import.

WITH suspicious_imports AS (
  SELECT
    i.id AS import_id,
    i.file_name,
    i.created_at,
    i.statement_period_start,
    i.statement_period_end,
    i.transaction_count,
    COUNT(*) FILTER (
      WHERE t.transaction_date >= DATE '2026-01-01'
        AND t.transaction_date < DATE '2026-02-01'
    ) AS jan_2026_rows,
    COUNT(*) FILTER (
      WHERE t.transaction_date >= DATE '2026-12-01'
        AND t.transaction_date < DATE '2027-01-01'
    ) AS dec_2026_rows,
    MIN(t.transaction_date) AS min_tx_date,
    MAX(t.transaction_date) AS max_tx_date
  FROM imports i
  JOIN transactions t ON t.import_id = i.id
  GROUP BY
    i.id,
    i.file_name,
    i.created_at,
    i.statement_period_start,
    i.statement_period_end,
    i.transaction_count
)
SELECT *
FROM suspicious_imports
WHERE jan_2026_rows > 0
  AND dec_2026_rows > 0
ORDER BY created_at NULLS LAST, import_id;

-- If you already know the date window is broader or different, adjust the query.
-- A second useful heuristic is imports whose statement span is implausibly large:

SELECT
  i.id AS import_id,
  i.file_name,
  i.statement_period_start,
  i.statement_period_end,
  (i.statement_period_end - i.statement_period_start) AS statement_span_days,
  COUNT(t.id) AS tx_count
FROM imports i
LEFT JOIN transactions t ON t.import_id = i.id
WHERE i.statement_period_start IS NOT NULL
  AND i.statement_period_end IS NOT NULL
GROUP BY i.id, i.file_name, i.statement_period_start, i.statement_period_end
HAVING (i.statement_period_end - i.statement_period_start) > 62
ORDER BY statement_span_days DESC, i.id;

-- ============================================================================
-- 2. Preview the suspicious rows for one import
-- ============================================================================
--
-- Replace the UUID before running.

-- SELECT
--   t.id,
--   t.import_id,
--   t.transaction_date,
--   t.description,
--   t.amount_cents,
--   t.is_debit,
--   t.category_id,
--   t.transaction_hash,
--   t.created_at
-- FROM transactions t
-- WHERE t.import_id = 'REPLACE_WITH_IMPORT_ID'::uuid
-- ORDER BY t.transaction_date, t.created_at, t.id;

-- ============================================================================
-- 3. Snapshot the affected import before deletion
-- ============================================================================
--
-- Run these SELECTs and save the output externally before deleting anything.

-- SELECT * FROM imports WHERE id = 'REPLACE_WITH_IMPORT_ID'::uuid;
-- SELECT * FROM transactions WHERE import_id = 'REPLACE_WITH_IMPORT_ID'::uuid ORDER BY transaction_date, created_at, id;

-- ============================================================================
-- 4. Preferred remediation: delete the bad import and re-import after parser fix
-- ============================================================================
--
-- Why delete + re-import:
-- - transaction_hash includes the date, so wrong dates mean wrong hashes
-- - the app also passes a sequence index into the hash generator during parsing
-- - that sequence is not stored as an explicit DB column, so exact hash rebuild is
--   not reliable from persisted rows alone
--
-- Replace the UUID before running. Keep this inside one transaction.

-- BEGIN;
--
-- DELETE FROM transactions
-- WHERE import_id = 'REPLACE_WITH_IMPORT_ID'::uuid;
--
-- DELETE FROM imports
-- WHERE id = 'REPLACE_WITH_IMPORT_ID'::uuid;
--
-- COMMIT;

-- ============================================================================
-- 5. Post-delete verification
-- ============================================================================

-- SELECT COUNT(*) FROM imports WHERE id = 'REPLACE_WITH_IMPORT_ID'::uuid;
-- SELECT COUNT(*) FROM transactions WHERE import_id = 'REPLACE_WITH_IMPORT_ID'::uuid;

-- ============================================================================
-- 6. Risky fallback: in-place date repair
-- ============================================================================
--
-- Only use this if the original PDF is unavailable and you have manually confirmed
-- the affected import. This can repair the stored dates and import period, but exact
-- transaction_hash reconstruction may still diverge from what the parser would have
-- generated because parser sequence ordering is not stored directly in the schema.
--
-- If you still choose this path, you must:
-- - export a full snapshot first
-- - update only the confirmed bad import
-- - accept that duplicate detection for those rows may not perfectly match a clean
--   re-import

-- Example preview for the rows that would be shifted back one year:
--
-- SELECT
--   t.id,
--   t.transaction_date AS old_date,
--   (t.transaction_date - INTERVAL '1 year')::date AS new_date,
--   t.description,
--   t.amount_cents
-- FROM transactions t
-- WHERE t.import_id = 'REPLACE_WITH_IMPORT_ID'::uuid
--   AND t.transaction_date >= DATE '2026-12-01'
--   AND t.transaction_date < DATE '2027-01-01'
-- ORDER BY t.transaction_date, t.created_at, t.id;
