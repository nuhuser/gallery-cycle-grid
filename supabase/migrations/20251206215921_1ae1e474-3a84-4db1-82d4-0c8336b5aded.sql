-- Create resume_categories table
CREATE TABLE public.resume_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.resume_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Resume categories are publicly viewable" 
ON public.resume_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create resume categories" 
ON public.resume_categories 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update resume categories" 
ON public.resume_categories 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete resume categories" 
ON public.resume_categories 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resume_categories_updated_at
BEFORE UPDATE ON public.resume_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();