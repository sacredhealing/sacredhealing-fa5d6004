import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Heart, Ruler, Shirt, Sparkles, Check, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
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

const SIZE_GUIDE = [
  { size: 'XS', chest: '81-86', waist: '61-66', hip: '86-91' },
  { size: 'S', chest: '86-91', waist: '66-71', hip: '91-96' },
  { size: 'M', chest: '91-96', waist: '71-76', hip: '96-101' },
  { size: 'L', chest: '96-101', waist: '76-81', hip: '101-106' },
  { size: 'XL', chest: '101-106', waist: '81-86', hip: '106-111' },
  { size: 'XXL', chest: '106-111', waist: '86-91', hip: '111-116' },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const formatProductCategory = (category: string) => {
    if (category === 'healing-shirts') return t('shop.categoryHealingArt');
    const keyByCat: Record<string, string> = {
      clothing: 'shop.catClothing',
      art: 'shop.catArt',
      accessories: 'shop.catAccessories',
    };
    const key = keyByCat[category];
    return key ? t(key) : category;
  };

  const fabricBullets = useMemo(
    () => [
      t('shop.fabricBullet1'),
      t('shop.fabricBullet2'),
      t('shop.fabricBullet3'),
      t('shop.fabricBullet4'),
      t('shop.fabricBullet5'),
      t('shop.fabricBullet6'),
    ],
    [t]
  );

  const careItems = useMemo(
    () => [
      t('shop.careItem1'),
      t('shop.careItem2'),
      t('shop.careItem3'),
      t('shop.careItem4'),
      t('shop.careItem5'),
      t('shop.careItem6'),
    ],
    [t]
  );
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (data) {
        setProduct({
          ...data,
          images: (data.images as string[]) || [],
          sizes: (data.sizes as string[]) || [],
        });
      } else if (error) {
        toast.error(t('shop.toastProductNotFound'));
        navigate('/shop');
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, t]);

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!product) return;

    setPurchasing(true);

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
      toast.error(t('shop.toastCheckoutFail'));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const mainImage = product.images[selectedImage] || product.images[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500/20 via-background to-purple-500/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/shop')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{t('shop.productDetailsTitle')}</h1>
        </div>
      </div>

      {/* Main Image */}
      <div className="px-4 py-4">
        <div className="aspect-square bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl overflow-hidden relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}

          {product.is_featured && (
            <Badge className="absolute top-4 left-4 bg-pink-500 text-white">{t('shop.featured')}</Badge>
          )}

          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-4 right-4 bg-background/80 hover:bg-background rounded-full ${
              isInWishlist(product.id) ? 'text-pink-500' : ''
            }`}
            onClick={() => toggleWishlist(product.id)}
          >
            <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </Button>

          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <Badge className="absolute bottom-4 left-4 bg-amber-500 text-white">
              {t('shop.onlyLeft', { count: product.stock_quantity })}
            </Badge>
          )}
        </div>

        {/* Image Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage === idx ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 space-y-4">
        <div>
          <Badge variant="outline" className="mb-2 capitalize">
            {formatProductCategory(product.category)}
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
          {product.description && (
            <p className="text-muted-foreground mt-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-foreground">€{product.price_eur}</span>
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            {t('shop.freeShipping')}
          </Badge>
        </div>

        {/* Buy Button */}
        <Button
          className="w-full h-12 text-lg"
          onClick={handleBuyNow}
          disabled={product.stock_quantity === 0 || purchasing}
        >
          {purchasing ? (
            t('shop.processing')
          ) : product.stock_quantity === 0 ? (
            t('shop.soldOut')
          ) : (
            <>
              <ShoppingBag className="w-5 h-5 mr-2" />
              {t('shop.buyNowWithPrice', { price: String(product.price_eur) })}
            </>
          )}
        </Button>

        {/* Tabs for Details */}
        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="details">{t('shop.tabDetails')}</TabsTrigger>
            <TabsTrigger value="sizing">
              <Ruler className="w-4 h-4 mr-1" />
              {t('shop.tabSizing')}
            </TabsTrigger>
            <TabsTrigger value="care">{t('shop.tabCare')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('shop.detailSacredTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('shop.detailSacredBody')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">{t('shop.fabricQualityTitle')}</h4>
                <ul className="space-y-2">
                  {fabricBullets.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">{t('shop.availableSizes')}</h4>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map((size) => (
                    <Badge key={size} variant="outline">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sizing" className="mt-4">
            <Card className="p-4">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                {t('shop.sizeGuideTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-foreground">{t('shop.tableSize')}</th>
                      <th className="text-left py-2 font-medium text-foreground">{t('shop.tableChest')}</th>
                      <th className="text-left py-2 font-medium text-foreground">{t('shop.tableWaist')}</th>
                      <th className="text-left py-2 font-medium text-foreground">{t('shop.tableHip')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_GUIDE.map((row) => (
                      <tr key={row.size} className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">{row.size}</td>
                        <td className="py-2 text-muted-foreground">{row.chest}</td>
                        <td className="py-2 text-muted-foreground">{row.waist}</td>
                        <td className="py-2 text-muted-foreground">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">{t('shop.sizingFootnote')}</p>
            </Card>
          </TabsContent>

          <TabsContent value="care" className="mt-4">
            <Card className="p-4 space-y-4">
              <h4 className="font-semibold text-foreground">{t('shop.careTitle')}</h4>
              <ul className="space-y-3">
                {careItems.map((text, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {text}
                  </li>
                ))}
              </ul>
              <div className="bg-muted/50 rounded-lg p-3 mt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>{t('shop.careProTipLead')}</strong> {t('shop.careProTipBody')}
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetail;
