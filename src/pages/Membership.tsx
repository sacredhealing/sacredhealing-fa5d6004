import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Sparkles, Star, Zap, Settings, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useMembershipTier } from '@/features/membership/useMembershipTier';
import { YourMembershipSummary } from '@/features/membership/YourMembershipSummary';
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
  const tier = useMembershipTier();
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
      {/* Paid users: show membership summary, not plan chooser */}
      {(tier !== "free" || isTrialActive) ? (
        <YourMembershipSummary
          tier={tier === "free" ? "annual" : tier}
          onManage={handleManageSubscription}
          managing={portalLoading}
        />
      ) : (
        <>
          {/* Header - free users only */}
          <div className="bg-gradient-to-br from-primary/20 via-background to-accent/10 px-4 py-6 sm:py-8 text-center">
            <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Choose Your Path</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Unlock your full spiritual potential</p>
          </div>

          {/* Trial Banner - show if user can start trial */}
          {canStartTrial && (
            <div className="px-3 sm:px-4 py-3 sm:py-4">
              <TrialBanner onTrialStarted={() => {
                refetchTrial();
                refreshMembership();
              }} />
            </div>
          )}

          {/* Promo Code Input - free users only */}
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

          {/* Tiers - free users only: Annual (primary) + Lifetime, Monthly as small link */}
          <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {[tiers.find((t) => t.slug === 'premium-annual'), tiers.find((t) => t.slug === 'lifetime')]
              .filter((t): t is NonNullable<typeof t> => t != null)
              .map((planTier) => {
              const Icon = tierIcons[planTier.slug] || Star;
              const isCurrentPlan = currentTier === planTier.slug;
              const isRecommended = planTier.slug === 'premium-annual';
              const isBestValue = planTier.slug === 'lifetime';

              return (
                <Card 
                  key={planTier.id} 
                  className={`p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br ${tierColors[planTier.slug]} border ${isCurrentPlan ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                >
                  {/* Badges - positioned responsively */}
                  {isRecommended && !isCurrentPlan && (
                    <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs">
                      Recommended
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
                    <div className={`p-2 sm:p-3 rounded-xl self-start ${planTier.slug === 'lifetime' ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${planTier.slug === 'lifetime' ? 'text-amber-500' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-foreground pr-16 sm:pr-24">{planTier.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{planTier.description}</p>
                      
                      <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">€{planTier.price_eur}</span>
                        {planTier.billing_interval && (
                          <span className="text-sm text-muted-foreground">/{planTier.billing_interval}</span>
                        )}
                        {planTier.slug === 'lifetime' && (
                          <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2">one-time</span>
                        )}
                      </div>

                      {planTier.slug === 'premium-annual' && (
                        <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                          Save €119.88 compared to monthly!
                        </div>
                      )}

                      <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        {planTier.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{feature}</span>
                          </li>
                        ))}
                        {planTier.features.length > 4 && (
                          <li className="text-xs text-muted-foreground pl-5 sm:pl-6">
                            +{planTier.features.length - 4} more features
                          </li>
                        )}
                      </ul>

                      <Button 
                        onClick={() => handleSubscribe(planTier)}
                        className="w-full text-sm sm:text-base"
                        size="sm"
                        variant={isCurrentPlan ? 'outline' : planTier.slug === 'lifetime' ? 'default' : 'secondary'}
                        disabled={isCurrentPlan || checkoutLoading === planTier.id}
                      >
                        {checkoutLoading === planTier.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : planTier.price_eur === 0 ? (
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
            {/* Monthly as small "try it" link */}
            {(() => {
              const monthlyTier = tiers.find((t) => t.slug === 'premium-monthly');
              if (!monthlyTier || currentTier === 'premium-monthly') return null;
              return (
                <p className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleSubscribe(monthlyTier)}
                    disabled={checkoutLoading === monthlyTier.id}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    {checkoutLoading === monthlyTier.id ? (
                      <>
                        <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Prefer monthly? Try it'
                    )}
                  </button>
                </p>
              );
            })()}
          </div>
        </>
      )}

      {/* Active Trial Banner - when on trial */}
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

      {/* Ayurveda Section */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <AyurvedaSection isPremium={isPremium} membershipTier={currentTier || 'free'} isAdmin={isAdmin} />
      </div>

      {/* Vedic Astrology Section - reduced padding on mobile for wider text column */}
      <div className="px-2 sm:px-4 py-4 sm:py-6">
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
