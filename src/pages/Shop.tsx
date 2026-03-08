import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Palette, Shirt, Star, Heart, Sparkles, PenTool, Check, ArrowRight, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_eur: number;
  images: string[];
  sizes: string[];
  stock_quantity: number;
  is_featured: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  clothing: Shirt,
  art: Palette,
  accessories: Star,
  'healing-shirts': Sparkles,
};

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHIRT_COLORS = ['White', 'Black', 'Natural', 'Navy'];

const Shop = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  const [customFormData, setCustomFormData] = useState({
    intention: '',
    shirtSize: '',
    shirtColor: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
    
    // Handle success/cancel from Stripe redirect
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Payment successful! Your order is being processed.');
    } else if (canceled === 'true') {
      toast.info('Payment was canceled.');
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('shop_products')
      .select('*')
      .order('is_featured', { ascending: false })
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

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleBuyNow = async (product: ShopProduct) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setPurchasing(product.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-shop-checkout', {
        body: {
          productId: product.id,
          productName: product.name,
          priceEur: product.price_eur,
          quantity: 1,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleCustomOrder = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!customFormData.intention || !customFormData.shirtSize || !customFormData.shirtColor || !customFormData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // TODO: Implement Stripe checkout for custom orders
    toast.success('Custom design request submitted! We will contact you soon.');
    setCustomOrderOpen(false);
    setCustomFormData({ intention: '', shirtSize: '', shirtColor: '', email: '', notes: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500/20 via-background to-purple-500/10 px-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-pink-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Sacred Shop</h1>
        <p className="text-muted-foreground">
          Laila's Siddha Quantum Nexus Clothing & Art Collection
        </p>
      </div>

      {/* Healing Art Shirts Section */}
      <div className="px-4 py-6 space-y-6">
        {/* Ready-Made Designs */}
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-amber-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-purple-400" />
              </div>
              <div className="flex-1">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-2">
                  Wearable Healing Art
                </Badge>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Healing Art on Shirts — Ready-Made Designs
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Original sacred artwork printed on soft, high-quality shirts. Choose from a curated gallery of ready-made designs that carry uplifting energy and support your daily practice.
                </p>
              </div>
            </div>
            
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Sacred-geometry artwork</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Comfortable fabric</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Multiple sizes (XS-XXL)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">High-quality print</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3">
                  <Info className="w-3 h-3 inline mr-1" />
                  Created by Laila & Adam with intentional vibration for your spiritual focus
                </p>
                <Button className="w-full" onClick={() => setActiveCategory('healing-shirts')}>
                  Browse Designs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Custom Designs */}
        <Card className="overflow-hidden border-amber-500/20">
          <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-pink-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <PenTool className="w-7 h-7 text-amber-400" />
              </div>
              <div className="flex-1">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 mb-2">
                  Personalized Creation
                </Badge>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Healing Art on Shirts — Custom Design
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your own healing art, printed on a shirt. Laila crafts one-of-a-kind artwork tailored to your energy, intention, or mantra—perfect for personal rituals or meaningful gifts.
                </p>
              </div>
            </div>
            
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Personalized by Laila</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Choose shirt style & color</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Amplify your intention</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Review before final print</span>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3 mt-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Process:</p>
                <p className="text-xs text-muted-foreground">
                  Submit intention → Design draft → Approve → Print & ship (Est. 2-3 weeks)
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div>
                  <span className="text-2xl font-bold text-foreground">€89</span>
                  <span className="text-sm text-muted-foreground ml-1">starting price</span>
                </div>
                <Dialog open={customOrderOpen} onOpenChange={setCustomOrderOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="bg-amber-500 hover:bg-amber-600">
                      Order Custom
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Custom Healing Art Shirt</DialogTitle>
                      <DialogDescription>
                        Share your intention and we'll create a unique design for you
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="intention">Your Intention / Mantra *</Label>
                        <Textarea
                          id="intention"
                          placeholder="Describe your intention, mantra, or theme for the artwork..."
                          value={customFormData.intention}
                          onChange={(e) => setCustomFormData(prev => ({ ...prev, intention: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Shirt Size *</Label>
                          <Select
                            value={customFormData.shirtSize}
                            onValueChange={(value) => setCustomFormData(prev => ({ ...prev, shirtSize: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {SHIRT_SIZES.map(size => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Shirt Color *</Label>
                          <Select
                            value={customFormData.shirtColor}
                            onValueChange={(value) => setCustomFormData(prev => ({ ...prev, shirtColor: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                              {SHIRT_COLORS.map(color => (
                                <SelectItem key={color} value={color}>{color}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Contact Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={customFormData.email}
                          onChange={(e) => setCustomFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any specific colors, symbols, or preferences..."
                          value={customFormData.notes}
                          onChange={(e) => setCustomFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>What's included:</strong> Personalized sacred artwork, high-quality print, one revision round, and shipping within Europe.
                        </p>
                      </div>
                      
                      <Button onClick={handleCustomOrder} className="w-full bg-amber-500 hover:bg-amber-600">
                        Submit Request — €89
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-4">
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="healing-shirts">
              <Sparkles className="w-4 h-4 mr-1" />
              Shirts
            </TabsTrigger>
            <TabsTrigger value="clothing">
              <Shirt className="w-4 h-4 mr-1" />
              Clothing
            </TabsTrigger>
            <TabsTrigger value="art">
              <Palette className="w-4 h-4 mr-1" />
              Art
            </TabsTrigger>
            <TabsTrigger value="accessories">Acc.</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Products Grid */}
      <div className="px-4 py-2">
        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground text-sm">
              Beautiful sacred items will be available here soon!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const Icon = categoryIcons[product.category] || Star;
              const mainImage = product.images[0];

              return (
                <Card 
                  key={product.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-pink-500/10 to-purple-500/10 relative">
                    {mainImage ? (
                      <img 
                        src={mainImage} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {product.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-pink-500 text-white">
                        Featured
                      </Badge>
                    )}

                    {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                      <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">
                        Only {product.stock_quantity} left
                      </Badge>
                    )}

                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Badge variant="outline">Sold Out</Badge>
                      </div>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className={`absolute bottom-2 right-2 bg-background/80 hover:bg-background rounded-full w-8 h-8 ${
                        isInWishlist(product.id) ? 'text-pink-500' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <Badge variant="outline" className="text-xs mb-2 capitalize">
                      {product.category === 'healing-shirts' ? 'Healing Art' : product.category}
                    </Badge>
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-foreground">€{product.price_eur}</span>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(product);
                        }}
                        disabled={product.stock_quantity === 0 || purchasing === product.id}
                      >
                        {purchasing === product.id ? '...' : 'Buy'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="px-4 py-6">
        <Card className="p-5 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            About Our Collection
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Each piece in our collection is infused with sacred healing energy by Laila. 
            Our clothing features unique spiritual designs, and our art pieces carry powerful 
            healing frequencies to transform your space and energy field.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <strong className="text-foreground">Fabric:</strong> 100% organic cotton, soft & breathable
            </div>
            <div>
              <strong className="text-foreground">Fit:</strong> Regular & relaxed options
            </div>
            <div>
              <strong className="text-foreground">Care:</strong> Machine wash cold, tumble dry low
            </div>
            <div>
              <strong className="text-foreground">Use:</strong> Daily wear, meditation, gifting
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Shop;
