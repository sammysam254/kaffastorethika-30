-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Create storage policies for product images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add stock column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;