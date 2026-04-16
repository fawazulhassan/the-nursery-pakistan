CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.completed_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  cover_image_url text NOT NULL,
  gallery_image_urls text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS handle_completed_projects_updated_at ON public.completed_projects;
CREATE TRIGGER handle_completed_projects_updated_at
  BEFORE UPDATE ON public.completed_projects
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS handle_consultation_requests_updated_at ON public.consultation_requests;
CREATE TRIGGER handle_consultation_requests_updated_at
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

ALTER TABLE public.completed_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read completed projects" ON public.completed_projects;
CREATE POLICY "Public can read completed projects"
ON public.completed_projects
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert completed projects" ON public.completed_projects;
CREATE POLICY "Admins can insert completed projects"
ON public.completed_projects
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update completed projects" ON public.completed_projects;
CREATE POLICY "Admins can update completed projects"
ON public.completed_projects
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete completed projects" ON public.completed_projects;
CREATE POLICY "Admins can delete completed projects"
ON public.completed_projects
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public can insert consultation requests" ON public.consultation_requests;
CREATE POLICY "Public can insert consultation requests"
ON public.consultation_requests
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can read consultation requests"
ON public.consultation_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can update consultation requests"
ON public.consultation_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can delete consultation requests"
ON public.consultation_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO storage.buckets (id, name, public)
VALUES ('landscaping-images', 'landscaping-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view landscaping images" ON storage.objects;
CREATE POLICY "Public can view landscaping images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'landscaping-images');

DROP POLICY IF EXISTS "Admins can upload landscaping images" ON storage.objects;
CREATE POLICY "Admins can upload landscaping images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'landscaping-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can update landscaping images" ON storage.objects;
CREATE POLICY "Admins can update landscaping images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'landscaping-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete landscaping images" ON storage.objects;
CREATE POLICY "Admins can delete landscaping images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'landscaping-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
