-- Bank format configurations for config-driven PDF parsing (D-16, D-17, IMPT-03)

CREATE TABLE bank_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  statement_type TEXT NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_configs_household_id ON bank_configs(household_id);

ALTER TABLE bank_configs ENABLE ROW LEVEL SECURITY;

-- RLS: all authenticated household members can view configs
CREATE POLICY "Users can view bank configs"
  ON bank_configs FOR SELECT
  TO authenticated
  USING (household_id = get_my_household_id());

-- RLS: only admins can manage configs
CREATE POLICY "Admins can manage bank configs"
  ON bank_configs FOR ALL
  TO authenticated
  USING (is_admin());

CREATE TRIGGER update_bank_configs_updated_at
  BEFORE UPDATE ON bank_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed: Citibank SG Credit Card config
INSERT INTO bank_configs (household_id, name, bank_name, country_code, statement_type, config, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Citibank SG Credit Card',
  'Citibank',
  'SG',
  'credit_card',
  '{
    "statement_period": {
      "pattern": "Statement\\s+Period[:\\s]+(.+?)\\s+to\\s+(.+)",
      "date_format": "dd/MM/yyyy"
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
      "NEW TRANSACTIONS"
    ],
    "section_markers": {
      "start": "NEW TRANSACTIONS",
      "end": "SUB-TOTAL"
    }
  }'::jsonb,
  TRUE
);
