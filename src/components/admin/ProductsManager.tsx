import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/utils/imageUtils';

const ProductsManager = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const {
    products,
    loading,
    totalCount,
    currentPage,
    totalPages,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
  } = useProducts({ pageSize: 10 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: '',
    images: [] as File[],
    badge: '',
    badge_color: 'bg-blue-500',
    rating: '0',
    reviews_count: '0',
    in_stock: true,
    is_featured: false,
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleSearch = () => {
    fetchProducts(1, searchQuery, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchProducts(1, searchQuery, category);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(page, searchQuery, selectedCategory);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    const newPreviews = [...previewImages];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    setPreviewImages(newPreviews);
    
    if (currentImageIndex >= newPreviews.length && newPreviews.length > 0) {
      setCurrentImageIndex(newPreviews.length - 1);
    } else if (newPreviews.length === 0) {
      setCurrentImageIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields (Name, Price, Category)');
      return;
    }
    
    if (formData.images.length === 0 && !editingProduct?.image_url) {
      toast.error('Please upload at least one product image');
      return;
    }
    
    setIsUploading(true);
    
    try {
      let imageUrl: string | null = null;
      
      // Upload images to storage if any are selected
      if (formData.images.length > 0) {
        console.log('Uploading images to storage...', formData.images.length);
        
        // Upload images directly using the hook function
        const uploadedImages = await uploadProductImages(formData.images);
        console.log('Images uploaded successfully:', uploadedImages.length);
        
        // Use the first image URL
        if (uploadedImages.length > 0) {
          imageUrl = uploadedImages[0].url;
        }
      }
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category: formData.category,
        image_url: imageUrl || editingProduct?.image_url || null,
        image_data: null,
        image_type: null,
        images: null,
        badge: formData.badge.trim() || null,
        badge_color: formData.badge_color,
        rating: parseFloat(formData.rating) || 0,
        reviews_count: parseInt(formData.reviews_count) || 0,
        in_stock: formData.in_stock,
        is_featured: formData.is_featured,
        stock: 100, // Default stock value
      };

      console.log('Saving product data:', productData);

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      setIsDialogOpen(false);
      resetForm();
      // Products will be refetched automatically by the hook
      toast.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to save product: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category: product.category,
      images: [],
      badge: product.badge || '',
      badge_color: product.badge_color || 'bg-blue-500',
      rating: product.rating.toString(),
      reviews_count: product.reviews_count.toString(),
      in_stock: product.in_stock,
      is_featured: product.is_featured,
    });
    // Show existing image if available
    if (product.image_url) {
      setPreviewImages([product.image_url]);
    } else {
      setPreviewImages([]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct(productToDelete);
      // Product list will be refetched automatically
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      category: '',
      images: [],
      badge: '',
      badge_color: 'bg-blue-500',
      rating: '0',
      reviews_count: '0',
      in_stock: true,
      is_featured: false,
    });
    setPreviewImages([]);
    setCurrentImageIndex(0);
  };

  const badgeColors = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-gray-500', label: 'Gray' },
  ];

  if (adminLoading) {
    return <div className="text-center py-8">Checking permissions...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="shoes">Shoes</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
              <SelectItem value="fashion">Fashion Accessories</SelectItem>
              <SelectItem value="home">Home & Kitchen</SelectItem>
              <SelectItem value="sports">Sports & Outdoors</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="outline">
            Search
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Products ({totalCount} total)
          </h3>
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • Showing {products.length} products
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Create a new product for your store'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="shoes">Shoes</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                      <SelectItem value="fashion">Fashion Accessories</SelectItem>
                      <SelectItem value="home">Home & Kitchen</SelectItem>
                      <SelectItem value="sports">Sports & Outdoors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (KES) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price (KES)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Images *</Label>
                <div className="flex flex-col space-y-4">
                  {previewImages.length > 0 && (
                    <div className="relative">
                      <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={previewImages[currentImageIndex]}
                          alt={`Preview ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {previewImages.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          {previewImages.map((_, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-primary' : 'bg-gray-300'}`}
                              aria-label={`Go to slide ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(currentImageIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-2 p-4 border-2 border-dashed rounded-lg hover:bg-gray-50">
                          <Plus className="h-6 w-6 text-gray-400" />
                          <span className="text-sm text-gray-500">Upload Files</span>
                          <span className="text-xs text-gray-400">Select multiple images</span>
                        </div>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-2 p-4 border-2 border-dashed rounded-lg hover:bg-gray-50">
                          <Plus className="h-6 w-6 text-gray-400" />
                          <span className="text-sm text-gray-500">Upload Folder</span>
                          <span className="text-xs text-gray-400">All images in folder</span>
                        </div>
                      </Label>
                      <Input
                        id="folder-upload"
                        type="file"
                        multiple
                        onChange={handleFolderChange}
                        className="hidden"
                        accept="image/*"
                        // @ts-ignore
                        webkitdirectory="true"
                      />
                    </div>
                  </div>
                  
                  {previewImages.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Please upload at least one product image from your computer. Images will be stored securely and won't break over time.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge">Badge Text</Label>
                  <Input
                    id="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="badge_color">Badge Color</Label>
                  <Select
                    value={formData.badge_color}
                    onValueChange={(value) => setFormData({ ...formData, badge_color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select badge color" />
                    </SelectTrigger>
                    <SelectContent>
                      {badgeColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reviews_count">Reviews Count</Label>
                  <Input
                    id="reviews_count"
                    type="number"
                    min="0"
                    value={formData.reviews_count}
                    onChange={(e) => setFormData({ ...formData, reviews_count: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="in_stock">In Stock</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="in_stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.in_stock ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_featured">Featured Product</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_featured ? 'Show on homepage' : 'Regular product'}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
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
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {(product.image_data || product.image_url || product.images?.length > 0) && (
                      <div className="relative w-12 h-12">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.badge && (
                        <Badge className={`${product.badge_color} text-white text-xs`}>
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{product.category}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>KES {product.price.toLocaleString()}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through">
                        KES {product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>{product.rating}</span>
                    <span className="text-muted-foreground">({product.reviews_count})</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.in_stock ? "default" : "destructive"}>
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} products
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No products found. Create your first product to get started.
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove all its data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsManager;
