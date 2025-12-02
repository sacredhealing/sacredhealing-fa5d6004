import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Sparkles, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MembershipTier {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_eur: number;
  billing_interval: string;
  features: string[];
  order_index: number;
}

const tierIcons: Record<string, React.ElementType> = {
  free: Star,
  starter: Zap,
  pro: Sparkles,
  vip: Crown,
};

const tierColors: Record<string, string> = {
  free: 'from-muted to-muted/50',
  starter: 'from-blue-500/20 to-blue-600/10',
  pro: 'from-purple-500/20 to-purple-600/10',
  vip: 'from-amber-500/20 to-amber-600/10',
};

const Membership = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
    if (user) {
      fetchUserMembership();
    }
  }, [user]);

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from('membership_tiers')
      .select('*')
      .order('order_index');

    if (data) {
      setTiers(data.map(tier => ({
        ...tier,
        features: tier.features as string[]
      })));
    }
    setLoading(false);
  };

  const fetchUserMembership = async () => {
    const { data } = await supabase
      .from('user_memberships')
      .select('tier_id, membership_tiers(slug)')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single();

    if (data?.membership_tiers) {
      setCurrentTier((data.membership_tiers as any).slug);
    }
  };

  const handleSubscribe = async (tier: MembershipTier) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (tier.price_eur === 0) {
      toast.success('You are on the Free plan!');
      return;
    }

    // TODO: Integrate Stripe checkout
    toast.info('Payment integration coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-accent/10 px-4 py-8 text-center">
        <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Choose Your Path</h1>
        <p className="text-muted-foreground">Unlock your full spiritual potential</p>
      </div>

      {/* Tiers */}
      <div className="px-4 py-6 space-y-4">
        {tiers.map((tier) => {
          const Icon = tierIcons[tier.slug] || Star;
          const isCurrentPlan = currentTier === tier.slug;
          const isPopular = tier.slug === 'pro';

          return (
            <Card 
              key={tier.id} 
              className={`p-5 relative overflow-hidden bg-gradient-to-br ${tierColors[tier.slug]} border ${isCurrentPlan ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
            >
              {isPopular && (
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                  Your Plan
                </Badge>
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${tier.slug === 'vip' ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
                  <Icon className={`w-6 h-6 ${tier.slug === 'vip' ? 'text-amber-500' : 'text-primary'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-foreground">€{tier.price_eur}</span>
                    {tier.price_eur > 0 && (
                      <span className="text-muted-foreground">/{tier.billing_interval}</span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleSubscribe(tier)}
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : tier.slug === 'vip' ? 'default' : 'secondary'}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : tier.price_eur === 0 ? 'Get Started' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Transformation Program CTA */}
      <div className="px-4 py-6">
        <Card className="p-6 bg-gradient-to-br from-amber-500/20 via-primary/10 to-purple-500/20 border-amber-500/30">
          <div className="text-center">
            <Badge className="bg-amber-500 text-white mb-3">Premium Coaching</Badge>
            <h3 className="text-xl font-bold text-foreground mb-2">6-Month Transformation Program</h3>
            <p className="text-muted-foreground mb-4">
              Deep healing journey with personal guidance, daily WhatsApp support & 2 Zoom sessions/month
            </p>
            <div className="text-3xl font-bold text-foreground mb-4">€2,497</div>
            <Button 
              onClick={() => navigate('/transformation')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
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
