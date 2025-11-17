-- Fix: Restrict profile access to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);