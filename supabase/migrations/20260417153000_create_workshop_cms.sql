CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  workshop_date timestamptz NOT NULL,
  cover_image_url text NOT NULL,
  gallery_image_urls text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workshop_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  slot_label text NOT NULL,
  slot_start_at timestamptz NOT NULL,
  slot_end_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slot_end_at > slot_start_at)
);

CREATE TABLE IF NOT EXISTS public.workshop_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES public.workshop_slots(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_id, email)
);

CREATE INDEX IF NOT EXISTS workshops_display_order_idx ON public.workshops (display_order, created_at DESC);
CREATE INDEX IF NOT EXISTS workshop_slots_workshop_id_idx ON public.workshop_slots (workshop_id, slot_start_at);
CREATE INDEX IF NOT EXISTS workshop_bookings_slot_status_idx ON public.workshop_bookings (slot_id, status);
CREATE INDEX IF NOT EXISTS workshop_bookings_workshop_id_idx ON public.workshop_bookings (workshop_id, created_at DESC);

DROP TRIGGER IF EXISTS handle_workshops_updated_at ON public.workshops;
CREATE TRIGGER handle_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS handle_workshop_slots_updated_at ON public.workshop_slots;
CREATE TRIGGER handle_workshop_slots_updated_at
  BEFORE UPDATE ON public.workshop_slots
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

DROP TRIGGER IF EXISTS handle_workshop_bookings_updated_at ON public.workshop_bookings;
CREATE TRIGGER handle_workshop_bookings_updated_at
  BEFORE UPDATE ON public.workshop_bookings
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active workshops" ON public.workshops;
CREATE POLICY "Public can read active workshops"
ON public.workshops
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can read all workshops" ON public.workshops;
CREATE POLICY "Admins can read all workshops"
ON public.workshops
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert workshops" ON public.workshops;
CREATE POLICY "Admins can insert workshops"
ON public.workshops
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update workshops" ON public.workshops;
CREATE POLICY "Admins can update workshops"
ON public.workshops
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete workshops" ON public.workshops;
CREATE POLICY "Admins can delete workshops"
ON public.workshops
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public can read active workshop slots" ON public.workshop_slots;
CREATE POLICY "Public can read active workshop slots"
ON public.workshop_slots
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.workshops w
    WHERE w.id = workshop_id
      AND w.is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can read all workshop slots" ON public.workshop_slots;
CREATE POLICY "Admins can read all workshop slots"
ON public.workshop_slots
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert workshop slots" ON public.workshop_slots;
CREATE POLICY "Admins can insert workshop slots"
ON public.workshop_slots
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update workshop slots" ON public.workshop_slots;
CREATE POLICY "Admins can update workshop slots"
ON public.workshop_slots
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete workshop slots" ON public.workshop_slots;
CREATE POLICY "Admins can delete workshop slots"
ON public.workshop_slots
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can read workshop bookings" ON public.workshop_bookings;
CREATE POLICY "Admins can read workshop bookings"
ON public.workshop_bookings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update workshop bookings" ON public.workshop_bookings;
CREATE POLICY "Admins can update workshop bookings"
ON public.workshop_bookings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete workshop bookings" ON public.workshop_bookings;
CREATE POLICY "Admins can delete workshop bookings"
ON public.workshop_bookings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.create_booking_if_available(
  p_slot_id uuid,
  p_booking_data jsonb
)
RETURNS public.workshop_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slot_record public.workshop_slots%ROWTYPE;
  confirmed_count integer;
  booking_row public.workshop_bookings%ROWTYPE;
  booking_email text;
  attendee_name text;
BEGIN
  SELECT ws.*
  INTO slot_record
  FROM public.workshop_slots ws
  JOIN public.workshops w ON w.id = ws.workshop_id
  WHERE ws.id = p_slot_id
    AND ws.is_active = true
    AND w.is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot is unavailable.';
  END IF;

  SELECT COUNT(*)
  INTO confirmed_count
  FROM public.workshop_bookings wb
  WHERE wb.slot_id = p_slot_id
    AND wb.status = 'confirmed';

  IF confirmed_count >= slot_record.capacity THEN
    RAISE EXCEPTION 'This slot is fully booked.';
  END IF;

  booking_email := lower(trim(COALESCE(p_booking_data->>'email', '')));
  attendee_name := trim(COALESCE(p_booking_data->>'attendee_name', ''));
  IF booking_email = '' THEN
    RAISE EXCEPTION 'Email is required.';
  END IF;
  IF attendee_name = '' THEN
    RAISE EXCEPTION 'Attendee name is required.';
  END IF;

  INSERT INTO public.workshop_bookings (
    workshop_id,
    slot_id,
    full_name,
    email,
    phone_number,
    notes,
    status
  )
  VALUES (
    slot_record.workshop_id,
    p_slot_id,
    attendee_name,
    booking_email,
    trim(COALESCE(p_booking_data->>'phone_number', '')),
    NULLIF(trim(COALESCE(p_booking_data->>'notes', '')), ''),
    COALESCE(NULLIF(p_booking_data->>'status', ''), 'new')
  )
  RETURNING * INTO booking_row;

  RETURN booking_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_if_available(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_if_available(uuid, jsonb) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-images', 'workshop-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view workshop images" ON storage.objects;
CREATE POLICY "Public can view workshop images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'workshop-images');

DROP POLICY IF EXISTS "Admins can upload workshop images" ON storage.objects;
CREATE POLICY "Admins can upload workshop images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'workshop-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can update workshop images" ON storage.objects;
CREATE POLICY "Admins can update workshop images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'workshop-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete workshop images" ON storage.objects;
CREATE POLICY "Admins can delete workshop images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'workshop-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
