-- Fix security vulnerability: Restrict profiles table access to owner only
-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optional: Create a policy for admins to view all profiles if needed
-- Uncomment if admin functionality requires viewing other profiles
-- CREATE POLICY "Admins can view all profiles" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles 
--     WHERE user_id = auth.uid() AND is_admin = true
--   )
-- );