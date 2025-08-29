-- Add layout field to projects table to store custom article layouts
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS layout jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.projects.layout IS 'Custom article layout with draggable content blocks';