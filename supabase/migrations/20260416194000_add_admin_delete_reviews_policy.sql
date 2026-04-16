DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
