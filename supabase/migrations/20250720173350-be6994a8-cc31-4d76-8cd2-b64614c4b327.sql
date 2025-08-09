-- Add image_data column to store images directly in database as base64
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_data TEXT;

-- Add image_type column to store the MIME type of the image
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_type TEXT;

-- Make image_url optional since we'll store images directly in the database
ALTER TABLE public.products 
ALTER COLUMN image_url DROP NOT NULL;