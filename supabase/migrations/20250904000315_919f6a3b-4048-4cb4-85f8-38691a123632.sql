-- Add logo_url and logo_link columns to projects table
ALTER TABLE public.projects 
ADD COLUMN logo_url TEXT,
ADD COLUMN logo_link TEXT;