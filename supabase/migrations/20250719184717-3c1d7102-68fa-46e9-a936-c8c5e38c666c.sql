-- Create shipping addresses table
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    county TEXT,
    postal_code TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shipping addresses
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping addresses
CREATE POLICY "Users can manage their own shipping addresses" 
ON public.shipping_addresses FOR ALL 
USING (auth.uid() = user_id);

-- Create mpesa payments table for backwards compatibility
CREATE TABLE IF NOT EXISTS public.mpesa_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    mpesa_message TEXT NOT NULL,
    mpesa_code TEXT,
    amount DECIMAL(10,2) NOT NULL,
    phone_number TEXT,
    status TEXT DEFAULT 'pending',
    confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mpesa payments
ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for mpesa payments (admin only)
CREATE POLICY "Admins can manage mpesa payments" 
ON public.mpesa_payments FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for new tables
DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON public.shipping_addresses;
CREATE TRIGGER update_shipping_addresses_updated_at
    BEFORE UPDATE ON public.shipping_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_mpesa_payments_updated_at ON public.mpesa_payments;
CREATE TRIGGER update_mpesa_payments_updated_at
    BEFORE UPDATE ON public.mpesa_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();