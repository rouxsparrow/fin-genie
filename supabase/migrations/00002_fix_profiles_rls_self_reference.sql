-- Fix self-referencing RLS policy on profiles table
-- The original policy's subquery reads from profiles to check household_id,
-- but that read also needs to pass the same policy — creating circular dependency.
-- Adding `id = auth.uid()` as a base case lets users always read their own profile.

DROP POLICY IF EXISTS "Users can view household profiles" ON profiles;

CREATE POLICY "Users can view household profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );
