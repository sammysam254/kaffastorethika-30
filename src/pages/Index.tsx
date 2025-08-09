import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, type Promotion } from '@/hooks/useAdmin';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Zap, Upload, X, Plus } from 'lucide-react';
import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import Categories from '@/components/Categories';
import AdsSection from '@/components/AdsSection';
import Footer from '@/components/Footer';
import AdminUtility from '@/components/AdminUtility';

interface PromotionWithProduct extends Promotion {
  product?: Product | null;
}

interface Product {
  id: string;
  name: string;
  image_url: string;
  price: number;
}

const Index = () => {
  console.log('Index component rendering...');
  const { user } = useAuth();
  const { isAdmin, fetchPromotions, createPromotion: savePromotion, fetchProducts: getProducts } = useAdmin();
  const [activePromotions, setActivePromotions] = useState<PromotionWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
    discount_percentage: 0,
    discount_amount: null,
    minimum_order_amount: null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadActivePromotions();
    if (isAdmin) {
      fetchProducts();
    }
  }, []);

  useEffect(() => {
    if (activePromotions.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % activePromotions.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activePromotions.length]);

  const loadActivePromotions = async () => {
    try {
      const promotions = await fetchPromotions();
      const products = await getProducts();
      
      // Enrich promotions with product data
      const enrichedPromotions = promotions.map(promo => {
        const product = products.find(p => promo.link_url?.includes(p.id));
        return {
          ...promo,
          product: product || null
        };
      });
      
      const active = enrichedPromotions.filter(promo => promo.is_active);
      setActivePromotions(active);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setNewPromotion(prev => ({
          ...prev,
          image_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setNewPromotion(prev => ({
        ...prev,
        title: selectedProduct.name,
        image_url: selectedProduct.image_url,
        // Use a valid SPA route with query param instead of a non-existent /products/:id path
        link_url: `/products?product=${productId}`
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Handle file upload if new image was selected
      let imageUrl = newPromotion.image_url;
      if (selectedFile) {
        // Replace with your actual file upload logic
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const promotionToSave = {
        title: newPromotion.title || '',
        description: newPromotion.description || '',
        image_url: imageUrl,
        link_url: newPromotion.link_url || '',
        is_active: newPromotion.is_active || true,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };

      await savePromotion(promotionToSave);
      await loadActivePromotions();
      resetForm();
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const resetForm = () => {
    setNewPromotion({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      start_date: '',
      end_date: '',
      is_active: true,
      discount_percentage: 0,
      discount_amount: null,
      minimum_order_amount: null
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setShowAddPromo(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activePromotions.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activePromotions.length) % activePromotions.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Ads Section */}
        <AdsSection />
        
        {/* Admin Utility - Temporary for making users admin */}
        <AdminUtility />
        
        <HeroSlider />
        
        {/* Admin Debug Section - Only show to admin users */}
        {user && isAdmin && (
          <div className="container mx-auto px-4 py-4 bg-blue-50 border border-blue-200 rounded-lg mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-800 mb-1">
                  Logged in as: {user.email}
                </p>
                <p className="text-sm text-blue-800">
                  Admin status: {isAdmin ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setShowAddPromo(!showAddPromo)} 
                  variant="default" 
                  size="sm"
                  className="flex items-center"
                >
                  {showAddPromo ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                  {showAddPromo ? 'Cancel' : 'Add Promotion'}
                </Button>
                <Link to="/admin">
                  <Button variant="default" size="sm">
                    Admin Panel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Add Promotion Form */}
        {showAddPromo && isAdmin && (
          <div className="container mx-auto px-4 py-6 mb-8 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Add New Promotion</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Promotion Title</label>
                    <Input
                      value={newPromotion.title || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={newPromotion.description || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Link URL</label>
                    <Input
                      value={newPromotion.link_url || ''}
                      onChange={(e) => setNewPromotion({...newPromotion, link_url: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Select Product</label>
                    <Select onValueChange={handleProductSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Promotion Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {previewImage || newPromotion.image_url ? (
                        <div className="relative">
                          <img
                            src={previewImage || newPromotion.image_url || ''}
                            alt="Preview"
                            className="max-h-64 mx-auto mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage(null);
                              setSelectedFile(null);
                              setNewPromotion({...newPromotion, image_url: ''});
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-8">
                          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 mb-2">Drag and drop your image here</p>
                          <p className="text-xs text-gray-400 mb-4">or</p>
                          <label className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                            Browse Files
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Promotion
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Active Promotions Section */}
        {activePromotions.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">🎉 Special Promotions</h2>
              <p className="text-muted-foreground">Don't miss out on these amazing deals!</p>
            </div>
            
            <div className="relative">
              <div className="flex overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out w-full"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {activePromotions.map((promotion) => (
                    <div key={promotion.id} className="w-full flex-shrink-0 px-4">
                      <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 h-full flex flex-col">
                        <CardContent className="p-0 flex flex-col flex-grow">
                          <div className="relative flex-grow">
                            {/* Hero Video/Image */}
                            {promotion.image_url ? (
                              <div className="relative h-full min-h-[300px] flex items-center justify-center overflow-hidden rounded-t-lg bg-gray-50">
                                <img
                                  src={promotion.image_url}
                                  alt={promotion.title}
                                  className="object-contain max-h-[300px] w-auto group-hover:scale-105 transition-transform duration-300 p-4"
                                  style={{ maxWidth: '100%' }}
                                />
                                {/* Video Play Overlay */}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-white/90 rounded-full p-3">
                                    <Play className="h-8 w-8 text-primary" />
                                  </div>
                                </div>
                                {/* Promotional Badge */}
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
                                    🔥 HOT DEAL
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                                <div className="text-center">
                                  <Zap className="h-12 w-12 text-primary mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Promotional Content</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                              {promotion.title}
                            </h3>
                            {promotion.description && (
                              <p className="text-muted-foreground text-sm mb-4">
                                {promotion.description}
                              </p>
                            )}
                            
                            {/* Product Price Display */}
                            {promotion.product && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Product Price:</span>
                                  <span className="text-lg font-bold text-primary">
                                    ${promotion.product.price.toFixed(2)}
                                  </span>
                                </div>
                                {promotion.discount_percentage && (
                                  <div className="text-sm text-green-600 font-medium">
                                    {promotion.discount_percentage}% OFF
                                  </div>
                                )}
                              </div>
                            )}
                            
            {promotion.link_url && (
              <Button asChild className="w-full">
                <a 
                  href={promotion.link_url?.startsWith('/products/')
                    ? `/products?product=${promotion.link_url.split('/').pop()}`
                    : promotion.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {promotion.product ? 'View Product' : 'Learn More'}
                </a>
              </Button>
            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Dots Indicator */}
              <div className="flex justify-center mt-6 space-x-2">
                {activePromotions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-primary' : 'bg-gray-300'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Flash Sale Banner */}
        <section className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-8 mb-8">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 mr-2 animate-pulse" />
              <h2 className="text-3xl font-bold">⚡ Flash Sales Active!</h2>
            </div>
            <p className="text-xl mb-6">Limited time offers with incredible discounts!</p>
            <Link to="/flash-sales">
              <Button size="lg" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                <Zap className="h-5 w-5 mr-2" />
                Shop Flash Sales Now
              </Button>
            </Link>
          </div>
        </section>
        
        <Categories />

      </main>
      <Footer />
    </div>
  );
};

export default Index;
