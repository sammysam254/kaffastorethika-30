import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  MessageSquare,
  Users,
  Megaphone,
  Zap,
  Ticket,
  Smartphone,
  Headphones,
  CreditCard,
  LogOut,
  Menu,
  Home,
  MonitorSpeaker,
  Crown,
  Settings
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminTabs = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'mpesa', label: 'M-Pesa Payments', icon: Smartphone },
  { id: 'flash-sales', label: 'Flash Sales', icon: Zap },
  { id: 'vouchers', label: 'Vouchers', icon: Ticket },
  { id: 'ads', label: 'Ads', icon: MonitorSpeaker },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'promotions', label: 'Promotions', icon: Megaphone },
  { id: 'support', label: 'Support Tickets', icon: Headphones },
];

// Only products for regular admins
const regularAdminTabs = [
  { id: 'products', label: 'Products', icon: Package },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useAdmin();
  
  // Get tabs based on admin level
  const tabsToShow = isSuperAdmin ? adminTabs : regularAdminTabs;
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Failed to sign out');
      } else {
        toast.success('Signed out successfully');
        navigate('/');
      }
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/e047520e-19b1-47f7-8286-99901fcfc9ab.png" 
            alt="Kaffa Online Store" 
            className="h-8 w-8 flex-shrink-0"
          />
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Kaffa Online Store</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tabsToShow.map((tab) => (
                <SidebarMenuItem key={tab.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeTab === tab.id}
                  >
                    <button
                      onClick={() => onTabChange(tab.id)}
                      className="w-full flex items-center space-x-2 text-left"
                    >
                      <tab.icon className="h-4 w-4" />
                      {!collapsed && <span>{tab.label}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Super Admin Only Section */}
              {isSuperAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      isActive={activeTab === 'succession'}
                    >
                      <button
                        onClick={() => onTabChange('succession')}
                        className="w-full flex items-center space-x-2 text-left"
                      >
                        <Crown className="h-4 w-4" />
                        {!collapsed && <span>Admin Succession</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      isActive={activeTab === 'admin-utility'}
                    >
                      <button
                        onClick={() => onTabChange('admin-utility')}
                        className="w-full flex items-center space-x-2 text-left"
                      >
                        <Settings className="h-4 w-4" />
                        {!collapsed && <span>Admin Utility</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full flex items-center space-x-2 text-left"
                  >
                    <Home className="h-4 w-4" />
                    {!collapsed && <span>View Site</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span>Sign Out</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}