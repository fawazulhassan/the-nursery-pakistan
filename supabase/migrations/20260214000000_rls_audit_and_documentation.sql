-- =============================================================================
-- RLS AUDIT AND DOCUMENTATION (Task T1.1)
-- =============================================================================
-- This migration documents and tightens Row-Level Security policies.
-- 
-- TABLES WITH RLS ENABLED:
-- - profiles: User profiles. Users see/update own; admins see all.
-- - user_roles: Role assignments. Users see own; admins see all. INSERT/UPDATE/DELETE 
--   only via handle_new_user trigger (SECURITY DEFINER).
-- - products: Product catalog. Public read; admins full CRUD.
-- - orders: Customer orders. Users see/create own; admins see/update all.
-- - order_items: Order line items. Users see/create for own orders; admins full access.
-- - delivery_addresses: Saved addresses. Users full CRUD on own; admins can view all.
-- - storage.objects (product-images bucket): Public read; admins upload/update/delete.
--
-- CART: Stored client-side (CartContext). No database table. No RLS needed.
-- =============================================================================

-- Add admin policy for delivery_addresses (support: view customer addresses)
CREATE POLICY "Admins can view all delivery addresses"
ON public.delivery_addresses
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for order_items (support: fix order line items)
CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure validate_stock and process_order_stock require authenticated user
-- (defense in depth: these are called during checkout; user must be logged in)
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to validate stock';
  END IF;

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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to process order';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF NOT public.decrease_stock((item->>'product_id')::uuid, (item->>'quantity')::integer) THEN
      RAISE EXCEPTION 'Insufficient stock for product %', item->>'product_id';
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Add table comments for RLS documentation
COMMENT ON TABLE public.profiles IS 'User profiles. RLS: users view/update own; admins view all. INSERT via handle_new_user trigger.';
COMMENT ON TABLE public.user_roles IS 'Role assignments. RLS: users view own; admins view all. INSERT only via handle_new_user trigger.';
COMMENT ON TABLE public.products IS 'Product catalog. RLS: public SELECT; admins INSERT/UPDATE/DELETE.';
COMMENT ON TABLE public.orders IS 'Customer orders. RLS: users SELECT/INSERT own; admins SELECT/UPDATE all.';
COMMENT ON TABLE public.order_items IS 'Order line items. RLS: users SELECT/INSERT for own orders; admins full CRUD.';
COMMENT ON TABLE public.delivery_addresses IS 'Saved delivery addresses. RLS: users full CRUD on own; admins SELECT all.';
