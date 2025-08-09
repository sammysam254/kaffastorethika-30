import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { getProductImageUrl, getAllImageUrls } from '@/utils/imageUtils';

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

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  // Get all available images
  const uniqueImages = getAllImageUrls(product);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImageUrl(product),
    });
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % uniqueImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + uniqueImages.length) % uniqueImages.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">{product.name}</DialogTitle>
          <DialogDescription>
            Product details and specifications
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="relative">
            <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={uniqueImages[currentImageIndex]}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.jpg';
                }}
              />
              
              {/* Navigation arrows for multiple images */}
              {uniqueImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            
            {/* Image indicators */}
            {uniqueImages.length > 1 && (
              <div className="flex justify-center space-x-2 mt-2">
                {uniqueImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {product.badge && (
              <Badge className={`absolute top-3 left-3 ${product.badge_color || 'bg-primary'} text-white`}>
                {product.badge}
              </Badge>
            )}
            
            {!product.in_stock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <Badge variant="destructive">Out of Stock</Badge>
              </div>
            )}

          </div>

          <div className="space-y-4 min-h-0">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-3">Description</h3>
              <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-48 sm:max-h-64 p-3 border rounded-lg bg-gray-50/50">
                {product.description || 'No description available for this product.'}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} ({product.reviews_count} reviews)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">
                KES {product.price.toLocaleString()}
              </span>
              {product.original_price && (
                <span className="text-sm text-muted-foreground line-through">
                  KES {product.original_price.toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Category:</strong> {product.category}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Stock:</strong> {product.in_stock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={!product.in_stock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
