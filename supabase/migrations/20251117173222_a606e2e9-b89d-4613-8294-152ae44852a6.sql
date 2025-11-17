-- Add INSERT policy for user_roles
-- Allow users to create their own role entry during signup
CREATE POLICY "Users can insert own role during signup"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);