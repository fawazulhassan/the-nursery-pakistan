ALTER TABLE public.completed_projects
ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.slugify_text(input text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := lower(coalesce(input, ''));
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
  normalized := regexp_replace(normalized, '^-+|-+$', '', 'g');
  IF normalized = '' THEN
    normalized := 'project';
  END IF;
  RETURN left(normalized, 80);
END;
$$;

DO $$
DECLARE
  project_record record;
  base_slug text;
  candidate_slug text;
  suffix int;
BEGIN
  FOR project_record IN
    SELECT id, title
    FROM public.completed_projects
    WHERE slug IS NULL OR btrim(slug) = ''
    ORDER BY created_at ASC, id ASC
  LOOP
    base_slug := public.slugify_text(project_record.title);
    candidate_slug := base_slug;
    suffix := 2;

    WHILE EXISTS (
      SELECT 1
      FROM public.completed_projects
      WHERE slug = candidate_slug
        AND id <> project_record.id
    ) LOOP
      candidate_slug := left(base_slug, 75) || '-' || suffix::text;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.completed_projects
    SET slug = candidate_slug
    WHERE id = project_record.id;
  END LOOP;
END;
$$;

ALTER TABLE public.completed_projects
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS completed_projects_slug_key
ON public.completed_projects (slug);
