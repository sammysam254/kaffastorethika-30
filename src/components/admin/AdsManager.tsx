import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, ExternalLink, Image, Video, Text, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

const AdsManager = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    ad_type: 'product' | 'text' | 'image' | 'url' | 'video';
    content_url: string;
    product_id: string;
    click_url: string;
    start_date: string;
    end_date: string;
    display_order: number;
    is_active: boolean;
  }>({
    title: '',
    description: '',
    ad_type: 'text',
    content_url: '',
    product_id: '',
    click_url: '',
    start_date: '',
    end_date: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadAds();
    loadProducts();
  }, []);

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads' as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAds(data as unknown as Ad[] || []);
    } catch (error) {
      console.error('Error loading ads:', error);
      toast({
        title: "Error",
        description: "Failed to load ads",
        variant: "destructive",
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const adData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        product_id: formData.ad_type === 'product' ? formData.product_id : null,
        content_url: ['image', 'video'].includes(formData.ad_type) ? formData.content_url : null,
        click_url: ['url', 'product'].includes(formData.ad_type) ? formData.click_url : null,
      };

      if (editingAd) {
        const { error } = await supabase
          .from('ads' as any)
          .update(adData)
          .eq('id', editingAd.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Ad updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('ads' as any)
          .insert([adData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Ad created successfully",
        });
      }

      resetForm();
      loadAds();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: "Failed to save ad",
        variant: "destructive",
      });
    }
  };

  const deleteAd = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ads' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Ad deleted successfully",
      });
      loadAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Error",
        description: "Failed to delete ad",
        variant: "destructive",
      });
    }
  };

  const toggleAdStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ads' as any)
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      loadAds();
      toast({
        title: "Success",
        description: `Ad ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Error",
        description: "Failed to update ad status",
        variant: "destructive",
      });
    }
  };

  const editAd = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      ad_type: ad.ad_type,
      content_url: ad.content_url || '',
      product_id: ad.product_id || '',
      click_url: ad.click_url || '',
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
      display_order: ad.display_order,
      is_active: ad.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ad_type: 'text',
      content_url: '',
      product_id: '',
      click_url: '',
      start_date: '',
      end_date: '',
      display_order: 0,
      is_active: true
    });
    setEditingAd(null);
    setIsDialogOpen(false);
  };

  const getAdTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'url': return <ExternalLink className="w-4 h-4" />;
      default: return <Text className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div>Loading ads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ads Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad_type">Ad Type *</Label>
                <Select value={formData.ad_type} onValueChange={(value: any) => setFormData({...formData, ad_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Ad</SelectItem>
                    <SelectItem value="image">Image Ad</SelectItem>
                    <SelectItem value="video">Video Ad</SelectItem>
                    <SelectItem value="product">Product Ad</SelectItem>
                    <SelectItem value="url">URL Ad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.ad_type === 'product' && (
                <div className="space-y-2">
                  <Label htmlFor="product_id">Select Product *</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - KSh {product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(['image', 'video'].includes(formData.ad_type)) && (
                <div className="space-y-2">
                  <Label htmlFor="content_url">Content URL *</Label>
                  <Input
                    id="content_url"
                    type="url"
                    value={formData.content_url}
                    onChange={(e) => setFormData({...formData, content_url: e.target.value})}
                    placeholder={`Enter ${formData.ad_type} URL`}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="click_url">Click URL</Label>
                <Input
                  id="click_url"
                  type="url"
                  value={formData.click_url}
                  onChange={(e) => setFormData({...formData, click_url: e.target.value})}
                  placeholder="Where should users go when they click this ad?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {ads.map((ad) => (
          <Card key={ad.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getAdTypeIcon(ad.ad_type)}
                  <CardTitle className="text-lg">{ad.title}</CardTitle>
                  <Badge variant={ad.is_active ? "default" : "secondary"}>
                    {ad.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{ad.ad_type}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => editAd(ad)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteAd(ad.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={(checked) => toggleAdStatus(ad.id, checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ad.description && (
                  <p className="text-sm text-muted-foreground">{ad.description}</p>
                )}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  {ad.start_date && <div>Start: {new Date(ad.start_date).toLocaleDateString()}</div>}
                  {ad.end_date && <div>End: {new Date(ad.end_date).toLocaleDateString()}</div>}
                  {ad.click_url && <div>Click URL: {ad.click_url}</div>}
                  <div>Display Order: {ad.display_order}</div>
                </div>

                {ad.ad_type === 'product' && ad.product_id && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">
                      Product: {products.find(p => p.id === ad.product_id)?.name || 'Unknown Product'}
                    </span>
                  </div>
                )}

                {(['image', 'video'].includes(ad.ad_type)) && ad.content_url && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    {ad.ad_type === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span className="text-sm truncate">Content: {ad.content_url}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {ads.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No ads created yet. Create your first ad to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdsManager;