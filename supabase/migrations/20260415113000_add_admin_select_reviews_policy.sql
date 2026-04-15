-- Allow admins to read all reviews in moderation panel
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;

CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
