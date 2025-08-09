-- Add missing columns to existing tables to match expected interfaces

-- Update products table to match expected interface
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[], -- Will store JSON array of image URLs
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS badge_color TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- Update orders table to match expected interface
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS shipping_address_id TEXT,
ADD COLUMN IF NOT EXISTS voucher_id UUID,
ADD COLUMN IF NOT EXISTS voucher_discount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update profiles table to match expected interface
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update promotions table to match expected interface
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update flash_sales table to match expected interface
ALTER TABLE public.flash_sales
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS quantity_limit INTEGER,
ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update vouchers table to match expected interface
ALTER TABLE public.vouchers
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS minimum_purchase_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_uses INTEGER,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create messages table for backwards compatibility
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for messages (admin only)
CREATE POLICY "Admins can manage messages" 
ON public.messages FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

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

-- Update triggers for new tables with updated_at columns
CREATE TRIGGER IF NOT EXISTS update_promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_flash_sales_updated_at
    BEFORE UPDATE ON public.flash_sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_vouchers_updated_at
    BEFORE UPDATE ON public.vouchers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_shipping_addresses_updated_at
    BEFORE UPDATE ON public.shipping_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_mpesa_payments_updated_at
    BEFORE UPDATE ON public.mpesa_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();