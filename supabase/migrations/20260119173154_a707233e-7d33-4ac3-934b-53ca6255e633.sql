-- Add payment tracking columns to orders table
ALTER TABLE public.orders
ADD COLUMN payment_method text NOT NULL DEFAULT 'cod',
ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid';

-- Add check constraint for valid payment methods
ALTER TABLE public.orders
ADD CONSTRAINT valid_payment_method CHECK (payment_method IN ('cod', 'online'));

-- Add check constraint for valid payment statuses
ALTER TABLE public.orders
ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));