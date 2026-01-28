import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Sparkles, Star, Zap, Settings, Loader2, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { TrialBanner } from '@/components/offers/TrialBanner';
import { PromoCodeInput } from '@/components/offers/PromoCodeInput';
import PremiumMeditationsList from '@/components/membership/PremiumMeditationsList';
import { VedicAstrologySection } from '@/components/membership/VedicAstrologySection';
import { AyurvedaSection } from '@/components/membership/AyurvedaSection';
import { toast } from 'sonner';

interface MembershipTier {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_eur: number;
  billing_interval: string | null;
  features: string[];
  order_index: number;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
}

const tierIcons: Record<string, React.ElementType> = {
  free: Star,
  'premium-monthly': Zap,
  'premium-annual': Sparkles,
  lifetime: Crown,
};

const tierColors: Record<string, string> = {
  free: 'from-muted to-muted/50',
  'premium-monthly': 'from-blue-500/20 to-blue-600/10',
  'premium-annual': 'from-purple-500/20 to-purple-600/10',
  lifetime: 'from-amber-500/20 to-amber-600/10',
};

const Membership = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tier: currentTier, isPremium, isAdmin, refresh: refreshMembership } = useMembership();
  const { isTrialActive, daysRemaining, canStartTrial, refetch: refetchTrial } = useFreeTrial();
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    id: string;
    name: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null>(null);

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const tierParam = searchParams.get('tier');

    if (success === 'true') {
      toast.success(`Welcome to ${tierParam || 'Premium'}! Your membership is now active.`);
      refreshMembership();
      // Clean up URL
      window.history.replaceState({}, '', '/membership');
    } else if (canceled === 'true') {
      toast.info('Checkout was canceled. No charges were made.');
      window.history.replaceState({}, '', '/membership');
    }
  }, [searchParams, refreshMembership]);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from('membership_tiers')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (data) {
      setTiers(data.map(tier => ({
        ...tier,
        features: tier.features as string[]
      })));
    }
    if (error) {
      console.error('Error fetching tiers:', error);
    }
    setLoading(false);
  };

  const handleSubscribe = async (tier: MembershipTier) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (tier.slug === 'free') {
      toast.success('You are on the Free plan!');
      return;
    }

    if (!tier.stripe_price_id) {
      toast.error('This tier is not available for purchase yet.');
      return;
    }

    setCheckoutLoading(tier.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
        body: {
          priceId: tier.stripe_price_id,
          tierSlug: tier.slug,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-accent/10 px-4 py-6 sm:py-8 text-center">
        <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Choose Your Path</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Unlock your full spiritual potential</p>
        
        {isPremium && (
          <Button 
            onClick={handleManageSubscription}
            variant="outline"
              className="mt-4 w-full sm:w-auto"
            size="sm"
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Trial Banner - show if user can start trial */}
      {canStartTrial && !isPremium && (
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <TrialBanner onTrialStarted={() => {
            refetchTrial();
            refreshMembership();
          }} />
        </div>
      )}

      {/* Active Trial Banner */}
      {isTrialActive && (
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <Card className="p-3 sm:p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20 flex-shrink-0">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-foreground">Free Trial Active</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {daysRemaining} days remaining - Full Premium access!
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Promo Code Input */}
      {!isPremium && !isTrialActive && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <PromoCodeInput
            onPromoApplied={setAppliedPromo}
            onPromoRemoved={() => setAppliedPromo(null)}
          />
          {appliedPromo && (
            <p className="text-xs sm:text-sm text-primary mt-2 text-center">
              {appliedPromo.discount_type === 'percent' 
                ? `${appliedPromo.discount_value}% off will be applied at checkout`
                : `€${appliedPromo.discount_value} off will be applied at checkout`
              }
            </p>
          )}
        </div>
      )}

      {/* Tiers */}
      <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {tiers.map((tier) => {
          const Icon = tierIcons[tier.slug] || Star;
          const isCurrentPlan = currentTier === tier.slug;
          const isPopular = tier.slug === 'premium-annual';
          const isBestValue = tier.slug === 'lifetime';

          return (
            <Card 
              key={tier.id} 
              className={`p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br ${tierColors[tier.slug]} border ${isCurrentPlan ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
            >
              {/* Badges - positioned responsively */}
              {isPopular && !isCurrentPlan && (
                <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs">
                  Most Popular
                </Badge>
              )}
              {isBestValue && !isCurrentPlan && (
                <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-amber-500 text-white text-[10px] sm:text-xs">
                  Best Value
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-green-500 text-white text-[10px] sm:text-xs">
                  Your Plan
                </Badge>
              )}

              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-xl self-start ${tier.slug === 'lifetime' ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${tier.slug === 'lifetime' ? 'text-amber-500' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-foreground pr-16 sm:pr-24">{tier.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{tier.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">€{tier.price_eur}</span>
                    {tier.billing_interval && (
                      <span className="text-sm text-muted-foreground">/{tier.billing_interval}</span>
                    )}
                    {tier.slug === 'lifetime' && (
                      <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2">one-time</span>
                    )}
                  </div>

                  {tier.slug === 'premium-annual' && (
                    <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                      Save €119.88 compared to monthly!
                    </div>
                  )}

                  <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    {tier.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{feature}</span>
                      </li>
                    ))}
                    {tier.features.length > 4 && (
                      <li className="text-xs text-muted-foreground pl-5 sm:pl-6">
                        +{tier.features.length - 4} more features
                      </li>
                    )}
                  </ul>

                  <Button 
                    onClick={() => handleSubscribe(tier)}
                    className="w-full text-sm sm:text-base"
                    size="sm"
                    variant={isCurrentPlan ? 'outline' : tier.slug === 'lifetime' ? 'default' : 'secondary'}
                    disabled={isCurrentPlan || checkoutLoading === tier.id}
                  >
                    {checkoutLoading === tier.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : tier.price_eur === 0 ? (
                      'Get Started'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Ayurvedic Journey Section */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <Card className="p-6 bg-gradient-to-br from-background via-background to-muted/20 border-2 border-primary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ayurvedic Journey</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Dosha constitution</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Personalized diet recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Mental constitution (Manas Prakriti)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Lifestyle rituals for balance</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Life situation healing path</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Herbal & botanical support</span>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate('/ayurvedic-journey')}
              className="w-full bg-gradient-to-r from-primary via-primary/90 to-accent text-white hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 font-semibold py-6 rounded-lg shadow-[0_0_20px_hsl(var(--primary)/0.4)] text-sm sm:text-base"
              size="lg"
            >
              <span className="flex items-center justify-center gap-2 w-full whitespace-nowrap">
                Begin Your Ayurvedic Journey
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Vedic Astrology Section */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <VedicAstrologySection />
      </div>

      {/* Premium Meditations List */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <PremiumMeditationsList />
      </div>

      {/* Transformation Program CTA */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-500/20 via-primary/10 to-purple-500/20 border-amber-500/30">
          <div className="text-center">
            <Badge className="bg-amber-500 text-white mb-2 sm:mb-3 text-xs">Premium Coaching</Badge>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">6-Month Transformation Program</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 max-w-md mx-auto">
              Deep healing journey with personal guidance, daily WhatsApp support & 2 Zoom sessions/month
            </p>
            <div className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">€2,497</div>
            <Button 
              onClick={() => navigate('/transformation')}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white"
              size="sm"
            >
              Learn More
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Membership;
