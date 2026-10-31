ALTER TABLE public.orders ADD COLUMN customer_note text;

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

  IF NEW.customer_note IS DISTINCT FROM OLD.customer_note
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.customer_note := OLD.customer_note;
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.create_checkout_order(numeric, text, text, text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_total_amount numeric,
  p_shipping_address text,
  p_phone_number text,
  p_payment_method text,
  p_payment_status text,
  p_customer_name text,
  p_customer_email text,
  p_items jsonb,
  p_customer_note text default null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_user_id uuid := auth.uid();
  v_customer_note text;
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_price numeric;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Checkout requires at least one item';
  END IF;

  v_customer_note := NULLIF(btrim(p_customer_note), '');
  IF v_customer_note IS NOT NULL AND char_length(v_customer_note) > 500 THEN
    RAISE EXCEPTION 'Order note must be 500 characters or fewer';
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
    customer_email,
    customer_note
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
    p_customer_email,
    v_customer_note
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

REVOKE ALL ON FUNCTION public.create_checkout_order(numeric, text, text, text, text, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(numeric, text, text, text, text, text, text, jsonb, text) TO anon, authenticated, service_role;
