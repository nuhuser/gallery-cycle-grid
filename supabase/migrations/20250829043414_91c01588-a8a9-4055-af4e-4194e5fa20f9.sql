-- Change projects.date from DATE to TEXT to support free-form dates like "Winter 2023"
ALTER TABLE public.projects
  ALTER COLUMN "date" TYPE text USING "date"::text;

-- Keep NOT NULL and set a sensible default for new rows
ALTER TABLE public.projects
  ALTER COLUMN "date" SET DEFAULT (CURRENT_DATE::text);
