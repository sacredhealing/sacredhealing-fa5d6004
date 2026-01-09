import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Crown, ExternalLink, Lock, CheckCircle, User, Calendar } from 'lucide-react';
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

  const handleAccessTool = (workspaceUrl: string | null, tierLevel: string) => {
    if (!workspaceUrl) {
      return;
    }
    window.open(workspaceUrl, '_blank', 'noopener,noreferrer');
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
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-heading font-bold text-foreground">
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
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                        // Refresh birth details
                        window.location.reload();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
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
          </div>
        )}

        {/* Daily Vedic Insight */}
        {highestAccess && (
          <div className="mb-6">
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
                    <ul className="space-y-1">
                      {tier.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${colors.text.replace('text-', 'bg-')} flex-shrink-0`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {tier.features.length > 5 && (
                        <li className="text-xs text-muted-foreground italic">
                          +{tier.features.length - 5} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {userHasAccess ? (
                    <Button
                      onClick={() => handleAccessTool(tier.workspace_url, tier.tier_level)}
                      className={`w-full bg-gradient-to-r ${colors.border.replace('border-', 'from-').replace('/30', '')} ${colors.text.replace('text-', 'to-')} text-white hover:opacity-90`}
                      size="lg"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Vedic Astrology Tool
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpgrade}
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

