-- Add sale_percentage column to products table
ALTER TABLE public.products 
ADD COLUMN sale_percentage numeric CHECK (sale_percentage >= 0 AND sale_percentage <= 100) DEFAULT NULL;