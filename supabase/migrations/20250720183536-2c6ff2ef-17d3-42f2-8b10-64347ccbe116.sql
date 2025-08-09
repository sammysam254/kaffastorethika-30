-- Add image_url column to products table for Supabase Storage URLs
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment explaining the column usage
COMMENT ON COLUMN public.products.image_url IS 'URL to product image stored in Supabase Storage. Takes priority over image_data for display.';

-- Create index for better performance when filtering by image availability
CREATE INDEX IF NOT EXISTS idx_products_image_url ON public.products(image_url) WHERE image_url IS NOT NULL;