import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, User, Sparkles, Heart, Shield, Users, CreditCard, Wallet, ExternalLink, ArrowLeft } from 'lucide-react';
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

const categoryIcons: Record<string, React.ReactNode> = {
  spiritual: <Sparkles className="w-5 h-5" />,
  healing: <Heart className="w-5 h-5" />,
  men: <Shield className="w-5 h-5" />,
};

const PrivateSessions: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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
      const [typesRes, packagesRes] = await Promise.all([
        supabase.from('session_types').select('*').eq('is_active', true).order('order_index'),
        supabase.from('session_packages').select('*').eq('is_active', true).order('order_index')
      ]);

      if (typesRes.data) setSessionTypes(typesRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Copy wallet address
    navigator.clipboard.writeText('BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j');
    toast.success('Wallet address copied!');
    
    setPaymentDialogOpen(false);
    
    // Open Calendly if available
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Step 1: Choose Practitioner
  if (!selectedPractitioner) {
    return (
      <div className="min-h-screen px-4 py-6 pb-32">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Private Sessions
          </h1>
          <p className="text-muted-foreground">
            Choose your guide for a transformative 1-on-1 session
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {/* Adam Card */}
          <Card 
            className="overflow-hidden cursor-pointer hover:border-primary transition-all animate-slide-up"
            onClick={() => setSelectedPractitioner('adam')}
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img 
                src={adamDrum} 
                alt="Adam" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <CardContent className="p-6">
              <h2 className="text-2xl font-heading font-bold mb-2">Adam</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Spiritual Guide & Energy Practitioner
              </p>
              <p className="text-foreground/80">
                Supporting healing through vibrational medicine and meditation, helping individuals realign with life purpose and inner wisdom.
              </p>
              <Button className="w-full mt-4" variant="outline">
                View Adam's Sessions
              </Button>
            </CardContent>
          </Card>

          {/* Laila Card */}
          <Card 
            className="overflow-hidden cursor-pointer hover:border-primary transition-all animate-slide-up"
            style={{ animationDelay: '0.1s' }}
            onClick={() => setSelectedPractitioner('laila')}
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img 
                src={lailaPortrait} 
                alt="Laila" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <CardContent className="p-6">
              <h2 className="text-2xl font-heading font-bold mb-2">Laila</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Yogi & Sound Healer
              </p>
              <p className="text-foreground/80">
                Channeling divine energy through meditation, mantra, and transformational breathwork, empowering individuals to awaken their intuition.
              </p>
              <Button className="w-full mt-4" variant="outline">
                View Laila's Sessions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Choose Session Type & Package
  return (
    <div className="min-h-screen px-4 py-6 pb-32">
      {/* Header with Back Button */}
      <header className="mb-8 animate-fade-in">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
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
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
            <img 
              src={selectedPractitioner === 'adam' ? adamDrum : lailaPortrait} 
              alt={selectedPractitioner === 'adam' ? 'Adam' : 'Laila'}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Sessions with {selectedPractitioner === 'adam' ? 'Adam' : 'Laila'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {selectedPractitioner === 'adam' 
                ? 'Spiritual Guide & Energy Practitioner'
                : 'Yogi & Sound Healer'}
            </p>
          </div>
        </div>
      </header>

      {/* Session Types */}
      <Card className="mb-6 animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={20} />
            Select Session Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSessionTypes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No sessions available for this practitioner yet.
            </p>
          ) : (
            <RadioGroup value={selectedType} onValueChange={setSelectedType} className="space-y-3">
              {filteredSessionTypes.map((type) => (
                <div key={type.id}>
                  <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                  <Label
                    htmlFor={type.id}
                    className="flex items-start gap-3 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      type.category === 'healing' ? 'bg-pink-500/20 text-pink-400' :
                      type.category === 'men' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {categoryIcons[type.category] || <Sparkles className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="font-heading font-semibold block">{type.name}</span>
                      <span className="text-sm text-muted-foreground">{type.description}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Packages */}
      <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
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
                  className="flex items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div>
                    <span className="font-heading font-semibold block">{pkg.name}</span>
                    <span className="text-sm text-muted-foreground">{pkg.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-heading font-bold text-gradient-gold">€{pkg.price_eur}</span>
                    {pkg.session_count > 1 && (
                      <span className="text-xs text-muted-foreground block">
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
      <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle>Your Details</CardTitle>
          <CardDescription>We'll contact you to schedule your session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us about your goals or any specific concerns..."
              className="mt-1 min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Book Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleBookSession}
          disabled={!selectedType || !selectedPackage || isSubmitting}
          className="w-full h-14 text-lg font-heading"
          variant="gold"
        >
          {isSubmitting ? 'Processing...' : selectedPackageData ? `Book for €${selectedPackageData.price_eur}` : 'Select options to book'}
        </Button>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={handleStripePayment}
              disabled={isSubmitting}
              className="w-full h-12 justify-start gap-3"
              variant="outline"
            >
              <CreditCard size={20} />
              <div className="text-left">
                <div className="font-medium">Pay with Card</div>
                <div className="text-xs text-muted-foreground">Secure Stripe checkout</div>
              </div>
            </Button>
            
            <Button
              onClick={handleCryptoPayment}
              disabled={isSubmitting}
              className="w-full h-12 justify-start gap-3"
              variant="outline"
            >
              <Wallet size={20} />
              <div className="text-left">
                <div className="font-medium">Pay with Crypto</div>
                <div className="text-xs text-muted-foreground">SOL via Phantom wallet</div>
              </div>
            </Button>

            {sessionTypes.find(t => t.id === selectedType)?.calendly_url && (
              <Button
                onClick={openCalendlyDirectly}
                className="w-full h-12 justify-start gap-3"
                variant="ghost"
              >
                <ExternalLink size={20} />
                <div className="text-left">
                  <div className="font-medium">Book on Calendly</div>
                  <div className="text-xs text-muted-foreground">Schedule directly</div>
                </div>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivateSessions;