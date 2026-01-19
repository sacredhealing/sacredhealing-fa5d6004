import React, { useState, useEffect } from 'react';
import { BackButton } from '@/components/layout/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Star, Crown, Lock, CheckCircle, User, Calendar } from 'lucide-react';
import { useVedicAstrology } from '@/hooks/useVedicAstrology';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BirthDetailsForm } from '@/components/vedic/BirthDetailsForm';
import { DailyVedicInsight } from '@/components/vedic/DailyVedicInsight';
import { useNavigate } from 'react-router-dom';

const tierIcons: Record<string, React.ElementType> = {
  basic: Star,
  premium: Sparkles,
  master: Crown,
};

const tierColors: Record<string, { bg: string; border: string; text: string }> = {
  basic: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  premium: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
  master: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
};

const VedicAstrology: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tiers, isLoading, hasAccess, getHighestAccessLevel } = useVedicAstrology();
  const { tier: membershipTier } = useMembership();
  const [birthDetailsDialogOpen, setBirthDetailsDialogOpen] = useState(false);
  const [hasBirthDetails, setHasBirthDetails] = useState(false);
  const [birthDetails, setBirthDetails] = useState<any>(null);
  const [activeTier, setActiveTier] = useState<'basic' | 'premium' | 'master' | null>(null);

  useEffect(() => {
    const checkBirthDetails = async () => {
      if (!user) return;

      try {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('birth_name, birth_date, birth_time, birth_place')
          .eq('id', user.id)
          .single();

        if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
          setHasBirthDetails(true);
          setBirthDetails(data);
        }
      } catch (error) {
        console.error('Error checking birth details:', error);
      }
    };

    checkBirthDetails();
  }, [user]);

  useEffect(() => {
    const highest = getHighestAccessLevel();
    if (highest) {
      setActiveTier(highest);
    }
  }, [getHighestAccessLevel]);

  const membershipMap: Record<string, string> = {
    'free': 'Free',
    'premium-monthly': 'Premium Monthly',
    'premium-annual': 'Premium Annual',
    'lifetime': 'Lifetime',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const highestAccess = getHighestAccessLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/30 via-background to-blue-950/20">
      <div className="container max-w-4xl mx-auto py-6 px-4 pb-24">
        <BackButton />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Vedic Astrology
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Discover your cosmic blueprint with ancient Vedic wisdom and receive personalized guidance based on planetary alignments.
          </p>
        </div>

        {/* Birth Details Section */}
        {!hasBirthDetails ? (
          <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/20">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">Add Your Birth Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your birth information to receive personalized daily Vedic guidance
                    </p>
                  </div>
                </div>
                <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="lg">
                      <User className="w-4 h-4 mr-2" />
                      Add Birth Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Enter Your Birth Details</DialogTitle>
                    </DialogHeader>
                    <BirthDetailsForm
                      onSaved={() => {
                        setBirthDetailsDialogOpen(false);
                        setHasBirthDetails(true);
                        window.location.reload();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="font-semibold text-foreground">Birth Details Saved</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {birthDetails?.birth_name} • {birthDetails?.birth_place}
                  </p>
                </div>
                <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Edit Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Update Birth Details</DialogTitle>
                    </DialogHeader>
                    <BirthDetailsForm
                      initialData={birthDetails}
                      onSaved={() => {
                        setBirthDetailsDialogOpen(false);
                        window.location.reload();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier Selection Tabs */}
        {highestAccess && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tiers.map((tier) => {
              const userHasAccess = hasAccess(tier.tier_level);
              const Icon = tierIcons[tier.tier_level] || Star;
              const colors = tierColors[tier.tier_level] || tierColors.basic;
              
              return (
                <Button
                  key={tier.id}
                  variant={activeTier === tier.tier_level ? "default" : "outline"}
                  className={`flex-shrink-0 ${
                    activeTier === tier.tier_level 
                      ? `bg-gradient-to-r ${colors.bg} border ${colors.border}` 
                      : ''
                  } ${!userHasAccess ? 'opacity-50' : ''}`}
                  onClick={() => userHasAccess && setActiveTier(tier.tier_level)}
                  disabled={!userHasAccess}
                >
                  {!userHasAccess && <Lock className="w-3 h-3 mr-1" />}
                  <Icon className={`w-4 h-4 mr-2 ${colors.text}`} />
                  {tier.name}
                </Button>
              );
            })}
          </div>
        )}

        {/* Active Tier Reading */}
        {activeTier && hasBirthDetails && (
          <Card className="mb-8 border-2 border-primary/30">
            <CardContent className="p-6">
              <DailyVedicInsight tier={activeTier} />
            </CardContent>
          </Card>
        )}

        {/* No Birth Details Message */}
        {!hasBirthDetails && highestAccess && (
          <Card className="mb-8 border border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 mx-auto text-amber-400 mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">Birth Details Required</h3>
              <p className="text-muted-foreground mb-4">
                Please add your birth details above to receive personalized Vedic readings
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tier Overview Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-semibold text-foreground">Available Tiers</h2>
          {tiers.map((tier) => {
            const Icon = tierIcons[tier.tier_level] || Star;
            const colors = tierColors[tier.tier_level] || tierColors.basic;
            const userHasAccess = hasAccess(tier.tier_level);
            const isLocked = !userHasAccess;

            return (
              <Card
                key={tier.id}
                className={`border-2 ${isLocked ? 'border-border/50 opacity-60' : colors.border} bg-gradient-to-br ${colors.bg}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-foreground">{tier.name}</h3>
                          {userHasAccess && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Active
                            </Badge>
                          )}
                          {isLocked && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Required Membership:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tier.membership_required.map((req) => (
                        <Badge
                          key={req}
                          variant={membershipTier === req ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {membershipMap[req] || req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Features:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${colors.text.replace('text-', 'bg-')} flex-shrink-0`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {userHasAccess ? (
                    <Button
                      onClick={() => {
                        setActiveTier(tier.tier_level);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full bg-gradient-to-r ${colors.border.replace('border-', 'from-').replace('/30', '')} ${colors.text.replace('text-', 'to-')} text-white hover:opacity-90`}
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      View {tier.name}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate('/membership')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Upgrade Membership to Unlock
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VedicAstrology;
