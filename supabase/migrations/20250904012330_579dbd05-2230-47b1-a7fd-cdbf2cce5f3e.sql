-- Add company field to projects table
ALTER TABLE public.projects 
ADD COLUMN company TEXT;