-- Enable the trigger for profile creation on signup
-- This trigger was already defined but we need to make sure it's attached

-- First, drop the existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that automatically creates a profile when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the profiles table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Add an index to user_roles for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);