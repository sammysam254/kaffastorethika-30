import { supabase } from '@/integrations/supabase/client';

export const getImageUrl = (product: any): string => {
  // Check if image_url contains a filename that needs to be converted to storage URL
  if (product?.image_url && !product.image_url.startsWith('http') && !product.image_url.startsWith('/')) {
    // It's a filename stored in storage, construct the full URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${product.image_url}`);
    return publicUrl;
  }

  // Priority 1: Check for storage URL or regular URL
  if (product?.image_url) {
    return product.image_url;
  }

  // Legacy: Check for images array
  if (product?.images && product.images.length > 0) {
    return product.images[0];
  }

  // Fallback to placeholder image
  return '/placeholder-product.jpg';
};

export const getAllImageUrls = (product: any): string[] => {
  const allImages = [];
  
  // Add primary image_url if it exists
  if (product?.image_url) {
    if (!product.image_url.startsWith('http') && !product.image_url.startsWith('/')) {
      // It's a filename stored in storage, construct the full URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${product.image_url}`);
      allImages.push(publicUrl);
    } else {
      allImages.push(product.image_url);
    }
  }
  
  // Add images from array if they exist
  if (product?.images && product.images.length > 0) {
    product.images.forEach((image: string) => {
      if (!image.startsWith('http') && !image.startsWith('/')) {
        // It's a filename stored in storage, construct the full URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${image}`);
        allImages.push(publicUrl);
      } else {
        allImages.push(image);
      }
    });
  }
  
  // Remove duplicates and return
  const uniqueImages = [...new Set(allImages)];
  return uniqueImages.length > 0 ? uniqueImages : ['/placeholder-product.jpg'];
};

export const getProductImageUrl = (product: any): string => {
  return getImageUrl(product);
};