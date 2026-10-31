ALTER TABLE public.orders ADD COLUMN admin_dispatch_note text;

CREATE OR REPLACE FUNCTION public.protect_admin_dispatch_note()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.admin_dispatch_note IS DISTINCT FROM OLD.admin_dispatch_note
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.admin_dispatch_note := OLD.admin_dispatch_note;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_admin_dispatch_note ON public.orders;

CREATE TRIGGER protect_admin_dispatch_note
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_dispatch_note();
