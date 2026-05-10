-- Guests cannot SELECT consultation_requests or workshop_bookings (admin-only SELECT policies).
-- Direct insert().select('id') and slot capacity queries therefore fail for anon users.
-- These SECURITY DEFINER RPCs return only non-sensitive aggregates / new row id.

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
    AND wb.status = 'confirmed'
  GROUP BY wb.slot_id;
$$;

REVOKE ALL ON FUNCTION public.get_confirmed_booking_counts_by_slots(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_confirmed_booking_counts_by_slots(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_consultation_request(
  p_full_name text,
  p_email text,
  p_phone_number text,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF trim(COALESCE(p_full_name, '')) = '' OR trim(COALESCE(p_email, '')) = '' OR trim(COALESCE(p_phone_number, '')) = '' THEN
    RAISE EXCEPTION 'full_name, email, and phone_number are required';
  END IF;

  INSERT INTO public.consultation_requests (full_name, email, phone_number, message, status)
  VALUES (
    trim(p_full_name),
    trim(p_email),
    trim(p_phone_number),
    NULLIF(trim(COALESCE(p_message, '')), ''),
    'new'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_consultation_request(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_consultation_request(text, text, text, text) TO anon, authenticated;
