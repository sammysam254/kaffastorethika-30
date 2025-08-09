import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  stock: number;
  image_data: string | null;
  image_type: string | null;
  image_url: string | null;
  images: string[] | null;
  badge: string | null;
  badge_color: string | null;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface UseProductsOptions {
  pageSize?: number;
  initialPage?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { pageSize = 10, initialPage = 1 } = options;
  
  const [state, setState] = useState<ProductsState>({
    products: [],
    loading: true,
    totalCount: 0,
    currentPage: initialPage,
    totalPages: 0,
  });

  // Fetch products with pagination
  const fetchProducts = async (page: number = 1, search?: string, category?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Add search filter
      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      // Add category filter
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      setState({
        products: data || [],
        loading: false,
        totalCount,
        currentPage: page,
        totalPages,
      });

      return { data: data || [], totalCount, totalPages };
    } catch (error) {
      console.error('Error fetching products:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast.error('Failed to load products');
      throw error;
    }
  };

  // Create product
  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          image_data: null, // Don't store base64 in database
          image_type: null
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Product created successfully');
      await fetchProducts(state.currentPage);
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
      throw error;
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const cleanedUpdates = {
        ...updates,
        image_data: null,
        image_type: null
      };
      
      const { data, error } = await supabase
        .from('products')
        .update(cleanedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Product updated successfully');
      await fetchProducts(state.currentPage);
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Product deleted successfully');
      
      // If we're on the last page and it becomes empty, go to previous page
      const remainingProducts = state.products.length - 1;
      if (remainingProducts === 0 && state.currentPage > 1) {
        await fetchProducts(state.currentPage - 1);
      } else {
        await fetchProducts(state.currentPage);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    }
  };

  // Upload product images
  const uploadProductImages = async (files: File[]): Promise<Array<{url: string, path: string}>> => {
    const results: Array<{url: string, path: string}> = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        throw new Error(`File must be an image, received: ${file.type}`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      results.push({
        url: fileName,
        path: filePath
      });
    }
    
    return results;
  };

  // Load initial products
  useEffect(() => {
    fetchProducts(initialPage);
  }, []);

  return {
    ...state,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    refetch: () => fetchProducts(state.currentPage),
  };
};