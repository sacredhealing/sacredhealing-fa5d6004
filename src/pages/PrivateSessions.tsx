import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, User, Sparkles, Heart, Shield, CreditCard, Wallet, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import lailaPortrait from '@/assets/laila-portrait.jpg';
import adamDrum from '@/assets/adam-drum.jpg';

interface SessionType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  calendly_url: string | null;
  image_url: string | null;
  practitioner: string;
}

interface SessionPackage {
  id: string;
  name: string;
  description: string | null;
  session_count: number;
  price_eur: number;
}

interface Practitioner {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  image_url: string | null;
  description: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  spiritual: <Sparkles className="w-5 h-5 text-[#D4AF37]" />,
  healing: <Heart className="w-5 h-5 text-[#D4AF37]" />,
  men: <Shield className="w-5 h-5 text-[#22D3EE]" />,
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

const categoryIconShell = (category: string) =>
  category === 'men'
    ? 'border border-[#22D3EE]/30 bg-[#22D3EE]/10 shadow-[0_0_20px_-6px_rgba(34,211,238,0.35)]'
    : 'border border-[#D4AF37]/25 bg-[#D4AF37]/10 shadow-[0_0_20px_-6px_rgba(212,175,55,0.25)]';

const PrivateSessions: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Fallback images
  const fallbackImages: Record<string, string> = {
    adam: adamDrum,
    laila: lailaPortrait,
  };

  useEffect(() => {
    fetchData();
    
    // Handle success redirect from Stripe
    const success = searchParams.get('success');
    const calendlyUrl = searchParams.get('calendly');
    
    if (success === 'true') {
      toast.success('Payment successful! Redirecting to booking...');
      if (calendlyUrl) {
        setTimeout(() => {
          window.open(calendlyUrl, '_blank');
        }, 1500);
      }
    }
    
    if (searchParams.get('canceled') === 'true') {
      toast.error('Payment was canceled');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [typesRes, packagesRes, practitionersRes] = await Promise.all([
        supabase.from('session_types').select('*').eq('is_active', true).order('order_index'),
        supabase.from('session_packages').select('*').eq('is_active', true).order('order_index'),
        supabase.from('practitioners').select('*')
      ]);

      if (typesRes.data) setSessionTypes(typesRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
      if (practitionersRes.data) setPractitioners(practitionersRes.data);
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPractitioner = (slug: string) => practitioners.find(p => p.slug === slug);
  const currentPractitioner = selectedPractitioner ? getPractitioner(selectedPractitioner) : null;

  const filteredSessionTypes = sessionTypes.filter(type => 
    type.practitioner === 'both' || type.practitioner === selectedPractitioner
  );

  const handleBookSession = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book a session');
      navigate('/auth');
      return;
    }

    if (!selectedType || !selectedPackage) {
      toast.error('Please select a session type and package');
      return;
    }

    setPaymentDialogOpen(true);
  };

  const handleStripePayment = async () => {
    setIsSubmitting(true);
    try {
      const selectedTypeData = sessionTypes.find(t => t.id === selectedType);
      
      const { data, error } = await supabase.functions.invoke('create-session-checkout', {
        body: {
          packageId: selectedPackage,
          sessionTypeId: selectedType,
          practitioner: selectedPractitioner,
          notes,
          contactEmail,
          calendlyUrl: selectedTypeData?.calendly_url || '',
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create payment session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCryptoPayment = () => {
    const selectedTypeData = sessionTypes.find(t => t.id === selectedType);
    const selectedPackageData = packages.find(p => p.id === selectedPackage);
    
    toast.info(
      `Send €${selectedPackageData?.price_eur} worth of SOL to: BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j and email sacredhealingvibe@gmail.com with your transaction ID and session details.`
    );
    
    navigator.clipboard.writeText('BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j');
    toast.success('Wallet address copied!');
    
    setPaymentDialogOpen(false);
    
    if (selectedTypeData?.calendly_url) {
      setTimeout(() => {
        window.open(selectedTypeData.calendly_url!, '_blank');
      }, 2000);
    }
  };

  const openCalendlyDirectly = () => {
    const selectedTypeData = sessionTypes.find(t => t.id === selectedType);
    if (selectedTypeData?.calendly_url) {
      window.open(selectedTypeData.calendly_url, '_blank');
    } else {
      toast.info('No Calendly link configured for this session type');
    }
  };

  const selectedPackageData = packages.find(p => p.id === selectedPackage);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {akashaField}
        <div
          className="animate-spin rounded-full h-9 w-9 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] relative z-10 shadow-[0_0_24px_rgba(212,175,55,0.35)]"
          aria-hidden
        />
      </div>
    );
  }

  // Step 1: Choose Practitioner
  if (!selectedPractitioner) {
    return (
      <div className="min-h-screen px-4 py-6 pb-32 relative overflow-hidden bg-[#050505]">
        {akashaField}
        <div className="relative z-10 max-w-lg mx-auto">
          <p className="sqi-label-text mb-3 text-[#D4AF37]/70">Bhakti-Algorithm · Prema-Pulse</p>
          <header className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-[2rem] font-black tracking-[-0.05em] font-heading text-[#D4AF37] gold-glow mb-2">
              Private Sessions
            </h1>
            <p className="sqi-body-text text-base">
              Choose your guide for a transformative 1-on-1 session
            </p>
          </header>

          <div className="space-y-4">
            {['adam', 'laila'].map((slug) => {
              const practitioner = getPractitioner(slug);
              const imageUrl = practitioner?.image_url || fallbackImages[slug];

              return (
                <div
                  key={slug}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPractitioner(slug);
                    }
                  }}
                  className="flex items-center gap-4 p-5 rounded-[40px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-[40px] cursor-pointer transition-all duration-300 animate-slide-up shadow-[0_0_40px_-14px_rgba(212,175,55,0.12)] hover:border-[#D4AF37]/25 hover:shadow-[0_0_48px_-10px_rgba(212,175,55,0.22)]"
                  onClick={() => setSelectedPractitioner(slug)}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37]/40 shrink-0 shadow-[0_0_20px_-4px_rgba(212,175,55,0.4)]">
                    <img
                      src={imageUrl}
                      alt={practitioner?.name || slug}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black tracking-[-0.05em] font-heading text-white">
                      Sessions with {practitioner?.name || slug}
                    </h2>
                    <p className="sqi-body-text text-sm mt-1">
                      {practitioner?.subtitle || (slug === 'adam' ? 'Spiritual Guide & Energy Practitioner' : 'Yogi & Sound Healer')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Choose Session Type & Package
  const practitionerImage = currentPractitioner?.image_url || fallbackImages[selectedPractitioner];

  return (
    <div className="min-h-screen px-4 py-6 pb-36 relative overflow-hidden bg-[#050505]">
      {akashaField}
      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header with Back Button */}
        <header className="mb-8 animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            className="mb-5 -ml-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-[#D4AF37] hover:text-[#D4AF37] hover:bg-white/[0.06] hover:border-[#D4AF37]/25 backdrop-blur-[40px] h-10 px-4"
            onClick={() => {
              setSelectedPractitioner(null);
              setSelectedType('');
              setSelectedPackage('');
            }}
          >
            <ArrowLeft size={16} className="mr-2" />
            Choose different guide
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37]/40 shrink-0 shadow-[0_0_24px_-4px_rgba(212,175,55,0.35)]">
              <img
                src={practitionerImage}
                alt={currentPractitioner?.name || selectedPractitioner}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="sqi-label-text mb-1 !text-[#D4AF37]/55">Vedic Light-Code · Session</p>
              <h1 className="text-xl sm:text-2xl font-black tracking-[-0.05em] font-heading text-[#D4AF37] gold-glow leading-tight">
                Sessions with {currentPractitioner?.name || selectedPractitioner}
              </h1>
              <p className="sqi-body-text text-sm mt-1">
                {currentPractitioner?.subtitle || (selectedPractitioner === 'adam'
                  ? 'Spiritual Guide & Energy Practitioner'
                  : 'Yogi & Sound Healer')}
              </p>
            </div>
          </div>
        </header>

        {/* Session Types */}
        <Card className="mb-6 animate-slide-up border-white/[0.06] shadow-[0_0_48px_-16px_rgba(212,175,55,0.12)] hover:border-[#D4AF37]/12">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-black tracking-[-0.05em] text-[#D4AF37] gold-glow !text-[#D4AF37]">
              <Sparkles size={20} className="text-[#D4AF37]" />
              Select Session Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSessionTypes.length === 0 ? (
              <p className="sqi-body-text text-center py-6">
                No sessions available for this practitioner yet.
              </p>
            ) : (
              <RadioGroup value={selectedType} onValueChange={setSelectedType} className="space-y-3">
                {filteredSessionTypes.map((type) => (
                  <div key={type.id}>
                    <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                    <Label
                      htmlFor={type.id}
                      className="flex items-start gap-3 rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-[40px] hover:border-[#D4AF37]/20 peer-data-[state=checked]:border-[#D4AF37] peer-data-[state=checked]:shadow-[0_0_32px_-8px_rgba(212,175,55,0.25)] [&:has([data-state=checked])]:border-[#D4AF37] cursor-pointer transition-all duration-300"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${categoryIconShell(type.category)}`}>
                        {categoryIcons[type.category] || <Sparkles className="w-5 h-5 text-[#D4AF37]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black tracking-[-0.03em] font-heading text-white block">{type.name}</span>
                        <span className="text-sm sqi-body-text">{type.description}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Packages */}
        <Card
          className="mb-6 animate-slide-up border-white/[0.06] shadow-[0_0_48px_-16px_rgba(212,175,55,0.1)] hover:border-[#D4AF37]/12"
          style={{ animationDelay: '0.1s' }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-black tracking-[-0.05em] text-[#D4AF37] gold-glow !text-[#D4AF37]">
              <Calendar size={20} className="text-[#D4AF37]" />
              Choose Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id}>
                  <RadioGroupItem value={pkg.id} id={pkg.id} className="peer sr-only" />
                  <Label
                    htmlFor={pkg.id}
                    className="flex items-center justify-between gap-3 rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-[40px] hover:border-[#D4AF37]/20 peer-data-[state=checked]:border-[#D4AF37] peer-data-[state=checked]:shadow-[0_0_32px_-8px_rgba(212,175,55,0.25)] [&:has([data-state=checked])]:border-[#D4AF37] cursor-pointer transition-all duration-300"
                  >
                    <div className="min-w-0">
                      <span className="font-black tracking-[-0.03em] font-heading text-white block">{pkg.name}</span>
                      <span className="text-sm sqi-body-text">{pkg.description}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black tracking-[-0.04em] font-heading text-gradient-gold">€{pkg.price_eur}</span>
                      {pkg.session_count > 1 && (
                        <span className="text-xs sqi-body-text block">
                          €{(pkg.price_eur / pkg.session_count).toFixed(0)}/session
                        </span>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Contact & Notes */}
        <Card
          className="mb-6 animate-slide-up border-white/[0.06] shadow-[0_0_48px_-16px_rgba(212,175,55,0.1)] hover:border-[#D4AF37]/12"
          style={{ animationDelay: '0.2s' }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black tracking-[-0.05em] text-[#D4AF37] gold-glow !text-[#D4AF37]">
              Your Details
            </CardTitle>
            <CardDescription className="sqi-body-text !text-white/55">
              We&apos;ll contact you to schedule your session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="sqi-label-text !tracking-[0.35em] text-[#D4AF37]/80">
                Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-2 rounded-[24px] border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/35 backdrop-blur-[40px] focus-visible:border-[#D4AF37]/45 focus-visible:ring-[#D4AF37]/25 h-11"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="sqi-label-text !tracking-[0.35em] text-[#D4AF37]/80">
                Additional Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us about your goals or any specific concerns..."
                className="mt-2 min-h-[100px] rounded-[24px] border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/35 backdrop-blur-[40px] focus-visible:border-[#D4AF37]/45 focus-visible:ring-[#D4AF37]/25"
              />
            </div>
          </CardContent>
        </Card>

        {/* Book Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 z-[100] pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto bg-gradient-to-t from-[#050505] via-[#050505]/96 to-transparent pt-8 pb-1 -mx-4 px-4 sm:mx-auto sm:px-0">
            <Button
              onClick={handleBookSession}
              disabled={!selectedType || !selectedPackage || isSubmitting}
              className="w-full h-14 text-sm font-black tracking-[0.2em] uppercase rounded-[40px] shadow-[0_0_40px_-8px_rgba(212,175,55,0.35)]"
              variant="gold"
            >
              {isSubmitting ? 'Processing...' : selectedPackageData ? `Book for €${selectedPackageData.price_eur}` : 'Select options to book'}
            </Button>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-sm rounded-[40px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-[40px] shadow-[0_0_56px_-8px_rgba(212,175,55,0.25)] sm:rounded-[40px]">
            <DialogHeader>
              <DialogTitle className="font-black tracking-[-0.04em] text-[#D4AF37] gold-glow text-center">
                Choose Payment Method
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                onClick={handleStripePayment}
                disabled={isSubmitting}
                className="w-full h-12 justify-start gap-3 rounded-[28px] border-white/[0.1] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                variant="outline"
              >
                <CreditCard size={20} className="text-[#D4AF37]" />
                <div className="text-left">
                  <div className="font-bold tracking-tight">Pay with Card</div>
                  <div className="text-xs sqi-body-text">Secure Stripe checkout</div>
                </div>
              </Button>

              <Button
                onClick={handleCryptoPayment}
                disabled={isSubmitting}
                className="w-full h-12 justify-start gap-3 rounded-[28px] border-white/[0.1] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-[#22D3EE]/35 hover:text-[#22D3EE]"
                variant="outline"
              >
                <Wallet size={20} className="text-[#22D3EE]" />
                <div className="text-left">
                  <div className="font-bold tracking-tight">Pay with Crypto</div>
                  <div className="text-xs sqi-body-text">SOL via Phantom wallet</div>
                </div>
              </Button>

              {sessionTypes.find(t => t.id === selectedType)?.calendly_url && (
                <Button
                  onClick={openCalendlyDirectly}
                  className="w-full h-12 justify-start gap-3 rounded-[28px] text-[#D4AF37] hover:bg-white/[0.06]"
                  variant="ghost"
                >
                  <ExternalLink size={20} />
                  <div className="text-left">
                    <div className="font-bold tracking-tight">Book on Calendly</div>
                    <div className="text-xs sqi-body-text">Schedule directly</div>
                  </div>
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PrivateSessions;