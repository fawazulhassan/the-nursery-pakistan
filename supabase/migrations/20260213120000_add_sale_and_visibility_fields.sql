-- Add sale date and quantity limit fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sale_start_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sale_end_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sale_quantity_limit INTEGER,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
