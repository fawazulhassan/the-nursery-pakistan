-- Normalize checkout insert policies to avoid role mismatch edge cases.
-- This keeps one deterministic policy per table for both authenticated and guest requests.

-- Keep guest checkout compatibility on schema level
ALTER TABLE public.orders
ALTER COLUMN user_id DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- orders: collapse overlapping INSERT policies into one TO public policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users or guests can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users or guests create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users create orders" ON public.orders;
DROP POLICY IF EXISTS "Guests create orders" ON public.orders;

CREATE POLICY "Users or guests create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- ---------------------------------------------------------------------------
-- order_items: collapse overlapping INSERT policies into one TO public policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users or guests can create order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users or guests create order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users create order items" ON public.order_items;
DROP POLICY IF EXISTS "Guests create order items" ON public.order_items;

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
