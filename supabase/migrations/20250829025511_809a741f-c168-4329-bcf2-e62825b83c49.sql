-- Fix security warnings for function search paths
DROP FUNCTION IF EXISTS public.generate_slug();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate the functions with proper search_path settings
CREATE OR REPLACE FUNCTION public.generate_slug()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.projects WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || extract(epoch from now())::int;
    END LOOP;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;