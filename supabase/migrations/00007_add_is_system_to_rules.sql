ALTER TABLE rules ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION prevent_system_rule_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system = TRUE THEN
    RAISE EXCEPTION 'System rules cannot be modified or deleted';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_system_rule_delete
  BEFORE DELETE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_rule_modification();

CREATE TRIGGER prevent_system_rule_update
  BEFORE UPDATE ON rules
  FOR EACH ROW
  WHEN (OLD.is_system = TRUE)
  EXECUTE FUNCTION prevent_system_rule_modification();
