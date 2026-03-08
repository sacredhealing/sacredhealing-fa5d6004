import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, Check, Zap, Heart, DollarSign, Star, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ServiceBannerRow } from '@/components/ui/service-banner-row';

interface WealthMeditationServiceProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const WealthMeditationService: React.FC<WealthMeditationServiceProps> = ({ open: controlledOpen, onOpenChange, hideTrigger }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? (v: boolean) => onOpenChange?.(v) : setInternalOpen;
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error(t('wealth.signInRequired'));
      return;
    }

    if (!email) {
      toast.error(t('wealth.emailRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-wealth-meditation-checkout', {
        body: { email },
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
        toast.success(t('wealth.checkoutSuccess'));
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to process purchase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!hideTrigger && (
        <ServiceBannerRow
          icon={Zap}
          title={t('wealth.title')}
          subtitle={t('wealth.badge')}
          onCtaClick={() => setIsOpen(true)}
          accentColor="yellow"
          variant="sanctuary"
          priceAboveTitle="€47"
        />
      )}

      {/* Purchase Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">{t('wealth.title')}</DialogTitle>
            <DialogDescription>
              {t('wealth.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* What it does */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-yellow-400 flex items-center gap-2">
                <Zap size={16} /> {t('wealth.whatItDoes')}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('wealth.benefit1')}</li>
                <li>• {t('wealth.benefit2')}</li>
                <li>• {t('wealth.benefit3')}</li>
                <li>• {t('wealth.benefit4')}</li>
              </ul>
            </div>

            {/* What's inside */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-amber-400 flex items-center gap-2">
                <Star size={16} /> {t('wealth.whatsInside')}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('wealth.inside1')}</li>
                <li>• {t('wealth.inside2')}</li>
                <li>• {t('wealth.inside3')}</li>
                <li>• {t('wealth.inside4')}</li>
              </ul>
            </div>

            {/* For you if */}
            <div className="p-4 rounded-lg bg-background/30 border border-border/50">
              <h4 className="font-semibold text-sm text-orange-400 flex items-center gap-2 mb-2">
                <Heart size={16} /> {t('wealth.forYouIf')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>• {t('wealth.goal1')}</span>
                <span>• {t('wealth.goal2')}</span>
                <span>• {t('wealth.goal3')}</span>
                <span>• {t('wealth.goal4')}</span>
              </div>
            </div>

            {/* How it works */}
            <div className="space-y-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Mail size={16} className="text-yellow-500" />
                {t('wealth.howItWorks')}
              </h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li><strong>{t('wealth.step1')}</strong></li>
                <li><strong>{t('wealth.step2')}</strong></li>
                <li><strong>{t('wealth.step3')}</strong></li>
                <li><strong>{t('wealth.step4')}</strong></li>
                <li><strong>{t('wealth.step5')}</strong></li>
              </ol>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t('wealth.emailLabel')} *
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('wealth.emailDescription')}
              </p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* What you get */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-semibold text-sm">{t('wealth.whatYouGet')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  {t('wealth.receive1')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  {t('wealth.receive2')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  {t('wealth.receive3')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  {t('wealth.receive4')}
                </li>
              </ul>
            </div>

            {/* Price & Purchase */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>{t('wealth.total')}</span>
                <span className="text-gradient-gold">€47</span>
              </div>
              
              <Button
                onClick={handlePurchase}
                disabled={!email || isLoading || !isAuthenticated}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {t('wealth.processing')}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    {t('wealth.continuePayment')}
                  </>
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-sm text-center text-muted-foreground">
                  {t('wealth.signInRequired')}
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground">
                {t('wealth.afterPayment')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WealthMeditationService;
