import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingBag, Trash2, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_eur: number;
  images: string[];
  sizes: string[];
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
}

const AdminShop = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'clothing',
    price_eur: 0,
    images: '',
    sizes: '',
    stock_quantity: 0,
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('shop_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data.map(p => ({
        ...p,
        images: (p.images as string[]) || [],
        sizes: (p.sizes as string[]) || [],
      })));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'clothing',
      price_eur: 0,
      images: '',
      sizes: '',
      stock_quantity: 0,
      is_active: true,
      is_featured: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (product: ShopProduct) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price_eur: product.price_eur,
      images: product.images.join(', '),
      sizes: product.sizes.join(', '),
      stock_quantity: product.stock_quantity,
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.price_eur <= 0) {
      toast.error('Please fill in required fields');
      return;
    }

    const saveData = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      price_eur: formData.price_eur,
      images: formData.images ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
      stock_quantity: formData.stock_quantity,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
    };

    if (editingId) {
      const { error } = await supabase
        .from('shop_products')
        .update(saveData)
        .eq('id', editingId);

      if (error) {
        toast.error('Failed to update product');
      } else {
        toast.success('Product updated');
        resetForm();
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from('shop_products')
        .insert(saveData);

      if (error) {
        toast.error('Failed to add product');
      } else {
        toast.success('Product added');
        resetForm();
        fetchProducts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('shop_products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manage Shop</h1>
            <p className="text-sm text-muted-foreground">{products.length} products</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Add Button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full mb-4">
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        )}

        {/* Form */}
        {showForm && (
          <Card className="p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Siddha Quantum Nexus Dress"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beautiful handcrafted..."
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (EUR) *</Label>
                  <Input
                    type="number"
                    value={formData.price_eur}
                    onChange={(e) => setFormData({ ...formData, price_eur: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Image URLs (comma-separated)</Label>
                <Textarea
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://image1.jpg, https://image2.jpg"
                />
              </div>

              <div>
                <Label>Sizes (comma-separated, for clothing)</Label>
                <Input
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="XS, S, M, L, XL"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Save'} Product
              </Button>
            </div>
          </Card>
        )}

        {/* List */}
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id} className={`p-4 ${!product.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                    {product.is_featured && <Badge className="text-xs">Featured</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    €{product.price_eur} • {product.stock_quantity} in stock • {product.category}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminShop;
