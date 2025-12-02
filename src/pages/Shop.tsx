import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Palette, Shirt, Star, Filter, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  is_featured: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  clothing: Shirt,
  art: Palette,
  accessories: Star,
};

const Shop = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

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

    // TODO: Implement Stripe checkout
    toast.info('Checkout coming soon!');
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
          Laila's Sacred Healing Clothing & Art Collection
        </p>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-4">
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="clothing">
              <Shirt className="w-4 h-4 mr-1" />
              Clothing
            </TabsTrigger>
            <TabsTrigger value="art">
              <Palette className="w-4 h-4 mr-1" />
              Art
            </TabsTrigger>
            <TabsTrigger value="accessories">Accessories</TabsTrigger>
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
                <Card key={product.id} className="overflow-hidden">
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
                      className="absolute bottom-2 right-2 bg-background/80 hover:bg-background rounded-full w-8 h-8"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <Badge variant="outline" className="text-xs mb-2 capitalize">
                      {product.category}
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
                        onClick={() => handleBuyNow(product)}
                        disabled={product.stock_quantity === 0}
                      >
                        Buy
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each piece in our collection is infused with sacred healing energy by Laila. 
            Our clothing features unique spiritual designs, and our art pieces carry powerful 
            healing frequencies to transform your space and energy field.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Shop;
