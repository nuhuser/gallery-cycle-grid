-- Fix the security issue by implementing proper user-based access controls
-- This ensures only project owners can modify their projects

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

-- Create secure user-based policies
-- Users can only create projects with their own user_id
CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own projects
CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own projects  
CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create a profiles table for admin user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone (for portfolio attribution)
CREATE POLICY "Profiles are publicly viewable" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  RETURN NEW;
END;
$$;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();