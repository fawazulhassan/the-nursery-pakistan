-- Force-reset INSERT policies for guest checkout consistency.
-- This removes any unknown/legacy INSERT policy combinations that can cause RLS conflicts.

ALTER TABLE public.orders
ALTER COLUMN user_id DROP NOT NULL;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', p.policyname);
  END LOOP;
END
$$;

CREATE POLICY "Users or guests create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

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
