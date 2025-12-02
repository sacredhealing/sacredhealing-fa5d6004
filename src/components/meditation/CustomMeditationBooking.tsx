import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Music, Eye, Heart, Star, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CustomMeditationBooking: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'double' | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const packages = [
    {
      id: 'single',
      name: 'Single Meditation',
      price: 70,
      originalPrice: null,
      description: '1 Custom Channeled Meditation',
      popular: false,
    },
    {
      id: 'double',
      name: 'Double Pack',
      price: 97,
      originalPrice: 140,
      description: '2 Custom Channeled Meditations',
      popular: true,
      savings: '€43',
    },
  ];

  const features = [
    { icon: Eye, text: 'Energy field scanning & reading' },
    { icon: Heart, text: 'Healing & life guidance' },
    { icon: Sparkles, text: 'Soul reading & past life insights' },
    { icon: Star, text: 'Spirit connection & messages' },
    { icon: Music, text: 'Custom 432hz music composition' },
  ];

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book a meditation');
      return;
    }

    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-meditation-checkout', {
        body: { packageType: selectedPackage, notes },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        setIsOpen(false);
        toast.success('Redirecting to checkout...');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Featured Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/30 via-amber-500/20 to-purple-800/30 border border-purple-500/30 p-6 animate-slide-up">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-3">
            ✨ Personalized Experience
          </Badge>
          
          <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
            Custom Channeled Meditation
          </h3>
          
          <p className="text-foreground/80 mb-4 leading-relaxed">
            Experience a deeply personal meditation channeled by Adam, featuring your own 
            432hz healing music, energy field scanning, soul readings, and spiritual guidance.
          </p>

          <div className="grid grid-cols-1 gap-2 mb-5">
            {features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-foreground/70">
                <feature.icon size={16} className="text-amber-400" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div>
              <span className="text-3xl font-heading font-bold text-gradient-gold">€70</span>
              <span className="text-muted-foreground text-sm ml-2">single</span>
            </div>
            <div className="text-muted-foreground">or</div>
            <div>
              <span className="text-3xl font-heading font-bold text-gradient-gold">€97</span>
              <span className="text-muted-foreground text-sm ml-2">for 2</span>
              <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                Save €43
              </Badge>
            </div>
          </div>

          <Button 
            onClick={() => setIsOpen(true)} 
            className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-semibold"
          >
            <Sparkles size={18} className="mr-2" />
            Book Your Meditation
          </Button>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Book Your Custom Meditation</DialogTitle>
            <DialogDescription>
              Adam will channel a personalized meditation just for you
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                What's Included
              </h4>
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon size={16} className="text-primary" />
                  </div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Package Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Select Package
              </h4>
              <div className="grid gap-3">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPackage(pkg.id as 'single' | 'double')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPackage === pkg.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {selectedPackage === pkg.id && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{pkg.name}</span>
                            {pkg.popular && (
                              <Badge className="bg-amber-500/20 text-amber-400 text-xs">Best Value</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">€{pkg.price}</div>
                        {pkg.originalPrice && (
                          <div className="text-sm text-muted-foreground line-through">€{pkg.originalPrice}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Special Requests (Optional)
              </h4>
              <Textarea
                placeholder="Share any specific intentions, areas of focus, or questions you'd like addressed in your meditation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Book Button */}
            <Button
              onClick={handleBooking}
              disabled={!selectedPackage || isLoading || !isAuthenticated}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Continue to Payment
                </>
              )}
            </Button>

            {!isAuthenticated && (
              <p className="text-sm text-center text-muted-foreground">
                Please sign in to book your meditation
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomMeditationBooking;
