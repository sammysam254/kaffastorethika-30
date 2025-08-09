import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProductImageUrl } from "@/utils/imageUtils";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  images: string[] | null;
  category: string;
  in_stock: boolean;
  stock: number;
}

const HeroSlider = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInStockProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,price,image_url,images,category,in_stock,stock')
          .eq('in_stock', true)
          .gt('stock', 0)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error loading products for hero:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInStockProducts();
  }, []);

  useEffect(() => {
    if (!products.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products.length]);

  const nextSlide = () => {
    if (!products.length) return;
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    if (!products.length) return;
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  const goToSlide = (index: number) => {
    if (!products.length) return;
    setCurrentSlide(index);
  };

  const currentProduct = products[currentSlide];

  return (
    <section className="relative bg-gradient-to-br from-background via-secondary/20 to-accent/10 py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-primary font-medium text-sm">
                  {loading ? 'Loading products…' : currentProduct ? `${currentProduct.category} · In stock` : 'No products in stock'}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                {currentProduct ? (
                  <>
                    {currentProduct.name.split(' ').slice(0, 2).join(' ')}
                    <span className="block bg-gradient-primary bg-clip-text text-transparent">
                      {currentProduct.name.split(' ').slice(2).join(' ') || currentProduct.name}
                    </span>
                  </>
                ) : (
                  'Explore Our Latest Products'
                )}
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                {currentProduct
                  ? `Only ${currentProduct.stock} left • KES ${currentProduct.price.toLocaleString()}`
                  : 'Browse our catalog of premium tech items available right now.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="group"
                onClick={() => navigate('/products')}
                disabled={loading || !products.length}
                aria-disabled={loading || !products.length}
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/products')}
              >
                View All Products
              </Button>
            </div>

            {/* Slide indicators */}
            <div className="flex gap-2 pt-4">
              {(loading ? Array.from({ length: 3 }) : products).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentSlide === index ? 'bg-primary w-8' : 'bg-primary/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  disabled={loading || !products.length}
                />
              ))}
            </div>
          </div>

          {/* Image Slider */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-tech transition-shadow duration-500">
              <div className="relative h-[500px] bg-muted">
                {currentProduct ? (
                  <img 
                    src={getProductImageUrl(currentProduct)} 
                    alt={`${currentProduct.name} - Product image`}
                    className="w-full h-full object-cover transition-transform duration-700"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {loading ? 'Loading…' : 'No in-stock products to display'}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
              aria-label="Previous product"
              disabled={loading || products.length <= 1}
            >
              <ChevronLeft className="h-5 w-5 text-foreground/80" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
              aria-label="Next product"
              disabled={loading || products.length <= 1}
            >
              <ChevronRight className="h-5 w-5 text-foreground/80" />
            </button>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-gradient-primary p-6 rounded-xl shadow-glow">
              <p className="text-white font-bold text-lg">Available Now</p>
              <p className="text-white/90 text-sm">Real inventory, no mockups</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;