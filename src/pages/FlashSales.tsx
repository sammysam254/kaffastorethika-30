
import { useState, useEffect } from 'react';
import { useAdmin, FlashSale } from '@/hooks/useAdmin';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ShoppingCart, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getProductImageUrl } from '@/utils/imageUtils';

const FlashSales = () => {
  const { fetchFlashSales } = useAdmin();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlashSales();
  }, []);

  const loadFlashSales = async () => {
    try {
      setLoading(true);
      const data = await fetchFlashSales();
      const activeFlashSales = data.filter(sale => 
        sale.active && 
        new Date(sale.start_date) <= new Date() && 
        new Date(sale.end_date) >= new Date()
      );
      setFlashSales(activeFlashSales);
    } catch (error) {
      console.error('Error loading flash sales:', error);
      toast.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference <= 0) return 'Expired';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleBuyNow = (sale: FlashSale) => {
    if (!sale.products) {
      toast.error('Product information not available');
      return;
    }

    // Check if there's enough quantity available
    const availableQuantity = sale.quantity_limit ? sale.quantity_limit - (sale.sold_quantity || 0) : 999;
    if (availableQuantity <= 0) {
      toast.error('This flash sale item is out of stock');
      return;
    }

    // Add to cart with flash sale price
    addToCart({
      id: sale.product_id,
      name: sale.products.name,
      price: sale.sale_price,
      image: getProductImageUrl(sale.products)
    });

    toast.success(`${sale.products.name} added to cart at flash sale price!`);
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading flash sales...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-yellow-500 mr-2" />
            <h1 className="text-4xl font-bold">⚡ Flash Sales</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Limited time offers with incredible discounts!
          </p>
        </div>

        {/* Flash Sales Grid */}
        {flashSales.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
              No Active Flash Sales
            </h2>
            <p className="text-muted-foreground">
              Check back soon for amazing deals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashSales.map((sale) => {
              const availableQuantity = sale.quantity_limit ? sale.quantity_limit - (sale.sold_quantity || 0) : 999;
              const isOutOfStock = availableQuantity <= 0;
              
              return (
                <Card key={sale.id} className="group hover:shadow-lg transition-shadow border-2 border-red-200">
                  <CardHeader className="relative">
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="animate-pulse">
                        -{sale.discount_percentage}%
                      </Badge>
                    </div>
                    
                    {sale.products && (
                      <img
                        src={getProductImageUrl(sale.products)}
                        alt={sale.products.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                      />
                    )}
                    
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {sale.products?.name}
                    </CardTitle>
                    
                    <CardDescription>
                      {sale.products?.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Price Section */}
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-primary">
                        KES {sale.sale_price.toLocaleString()}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        KES {sale.original_price.toLocaleString()}
                      </span>
                    </div>

                    {/* Quantity Info */}
                    {sale.quantity_limit && (
                      <div className="text-sm text-muted-foreground">
                        Available: {availableQuantity} left
                      </div>
                    )}

                    {/* Time Remaining */}
                    <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="font-medium">
                        Ends in: {calculateTimeRemaining(sale.end_date)}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleBuyNow(sale)}
                      disabled={isOutOfStock}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isOutOfStock ? 'Out of Stock' : `Buy Now - Save KES ${(sale.original_price - sale.sale_price).toLocaleString()}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default FlashSales;
