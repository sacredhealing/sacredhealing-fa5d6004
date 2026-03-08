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
import { ServiceBannerRow } from '@/components/ui/service-banner-row';

interface CustomMeditationBookingProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const CustomMeditationBooking: React.FC<CustomMeditationBookingProps> = ({ open: controlledOpen, onOpenChange, hideTrigger }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? (v: boolean) => onOpenChange?.(v) : setInternalOpen;
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'double' | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const packages = [
    {
      id: 'single',
      name: t('customMeditation.singlePackage'),
      price: 70,
      originalPrice: null,
      description: t('customMeditation.singleDesc'),
      popular: false,
    },
    {
      id: 'double',
      name: t('customMeditation.doublePackage'),
      price: 97,
      originalPrice: 140,
      description: t('customMeditation.doubleDesc'),
      popular: true,
      savings: '€43',
    },
  ];

  const features = [
    { icon: Eye, text: t('customMeditation.feature1') },
    { icon: Heart, text: t('customMeditation.feature2') },
    { icon: Sparkles, text: t('customMeditation.feature3') },
    { icon: Star, text: t('customMeditation.feature4') },
    { icon: Music, text: t('customMeditation.feature5') },
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
      {!hideTrigger && (
        <ServiceBannerRow
          icon={Sparkles}
          title={t('customMeditation.title')}
          subtitle={t('customMeditation.badge')}
          onCtaClick={() => setIsOpen(true)}
          accentColor="purple"
          variant="sanctuary"
          priceAboveTitle="€70–€97"
        />
      )}

      {/* Booking Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">{t('customMeditation.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('customMeditation.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t('customMeditation.whatsIncluded')}
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
                {t('customMeditation.selectPackage')}
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
                              <Badge className="bg-amber-500/20 text-amber-400 text-xs">{t('customMeditation.bestValue')}</Badge>
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
                {t('customMeditation.specialRequests')}
              </h4>
              <Textarea
                placeholder={t('customMeditation.notesPlaceholder')}
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
                  {t('customMeditation.processing')}
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  {t('customMeditation.continuePayment')}
                </>
              )}
            </Button>

            {!isAuthenticated && (
              <p className="text-sm text-center text-muted-foreground">
                {t('customMeditation.signInRequired')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomMeditationBooking;
