-- Allow guest checkout by permitting nullable user_id on orders
ALTER TABLE public.orders
ALTER COLUMN user_id DROP NOT NULL;

-- Replace restrictive insert policy for authenticated-only orders
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users or guests can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

-- Replace restrictive insert policy for authenticated-only order items
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users or guests can create order items for their orders" ON public.order_items;
CREATE POLICY "Users or guests can create order items for their orders"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
        OR (auth.uid() IS NULL AND orders.user_id IS NULL)
      )
  )
);

-- Allow stock validation/stock processing during guest checkout
CREATE OR REPLACE FUNCTION public.validate_stock(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  result jsonb := '[]'::jsonb;
  product_record record;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, stock_quantity, in_stock
    INTO product_record
    FROM public.products
    WHERE id = (item->>'product_id')::uuid;

    IF product_record.id IS NULL THEN
      result := result || jsonb_build_object(
        'product_id', item->>'product_id',
        'valid', false,
        'error', 'Product not found'
      );
    ELSIF NOT product_record.in_stock OR product_record.stock_quantity < (item->>'quantity')::integer THEN
      result := result || jsonb_build_object(
        'product_id', item->>'product_id',
        'name', product_record.name,
        'valid', false,
        'available', product_record.stock_quantity,
        'requested', (item->>'quantity')::integer,
        'error', 'Insufficient stock'
      );
    ELSE
      result := result || jsonb_build_object(
        'product_id', item->>'product_id',
        'valid', true
      );
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_order_stock(p_items jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF NOT public.decrease_stock((item->>'product_id')::uuid, (item->>'quantity')::integer) THEN
      RAISE EXCEPTION 'Insufficient stock for product %', item->>'product_id';
    END IF;
  END LOOP;

  RETURN true;
END;
$$;
