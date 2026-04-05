-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Updated_at trigger function (reused across all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- Profiles table (per D-24, D-25, D-26, D-28, D-29)
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_household_id ON profiles(household_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- All authenticated users in the same household can read all profiles
CREATE POLICY "Users can view household profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- Only admins can insert new profiles
CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admins can update profiles (role changes)
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================================================
-- Categories table (per D-26, D-25, D-29, INFR-01)
-- =============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_household_id ON categories(household_id);

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================================================
-- Rules table (per D-26, D-25, D-29)
-- =============================================================================
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'substring' CHECK (match_type IN ('substring', 'regex')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_household_id ON rules(household_id);
CREATE INDEX idx_rules_sort_order ON rules(sort_order);

CREATE TRIGGER update_rules_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household rules"
  ON rules FOR SELECT
  TO authenticated
  USING (
    household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage rules"
  ON rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================================================
-- Imports table (per D-26, D-25, D-29)
-- =============================================================================
CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  file_name TEXT NOT NULL,
  statement_period_start DATE,
  statement_period_end DATE,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_imports_household_id ON imports(household_id);

ALTER TABLE imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household imports"
  ON imports FOR SELECT
  TO authenticated
  USING (
    household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can create imports"
  ON imports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================================================
-- Transactions table (per D-26, D-25, D-29, INFR-01)
-- =============================================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  is_debit BOOLEAN NOT NULL DEFAULT TRUE,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX idx_transactions_household_id ON transactions(household_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
