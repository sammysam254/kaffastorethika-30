-- Add missing columns to existing tables to match expected interfaces

-- Update products table to match expected interface
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[],
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