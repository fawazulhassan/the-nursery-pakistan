-- Add stock_quantity column to products table
ALTER TABLE public.products ADD COLUMN stock_quantity integer NOT NULL DEFAULT 10;

-- Add constraint to ensure stock_quantity is never negative
ALTER TABLE public.products ADD CONSTRAINT stock_quantity_non_negative CHECK (stock_quantity >= 0);

-- Create a function to safely decrease stock (prevents race conditions)
CREATE OR REPLACE FUNCTION public.decrease_stock(p_product_id uuid, p_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT stock_quantity INTO current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;
  
  -- Check if enough stock
  IF current_stock IS NULL OR current_stock < p_quantity THEN
    RETURN false;
  END IF;
  
  -- Decrease stock
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity,
      in_stock = CASE WHEN (stock_quantity - p_quantity) > 0 THEN true ELSE false END,
      updated_at = now()
  WHERE id = p_product_id;
  
  RETURN true;
END;
$$;

-- Create a function to validate stock availability for multiple products
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

-- Create a function to process order and decrease all stocks atomically
CREATE OR REPLACE FUNCTION public.process_order_stock(p_items jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  success boolean := true;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF NOT public.decrease_stock((item->>'product_id')::uuid, (item->>'quantity')::integer) THEN
      success := false;
      -- Rollback will happen automatically if we raise an exception
      RAISE EXCEPTION 'Insufficient stock for product %', item->>'product_id';
    END IF;
  END LOOP;
  
  RETURN success;
END;
$$;