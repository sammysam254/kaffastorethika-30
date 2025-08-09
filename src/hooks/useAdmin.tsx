import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
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

export interface Order {
  id: string;
  user_id: string;
  product_id: string | null;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string;
  shipping_address_id: string | null;
  voucher_id: string | null;
  voucher_discount: number | null;
  shipping_fee: number | null;
  payment_method: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    products?: Product;
  }>;
  products?: Product;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  replied_at: string | null;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  minimum_order_amount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url: string | null;
  link_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  user_roles?: Array<{ role: 'admin' | 'user' | 'super_admin' }>;
}

export interface FlashSale {
  id: string;
  product_id: string;
  original_price: number | null;
  sale_price: number | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  quantity_limit: number | null;
  sold_quantity: number | null;
  is_active: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  minimum_purchase_amount: number | null;
  minimum_order_amount: number | null;
  max_uses: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  expires_at: string | null;
  active: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  county: string | null;
  postal_code: string | null;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MpesaPayment {
  id: string;
  order_id: string;
  mpesa_message: string;
  mpesa_code: string | null;
  amount: number;
  phone_number: string | null;
  status: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin or super admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('🔍 Checking admin status for user:', user?.email);
      if (!user) {
        console.log('❌ No user found');
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Querying user_roles for user:', user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin']);

        console.log('📊 Roles query result:', { data, error });

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error checking admin status:', error);
        }

        const roles = data || [];
        const hasSuperAdmin = roles.some(r => r.role === 'super_admin');
        const hasRegularAdmin = roles.some(r => r.role === 'admin');
        
        console.log('🎯 Role analysis:', { 
          roles, 
          hasSuperAdmin, 
          hasRegularAdmin, 
          finalIsAdmin: hasSuperAdmin || hasRegularAdmin 
        });
        
        setIsSuperAdmin(hasSuperAdmin);
        // Super admin or regular admin both count as admin
        setIsAdmin(hasSuperAdmin || hasRegularAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // Set up real-time subscription to user_roles changes
    const subscription = supabase
      .channel('user_roles_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_roles',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        console.log('🔄 User roles changed:', payload);
        // Re-check admin status when roles change
        setTimeout(() => checkAdminStatus(), 100);
      })
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up user_roles subscription');
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Upload images to Supabase Storage (kept for backwards compatibility)
  const uploadProductImages = async (files: File[]): Promise<Array<{url: string, path: string}>> => {
    const results: Array<{url: string, path: string}> = [];
    
    console.log(`Uploading ${files.length} files to storage...`);
    
    for (const file of files) {
      // Accept all image types
      if (!file.type.startsWith('image/')) {
        throw new Error(`File must be an image, received: ${file.type}`);
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log(`Uploading file: ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      // Store just the filename instead of full URL to avoid size limits
      results.push({
        url: fileName, // Just store the filename
        path: filePath
      });
      
      console.log(`Successfully uploaded: ${fileName}`);
    }
    
    console.log(`All files uploaded successfully: ${results.length} images`);
    return results;
  };

  // Convert files to base64 for database storage
  const convertFilesToBase64 = async (files: File[]): Promise<Array<{data: string, type: string}>> => {
    const results: Array<{data: string, type: string}> = [];
    
    for (const file of files) {
      // Accept all image types - just check if it starts with 'image/'
      if (!file.type.startsWith('image/')) {
        throw new Error(`File must be an image, received: ${file.type}`);
      }

      console.log(`Converting ${file.name} (${file.type}) to base64...`);

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/[type];base64, prefix to store only the base64 data
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      results.push({
        data: base64,
        type: file.type
      });
      
      console.log(`Successfully converted ${file.name} to base64`);
    }
    
    console.log(`All ${files.length} files converted to base64 successfully`);
    return results;
  };

  // Product management
  const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  };

  const createProduct = async (productData: any) => {
    try {
      // Remove base64 data before saving to avoid size limits
      const cleanedData = {
        ...productData,
        image_data: null, // Don't store base64 in database anymore
        image_type: null  // Don't store image type anymore
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([cleanedData])
        .select()
        .single();

      if (error) throw error;
      toast.success('Product created successfully');
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: any) => {
    try {
      // Remove base64 data before saving to avoid size limits
      const cleanedUpdates = {
        ...updates,
        image_data: null, // Don't store base64 in database anymore
        image_type: null  // Don't store image type anymore
      };
      
      const { data, error } = await supabase
        .from('products')
        .update(cleanedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Product updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      // Optional: Add image cleanup logic here if needed
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    }
  };

  // Order management
  const fetchOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const createOrder = async (orderData: any) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    toast.success('Order created successfully');
    return data;
  };

  const updateOrderStatus = async (id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Order status updated successfully');
    return data;
  };

  const fetchMessages = async (): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const updateMessageStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        status,
        replied_at: status === 'replied' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Message status updated successfully');
    return data;
  };

  // User management
  const fetchUsers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    // Fetch user roles separately to avoid relation issues
    const usersWithRoles = await Promise.all(
      (data || []).map(async (user) => {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.user_id);
        
        return { ...user, user_roles: roles || [] };
      })
    );
    
    return usersWithRoles;
  };

  const makeUserAdmin = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role: 'admin' }])
      .select()
      .single();

    if (error) throw error;
    toast.success('User promoted to admin successfully');
    return data;
  };

  const removeUserAdmin = async (userId: string) => {
    // Check if current user is super admin and target is not super admin
    if (!isSuperAdmin) {
      toast.error('Only super admins can remove admin roles');
      return;
    }

    // Check if trying to remove super admin
    const { data: targetRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const isSuperAdminTarget = targetRoles?.some(r => r.role === 'super_admin');
    
    if (isSuperAdminTarget && userId === user?.id) {
      // Super admin trying to resign themselves
      const { data: otherSuperAdmins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin')
        .neq('user_id', userId);

      if (!otherSuperAdmins || otherSuperAdmins.length === 0) {
        toast.error('You must promote another admin to super admin before resigning');
        return;
      }
    } else if (isSuperAdminTarget) {
      toast.error('Cannot remove super admin role from another super admin');
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) throw error;
    toast.success('Admin role removed successfully');
  };

  const makeSuperAdmin = async (userId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admins can promote to super admin');
      return;
    }

    // Check if user has admin role first
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const hasAdminRole = existingRoles?.some(r => r.role === 'admin');
    if (!hasAdminRole) {
      toast.error('User must be an admin before being promoted to super admin');
      return;
    }

    // Remove admin role and add super admin role
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role: 'super_admin' }])
      .select()
      .single();

    if (error) throw error;
    toast.success('User promoted to super admin successfully');
    return data;
  };

  const resignSuperAdmin = async () => {
    if (!isSuperAdmin || user?.id !== user?.id) {
      toast.error('Unauthorized action');
      return;
    }

    // Check if there are other super admins
    const { data: otherSuperAdmins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin')
      .neq('user_id', user.id);

    if (!otherSuperAdmins || otherSuperAdmins.length === 0) {
      toast.error('You must promote another admin to super admin before resigning');
      return;
    }

    // Remove super admin role and add regular admin role
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)
      .eq('role', 'super_admin');

    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: user.id, role: 'admin' }])
      .select()
      .single();

    if (error) throw error;
    toast.success('Successfully resigned from super admin role');
    return data;
  };

  // Promotion management
  const fetchPromotions = async (): Promise<Promotion[]> => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const createPromotion = async (promotion: any) => {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promotion]) // Remove the created_by field
      .select()
      .single();

    if (error) throw error;
    toast.success('Promotion created successfully');
    return data;
  };

  const updatePromotion = async (id: string, updates: Partial<Promotion>) => {
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Promotion updated successfully');
    return data;
  };

  const deletePromotion = async (id: string) => {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Promotion deleted successfully');
  };

  // Flash Sale management
  const fetchFlashSales = async (): Promise<FlashSale[]> => {
    const { data, error } = await supabase
      .from('flash_sales')
      .select(`
        *,
        products:product_id (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  };

  const createFlashSale = async (flashSale: any) => {
    const { data, error } = await supabase
      .from('flash_sales')
      .insert([flashSale])
      .select()
      .single();

    if (error) throw error;
    toast.success('Flash sale created successfully');
    return data;
  };

  const updateFlashSale = async (id: string, updates: Partial<FlashSale>) => {
    const { data, error } = await supabase
      .from('flash_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Flash sale updated successfully');
    return data;
  };

  const deleteFlashSale = async (id: string) => {
    const { error } = await supabase
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Flash sale deleted successfully');
  };

  // Voucher management
  const fetchVouchers = async (): Promise<Voucher[]> => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const createVoucher = async (voucher: any) => {
    const { data, error } = await supabase
      .from('vouchers')
      .insert([voucher])
      .select()
      .single();

    if (error) throw error;
    toast.success('Voucher created successfully');
    return data;
  };

  const updateVoucher = async (id: string, updates: Partial<Voucher>) => {
    const { data, error } = await supabase
      .from('vouchers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Voucher updated successfully');
    return data;
  };

  const deleteVoucher = async (id: string) => {
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Voucher deleted successfully');
  };

  // M-Pesa Payment management
  const fetchMpesaPayments = async (): Promise<MpesaPayment[]> => {
    const { data, error } = await supabase
      .from('mpesa_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const confirmMpesaPayment = async (id: string) => {
    const { data, error } = await supabase
      .from('mpesa_payments')
      .update({ 
        status: 'confirmed',
        confirmed_by: user?.id,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('M-Pesa payment confirmed successfully');
    return data;
  };

  const rejectMpesaPayment = async (id: string) => {
    const { data, error } = await supabase
      .from('mpesa_payments')
      .update({ 
        status: 'rejected',
        confirmed_by: user?.id,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('M-Pesa payment rejected');
    return data;
  };

  return {
    isAdmin,
    isSuperAdmin,
    loading,
    // File uploads
    uploadProductImages,
    // Products
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    // Orders
    fetchOrders,
    createOrder,
    updateOrderStatus,
    // Messages
    fetchMessages,
    updateMessageStatus,
    // Users
    fetchUsers,
    makeUserAdmin,
    removeUserAdmin,
    makeSuperAdmin,
    resignSuperAdmin,
    // Promotions
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    savePromotion: createPromotion,
    // Flash Sales
    fetchFlashSales,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    // Vouchers
    fetchVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    // M-Pesa Payments
    fetchMpesaPayments,
    confirmMpesaPayment,
    rejectMpesaPayment,
  };
};
