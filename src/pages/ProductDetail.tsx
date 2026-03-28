import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Heart, Ruler, Shirt, Sparkles, Check, ShoppingBag, Loader2 } from 'lucide-react';
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

const akashaField = (
  <>
    <div className="pointer-events-none fixed inset-0 bg-[#050505] z-0" aria-hidden />
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.95] bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(212,175,55,0.1)_0%,transparent_55%),radial-gradient(ellipse_90%_55%_at_100%_25%,rgba(212,175,55,0.05)_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_0%_75%,rgba(34,211,238,0.035)_0%,transparent_45%)]"
      aria-hidden
    />
  </>
);

const detailGlassPanel =
  '!p-5 rounded-[28px] border border-white/[0.08] shadow-[0_0_40px_-14px_rgba(212,175,55,0.12)]';

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
      <div className="min-h-screen relative overflow-hidden bg-[#050505] flex items-center justify-center">
        {akashaField}
        <Loader2
          className="relative z-10 w-9 h-9 animate-spin text-[#D4AF37] drop-shadow-[0_0_16px_rgba(212,175,55,0.45)]"
          aria-hidden
        />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const mainImage = product.images[selectedImage] || product.images[0];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] pb-28">
      {akashaField}
      <div className="relative z-10 px-4 pt-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-6">
        <p className="sqi-label-text text-[#D4AF37]/60">{t('shop.sqiEyebrow')}</p>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/shop')}
            className="rounded-full border border-white/[0.08] text-[#D4AF37] hover:bg-white/[0.06] hover:text-[#D4AF37]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-black tracking-[-0.04em] font-heading text-[#D4AF37] gold-glow">
            {t('shop.productDetailsTitle')}
          </h1>
        </div>
      </div>

      {/* Main Image */}
      <div className="py-2">
        <div className="aspect-square bg-[#050505] rounded-[24px] overflow-hidden relative border border-[#D4AF37]/25 shadow-[0_0_48px_-12px_rgba(212,175,55,0.2)]">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
              <Shirt className="w-24 h-24 text-[#D4AF37]/25" />
            </div>
          )}

          {product.is_featured && (
            <Badge className="absolute top-4 left-4 border border-[#D4AF37]/40 bg-[#050505]/90 text-[#D4AF37] font-black text-[10px] uppercase tracking-wider">
              {t('shop.featured')}
            </Badge>
          )}

          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-4 right-4 bg-[#050505]/80 border border-white/[0.1] hover:bg-[#050505] rounded-full ${
              isInWishlist(product.id) ? 'text-[#D4AF37]' : 'text-white/80'
            }`}
            onClick={() => toggleWishlist(product.id)}
          >
            <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </Button>

          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <Badge className="absolute bottom-4 left-4 border border-[#22D3EE]/40 bg-[#22D3EE]/15 text-[#22D3EE] text-xs font-bold">
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
                className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage === idx ? 'border-[#D4AF37] shadow-[0_0_16px_-4px_rgba(212,175,55,0.45)]' : 'border-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-4 pt-2">
        <div>
          <Badge
            variant="outline"
            className="mb-2 capitalize border-[#D4AF37]/25 text-[#D4AF37]/90 bg-[#D4AF37]/5"
          >
            {formatProductCategory(product.category)}
          </Badge>
          <h2 className="text-2xl font-black tracking-[-0.04em] font-heading text-white">{product.name}</h2>
          {product.description && <p className="sqi-body-text mt-2">{product.description}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-3xl font-black font-heading text-[#D4AF37]">€{product.price_eur}</span>
          <Badge
            variant="outline"
            className="border-[#22D3EE]/35 text-[#22D3EE] bg-[#22D3EE]/10 text-xs font-bold"
          >
            {t('shop.freeShipping')}
          </Badge>
        </div>

        {/* Buy Button */}
        <Button
          variant="gold"
          className="w-full h-12 text-base font-black tracking-[0.08em] uppercase"
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
          <TabsList className="w-full grid grid-cols-3 h-auto p-1.5 gap-1 rounded-[28px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-[40px]">
            <TabsTrigger
              value="details"
              className="rounded-full text-xs py-2.5 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              {t('shop.tabDetails')}
            </TabsTrigger>
            <TabsTrigger
              value="sizing"
              className="rounded-full text-xs py-2.5 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              <Ruler className="w-4 h-4 mr-1 shrink-0" />
              {t('shop.tabSizing')}
            </TabsTrigger>
            <TabsTrigger
              value="care"
              className="rounded-full text-xs py-2.5 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              {t('shop.tabCare')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card className={`${detailGlassPanel} space-y-4`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-black font-heading text-[#D4AF37] text-sm">{t('shop.detailSacredTitle')}</h4>
                  <p className="sqi-body-text text-sm mt-1">{t('shop.detailSacredBody')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black font-heading text-white text-sm tracking-tight">{t('shop.fabricQualityTitle')}</h4>
                <ul className="space-y-2">
                  {fabricBullets.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm sqi-body-text">
                      <Check className="w-4 h-4 text-[#22D3EE] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black font-heading text-white text-sm">{t('shop.availableSizes')}</h4>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map((size) => (
                    <Badge key={size} variant="outline" className="border-[#D4AF37]/25 text-[#D4AF37]/90">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sizing" className="mt-4">
            <Card className={detailGlassPanel}>
              <h4 className="font-black font-heading text-[#D4AF37] mb-4 flex items-center gap-2 text-sm">
                <Ruler className="w-5 h-5 text-[#22D3EE]" />
                {t('shop.sizeGuideTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.1]">
                      <th className="text-left py-2 font-bold text-white/90">{t('shop.tableSize')}</th>
                      <th className="text-left py-2 font-bold text-white/90">{t('shop.tableChest')}</th>
                      <th className="text-left py-2 font-bold text-white/90">{t('shop.tableWaist')}</th>
                      <th className="text-left py-2 font-bold text-white/90">{t('shop.tableHip')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_GUIDE.map((row) => (
                      <tr key={row.size} className="border-b border-white/[0.06]">
                        <td className="py-2 font-bold text-[#D4AF37]">{row.size}</td>
                        <td className="py-2 sqi-body-text">{row.chest}</td>
                        <td className="py-2 sqi-body-text">{row.waist}</td>
                        <td className="py-2 sqi-body-text">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="sqi-body-text text-xs mt-4">{t('shop.sizingFootnote')}</p>
            </Card>
          </TabsContent>

          <TabsContent value="care" className="mt-4">
            <Card className={`${detailGlassPanel} space-y-4`}>
              <h4 className="font-black font-heading text-white text-sm">{t('shop.careTitle')}</h4>
              <ul className="space-y-3">
                {careItems.map((text, idx) => (
                  <li key={idx} className="text-sm sqi-body-text">
                    {text}
                  </li>
                ))}
              </ul>
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-3 mt-4">
                <p className="sqi-body-text text-xs">
                  <strong className="text-white/90">{t('shop.careProTipLead')}</strong> {t('shop.careProTipBody')}
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
};

export default ProductDetail;
