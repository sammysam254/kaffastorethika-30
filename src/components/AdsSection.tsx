import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Ad {
  id: string;
  title: string;
  description: string;
  ad_type: 'product' | 'text' | 'image' | 'url' | 'video';
  content_url: string;
  product_id: string;
  click_url: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

const AdsSection = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAds();
    loadProducts();
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Filter ads by date range
      const now = new Date();
      const activeAds = (data as unknown as Ad[]).filter(ad => {
        const startDate = ad.start_date ? new Date(ad.start_date) : null;
        const endDate = ad.end_date ? new Date(ad.end_date) : null;
        
        return (!startDate || startDate <= now) && (!endDate || endDate >= now);
      });

      setAds(activeAds);
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAdClick = (ad: Ad) => {
    if (ad.ad_type === 'product' && ad.product_id) {
      // Navigate to products page or open product modal
      navigate('/products');
    } else if (ad.click_url) {
      window.open(ad.click_url, '_blank');
    }
  };

  const nextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % ads.length);
  };

  const prevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];
  const currentProduct = currentAd.ad_type === 'product' && currentAd.product_id 
    ? products.find(p => p.id === currentAd.product_id)
    : null;

  const renderAdContent = () => {
    switch (currentAd.ad_type) {
      case 'product':
        if (!currentProduct) return null;
        return (
          <div className="flex items-center gap-4 h-full">
            <div className="flex-shrink-0">
              <img 
                src={currentProduct.image_url || '/placeholder-product.jpg'} 
                alt={currentProduct.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{currentProduct.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{currentAd.description}</p>
              <p className="text-sm font-bold text-primary">KSh {currentProduct.price}</p>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="flex items-center gap-4 h-full">
            <div className="flex-shrink-0">
              <img 
                src={currentAd.content_url} 
                alt={currentAd.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{currentAd.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{currentAd.description}</p>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center gap-4 h-full">
            <div className="flex-shrink-0">
              <video 
                src={currentAd.content_url}
                className="w-16 h-16 object-cover rounded-lg"
                muted
                autoPlay
                loop
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{currentAd.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{currentAd.description}</p>
            </div>
          </div>
        );
      
      default: // text and url ads
        return (
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{currentAd.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{currentAd.description}</p>
            </div>
            {currentAd.click_url && (
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Card 
        className="relative bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleAdClick(currentAd)}
      >
        <div className="p-4 h-20">
          {renderAdContent()}
        </div>

        {ads.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                prevAd();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                nextAd();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {ads.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentAdIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdsSection;