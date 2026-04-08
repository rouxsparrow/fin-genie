-- Clean up orphan import records (from failed imports that didn't clean up)
-- Deletes imports that have zero matching transactions in the transactions table
DELETE FROM imports
WHERE id NOT IN (
  SELECT DISTINCT import_id FROM transactions WHERE import_id IS NOT NULL
);
