import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { LotusIcon } from '@/components/icons/LotusIcon';

interface MembershipStatus {
  hasMembership: boolean;
  planType: string | null;
  subscriptionEnd: string | null;
}

const MeditationMembershipBanner: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<'monthly' | 'yearly' | null>(null);

  useEffect(() => {
    if (user) {
      checkMembership();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkMembership = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-meditation-membership');
      if (error) throw error;
      setMembership(data);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSubscribing(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-membership-checkout', {
        body: { planType }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500/10 via-primary/5 to-amber-500/10 border-purple-500/30">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  // Show active membership badge
  if (membership?.hasMembership) {
    return (
      <Card className="p-4 mb-6 bg-gradient-to-br from-purple-500/20 via-primary/10 to-amber-500/20 border-purple-500/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-500/20">
            <Crown className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{t('membership.meditationMember')}</span>
              <Badge className="bg-purple-500 text-white text-xs">
                {membership.planType === 'yearly' ? t('membership.yearly') : t('membership.monthly')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('membership.unlimitedMeditations')} • 33 SHC {t('membership.perSession')} • {t('membership.renews')} {membership.subscriptionEnd ? new Date(membership.subscriptionEnd).toLocaleDateString() : t('membership.soon')}
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-purple-500" />
        </div>
      </Card>
    );
  }

  // Show subscription options with consistent styling
  const features = [
    { text: t('membership.allMeditations') },
    { text: `33 SHC/${t('membership.session')}` },
    { text: t('membership.premiumContent') },
    { text: t('membership.cancelAnytime') },
  ];

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-500/10 via-primary/5 to-amber-500/10 border border-purple-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <LotusIcon className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-heading font-bold text-foreground">{t('membership.meditationMembership')}</h3>
            <Badge className="bg-purple-500 text-white">{t('common.new')}</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {t('membership.meditationDescription')}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Monthly Plan */}
            <div className="p-3 rounded-xl border border-border/50 bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">{t('membership.monthly')}</p>
              <p className="text-xl font-bold text-foreground">€4.99<span className="text-sm font-normal text-muted-foreground">/{t('membership.mo')}</span></p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => handleSubscribe('monthly')}
                disabled={subscribing !== null}
              >
                {subscribing === 'monthly' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('membership.subscribe')
                )}
              </Button>
            </div>

            {/* Yearly Plan */}
            <div className="p-3 rounded-xl border-2 border-purple-500/50 bg-purple-500/5 relative">
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px]">{t('membership.save10')}</Badge>
              <p className="text-xs text-muted-foreground mb-1">{t('membership.yearly')}</p>
              <p className="text-xl font-bold text-foreground">€49<span className="text-sm font-normal text-muted-foreground">/{t('membership.yr')}</span></p>
              <Button 
                size="sm" 
                className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => handleSubscribe('yearly')}
                disabled={subscribing !== null}
              >
                {subscribing === 'yearly' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('membership.subscribe')
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {features.map((feature, index) => (
              <span key={index} className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                {feature.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeditationMembershipBanner;
