
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Menu, User, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import MobileMenu from './MobileMenu';
import AdminLink from './AdminLink';
import { toast } from 'sonner';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out. Please try again.');
      } else {
        toast.success('Signed out successfully');
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/e047520e-19b1-47f7-8286-99901fcfc9ab.png" 
              alt="Kaffa Online Store" 
              className="h-10 w-auto"
            />
            <span className="font-bold text-xl hidden sm:block">Kaffa Online Store</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <AdminLink />
            <Link to="/products" className="text-foreground hover:text-primary transition-colors">
              Products
            </Link>
            <Link to="/flash-sales" className="text-foreground hover:text-primary transition-colors">
              Flash Sales
            </Link>
            {user && (
              <Link to="/my-orders" className="text-foreground hover:text-primary transition-colors flex items-center space-x-1">
                <Package className="h-4 w-4" />
                <span>My Orders</span>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Actions */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <User className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  );
};

export default Header;
