-- Add project_type column to distinguish between regular projects and work experience
ALTER TABLE public.projects 
ADD COLUMN project_type text NOT NULL DEFAULT 'project' 
CHECK (project_type IN ('project', 'work'));