import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Star, Crown, Lock, CheckCircle, User, Calendar, Compass, Zap } from 'lucide-react';
import { useVedicAstrology } from '@/hooks/useVedicAstrology';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BirthDetailsForm } from '@/components/vedic/BirthDetailsForm';
import { AIVedicDashboard } from '@/components/vedic/AIVedicDashboard';
import { DailyVedicInsight } from '@/components/vedic/DailyVedicInsight';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { MembershipTier, UserProfile } from '@/lib/vedicTypes';

const tierIcons: Record<string, React.ElementType> = {
  basic: Star,
  premium: Sparkles,
  master: Crown,
  free: Star,
  compass: Compass,
};

const tierColors: Record<string, { bg: string; border: string; text: string }> = {
  basic: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  free: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  premium: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
  compass: {
    bg: 'from-indigo-500/10 to-indigo-600/5',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
  },
  master: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
};

// Map existing DB tiers to new AI tier system
const mapToAITier = (dbTier: 'basic' | 'premium' | 'master'): MembershipTier => {
  switch (dbTier) {
    case 'basic': return 'free';
    case 'premium': return 'compass';
    case 'master': return 'premium';
    default: return 'free';
  }
};

const VedicAstrology: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tiers, isLoading, hasAccess, getHighestAccessLevel } = useVedicAstrology();
  const { tier: membershipTier } = useMembership();
  const [birthDetailsDialogOpen, setBirthDetailsDialogOpen] = useState(false);
  const [hasBirthDetails, setHasBirthDetails] = useState(false);
  const [birthDetails, setBirthDetails] = useState<any>(null);
  const [activeTier, setActiveTier] = useState<'basic' | 'premium' | 'master' | null>(null);
  const [useAIMode, setUseAIMode] = useState(true);

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

  useEffect(() => {
    const urlTier = (searchParams.get('tier') as 'basic' | 'premium' | 'master' | null) || null;
    const preferredTier = urlTier && hasAccess(urlTier) ? urlTier : getHighestAccessLevel();

    if (preferredTier) {
      setActiveTier(preferredTier);
    }
  }, [getHighestAccessLevel, hasAccess, searchParams]);

  const membershipMap: Record<string, string> = {
    'free': 'Free',
    'premium-monthly': 'Premium Monthly',
    'premium-annual': 'Premium Annual',
    'lifetime': 'Lifetime',
  };

  // Create UserProfile for AI Dashboard
  const userProfile: UserProfile | null = hasBirthDetails && activeTier ? {
    name: birthDetails?.birth_name || '',
    birthDate: birthDetails?.birth_date || '',
    birthTime: birthDetails?.birth_time || '',
    birthPlace: birthDetails?.birth_place || '',
    plan: mapToAITier(activeTier),
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const highestAccess = getHighestAccessLevel();

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      {/* Midnight Temple Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[100px]" />
      </div>

      <div className="container max-w-4xl mx-auto py-6 px-4 pb-24">
        {/* Header */}
        <motion.header 
          className="text-center mb-8 pt-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight font-serif">
            Akashic Vedic Guide
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg font-light tracking-wide">
            Merging the geometric precision of the stars with{' '}
            <span className="text-blue-400 font-medium">AI-Powered Efficiency</span>.{' '}
            Discover your soul's blueprint.
          </p>
        </motion.header>

        {/* Birth Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {!hasBirthDetails ? (
            <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/20">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-1">Identify Birth Coordinates</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your birth information to receive AI-powered Vedic guidance
                      </p>
                    </div>
                  </div>
                  <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                        <User className="w-4 h-4 mr-2" />
                        Sync with Cosmic Records
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl">
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
            <Card className="mb-8 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <p className="font-semibold text-foreground">Birth Coordinates Synced</p>
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
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl">
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
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Tier Navigation - Sticky */}
        {highestAccess && (
          <motion.div 
            className="sticky top-4 z-50 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-1.5 rounded-2xl gap-1 shadow-2xl">
              {tiers.map((tier) => {
                const userHasAccess = hasAccess(tier.tier_level);
                const Icon = tierIcons[tier.tier_level] || Star;
                const isActive = activeTier === tier.tier_level;
                
                return (
                  <button
                    key={tier.id}
                    onClick={() => userHasAccess && setActiveTier(tier.tier_level)}
                    disabled={!userHasAccess}
                    className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 ${
                      isActive 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : userHasAccess 
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                          : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {!userHasAccess && <Lock className="w-3 h-3 mr-1" />}
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{tier.name}</span>
                    <span className="sm:hidden">
                      {tier.tier_level === 'basic' ? 'Pulse' : tier.tier_level === 'premium' ? 'Compass' : 'Master'}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Mode Toggle */}
        {hasBirthDetails && activeTier && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-muted/30 rounded-lg p-1 border border-border">
              <button
                onClick={() => setUseAIMode(true)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  useAIMode 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="w-3 h-3 inline mr-1" />
                AI-Powered
              </button>
              <button
                onClick={() => setUseAIMode(false)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  !useAIMode 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className="w-3 h-3 inline mr-1" />
                Classic
              </button>
            </div>
          </div>
        )}

        {/* Active Tier Reading */}
        {activeTier && (
          <motion.div
            key={`${activeTier}-${useAIMode}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            {useAIMode && userProfile ? (
              <AIVedicDashboard 
                user={userProfile} 
                onEditDetails={() => setBirthDetailsDialogOpen(true)} 
                onUpgrade={() => navigate('/membership')}
              />
            ) : (
              <Card className="border-2 border-primary/30">
                <CardContent className="p-6">
                  <DailyVedicInsight tier={activeTier} />
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Tier Overview Cards */}
        <motion.div 
          className="space-y-4 pt-8 border-t border-border/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-heading font-semibold text-foreground">Available Tiers</h2>
          {tiers.map((tier) => {
            const Icon = tierIcons[tier.tier_level] || Star;
            const colors = tierColors[tier.tier_level] || tierColors.basic;
            const userHasAccess = hasAccess(tier.tier_level);
            const isLocked = !userHasAccess;

            return (
              <Card
                key={tier.id}
                className={`border-2 ${isLocked ? 'border-border/50 opacity-60' : colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm`}
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
                      className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90`}
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
        </motion.div>
      </div>
    </div>
  );
};

export default VedicAstrology;
