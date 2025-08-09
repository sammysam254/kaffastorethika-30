import { useState, useEffect } from 'react';
import { useAdmin, Promotion } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Star, Megaphone, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews_count: number;
  description: string | null;
  image_url: string | null;
  category: string;
  in_stock: boolean;
}

const PromotionsManager = () => {
  const { 
    fetchPromotions, 
    createPromotion, 
    updatePromotion, 
    deletePromotion,
    fetchProducts 
  } = useAdmin();
  
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    start_date: '',
    end_date: '',
    active: true,
    selectedProductId: '',
    discount_percentage: '',
    discount_amount: '',
    minimum_order_amount: ''
  });

  useEffect(() => {
    loadPromotions();
    loadProducts();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await fetchPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setFormData(prev => ({
        ...prev,
        selectedProductId: productId,
        title: `${product.name} - Special Offer`,
        description: `Special promotion for ${product.name}. ${product.description || ''}`,
        image_url: product.image_url || '',
        link_url: `https://kaffaonline.store/products/${productId}`
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    
    try {
      const promotionData = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: formData.active,
        active: formData.active,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        minimum_order_amount: formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : null
      };

      console.log('Creating promotion with data:', promotionData);

      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, promotionData);
        toast.success('Promotion updated successfully');
      } else {
        await createPromotion(promotionData);
        toast.success('Promotion created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      loadPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error(`Failed to save promotion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    // Extract product ID from link_url if it follows the pattern /products/{id}
    const productIdMatch = promotion.link_url?.match(/\/products\/(.+)/);
    const productId = productIdMatch ? productIdMatch[1] : '';
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      image_url: promotion.image_url || '',
      link_url: promotion.link_url || '',
      start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().slice(0, 16) : '',
      end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().slice(0, 16) : '',
      active: promotion.active,
      selectedProductId: productId,
      discount_percentage: promotion.discount_percentage?.toString() || '',
      discount_amount: promotion.discount_amount?.toString() || '',
      minimum_order_amount: promotion.minimum_order_amount?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await deletePromotion(id);
      toast.success('Promotion deleted successfully');
      loadPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Failed to delete promotion');
    }
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setSelectedProduct(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      start_date: '',
      end_date: '',
      active: true,
      selectedProductId: '',
      discount_percentage: '',
      discount_amount: '',
      minimum_order_amount: ''
    });
  };

  const isPromotionExpired = (promotion: Promotion) => {
    if (!promotion.end_date) return false;
    return new Date(promotion.end_date) < new Date();
  };

  if (loading) {
    return <div className="text-center py-8">Loading promotions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Megaphone className="h-5 w-5 mr-2 text-blue-500" />
          Promotions ({promotions.length})
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
              </DialogTitle>
              <DialogDescription>
                Create promotions to showcase products and attract customers
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selectedProductId">Select Product *</Label>
                  <Select
                    value={formData.selectedProductId}
                    onValueChange={handleProductSelect}
                    required
                  >
                    <SelectTrigger className="w-full bg-background border border-input">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50 max-h-[300px] overflow-y-auto">
                      {products.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No products available
                        </div>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id} className="cursor-pointer hover:bg-accent">
                            <div className="flex items-center space-x-2">
                              <span>{product.name}</span>
                              <span className="text-muted-foreground">- KES {product.price.toLocaleString()}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="active">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedProduct && (
                <Card className="p-4">
                  <div className="flex items-center space-x-4">
                    {selectedProduct.image_url && (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{selectedProduct.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="font-medium">KES {selectedProduct.price.toLocaleString()}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{selectedProduct.rating}</span>
                          <span className="text-muted-foreground">({selectedProduct.reviews_count})</span>
                        </div>
                        <Badge variant={selectedProduct.in_stock ? "default" : "destructive"}>
                          {selectedProduct.in_stock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Promotion Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter promotion title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your promotion"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Discount %</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                    placeholder="e.g., 20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount Amount (KES)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                    placeholder="e.g., 1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_order_amount">Min. Order (KES)</Label>
                  <Input
                    id="minimum_order_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_order_amount: e.target.value }))}
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="e.g., /products/laptop-123"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPromotion ? 'Update' : 'Create'} Promotion
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Promotion</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promotion) => {
              // Extract product ID from link_url if it follows the pattern /products/{id}
              const productIdMatch = promotion.link_url?.match(/\/products\/(.+)/);
              const productId = productIdMatch ? productIdMatch[1] : '';
              const product = products.find(p => p.id === productId);
              return (
                <TableRow key={promotion.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {promotion.image_url ? (
                        <img
                          src={promotion.image_url}
                          alt={promotion.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{promotion.title}</div>
                        {promotion.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {promotion.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product ? (
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          KES {product.price.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No product</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {promotion.discount_percentage ? (
                      <Badge variant="secondary">{promotion.discount_percentage}% off</Badge>
                    ) : promotion.discount_amount ? (
                      <Badge variant="secondary">KES {promotion.discount_amount} off</Badge>
                    ) : (
                      <span className="text-muted-foreground">No discount</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {promotion.start_date && (
                        <div>From: {new Date(promotion.start_date).toLocaleDateString()}</div>
                      )}
                      {promotion.end_date && (
                        <div>Until: {new Date(promotion.end_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        !promotion.active ? 'secondary' :
                        isPromotionExpired(promotion) ? 'destructive' : 
                        'default'
                      }
                    >
                      {!promotion.active ? 'Inactive' :
                       isPromotionExpired(promotion) ? 'Expired' : 
                       'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(promotion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(promotion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {promotions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No promotions found. Create your first promotion to showcase products and attract customers.
        </div>
      )}
    </div>
  );
};

export default PromotionsManager;