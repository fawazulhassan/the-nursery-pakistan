-- Reviews system: table, RLS policies, and storage policies

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_email text,
  reviewer_city text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  show_on_homepage boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
CREATE POLICY "Public can read approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public bucket for review photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view review images" ON storage.objects;
CREATE POLICY "Public can view review images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'review-images'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Admins can update review images" ON storage.objects;
CREATE POLICY "Admins can update review images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'review-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete review images" ON storage.objects;
CREATE POLICY "Admins can delete review images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'review-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
