
import { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import AdminLoadingFallback from '@/components/ui/admin-loading-fallback';
import { toast } from 'sonner';

// Lazy load admin components for better performance
const ProductsManager = lazy(() => import('@/components/admin/ProductsManager'));
const OrdersManager = lazy(() => import('@/components/admin/OrdersManager'));
const MessagesManager = lazy(() => import('@/components/admin/MessagesManager'));
const UsersManager = lazy(() => import('@/components/admin/UsersManager'));
const PromotionsManager = lazy(() => import('@/components/admin/PromotionsManager'));
const FlashSalesManager = lazy(() => import('@/components/admin/FlashSalesManager'));
const VouchersManager = lazy(() => import('@/components/admin/VouchersManager'));
const MpesaPaymentsManager = lazy(() => import('@/components/admin/MpesaPaymentsManager'));
const NcbaLoopPaymentsManager = lazy(() => import('@/components/admin/NcbaLoopPaymentsManager'));
const SupportTicketsManager = lazy(() => import('@/components/admin/SupportTicketsManager'));
const AdsManager = lazy(() => import('@/components/admin/AdsManager'));
const AdminSuccessionManager = lazy(() => import('@/components/AdminSuccessionManager'));
const AdminUtility = lazy(() => import('@/components/AdminUtility'));

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    console.log('🏛️ Admin page effect:', { user: user?.email, isAdmin, loading });
    
    // If not loading and either no user or not admin, redirect to auth
    if (!loading) {
      if (!user) {
        console.log('❌ No user, redirecting to auth');
        toast.error('You must be logged in to access the admin panel');
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        console.log('❌ User not admin, redirecting to home');
        toast.error('You do not have admin privileges');
        navigate('/');
        return;
      }
      
      console.log('✅ Admin access granted');
    }
  }, [user, isAdmin, loading, navigate]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductsManager />;
      case 'orders':
        return <OrdersManager />;
      case 'flash-sales':
        return <FlashSalesManager />;
      case 'vouchers':
        return <VouchersManager />;
      case 'mpesa':
        return <MpesaPaymentsManager />;
      case 'messages':
        return <MessagesManager />;
      case 'users':
        return <UsersManager />;
      case 'promotions':
        return <PromotionsManager />;
      case 'support':
        return <SupportTicketsManager />;
      case 'ads':
        return <AdsManager />;
      case 'succession':
        return <AdminSuccessionManager />;
      case 'admin-utility':
        return <AdminUtility />;
      default:
        return <ProductsManager />;
    }
  };

  const getActiveTitle = () => {
    switch (activeTab) {
      case 'products':
        return { title: 'Products Management', description: 'Add, edit, and delete products in your store' };
      case 'orders':
        return { title: 'Orders Management', description: 'View and manage customer orders' };
      case 'flash-sales':
        return { title: 'Flash Sales Management', description: 'Create and manage limited-time flash sales with special discounts' };
      case 'vouchers':
        return { title: 'Voucher Management', description: 'Create and manage discount vouchers for customers' };
      case 'mpesa':
        return { title: 'M-Pesa Payment Management', description: 'Review and manually confirm M-Pesa payments from customers. Phone: 0743049549' };
      case 'messages':
        return { title: 'Customer Messages', description: 'View and respond to customer inquiries' };
      case 'users':
        return { title: 'Users Management', description: 'Manage user accounts and admin permissions' };
      case 'promotions':
        return { title: 'Promotional Content', description: 'Create and manage promotional banners and campaigns' };
      case 'support':
        return { title: 'Support Tickets', description: 'Manage customer support tickets and respond to inquiries' };
      case 'ads':
        return { title: 'Ads Management', description: 'Create and manage advertisements including product ads, image ads, video ads, and URL ads' };
      case 'succession':
        return { title: 'Admin Succession', description: 'Manage automatic transfer of super admin privileges and succession planning' };
      case 'admin-utility':
        return { title: 'Admin Utility', description: 'Quick admin tools and emergency super admin access' };
      default:
        return { title: 'Products Management', description: 'Add, edit, and delete products in your store' };
    }
  };

  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not admin (redirect will happen via useEffect)
  if (!user || !isAdmin) {
    return null;
  }

  const { title, description } = getActiveTitle();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3">
                <SidebarTrigger className="lg:hidden" />
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold">{title}</h1>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8">
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<AdminLoadingFallback message="Loading admin panel..." />}>
                  {renderActiveComponent()}
                </Suspense>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
