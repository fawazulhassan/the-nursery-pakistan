-- Allow guests to track only their own guest order by full UUID reference and
-- matching checkout email. Do not replace this function with anonymous SELECT
-- policies on orders or order_items; those tables must remain protected by RLS.

CREATE OR REPLACE FUNCTION public.track_guest_order(
  p_order_reference uuid,
  p_customer_email text
)
RETURNS TABLE (
  order_reference uuid,
  status text,
  order_date timestamptz,
  total_amount numeric,
  payment_method text,
  payment_status text,
  items jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id AS order_reference,
    o.status,
    o.created_at AS order_date,
    o.total_amount,
    o.payment_method,
    o.payment_status,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', COALESCE(p.name, 'Product unavailable'),
            'image_url', p.image_url,
            'quantity', oi.quantity,
            'unit_price', oi.price
          )
          ORDER BY oi.created_at, oi.id
        )
        FROM public.order_items AS oi
        LEFT JOIN public.products AS p ON p.id = oi.product_id
        WHERE oi.order_id = o.id
      ),
      '[]'::jsonb
    ) AS items
  FROM public.orders AS o
  WHERE o.id = p_order_reference
    AND (
      o.user_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM auth.users AS auth_user
        WHERE auth_user.id = o.user_id
          AND auth_user.is_anonymous IS TRUE
      )
    )
    AND trim(COALESCE(p_customer_email, '')) <> ''
    AND lower(trim(COALESCE(o.customer_email, ''))) = lower(trim(p_customer_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_guest_order(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_guest_order(uuid, text) TO anon, authenticated;

COMMENT ON FUNCTION public.track_guest_order(uuid, text) IS
  'Returns a privacy-limited guest or anonymous-session order only when the full UUID and checkout email match; registered-user orders are excluded.';
