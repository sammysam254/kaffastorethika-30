import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProductImageUrl } from "@/utils/imageUtils";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  rating: number;
  reviews_count: number;
  image_url: string | null;
  images: string[] | null;
  badge: string | null;
  badge_color: string | null;
  is_featured: boolean;
  in_stock: boolean;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .limit(8)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImageUrl(product),
    });
  };

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Products
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our latest collection of premium computers and tech products
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-64 mb-4"></div>
                <div className="bg-muted rounded h-4 mb-2"></div>
                <div className="bg-muted rounded h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <button key={product.id} className="group w-full text-left">
                <Card className="hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-background border-border/50 hover:border-primary/30 h-full">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img 
                        src={getProductImageUrl(product)} 
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                      />
                      
                      {product.badge && (
                        <Badge className={`absolute top-3 left-3 ${product.badge_color || 'bg-primary'} text-white`}>
                          {product.badge}
                        </Badge>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                        <Button variant="secondary" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          navigate('/products');
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}>
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {product.rating} ({product.reviews_count})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-primary">
                          KES {product.price.toLocaleString()}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            KES {product.original_price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <Button variant="default" className="w-full" onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}>
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" onClick={() => navigate('/products')}>
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;