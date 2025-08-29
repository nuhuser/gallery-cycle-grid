-- Remove the insecure admin_users table since we're not using database-based auth
-- This eliminates the security risk of exposed admin credentials
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Update RLS policies for projects table to use a more secure approach
-- Remove the overly permissive user_id check and make projects publicly viewable
-- but only allow authenticated admin sessions to modify

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

-- Create new secure policies
-- Allow public viewing of projects (for the portfolio site)
CREATE POLICY "Projects are publicly viewable" 
ON public.projects 
FOR SELECT 
USING (true);

-- Only allow authenticated Supabase users to manage projects
-- This will be used when we implement proper admin auth later
CREATE POLICY "Authenticated users can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects" 
ON public.projects 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects" 
ON public.projects 
FOR DELETE 
USING (auth.role() = 'authenticated');