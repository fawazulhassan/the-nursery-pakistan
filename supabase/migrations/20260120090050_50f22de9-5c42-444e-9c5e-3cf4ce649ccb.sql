-- Create delivery_addresses table for users to save their addresses
CREATE TABLE public.delivery_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone_number text NOT NULL,
    address_line text NOT NULL,
    city text NOT NULL,
    notes text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
CREATE POLICY "Users can view their own addresses"
ON public.delivery_addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own addresses
CREATE POLICY "Users can create their own addresses"
ON public.delivery_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
ON public.delivery_addresses
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
ON public.delivery_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_delivery_addresses_updated_at
BEFORE UPDATE ON public.delivery_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();