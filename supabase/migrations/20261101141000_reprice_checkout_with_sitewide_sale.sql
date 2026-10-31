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
  v_computed_total numeric := 0;
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_price numeric;
  v_base_price numeric;
  v_product_percent numeric;
  v_product_start timestamptz;
  v_product_end timestamptz;
  v_product_applied numeric;
  v_sitewide jsonb;
  v_site_percent numeric := 0;
  v_site_candidate numeric;
  v_applied numeric;
  v_start_ok boolean;
  v_end_ok boolean;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Checkout requires at least one item';
  END IF;

  v_customer_note := NULLIF(btrim(p_customer_note), '');
  IF v_customer_note IS NOT NULL AND char_length(v_customer_note) > 500 THEN
    RAISE EXCEPTION 'Order note must be 500 characters or fewer';
  END IF;

  SELECT value_json INTO v_sitewide
  FROM public.site_settings
  WHERE key = 'sitewide_sale';

  IF v_sitewide IS NOT NULL THEN
    BEGIN
      IF COALESCE((v_sitewide->>'enabled')::boolean, false)
        AND (v_sitewide->>'percentage') ~ '^[0-9]+$'
      THEN
        v_site_candidate := (v_sitewide->>'percentage')::numeric;
        IF v_site_candidate >= 10 AND v_site_candidate <= 30 THEN
          v_start_ok := true;
          v_end_ok := true;
          IF NULLIF(v_sitewide->>'starts_at', '') IS NOT NULL THEN
            v_start_ok := NULLIF(v_sitewide->>'starts_at', '')::timestamptz <= now();
          END IF;
          IF NULLIF(v_sitewide->>'ends_at', '') IS NOT NULL THEN
            v_end_ok := NULLIF(v_sitewide->>'ends_at', '')::timestamptz >= now();
          END IF;
          IF v_start_ok AND v_end_ok THEN
            v_site_percent := v_site_candidate;
          END IF;
        END IF;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_site_percent := 0;
    END;
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
    0,
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

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', item->>'product_id';
    END IF;

    SELECT price, sale_percentage, sale_start_at, sale_end_at
    INTO v_base_price, v_product_percent, v_product_start, v_product_end
    FROM public.products
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', item->>'product_id';
    END IF;

    IF v_base_price IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', item->>'product_id';
    END IF;

    v_product_applied := 0;
    IF v_product_percent IS NOT NULL
      AND v_product_percent > 0
      AND (v_product_start IS NULL OR v_product_start <= now())
      AND (v_product_end IS NULL OR v_product_end >= now())
    THEN
      v_product_applied := v_product_percent;
    END IF;

    v_applied := GREATEST(v_product_applied, v_site_percent);
    v_price := ROUND(v_base_price * (100 - v_applied) / 100);

    IF NOT public.decrease_stock(v_product_id, v_quantity) THEN
      RAISE EXCEPTION 'Insufficient stock for product %', item->>'product_id';
    END IF;

    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (v_order_id, v_product_id, v_quantity, v_price);

    v_computed_total := v_computed_total + (v_price * v_quantity);
  END LOOP;

  UPDATE public.orders
  SET total_amount = v_computed_total
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout_order(numeric, text, text, text, text, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(numeric, text, text, text, text, text, text, jsonb, text) TO anon, authenticated, service_role;
