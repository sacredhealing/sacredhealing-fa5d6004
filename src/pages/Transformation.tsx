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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          role="status"
          aria-label={t('transformation.loadingAria')}
        />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">{t('transformation.emptyTitle')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('transformation.emptyDescription')}
          </p>
        </Card>
      </div>
    );
  }

  const currentSource = selectedVariation || program;
  const showPractitionerSelection = program.practitioner === 'both';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-500/30 via-primary/20 to-purple-500/30 px-4 py-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_70%)]" />
        <div className="relative">
          <Badge className="bg-amber-500 text-white mb-4">{t('transformation.badgeJourney')}</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">{program.name}</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {program.description}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {t('transformation.metaMonths', { count: currentSource.duration_months })}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {t('transformation.metaModules', { count: program.modules.length })}
            </span>
          </div>
        </div>
      </div>

      {/* Variations Banner */}
      {variations.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{t('transformation.choosePackage')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Card 
              className={`p-4 min-w-[160px] cursor-pointer transition-all ${
                !selectedVariation ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50'
              }`}
              onClick={() => setSelectedVariation(null)}
            >
              <h3 className="font-semibold text-foreground text-sm">{t('transformation.packageStandard')}</h3>
              <p className="text-amber-500 font-bold mt-1">€{program.price_eur}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('transformation.metaMonths', { count: program.duration_months })}</p>
            </Card>
            {variations.map((v) => (
              <Card 
                key={v.id}
                className={`p-4 min-w-[160px] cursor-pointer transition-all ${
                  selectedVariation?.id === v.id ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50'
                }`}
                onClick={() => setSelectedVariation(v)}
              >
                <h3 className="font-semibold text-foreground text-sm">{v.name}</h3>
                <p className="text-amber-500 font-bold mt-1">€{v.price_eur}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('transformation.metaMonths', { count: v.duration_months })}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Practitioner Selection */}
      {showPractitionerSelection && practitioners.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{t('transformation.chooseGuide')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {practitioners.map((p) => (
              <Card 
                key={p.id}
                className={`p-4 cursor-pointer transition-all text-center ${
                  selectedPractitioner?.id === p.id ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50'
                }`}
                onClick={() => setSelectedPractitioner(p)}
              >
                <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-amber-500/30">
                  {p.image_url ? (
                    <AvatarImage src={p.image_url} alt={p.name} />
                  ) : (
                    <AvatarFallback className="bg-amber-500/20 text-amber-500">
                      {p.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-semibold text-foreground">{p.name}</h3>
                {p.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{p.subtitle}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Price Card with Payment Options */}
      <div className="px-4 py-4">
        <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-purple-500/10 border-amber-500/30">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground mb-1">{t('transformation.investmentTitle')}</p>
            
            {/* Payment Type Toggle */}
            {currentSource.installment_price_eur > 0 && (
              <div className="flex gap-2 justify-center mb-4">
                <Button
                  variant={paymentType === 'full' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('full')}
                  className={paymentType === 'full' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  {t('transformation.payFull')}
                </Button>
                <Button
                  variant={paymentType === 'installment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('installment')}
                  className={paymentType === 'installment' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  {t('transformation.payInstallments', { count: getInstallmentCount() })}
                </Button>
              </div>
            )}
            
            {paymentType === 'full' ? (
              <>
                <div className="text-4xl font-bold text-foreground mb-2">€{currentSource.price_eur.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mb-4">{t('transformation.oneTimeLifetime')}</p>
              </>
            ) : (
              <>
                <div className="text-4xl font-bold text-foreground mb-2">
                  €{currentSource.installment_price_eur.toLocaleString()}
                  <span className="text-lg">{t('transformation.perMonthShort')}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('transformation.installmentLine', {
                    count: getInstallmentCount(),
                    total: getTotalInstallmentPrice().toLocaleString(),
                  })}
                </p>
                {getTotalInstallmentPrice() > currentSource.price_eur && (
                  <p className="text-xs text-amber-500 mb-4">
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
            >
              {enrolling ? t('transformation.processing') : t('transformation.beginTransformation')}
            </Button>
          </div>
        </Card>
      </div>

      {/* What's Included */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">{t('transformation.whatsIncluded')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {(selectedVariation?.features || program.features).map((feature, idx) => {
            const Icon = getFeatureIcon(feature);
            return (
              <Card key={idx} className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-sm text-foreground leading-snug">{feature}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">{t('transformation.modulesHeading', { count: program.modules.length })}</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {program.modules.map((module) => (
            <AccordionItem key={module.number} value={`module-${module.number}`} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {module.number}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{module.name}</h3>
                    <p className="text-xs text-muted-foreground">{t('transformation.metaMonths', { count: module.duration_months })}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground pl-13">
                  {module.description}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Daily Support Highlight */}
      <div className="px-4 py-6">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t('transformation.dailyWhatsappTitle')}</h3>
              <p className="text-sm text-muted-foreground">
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
        <Card className="p-6 bg-muted/30 border-dashed">
          <div className="text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground italic">
              {t('transformation.testimonialQuote')}
            </p>
            <p className="text-sm font-medium text-foreground mt-3">{t('transformation.testimonialBy')}</p>
          </div>
        </Card>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <Button 
          onClick={handleEnroll}
          disabled={enrolling}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
          size="lg"
        >
          {enrolling
            ? t('transformation.processing')
            : paymentType === 'full'
              ? t('transformation.enrollNowFull', { price: currentSource.price_eur.toLocaleString() })
              : t('transformation.enrollNowMonthly', { price: currentSource.installment_price_eur.toLocaleString() })}
        </Button>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('transformation.choosePaymentMethod')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                {(selectedVariation?.name || t('transformation.packageStandard')) +
                  (selectedPractitioner ? t('transformation.withGuide', { name: selectedPractitioner.name }) : '')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {paymentType === 'full' 
                  ? `€${currentSource.price_eur.toLocaleString()}`
                  : `€${currentSource.installment_price_eur}${t('transformation.perMonthShort')} × ${getInstallmentCount()}`
                }
              </p>
            </div>
            
            <Button 
              onClick={() => processPayment('card')}
              disabled={enrolling}
              className="w-full"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {t('transformation.payWithCard')}
            </Button>
            
            <Button 
              onClick={() => processPayment('crypto')}
              disabled={enrolling}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Wallet className="w-5 h-5 mr-2" />
              {t('transformation.payWithCrypto')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transformation;