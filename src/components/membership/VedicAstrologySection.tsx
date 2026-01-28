import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Crown, Lock, CheckCircle, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useVedicAstrology } from '@/hooks/useVedicAstrology';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BirthDetailsForm } from '@/components/vedic/BirthDetailsForm';
import { DailyVedicInsight } from '@/components/vedic/DailyVedicInsight';

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

export const VedicAstrologySection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tiers, isLoading, hasAccess, getHighestAccessLevel } = useVedicAstrology();
  const { tier: membershipTier, isPremium } = useMembership();
  const [birthDetailsDialogOpen, setBirthDetailsDialogOpen] = useState(false);
  const [hasBirthDetails, setHasBirthDetails] = useState(false);
  const [birthDetails, setBirthDetails] = useState<any>(null);

  const fetchBirthDetails = async () => {
    if (!user) return;

    try {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('birth_name, birth_date, birth_time, birth_place')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        setHasBirthDetails(true);
        setBirthDetails(data);
      } else {
        setHasBirthDetails(false);
        setBirthDetails(null);
      }
    } catch (error) {
      console.error('Error checking birth details:', error);
    }
  };

  useEffect(() => {
    fetchBirthDetails();
  }, [user]);

  const handleAccessTool = (tierLevel: string) => {
    navigate(`/vedic-astrology?tier=${tierLevel}`);
  };

  const handleUpgrade = () => {
    navigate('/membership');
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highestAccess = getHighestAccessLevel();
  const membershipMap: Record<string, string> = {
    'free': 'Free',
    'premium-monthly': 'Premium Monthly',
    'premium-annual': 'Premium Annual',
    'lifetime': 'Lifetime',
  };

  return (
    <Card className="w-full border-2 border-primary/30 bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-5 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              Vedic Astrology
            </h2>
            <p className="text-sm text-muted-foreground">
              Discover your cosmic blueprint with ancient Vedic wisdom
            </p>
          </div>
        </div>

        {/* Birth Details Section */}
        {!hasBirthDetails ? (
          <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Add Your Birth Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your birth information to receive personalized daily Vedic guidance
                    </p>
                  </div>
                </div>
                <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="lg" className="w-full sm:w-auto">
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
                        fetchBirthDetails();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
                      fetchBirthDetails();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Daily Vedic Insight */}
        {highestAccess && (
          <div className="mb-6 w-full">
            <DailyVedicInsight tier={highestAccess} />
          </div>
        )}

        {highestAccess && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-blue-500" />
              <p className="font-semibold text-foreground">
                Your Current Access: {tiers.find(t => t.tier_level === highestAccess)?.name}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your {membershipMap[membershipTier || 'free']} membership
            </p>
          </div>
        )}

        <div className="space-y-4">
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
                <CardContent className="p-3 sm:p-5">
                  {/* Header Row - Horizontal Layout */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-lg text-foreground leading-tight">{tier.name}</h3>
                        {userHasAccess && (
                          <Badge className="bg-green-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5">
                            Active
                          </Badge>
                        )}
                        {isLocked && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description - Compact, Horizontal */}
                  <p className="text-xs sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-tight sm:leading-normal line-clamp-2 sm:line-clamp-none">{tier.description}</p>

                  {/* Required Membership and Features - Horizontal on mobile too */}
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-shrink-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">
                        Required:
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {tier.membership_required.map((req) => (
                          <Badge
                            key={req}
                            variant={membershipTier === req ? 'default' : 'outline'}
                            className="text-[10px] sm:text-xs px-1.5 py-0.5"
                          >
                            {membershipMap[req] || req}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">
                        Features:
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-3 gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-1.5">
                        {tier.features.slice(0, 6).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-[10px] sm:text-sm text-foreground">
                            <div className={`w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full mt-1.5 ${colors.text.replace('text-', 'bg-')} flex-shrink-0`} />
                            <span className="leading-tight sm:leading-snug break-words">{feature}</span>
                          </div>
                        ))}
                      </div>
                      {tier.features.length > 6 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground italic mt-1.5 sm:mt-2">
                          +{tier.features.length - 6} more
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Button - Full Width, Consistent on Mobile */}
                  {userHasAccess ? (
                    <Button
                      onClick={() => handleAccessTool(tier.tier_level)}
                      className={`w-full bg-gradient-to-r ${colors.border.replace('border-', 'from-').replace('/30', '')} ${colors.text.replace('text-', 'to-')} text-white hover:opacity-90 text-xs sm:text-base py-2.5 sm:py-4 min-h-[44px] sm:min-h-[48px] font-medium`}
                      size="lg"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap text-xs sm:text-base">Open Vedic Tool</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      variant="outline"
                      className="w-full text-xs sm:text-base py-2.5 sm:py-4 min-h-[44px] sm:min-h-[48px] font-medium"
                      size="lg"
                    >
                      <span className="whitespace-nowrap text-xs sm:text-base">Upgrade to Unlock</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Note:</strong> Vedic Astrology access is automatically granted based on your membership tier. 
            Upgrade your membership to unlock higher tiers of cosmic wisdom.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

