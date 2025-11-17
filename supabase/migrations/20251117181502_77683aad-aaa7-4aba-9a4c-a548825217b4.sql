-- Add DELETE policy for user_roles table so users can delete their own roles when switching
CREATE POLICY "Users can delete own roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);