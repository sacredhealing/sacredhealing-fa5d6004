import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  const shellClass =
    "min-h-screen pb-24 w-full max-w-full overflow-x-hidden bg-[#050505] text-white";
  const glassCardClass =
    "bg-white/[0.02] backdrop-blur-[40px] border border-white/[0.05] rounded-[40px] shadow-[0_0_35px_rgba(212,175,55,0.08)]";
  const goldGlowClass = "text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)]";
  const microLabelClass =
    "text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60";
  const bodyClass = "text-white/60 leading-[1.6]";

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
      toast.error('Please select a practitioner first');
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
        toast.info('Please send payment to: BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
    
    setEnrolling(false);
    setShowPaymentDialog(false);
  };

  if (loading) {
    return (
      <div className={shellClass + " flex items-center justify-center"}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className={shellClass + " flex items-center justify-center px-4"}>
        <Card className={`p-8 text-center ${glassCardClass}`}>
          <Sparkles className="w-12 h-12 text-[#D4AF37]/60 mx-auto mb-4" />
          <h3 className={`font-black tracking-[-0.03em] mb-2 ${goldGlowClass}`}>Program Not Available</h3>
          <p className={bodyClass + " text-sm"}>
            The transformation program is currently being prepared.
          </p>
        </Card>
      </div>
    );
  }

  const currentSource = selectedVariation || program;
  const showPractitionerSelection = program.practitioner === 'both';

  return (
    <div className={shellClass}>
      {/* SQI 2050 Akasha background */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(212,175,55,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(212,175,55,0.035) 0%, transparent 55%), #050505",
        }}
      />

      {/* Hero Section */}
      <div className="px-4 py-10 text-center relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(212,175,55,0.12), transparent 65%)",
          }}
        />
        <div className="relative">
          <Badge className={`mb-4 ${glassCardClass} ${goldGlowClass}`}>
            Life-Changing Journey
          </Badge>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-[-0.05em] mb-3 ${goldGlowClass}`}>
            {program.name}
          </h1>
          <p className={bodyClass + " max-w-md mx-auto mb-6"}>
            {program.description}
          </p>
          <div className={"flex items-center justify-center gap-4 text-sm " + bodyClass}>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#D4AF37]/70" />
              {currentSource.duration_months} months
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-[#D4AF37]/70" />
              {program.modules.length} modules
            </span>
          </div>
        </div>
      </div>

      {/* Variations Banner */}
      {variations.length > 0 && (
        <div className="px-4 py-4">
          <h2 className={`${microLabelClass} mb-3`}>Choose Your Package</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Card 
              className={`p-4 min-w-[160px] cursor-pointer transition-all ${glassCardClass} ${
                !selectedVariation ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.06]' : 'hover:border-[#D4AF37]/35'
              }`}
              onClick={() => setSelectedVariation(null)}
            >
              <h3 className="font-semibold text-white/90 text-sm">Standard</h3>
              <p className={`font-black tracking-[-0.03em] mt-1 ${goldGlowClass}`}>€{program.price_eur}</p>
              <p className="text-xs text-white/45 mt-1">{program.duration_months} months</p>
            </Card>
            {variations.map((v) => (
              <Card 
                key={v.id}
                className={`p-4 min-w-[160px] cursor-pointer transition-all ${glassCardClass} ${
                  selectedVariation?.id === v.id ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.06]' : 'hover:border-[#D4AF37]/35'
                }`}
                onClick={() => setSelectedVariation(v)}
              >
                <h3 className="font-semibold text-white/90 text-sm">{v.name}</h3>
                <p className={`font-black tracking-[-0.03em] mt-1 ${goldGlowClass}`}>€{v.price_eur}</p>
                <p className="text-xs text-white/45 mt-1">{v.duration_months} months</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Practitioner Selection */}
      {showPractitionerSelection && practitioners.length > 0 && (
        <div className="px-4 py-4">
          <h2 className={`${microLabelClass} mb-3`}>Choose Your Guide</h2>
          <div className="grid grid-cols-2 gap-3">
            {practitioners.map((p) => (
              <Card 
                key={p.id}
                className={`p-4 cursor-pointer transition-all text-center ${glassCardClass} ${
                  selectedPractitioner?.id === p.id ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.06]' : 'hover:border-[#D4AF37]/35'
                }`}
                onClick={() => setSelectedPractitioner(p)}
              >
                <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-[#D4AF37]/30">
                  {p.image_url ? (
                    <AvatarImage src={p.image_url} alt={p.name} />
                  ) : (
                    <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37]">
                      {p.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-semibold text-white/90">{p.name}</h3>
                {p.subtitle && (
                  <p className="text-xs text-white/45 mt-1">{p.subtitle}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Price Card with Payment Options */}
      <div className="px-4 py-4">
        <Card className={`p-6 ${glassCardClass} border-[#D4AF37]/25`}>
          <div className="text-center mb-4">
            <p className={`text-sm mb-1 ${bodyClass}`}>Investment in Your Transformation</p>
            
            {/* Payment Type Toggle */}
            {currentSource.installment_price_eur > 0 && (
              <div className="flex gap-2 justify-center mb-4">
                <Button
                  variant={paymentType === 'full' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('full')}
                  className={
                    paymentType === 'full'
                      ? 'bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505]'
                      : 'border-white/[0.08] text-white/80 hover:text-white hover:border-[#D4AF37]/35'
                  }
                >
                  Full Payment
                </Button>
                <Button
                  variant={paymentType === 'installment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('installment')}
                  className={
                    paymentType === 'installment'
                      ? 'bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505]'
                      : 'border-white/[0.08] text-white/80 hover:text-white hover:border-[#D4AF37]/35'
                  }
                >
                  {getInstallmentCount()} Installments
                </Button>
              </div>
            )}
            
            {paymentType === 'full' ? (
              <>
                <div className={`text-4xl font-black tracking-[-0.05em] mb-2 ${goldGlowClass}`}>
                  €{currentSource.price_eur.toLocaleString()}
                </div>
                <p className={`text-sm mb-4 ${bodyClass}`}>One-time payment • Lifetime access to materials</p>
              </>
            ) : (
              <>
                <div className={`text-4xl font-black tracking-[-0.05em] mb-2 ${goldGlowClass}`}>
                  €{currentSource.installment_price_eur.toLocaleString()}
                  <span className="text-lg text-white/45">/month</span>
                </div>
                <p className={`text-sm mb-2 ${bodyClass}`}>
                  {getInstallmentCount()} payments • Total: €{getTotalInstallmentPrice().toLocaleString()}
                </p>
                {getTotalInstallmentPrice() > currentSource.price_eur && (
                  <p className="text-xs text-[#D4AF37]/80 mb-4">
                    Save €{(getTotalInstallmentPrice() - currentSource.price_eur).toLocaleString()} with full payment!
                  </p>
                )}
              </>
            )}
            
            <Button 
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] shadow-[0_0_25px_rgba(212,175,55,0.25)]"
              size="lg"
            >
              {enrolling ? 'Processing...' : 'Begin Your Transformation'}
            </Button>
          </div>
        </Card>
      </div>

      {/* What's Included */}
      <div className="px-4 py-6">
        <h2 className={`text-lg font-black tracking-[-0.03em] mb-4 ${goldGlowClass}`}>What's Included</h2>
        <div className="grid grid-cols-2 gap-3">
          {(selectedVariation?.features || program.features).map((feature, idx) => {
            const Icon = getFeatureIcon(feature);
            return (
              <Card key={idx} className={`p-4 flex items-start gap-3 ${glassCardClass}`}>
                <div className="p-2 rounded-[14px] bg-[#D4AF37]/10 border border-[#D4AF37]/15">
                  <Icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <span className="text-sm text-white/80 leading-snug">{feature}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div className="px-4 py-6">
        <h2 className={`text-lg font-black tracking-[-0.03em] mb-4 ${goldGlowClass}`}>The 3 Modules</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {program.modules.map((module) => (
            <AccordionItem
              key={module.number}
              value={`module-${module.number}`}
              className={`overflow-hidden ${glassCardClass}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#050505] font-black">
                    {module.number}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white/90">{module.name}</h3>
                    <p className="text-xs text-white/45">{module.duration_months} months</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className={`text-sm pl-13 ${bodyClass}`}>
                  {module.description}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Daily Support Highlight */}
      <div className="px-4 py-6">
        <Card className={`p-6 ${glassCardClass}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <MessageCircle className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className={`font-black tracking-[-0.03em] mb-2 ${goldGlowClass}`}>Daily WhatsApp Connection</h3>
              <p className={`text-sm ${bodyClass}`}>
                Stay connected with {selectedPractitioner?.name || 'your practitioner'} every day. Get guidance, share your experiences, 
                and receive healing support whenever you need it throughout your transformation journey.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Testimonial placeholder */}
      <div className="px-4 py-6">
        <Card className={`p-6 ${glassCardClass}`}>
          <div className="text-center">
            <Users className="w-10 h-10 text-[#D4AF37]/60 mx-auto mb-3" />
            <p className="text-sm text-white/60 italic">
              "This program changed my life completely. The daily support and healing sessions 
              helped me release years of trauma and step into my true power."
            </p>
            <p className="text-sm font-semibold text-white/85 mt-3">— Transformation Graduate</p>
          </div>
        </Card>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-20 left-0 right-0 px-4 pb-4 pt-8"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.98), rgba(5,5,5,0.92), transparent)",
        }}
      >
        <Button 
          onClick={handleEnroll}
          disabled={enrolling}
          className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] shadow-[0_0_25px_rgba(212,175,55,0.25)]"
          size="lg"
        >
          {enrolling ? 'Processing...' : paymentType === 'full' 
            ? `Enroll Now • €${currentSource.price_eur.toLocaleString()}`
            : `Enroll Now • €${currentSource.installment_price_eur}/mo`
          }
        </Button>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className={glassCardClass + " text-white"}>
          <DialogHeader>
            <DialogTitle className={`font-black tracking-[-0.03em] ${goldGlowClass}`}>Choose Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center mb-4">
              <p className={`text-sm ${bodyClass}`}>
                {selectedVariation?.name || 'Standard Package'}
                {selectedPractitioner && ` with ${selectedPractitioner.name}`}
              </p>
              <p className={`text-2xl font-black tracking-[-0.05em] ${goldGlowClass}`}>
                {paymentType === 'full' 
                  ? `€${currentSource.price_eur.toLocaleString()}`
                  : `€${currentSource.installment_price_eur}/mo × ${getInstallmentCount()}`
                }
              </p>
            </div>
            
            <Button 
              onClick={() => processPayment('card')}
              disabled={enrolling}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505]"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay with Card
            </Button>
            
            <Button 
              onClick={() => processPayment('crypto')}
              disabled={enrolling}
              variant="outline"
              className="w-full border-white/[0.10] text-white/85 hover:text-white hover:border-[#D4AF37]/35"
              size="lg"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Pay with Crypto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transformation;