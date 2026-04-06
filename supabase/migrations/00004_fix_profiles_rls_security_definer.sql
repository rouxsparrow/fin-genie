-- Fix infinite recursion in profiles RLS policies.
-- A SECURITY DEFINER function bypasses RLS when looking up the caller's
-- household_id and role, breaking the circular dependency.

-- Helper: get current user's household_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM profiles WHERE id = auth.uid()
$$;

-- Helper: check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view household profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Recreate with SECURITY DEFINER functions (no self-referencing subqueries)
CREATE POLICY "Users can view household profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (household_id = get_my_household_id());

CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Also fix other tables that reference profiles for admin checks
-- (these aren't recursive but benefit from the cleaner function pattern)

-- Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view household categories" ON categories;
CREATE POLICY "Users can view household categories"
  ON categories FOR SELECT
  TO authenticated
  USING (household_id = get_my_household_id());

-- Rules
DROP POLICY IF EXISTS "Admins can manage rules" ON rules;
CREATE POLICY "Admins can manage rules"
  ON rules FOR ALL
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view household rules" ON rules;
CREATE POLICY "Users can view household rules"
  ON rules FOR SELECT
  TO authenticated
  USING (household_id = get_my_household_id());

-- Imports
DROP POLICY IF EXISTS "Admins can create imports" ON imports;
CREATE POLICY "Admins can create imports"
  ON imports FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users can view household imports" ON imports;
CREATE POLICY "Users can view household imports"
  ON imports FOR SELECT
  TO authenticated
  USING (household_id = get_my_household_id());

-- Transactions
DROP POLICY IF EXISTS "Admins can manage transactions" ON transactions;
CREATE POLICY "Admins can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view household transactions" ON transactions;
CREATE POLICY "Users can view household transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (household_id = get_my_household_id());
