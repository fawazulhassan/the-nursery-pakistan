INSERT INTO public.site_settings (key, value_json)
VALUES ('sitewide_sale', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can read sitewide sale" ON public.site_settings;
CREATE POLICY "Anyone can read sitewide sale"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key = 'sitewide_sale');
