import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ShoppingBag, Palette, Shirt, Star, Heart, Sparkles, PenTool, Check, ArrowRight, Info, Loader2 } from 'lucide-react';
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
const SHIRT_COLORS = ['White', 'Black', 'Natural', 'Navy'] as const;
const CUSTOM_SHIRT_PRICE = '89';

const shirtColorTranslationKey = (color: string): string => {
  const map: Record<string, string> = {
    White: 'shop.colorWhite',
    Black: 'shop.colorBlack',
    Natural: 'shop.colorNatural',
    Navy: 'shop.colorNavy',
  };
  return map[color] ?? 'shop.colorWhite';
};

const akashaField = (
  <>
    <div className="pointer-events-none fixed inset-0 bg-[#050505] z-0" aria-hidden />
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.95] bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(212,175,55,0.1)_0%,transparent_55%),radial-gradient(ellipse_90%_55%_at_100%_25%,rgba(212,175,55,0.05)_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_0%_75%,rgba(34,211,238,0.035)_0%,transparent_45%)]"
      aria-hidden
    />
  </>
);

const shopGlassCard =
  '!p-0 overflow-hidden rounded-[40px] border border-white/[0.08] shadow-[0_0_48px_-16px_rgba(212,175,55,0.15)]';

const Shop = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      toast.success(t('shop.toastPaymentSuccess'));
    } else if (canceled === 'true') {
      toast.info(t('shop.toastPaymentCanceled'));
    }
  }, [searchParams, t]);

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
      toast.error(t('shop.toastCheckoutFail'));
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
      toast.error(t('shop.toastFillRequired'));
      return;
    }
    
    // TODO: Implement Stripe checkout for custom orders
    toast.success(t('shop.toastCustomSubmitted'));
    setCustomOrderOpen(false);
    setCustomFormData({ intention: '', shirtSize: '', shirtColor: '', email: '', notes: '' });
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] pb-28">
      {akashaField}
      <div className="relative z-10 px-4 pt-6 max-w-4xl mx-auto">
      <header className="mb-8 text-center animate-fade-in">
        <p className="sqi-label-text mb-2 text-[#D4AF37]/70">{t('shop.sqiEyebrow')}</p>
        <div className="w-16 h-16 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_-8px_rgba(212,175,55,0.35)]">
          <ShoppingBag className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-[-0.05em] font-heading text-[#D4AF37] gold-glow">
          {t('shop.title')}
        </h1>
        <p className="sqi-body-text mt-2 text-base max-w-xl mx-auto">{t('shop.heroTagline')}</p>
      </header>

      {/* Healing Art Shirts Section */}
      <div className="py-2 space-y-6">
        {/* Ready-Made Designs */}
        <Card className={`${shopGlassCard} relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[40px] before:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,175,55,0.09)_0%,transparent_55%)]`}>
          <div className="relative z-[1] p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_-8px_rgba(212,175,55,0.35)]">
                <Sparkles className="w-7 h-7 text-[#D4AF37]" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="mb-2 border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/15">
                  {t('shop.badgeWearableHealingArt')}
                </Badge>
                <h2 className="text-xl font-black tracking-[-0.03em] font-heading text-white mb-2">
                  {t('shop.readyMadeTitle')}
                </h2>
                <p className="sqi-body-text text-sm">{t('shop.readyMadeBody')}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.readyCheck1')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.readyCheck2')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.readyCheck3')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.readyCheck4')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08]">
                <p className="sqi-body-text text-xs mb-3">
                  <Info className="w-3 h-3 inline mr-1 text-[#D4AF37]/80" />
                  {t('shop.readyInfoLine')}
                </p>
                <Button variant="gold" className="w-full font-black tracking-[0.12em] uppercase text-xs" onClick={() => setActiveCategory('healing-shirts')}>
                  {t('shop.browseDesigns')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Custom Designs */}
        <Card className={`${shopGlassCard} relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[40px] before:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(34,211,238,0.08)_0%,transparent_55%)]`}>
          <div className="relative z-[1] p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl border border-[#22D3EE]/25 bg-[#22D3EE]/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_-8px_rgba(34,211,238,0.25)]">
                <PenTool className="w-7 h-7 text-[#22D3EE]" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="mb-2 border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/15">
                  {t('shop.badgePersonalized')}
                </Badge>
                <h2 className="text-xl font-black tracking-[-0.03em] font-heading text-white mb-2">
                  {t('shop.customTitle')}
                </h2>
                <p className="sqi-body-text text-sm">{t('shop.customBody')}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.customCheck1')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.customCheck2')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.customCheck3')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] mt-0.5 flex-shrink-0" />
                  <span className="text-xs sqi-body-text">{t('shop.customCheck4')}</span>
                </div>
              </div>

              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] backdrop-blur-[40px] p-3 mt-3">
                <p className="sqi-label-text !text-[#D4AF37]/55 mb-1">{t('shop.processLabel')}</p>
                <p className="sqi-body-text text-xs">{t('shop.processSteps')}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/[0.08]">
                <div>
                  <span className="text-2xl font-black font-heading text-[#D4AF37]">€{CUSTOM_SHIRT_PRICE}</span>
                  <span className="sqi-body-text text-sm ml-1">{t('shop.startingPriceNote')}</span>
                </div>
                <Dialog open={customOrderOpen} onOpenChange={setCustomOrderOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gold" className="w-full sm:w-auto font-black tracking-[0.1em] uppercase text-xs">
                      {t('shop.orderCustom')}
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-[28px] border border-white/[0.1] bg-[#050505]/95 backdrop-blur-[40px] text-white shadow-[0_0_60px_-20px_rgba(212,175,55,0.35)]">
                    <DialogHeader>
                      <DialogTitle className="font-heading font-black tracking-[-0.03em] text-[#D4AF37] gold-glow">
                        {t('shop.dialogCustomTitle')}
                      </DialogTitle>
                      <DialogDescription className="sqi-body-text text-sm">{t('shop.dialogCustomDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="intention" className="sqi-label-text !text-[10px] !tracking-[0.35em] text-[#D4AF37]/80">
                          {t('shop.labelIntention')}
                        </Label>
                        <Textarea
                          id="intention"
                          placeholder={t('shop.placeholderIntention')}
                          value={customFormData.intention}
                          onChange={(e) => setCustomFormData(prev => ({ ...prev, intention: e.target.value }))}
                          rows={3}
                          className="rounded-[20px] border-white/[0.1] bg-white/[0.04] text-white placeholder:text-white/35 backdrop-blur-[40px] focus-visible:border-[#D4AF37]/45 focus-visible:ring-[#D4AF37]/20"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="sqi-label-text !text-[10px] !tracking-[0.35em] text-[#D4AF37]/80">{t('shop.labelShirtSize')}</Label>
                          <Select
                            value={customFormData.shirtSize}
                            onValueChange={(value) => setCustomFormData(prev => ({ ...prev, shirtSize: value }))}
                          >
                            <SelectTrigger className="rounded-[20px] border-white/[0.1] bg-white/[0.04] text-white backdrop-blur-[40px]">
                              <SelectValue placeholder={t('shop.selectSize')} />
                            </SelectTrigger>
                            <SelectContent>
                              {SHIRT_SIZES.map(size => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="sqi-label-text !text-[10px] !tracking-[0.35em] text-[#D4AF37]/80">{t('shop.labelShirtColor')}</Label>
                          <Select
                            value={customFormData.shirtColor}
                            onValueChange={(value) => setCustomFormData(prev => ({ ...prev, shirtColor: value }))}
                          >
                            <SelectTrigger className="rounded-[20px] border-white/[0.1] bg-white/[0.04] text-white backdrop-blur-[40px]">
                              <SelectValue placeholder={t('shop.selectColor')} />
                            </SelectTrigger>
                            <SelectContent>
                              {SHIRT_COLORS.map(color => (
                                <SelectItem key={color} value={color}>
                                  {t(shirtColorTranslationKey(color))}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="sqi-label-text !text-[10px] !tracking-[0.35em] text-[#D4AF37]/80">
                          {t('shop.labelContactEmail')}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t('shop.emailPlaceholder')}
                          value={customFormData.email}
                          onChange={(e) => setCustomFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="rounded-[20px] border-white/[0.1] bg-white/[0.04] text-white placeholder:text-white/35 h-11 backdrop-blur-[40px] focus-visible:border-[#D4AF37]/45 focus-visible:ring-[#D4AF37]/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes" className="sqi-label-text !text-[10px] !tracking-[0.35em] text-[#D4AF37]/80">
                          {t('shop.labelNotesOptional')}
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder={t('shop.placeholderNotes')}
                          value={customFormData.notes}
                          onChange={(e) => setCustomFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={2}
                          className="rounded-[20px] border-white/[0.1] bg-white/[0.04] text-white placeholder:text-white/35 backdrop-blur-[40px] focus-visible:border-[#D4AF37]/45 focus-visible:ring-[#D4AF37]/20"
                        />
                      </div>

                      <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-3">
                        <p className="sqi-body-text text-xs">
                          <strong className="text-white/90">{t('shop.whatsIncludedLead')}</strong> {t('shop.whatsIncludedBody')}
                        </p>
                      </div>

                      <Button variant="gold" onClick={handleCustomOrder} className="w-full font-black tracking-[0.12em] uppercase text-xs">
                        {t('shop.submitRequest', { price: CUSTOM_SHIRT_PRICE })}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Tabs — Bhakti-Algorithm filters */}
      <div className="py-4">
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full grid grid-cols-5 h-auto p-1.5 gap-1 rounded-[28px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-[40px]">
            <TabsTrigger
              value="all"
              className="rounded-full text-[10px] sm:text-xs py-2.5 px-1 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              {t('shop.tabAll')}
            </TabsTrigger>
            <TabsTrigger
              value="healing-shirts"
              className="rounded-full text-[10px] sm:text-xs py-2.5 px-1 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 shrink-0" />
              {t('shop.tabShirts')}
            </TabsTrigger>
            <TabsTrigger
              value="clothing"
              className="rounded-full text-[10px] sm:text-xs py-2.5 px-1 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              <Shirt className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 shrink-0" />
              {t('shop.tabClothing')}
            </TabsTrigger>
            <TabsTrigger
              value="art"
              className="rounded-full text-[10px] sm:text-xs py-2.5 px-1 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 shrink-0" />
              {t('shop.tabArt')}
            </TabsTrigger>
            <TabsTrigger
              value="accessories"
              className="rounded-full text-[10px] sm:text-xs py-2.5 px-1 text-white/60 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] data-[state=active]:shadow-[0_0_20px_-8px_rgba(212,175,55,0.4)]"
            >
              {t('shop.tabAccessoriesShort')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Products Grid */}
      <div className="py-2">
        {filteredProducts.length === 0 ? (
          <Card className={shopGlassCard}>
            <div className="relative z-[1] p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-[#D4AF37]/65 mx-auto mb-4" />
              <h3 className="font-black font-heading tracking-[-0.03em] text-white mb-2">{t('shop.comingSoonTitle')}</h3>
              <p className="sqi-body-text text-sm">{t('shop.comingSoonBody')}</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const Icon = categoryIcons[product.category] || Star;
              const mainImage = product.images[0];

              return (
                <Card
                  key={product.id}
                  className={`${shopGlassCard} cursor-pointer transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.25)] hover:scale-[1.02] animate-slide-up rounded-[28px]`}
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  <div className="aspect-square bg-[#050505] relative">
                    {mainImage ? (
                      <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                        <Icon className="w-12 h-12 text-[#D4AF37]/35" />
                      </div>
                    )}

                    {product.is_featured && (
                      <Badge className="absolute top-2 left-2 border border-[#D4AF37]/40 bg-[#050505]/90 text-[#D4AF37] font-black text-[10px] uppercase tracking-wider">
                        {t('shop.featured')}
                      </Badge>
                    )}

                    {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                      <Badge className="absolute top-2 right-2 border border-[#22D3EE]/40 bg-[#22D3EE]/15 text-[#22D3EE] text-[10px] font-bold">
                        {t('shop.onlyLeft', { count: product.stock_quantity })}
                      </Badge>
                    )}

                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-[#050505]/85 backdrop-blur-sm flex items-center justify-center">
                        <Badge variant="outline" className="border-white/20 text-white/90 bg-white/[0.04]">
                          {t('shop.soldOut')}
                        </Badge>
                      </div>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className={`absolute bottom-2 right-2 bg-[#050505]/80 border border-white/[0.08] hover:bg-[#050505] hover:border-[#D4AF37]/30 rounded-full w-9 h-9 ${
                        isInWishlist(product.id) ? 'text-[#D4AF37]' : 'text-white/70'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  <div className="p-3 border-t border-white/[0.06]">
                    <Badge
                      variant="outline"
                      className="text-[10px] mb-2 capitalize border-[#D4AF37]/25 text-[#D4AF37]/90 bg-[#D4AF37]/5"
                    >
                      {formatProductCategory(product.category)}
                    </Badge>
                    <h3 className="font-bold font-heading tracking-tight text-white text-sm truncate">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs sqi-body-text truncate mt-1">{product.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-3 gap-2">
                      <span className="font-black font-heading text-[#D4AF37]">€{product.price_eur}</span>
                      <Button
                        variant="gold"
                        size="sm"
                        className="font-black text-[10px] tracking-[0.15em] uppercase shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(product);
                        }}
                        disabled={product.stock_quantity === 0 || purchasing === product.id}
                      >
                        {purchasing === product.id ? '...' : t('shop.buyShort')}
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
      <div className="py-6">
        <Card className={`${shopGlassCard} p-6 bg-[radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(212,175,55,0.06)_0%,transparent_50%),rgba(255,255,255,0.02)]`}>
          <h3 className="font-black font-heading tracking-[-0.03em] text-[#D4AF37] gold-glow mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#D4AF37]" />
            {t('shop.aboutTitle')}
          </h3>
          <p className="sqi-body-text text-sm mb-4">{t('shop.aboutBody')}</p>
          <div className="grid grid-cols-2 gap-3 text-xs sqi-body-text">
            <div>
              <span className="text-white font-bold">{t('shop.aboutFabricLabel')}</span> {t('shop.aboutFabric')}
            </div>
            <div>
              <span className="text-white font-bold">{t('shop.aboutFitLabel')}</span> {t('shop.aboutFit')}
            </div>
            <div>
              <span className="text-white font-bold">{t('shop.aboutCareLabel')}</span> {t('shop.aboutCare')}
            </div>
            <div>
              <span className="text-white font-bold">{t('shop.aboutUseLabel')}</span> {t('shop.aboutUse')}
            </div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Shop;
