import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, ShoppingCart, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductModal from '@/components/ProductModal';
import { getProductImageUrl } from '@/utils/imageUtils';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[] | null;
  category: string;
  rating: number;
  reviews_count: number;
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
  description: string | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) setCategory(categoryParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [category, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*');
      
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      // Apply sorting
      if (sortBy === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      } else if (sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      } else {
        query = query.order('name', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'fashion', label: 'Fashion Accessories' },
    { value: 'home', label: 'Home & Kitchen' },
    { value: 'sports', label: 'Sports & Outdoors' },
  ];

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImageUrl(product),
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-64 mb-4"></div>
                <div className="bg-muted rounded h-4 mb-2"></div>
                <div className="bg-muted rounded h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Our Products</h1>
          <p className="text-muted-foreground">
            Discover our complete range of products
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative flex">
            <Input
              placeholder="I am searching for..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-r-none border-r-0 h-12 text-base"
            />
            <Button 
              className="bg-red-500 hover:bg-red-600 rounded-l-none px-6 h-12"
            >
              <Search className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex overflow-x-auto pb-2 space-x-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-none border-b-2 transition-colors ${
                  category === cat.value
                    ? 'border-red-500 text-red-500 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="relative aspect-square bg-gray-50 p-2">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={() => handleProductClick(product)}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                  
                  {product.badge && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      {product.badge}
                    </div>
                  )}
                  
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Out of Stock</span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <h3 
                    className="text-sm font-medium text-gray-800 line-clamp-2 cursor-pointer hover:text-primary"
                    onClick={() => handleProductClick(product)}
                  >
                    {product.name}
                  </h3>

                  <div className="text-lg font-bold text-red-600">
                    KSh {product.price.toLocaleString()}
                  </div>

                  {product.original_price && product.original_price > product.price && (
                    <div className="text-sm text-gray-500 line-through">
                      KSh {product.original_price.toLocaleString()}
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({product.reviews_count})
                    </span>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-white text-sm py-2"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.in_stock}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      <Footer />
    </div>
  );
};

export default Products;
