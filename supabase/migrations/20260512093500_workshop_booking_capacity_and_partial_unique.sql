-- Bookings default to status 'new' but capacity and slot counts used only 'confirmed',
-- so the UI showed "0/X" while UNIQUE(slot_id, email) rejected duplicate submits as 23505.
-- Count all non-cancelled bookings for capacity/UI; dedupe emails per slot except when cancelled.

ALTER TABLE public.workshop_bookings
  DROP CONSTRAINT IF EXISTS workshop_bookings_slot_id_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS workshop_bookings_slot_email_active_uidx
  ON public.workshop_bookings (slot_id, lower(trim(email)))
  WHERE status <> 'cancelled';

CREATE OR REPLACE FUNCTION public.get_confirmed_booking_counts_by_slots(p_slot_ids uuid[])
RETURNS TABLE (slot_id uuid, cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wb.slot_id, COUNT(*)::bigint AS cnt
  FROM public.workshop_bookings wb
  WHERE wb.slot_id = ANY (p_slot_ids)
    AND wb.status <> 'cancelled'
  GROUP BY wb.slot_id;
$$;

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
  active_booking_count integer;
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
  INTO active_booking_count
  FROM public.workshop_bookings wb
  WHERE wb.slot_id = p_slot_id
    AND wb.status <> 'cancelled';

  IF active_booking_count >= slot_record.capacity THEN
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
    COALESCE(NULLIF(trim(p_booking_data->>'status'), ''), 'new')
  )
  RETURNING * INTO booking_row;

  RETURN booking_row;
END;
$$;
