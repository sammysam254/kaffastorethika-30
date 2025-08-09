-- Fix product deletion by updating foreign key constraint
-- This allows products to be deleted even if they're referenced in orders

-- First, drop the existing foreign key constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

-- Recreate the constraint with CASCADE or SET NULL behavior
-- Using SET NULL so that when a product is deleted, the order's product_id becomes null
-- This preserves order history while allowing product deletion
ALTER TABLE orders 
ADD CONSTRAINT orders_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;