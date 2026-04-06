-- Fix: split the self-referencing SELECT policy into two separate policies.
-- PostgreSQL ORs multiple policies together, so having a simple "own profile"
-- policy provides the base case that breaks the circular subquery dependency.

DROP POLICY IF EXISTS "Users can view household profiles" ON profiles;

-- Policy 1: Users can always read their own profile row (no subquery needed)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Users can read other profiles in their household
-- This subquery works because Policy 1 guarantees the user's own row is readable,
-- so the subquery can resolve auth.uid()'s household_id via Policy 1.
CREATE POLICY "Users can view household profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );
