-- Fix Citibank SG config for real PDF statements
--
-- Real Citibank SG PDFs have image-only summary pages (1-6) with no extractable text.
-- The "Statement Period" and "NEW TRANSACTIONS" markers only exist on those pages.
-- Text extraction starts at the transaction detail pages (7+).
--
-- Changes:
-- 1. Add period_fallback to infer statement period from transaction dates + Payment Due Date year
-- 2. Remove section_markers (NEW TRANSACTIONS not in extractable text, SUB-TOTAL cuts off too early)
-- 3. Add skip patterns for card numbers (XXXX-XXXX-XXXX-NNNN) and per-page headers
-- 4. Keep statement_period.pattern for PDFs that DO have it (backward compatible)

UPDATE bank_configs
SET config = '{
  "statement_period": {
    "pattern": "Statement\\s+Period[:\\s]+(.+?)\\s+to\\s+(.+)",
    "date_format": "dd/MM/yyyy"
  },
  "period_fallback": {
    "year_hint_pattern": "Payment Due Date:\\s+(.+?)\\s*$",
    "year_hint_format": "MMMM d, yyyy",
    "strategy": "infer_from_transactions"
  },
  "transaction": {
    "line_pattern": "^(\\d{2}\\s+[A-Z]{3})\\s+(.+?)\\s+(\\(?[\\d,]+\\.\\d{2}\\)?)$",
    "date_format": "dd MMM",
    "credit_indicator": "parentheses",
    "description_continuation": true
  },
  "skip_patterns": [
    "BALANCE PREVIOUS STATEMENT",
    "SUB-TOTAL",
    "TOTAL",
    "Card No\\.",
    "REWARDS SUMMARY",
    "PAYMENT DUE DATE",
    "MINIMUM PAYMENT",
    "CREDIT LIMIT",
    "NEW TRANSACTIONS",
    "^XXXX-XXXX-XXXX-\\d{4}$",
    "TRANSACTIONS FOR",
    "ALL TRANSACTIONS BILLED",
    "DATE\\s+DESCRIPTION\\s+AMOUNT",
    "^Page \\d+ of \\d+",
    "EPSTCSX",
    "Co Reg No",
    "Citibank Singapore",
    "Robinson Road",
    "CITI CASH BACK",
    "Retail Interest Rate",
    "monthly interest charges",
    "KINDLY ENSURE",
    "KINDLY CALL",
    "^\\d{10,}$",
    "^1000$"
  ]
}'::jsonb,
updated_at = NOW()
WHERE bank_name = 'Citibank'
  AND country_code = 'SG'
  AND statement_type = 'credit_card';
