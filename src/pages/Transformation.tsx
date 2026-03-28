import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Sparkles, 
  Video, 
  MessageCircle, 
  Heart, 
  BookOpen, 
  Award, 
  Users, 
  Check,
  Calendar,
  CreditCard,
  Wallet
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Module {
  number: number;
  name: string;
  duration_months: number;
  description: string;
}

interface TransformationProgram {
  id: string;
  name: string;
  description: string;
  price_eur: number;
  duration_months: number;
  modules: Module[];
  features: string[];
  installment_price_eur: number;
  installment_count: number;
  practitioner: string;
}

interface Variation {
  id: string;
  name: string;
  description: string;
  features: string[];
  price_eur: number;
  installment_price_eur: number;
  installment_count: number;
  duration_months: number;
}

interface Practitioner {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  image_url: string | null;
}

const CRYPTO_WALLET = 'BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j';

const akashaField = (
  <>
    <div className="pointer-events-none fixed inset-0 bg-[#050505] z-0" aria-hidden />
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.95] bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(212,175,55,0.1)_0%,transparent_55%),radial-gradient(ellipse_90%_55%_at_100%_25%,rgba(212,175,55,0.05)_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_0%_75%,rgba(34,211,238,0.035)_0%,transparent_45%)]"
      aria-hidden
    />
  </>
);

const getFeatureIcon = (feature: string): React.ElementType => {
  const lower = feature.toLowerCase();
  if (lower.includes('zoom')) return Video;
  if (lower.includes('whatsapp')) return MessageCircle;
  if (lower.includes('healing')) return Heart;
  if (lower.includes('material')) return BookOpen;
  if (lower.includes('certificate')) return Award;
  if (lower.includes('community')) return Users;
  return Check;
};

const Transformation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [program, setProgram] = useState<TransformationProgram | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  
  // Selection states
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch program
    const { data: programData } = await supabase
      .from('transformation_programs')
      .select('*')
      .single();

    if (programData) {
      setProgram({
        ...programData,
        modules: (programData.modules as unknown) as Module[],
        features: (programData.features as unknown) as string[],
        installment_price_eur: programData.installment_price_eur || 0,
        installment_count: programData.installment_count || 3,
        practitioner: programData.practitioner || 'both'
      });
    }

    // Fetch variations
    const { data: variationsData } = await supabase
      .from('transformation_variations')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (variationsData) {
      setVariations(variationsData.map(v => ({
        ...v,
        features: v.features as string[]
      })));
    }

    // Fetch practitioners
    const { data: practitionerData } = await supabase
      .from('practitioners')
      .select('*');

    if (practitionerData) {
      setPractitioners(practitionerData);
    }

    setLoading(false);
  };

  const getCurrentPrice = () => {
    const source = selectedVariation || program;
    if (!source) return 0;
    return paymentType === 'full' ? source.price_eur : source.installment_price_eur;
  };

  const getInstallmentCount = () => {
    const source = selectedVariation || program;
    return source?.installment_count || 3;
  };

  const getTotalInstallmentPrice = () => {
    const source = selectedVariation || program;
    if (!source) return 0;
    return source.installment_price_eur * source.installment_count;
  };

  const handleEnroll = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if practitioner selection is needed
    if (program?.practitioner === 'both' && !selectedPractitioner) {
      toast.error(t('transformation.toastSelectPractitioner'));
      return;
    }
    
    setShowPaymentDialog(true);
  };

  const processPayment = async (method: 'card' | 'crypto') => {
    setEnrolling(true);
    
    try {
      if (method === 'card') {
        const currentPrice = getCurrentPrice();
        const { data, error } = await supabase.functions.invoke('create-transformation-checkout', {
          body: { 
            priceEur: currentPrice,
            programId: program?.id,
            variationId: selectedVariation?.id || null,
            practitionerId: selectedPractitioner?.id || null,
            paymentType,
            programName: selectedVariation?.name || program?.name
          }
        });
        
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, '_blank');
        }
      } else {
        toast.info(t('transformation.toastCryptoSend', { wallet: CRYPTO_WALLET }));
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(t('transformation.toastPaymentFailed'));
    }
    
    setEnrolling(false);
    setShowPaymentDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {akashaField}
        <div
          className="animate-spin rounded-full h-9 w-9 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] relative z-10 shadow-[0_0_24px_rgba(212,175,55,0.35)]"
          role="status"
          aria-label={t('transformation.loadingAria')}
        />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#050505]">
        {akashaField}
        <Card className="p-8 text-center relative z-10 max-w-md border-white/[0.08] shadow-[0_0_48px_-12px_rgba(212,175,55,0.18)]">
          <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
          <h3 className="font-black tracking-[-0.04em] text-[#D4AF37] gold-glow mb-2 font-heading">{t('transformation.emptyTitle')}</h3>
          <p className="sqi-body-text text-sm">{t('transformation.emptyDescription')}</p>
        </Card>
      </div>
    );
  }

  const currentSource = selectedVariation || program;
  const showPractitionerSelection = program.practitioner === 'both';

  return (
    <div className="min-h-screen pb-28 relative overflow-hidden bg-[#050505]">
      {akashaField}

      <div className="relative z-10 max-w-lg mx-auto">
      {/* Hero — Prema-Pulse header */}
      <div className="px-4 pt-8 pb-10 text-center relative">
        <p className="sqi-label-text mb-3 text-[#D4AF37]/70">Bhakti-Algorithm · Prema-Pulse</p>
        <Badge className="mb-4 rounded-full border border-[#D4AF37]/35 bg-white/[0.04] text-[#D4AF37] px-4 py-1.5 font-extrabold uppercase tracking-[0.28em] text-[10px] shadow-[0_0_24px_-6px_rgba(212,175,55,0.35)] backdrop-blur-[40px] hover:bg-white/[0.06]">
          {t('transformation.badgeJourney')}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-black tracking-[-0.05em] text-[#D4AF37] gold-glow mb-4 font-heading leading-tight">
          {program.name}
        </h1>
        <p className="sqi-body-text max-w-md mx-auto mb-8 text-base">
          {program.description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-2 sqi-body-text">
            <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
            {t('transformation.metaMonths', { count: currentSource.duration_months })}
          </span>
          <span className="flex items-center gap-2 sqi-body-text">
            <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
            {t('transformation.metaModules', { count: program.modules.length })}
          </span>
        </div>
      </div>

      {/* Variations Banner */}
      {variations.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="sqi-label-text mb-3 !text-[#D4AF37]/80 !tracking-[0.35em]">{t('transformation.choosePackage')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Card
              className={`p-4 min-w-[168px] cursor-pointer transition-all duration-300 rounded-[28px] !rounded-[28px] ${
                !selectedVariation
                  ? 'border-[#D4AF37] shadow-[0_0_32px_-8px_rgba(212,175,55,0.3)] bg-[#D4AF37]/5'
                  : 'border-white/[0.08] hover:border-[#D4AF37]/35'
              }`}
              onClick={() => setSelectedVariation(null)}
            >
              <h3 className="font-black tracking-[-0.03em] text-white text-sm">{t('transformation.packageStandard')}</h3>
              <p className="text-[#D4AF37] font-black mt-1.5 text-lg">€{program.price_eur}</p>
              <p className="text-xs sqi-body-text mt-1">{t('transformation.metaMonths', { count: program.duration_months })}</p>
            </Card>
            {variations.map((v) => (
              <Card
                key={v.id}
                className={`p-4 min-w-[168px] cursor-pointer transition-all duration-300 rounded-[28px] !rounded-[28px] ${
                  selectedVariation?.id === v.id
                    ? 'border-[#D4AF37] shadow-[0_0_32px_-8px_rgba(212,175,55,0.3)] bg-[#D4AF37]/5'
                    : 'border-white/[0.08] hover:border-[#D4AF37]/35'
                }`}
                onClick={() => setSelectedVariation(v)}
              >
                <h3 className="font-black tracking-[-0.03em] text-white text-sm leading-snug">{v.name}</h3>
                <p className="text-[#D4AF37] font-black mt-1.5 text-lg">€{v.price_eur}</p>
                <p className="text-xs sqi-body-text mt-1">{t('transformation.metaMonths', { count: v.duration_months })}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Practitioner Selection */}
      {showPractitionerSelection && practitioners.length > 0 && (
        <div className="px-4 py-4">
          <p className="sqi-label-text mb-3 !text-[#D4AF37]/55">{t('transformation.chooseGuide')}</p>
          <div className="grid grid-cols-2 gap-3">
            {practitioners.map((p) => (
              <Card
                key={p.id}
                className={`p-4 cursor-pointer transition-all duration-300 text-center rounded-[28px] !rounded-[28px] ${
                  selectedPractitioner?.id === p.id
                    ? 'border-[#D4AF37] shadow-[0_0_28px_-8px_rgba(212,175,55,0.28)] bg-[#D4AF37]/5'
                    : 'border-white/[0.08] hover:border-[#D4AF37]/30'
                }`}
                onClick={() => setSelectedPractitioner(p)}
              >
                <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-[#D4AF37]/40 shadow-[0_0_20px_-4px_rgba(212,175,55,0.35)]">
                  {p.image_url ? (
                    <AvatarImage src={p.image_url} alt={p.name} />
                  ) : (
                    <AvatarFallback className="bg-[#D4AF37]/15 text-[#D4AF37] font-bold">
                      {p.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-black tracking-[-0.04em] text-white text-sm">{p.name}</h3>
                {p.subtitle && <p className="text-xs sqi-body-text mt-1 leading-snug">{p.subtitle}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Price Card with Payment Options */}
      <div className="px-4 py-4">
        <Card className="p-6 border-[#D4AF37]/25 shadow-[0_0_56px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/35">
          <div className="text-center mb-2">
            <p className="sqi-label-text !text-[#D4AF37]/75 mb-3 !tracking-[0.3em]">{t('transformation.investmentTitle')}</p>

            {currentSource.installment_price_eur > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentType('full')}
                  className={`rounded-full border px-4 ${
                    paymentType === 'full'
                      ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] hover:bg-[#D4AF37]/90 hover:text-[#050505]'
                      : 'border-white/[0.12] bg-white/[0.04] text-white hover:border-[#D4AF37]/40'
                  }`}
                >
                  {t('transformation.payFull')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentType('installment')}
                  className={`rounded-full border px-4 ${
                    paymentType === 'installment'
                      ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] hover:bg-[#D4AF37]/90 hover:text-[#050505]'
                      : 'border-white/[0.12] bg-white/[0.04] text-white hover:border-[#D4AF37]/40'
                  }`}
                >
                  {t('transformation.payInstallments', { count: getInstallmentCount() })}
                </Button>
              </div>
            )}

            {paymentType === 'full' ? (
              <>
                <div className="text-4xl font-black tracking-[-0.04em] text-gradient-gold mb-2 font-heading">
                  €{currentSource.price_eur.toLocaleString()}
                </div>
                <p className="text-sm sqi-body-text mb-5">{t('transformation.oneTimeLifetime')}</p>
              </>
            ) : (
              <>
                <div className="text-4xl font-black tracking-[-0.04em] text-white mb-2 font-heading">
                  €{currentSource.installment_price_eur.toLocaleString()}
                  <span className="text-lg sqi-body-text font-normal">{t('transformation.perMonthShort')}</span>
                </div>
                <p className="text-sm sqi-body-text mb-2">
                  {t('transformation.installmentLine', {
                    count: getInstallmentCount(),
                    total: getTotalInstallmentPrice().toLocaleString(),
                  })}
                </p>
                {getTotalInstallmentPrice() > currentSource.price_eur && (
                  <p className="text-xs text-[#22D3EE] font-semibold mb-4 tracking-wide">
                    {t('transformation.saveWithFull', {
                      amount: (getTotalInstallmentPrice() - currentSource.price_eur).toLocaleString(),
                    })}
                  </p>
                )}
              </>
            )}

            <Button
              onClick={handleEnroll}
              disabled={enrolling}
              variant="gold"
              className="w-full rounded-[40px] h-12 text-xs font-black tracking-[0.22em] uppercase shadow-[0_0_40px_-8px_rgba(212,175,55,0.45)]"
              size="lg"
            >
              {enrolling ? t('transformation.processing') : t('transformation.beginTransformation')}
            </Button>
          </div>
        </Card>
      </div>

      {/* What's Included */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-black tracking-[-0.05em] text-[#D4AF37] gold-glow mb-4 font-heading">{t('transformation.whatsIncluded')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {(selectedVariation?.features || program.features).map((feature, idx) => {
            const Icon = getFeatureIcon(feature);
            return (
              <Card
                key={idx}
                className="p-4 flex items-start gap-3 border-white/[0.06] rounded-[28px] !rounded-[28px] shadow-[0_0_36px_-14px_rgba(212,175,55,0.12)] hover:border-[#D4AF37]/15"
              >
                <div className="p-2 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 shrink-0">
                  <Icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <span className="text-sm sqi-body-text text-white/85 leading-snug">{feature}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-black tracking-[-0.05em] text-[#D4AF37] gold-glow mb-4 font-heading">{t('transformation.modulesHeading', { count: program.modules.length })}</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {program.modules.map((module) => (
            <AccordionItem
              key={module.number}
              value={`module-${module.number}`}
              className="border border-white/[0.08] rounded-[28px] overflow-hidden bg-white/[0.02] backdrop-blur-[40px] data-[state=open]:border-[#D4AF37]/25"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/10 flex items-center justify-center text-[#22D3EE] font-black text-sm shadow-[0_0_20px_-6px_rgba(34,211,238,0.35)]">
                    {module.number}
                  </div>
                  <div className="text-left min-w-0">
                    <h3 className="font-black tracking-[-0.03em] text-white leading-snug">{module.name}</h3>
                    <p className="text-xs sqi-body-text">{t('transformation.metaMonths', { count: module.duration_months })}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm sqi-body-text pl-1 border-l border-[#D4AF37]/20 ml-2 py-1">{module.description}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Daily Support Highlight */}
      <div className="px-4 py-6">
        <Card className="p-6 border-[#D4AF37]/20 shadow-[0_0_48px_-14px_rgba(212,175,55,0.15)] rounded-[40px] !rounded-[40px]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 shrink-0">
              <MessageCircle className="w-6 h-6 text-[#22D3EE]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black tracking-[-0.04em] text-[#D4AF37] gold-glow mb-2 text-base font-heading">{t('transformation.dailyWhatsappTitle')}</h3>
              <p className="text-sm sqi-body-text">
                {t('transformation.dailyWhatsappBody', {
                  name: selectedPractitioner?.name || t('transformation.yourPractitionerFallback'),
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Testimonial placeholder */}
      <div className="px-4 py-6">
        <Card className="p-6 border border-dashed border-[#D4AF37]/25 bg-white/[0.02] rounded-[40px] !rounded-[40px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="text-center">
            <Users className="w-10 h-10 text-[#D4AF37] mx-auto mb-3 opacity-80" />
            <p className="text-sm sqi-body-text italic">{t('transformation.testimonialQuote')}</p>
            <p className="text-sm font-black tracking-[-0.02em] text-[#D4AF37] mt-4">{t('transformation.testimonialBy')}</p>
          </div>
        </Card>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 z-[100] pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto bg-gradient-to-t from-[#050505] via-[#050505]/96 to-transparent pt-10 pb-1">
          <Button
            onClick={handleEnroll}
            disabled={enrolling}
            variant="gold"
            className="w-full rounded-[40px] h-12 text-xs font-black tracking-[0.18em] uppercase shadow-[0_0_48px_-8px_rgba(212,175,55,0.45)]"
            size="lg"
          >
            {enrolling
              ? t('transformation.processing')
              : paymentType === 'full'
                ? t('transformation.enrollNowFull', { price: currentSource.price_eur.toLocaleString() })
                : t('transformation.enrollNowMonthly', { price: currentSource.installment_price_eur.toLocaleString() })}
          </Button>
        </div>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md rounded-[40px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-[40px] shadow-[0_0_56px_-8px_rgba(212,175,55,0.25)] sm:rounded-[40px]">
          <DialogHeader>
            <DialogTitle className="font-black tracking-[-0.04em] text-[#D4AF37] gold-glow text-center">
              {t('transformation.choosePaymentMethod')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center mb-4">
              <p className="text-sm sqi-body-text">
                {(selectedVariation?.name || t('transformation.packageStandard')) +
                  (selectedPractitioner ? t('transformation.withGuide', { name: selectedPractitioner.name }) : '')}
              </p>
              <p className="text-2xl font-black tracking-[-0.03em] text-gradient-gold font-heading mt-2">
                {paymentType === 'full'
                  ? `€${currentSource.price_eur.toLocaleString()}`
                  : `€${currentSource.installment_price_eur}${t('transformation.perMonthShort')} × ${getInstallmentCount()}`}
              </p>
            </div>

            <Button
              onClick={() => processPayment('card')}
              disabled={enrolling}
              className="w-full rounded-[28px] bg-[#D4AF37] text-[#050505] hover:bg-[#D4AF37]/90 font-bold"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {t('transformation.payWithCard')}
            </Button>

            <Button
              onClick={() => processPayment('crypto')}
              disabled={enrolling}
              variant="outline"
              className="w-full rounded-[28px] border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-[#22D3EE]/35 hover:text-[#22D3EE]"
              size="lg"
            >
              <Wallet className="w-5 h-5 mr-2" />
              {t('transformation.payWithCrypto')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Transformation;