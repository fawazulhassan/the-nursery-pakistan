-- Stabilize guest checkout:
-- 1) Persist customer details for admin visibility.
-- 2) Normalize order_items INSERT policy for auth + guest.
-- 3) Provide one transactional checkout RPC to prevent partial writes.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_items'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items', p.policyname);
  END LOOP;
END
$$;

CREATE POLICY "Users or guests create order items for their orders"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
        OR
        (auth.uid() IS NULL AND orders.user_id IS NULL)
      )
  )
);

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_total_amount numeric,
  p_shipping_address text,
  p_phone_number text,
  p_payment_method text,
  p_payment_status text,
  p_customer_name text,
  p_customer_email text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_user_id uuid := auth.uid();
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_price numeric;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Checkout requires at least one item';
  END IF;

  INSERT INTO public.orders (
    id,
    user_id,
    total_amount,
    status,
    shipping_address,
    phone_number,
    payment_method,
    payment_status,
    customer_name,
    customer_email
  )
  VALUES (
    v_order_id,
    v_user_id,
    p_total_amount,
    'pending',
    p_shipping_address,
    p_phone_number,
    p_payment_method,
    p_payment_status,
    p_customer_name,
    p_customer_email
  );

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::integer;
    v_price := (item->>'price')::numeric;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', item->>'product_id';
    END IF;

    IF NOT public.decrease_stock(v_product_id, v_quantity) THEN
      RAISE EXCEPTION 'Insufficient stock for product %', item->>'product_id';
    END IF;

    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (v_order_id, v_product_id, v_quantity, v_price);
  END LOOP;

  RETURN v_order_id;
END;
$$;
