import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Star, Crown, Lock, CheckCircle, User, Calendar, Zap } from 'lucide-react';
import { useVedicAstrology } from '@/hooks/useVedicAstrology';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BirthDetailsForm } from '@/components/vedic/BirthDetailsForm';
import { AIVedicDashboard } from '@/components/vedic/AIVedicDashboard';
import { DailyVedicInsight } from '@/components/vedic/DailyVedicInsight';
import { IncenseSmoke } from '@/components/vedic/IncenseSmoke';
import { SacredHeader } from '@/components/vedic/SacredHeader';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePersistedState } from '@/features/vedic/usePersistedState';
import type { MembershipTier, UserProfile } from '@/lib/vedicTypes';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { tiers, isLoading, hasAccess, getHighestAccessLevel } = useVedicAstrology();
  const { tier: membershipTier } = useMembership();
  const [birthDetailsDialogOpen, setBirthDetailsDialogOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const userKey = user?.id ?? 'anon';
  const lsKey = (k: string) => `sh:vedic:${userKey}:${k}`;

  // Default: free → Classic, paid → AI-Powered. Persisted so paid users keep their choice.
  const [useAIMode, setUseAIMode] = usePersistedState<boolean>(lsKey('aiMode'), true);
  const [syncState, setSyncState] = usePersistedState<{ status: 'idle' | 'synced' | 'error'; lastSyncedAt?: string }>(
    lsKey('sync'),
    { status: 'idle' }
  );
  const [cachedBirth, setCachedBirth] = usePersistedState<any>(lsKey('birth'), null);
  const [cachedResults, setCachedResults] = usePersistedState<any>(lsKey('cachedResults'), null);

  // Live birth details from DB
  const [hasBirthDetails, setHasBirthDetails] = useState(false);
  const [birthDetails, setBirthDetails] = useState<any>(null);
  const [activeTier, setActiveTier] = useState<'basic' | 'premium' | 'master' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const synced = syncState.status === 'synced';
  const lastSyncedAt = syncState.lastSyncedAt ?? null;

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
        setCachedBirth(data);
        if (!synced) {
          setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
        }
        setSyncError(null);
      } else {
        setHasBirthDetails(false);
        setBirthDetails(null);
      }
    } catch (error) {
      console.error('Error checking birth details:', error);
    }
  };

  // Restore from cache on mount if DB hasn't loaded yet
  useEffect(() => {
    if (!birthDetails && cachedBirth) {
      setBirthDetails(cachedBirth);
      setHasBirthDetails(true);
    }
  }, []);

  useEffect(() => {
    fetchBirthDetails();
  }, [user]);  

  useEffect(() => {
    const urlTier = (searchParams.get('tier') as 'basic' | 'premium' | 'master' | null) || null;
    const preferredTier = urlTier && hasAccess(urlTier) ? urlTier : getHighestAccessLevel();
    if (preferredTier) setActiveTier(preferredTier);
  }, [getHighestAccessLevel, hasAccess, searchParams]);

  const isPaid = membershipTier !== 'free';

  // Free users always see Classic (cannot switch to AI without upgrading)
  useEffect(() => {
    if (!isPaid && useAIMode) setUseAIMode(false);
  }, [isPaid, useAIMode, setUseAIMode]);

  const handleModeSwitch = (toAi: boolean) => {
    if (toAi && !isPaid) {
      setShowUpgradeDialog(true);
      return;
    }
    setUseAIMode(toAi);
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

  const membershipMap: Record<string, string> = {
    'free': 'Free',
    'premium-monthly': 'Premium Monthly',
    'premium-annual': 'Premium Annual',
    'lifetime': 'Lifetime',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Temple background + incense smoke */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-950/10 blur-[100px]" />
      </div>
      <IncenseSmoke />

      <div className="container max-w-4xl mx-auto py-6 px-4 pb-24">
        {/* Header */}
        <motion.header 
          className="text-center mb-6 pt-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight font-serif">
            Akashic Vedic Guide
          </h1>
        </motion.header>

        {/* Profile Snapshot Card (basic info about me) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          {hasBirthDetails ? (
            <SacredHeader
              name={birthDetails?.birth_name || 'Your Chart'}
              birthData={{
                location: birthDetails?.birth_place || 'Unknown location',
                date: birthDetails?.birth_date || '',
                time: birthDetails?.birth_time || '',
              }}
              syncTime={synced && lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Not synced yet'}
              onAdjustBirthData={() => setBirthDetailsDialogOpen(true)}
            />
          ) : null}
          {hasBirthDetails && (
            <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle>Update Birth Details</DialogTitle>
                </DialogHeader>
                <BirthDetailsForm
                  initialData={birthDetails}
                  onSaved={() => {
                    setBirthDetailsDialogOpen(false);
                    fetchBirthDetails();
                    setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
                    setSyncError(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
          {!hasBirthDetails && (
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
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
                          setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
                          setSyncError(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>


        {/* Mode Toggle — free users see AI button but get upgrade prompt on click */}
        {hasBirthDetails && activeTier && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex bg-amber-950/30 rounded-lg p-1 border border-amber-900/30">
              <button
                onClick={() => handleModeSwitch(true)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  useAIMode
                    ? 'bg-amber-600 text-black shadow-sm'
                    : 'text-amber-200/70 hover:text-amber-100'
                }`}
              >
                <Zap className="w-3 h-3 inline mr-1" />
                AI-Powered
              </button>
              <button
                onClick={() => handleModeSwitch(false)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  !useAIMode
                    ? 'bg-amber-600 text-black shadow-sm'
                    : 'text-amber-200/70 hover:text-amber-100'
                }`}
              >
                <Star className="w-3 h-3 inline mr-1" />
                Classic
              </button>
            </div>
          </div>
        )}

        {/* Upgrade prompt when free user clicks AI-Powered */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="bg-[#0d0d14] border-amber-900/30 text-amber-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-amber-200">
                🔱 Unlock AI-Powered Vedic Guidance
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-amber-100/70 font-serif text-sm leading-relaxed">
                Access the Bhrigu Nadi Oracle, personalized AI readings, Soul Blueprint analysis, Yoga Activator, and more.
              </p>
              <ul className="space-y-2 text-amber-200/60 text-sm font-serif">
                <li>✦ AI Guru Chat with Bhrigu Rishi Oracle</li>
                <li>✦ Personalized Soul Blueprint & Karma Analysis</li>
                <li>✦ Planetary Yoga Activation Protocols</li>
                <li>✦ Real-time Hora Notifications</li>
                <li>✦ Deep Nakshatra & Dasha Insights</li>
              </ul>
              <Button
                onClick={() => {
                  setShowUpgradeDialog(false);
                  navigate('/membership');
                }}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-black font-semibold hover:opacity-90"
              >
                Upgrade to Premium →
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Active Tier Content — collapsible sections only, no tabs */}
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
                userId={user?.id}
                onEditDetails={() => setBirthDetailsDialogOpen(true)} 
                onUpgrade={() => navigate('/membership')}
              />
            ) : (
              <div className="rounded-2xl border border-amber-900/20 bg-[#0d0d14]/80 p-4 sm:p-6">
                <DailyVedicInsight tier={activeTier} />
              </div>
            )}
          </motion.div>
        )}

        {/* Available Tiers - ONLY for free users (hidden for paid) */}
        {!isPaid && (
          <motion.div 
            className="space-y-4 pt-8 border-t border-border/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-heading font-semibold text-foreground">Available Tiers</h2>
            {tiers.map((tier) => {
              const userHasAccess = hasAccess(tier.tier_level);
              const isLocked = !userHasAccess;

              return (
                <Card
                  key={tier.id}
                  className={`border ${isLocked ? 'border-border/50 opacity-60' : 'border-purple-500/30'} bg-card/50 backdrop-blur-sm`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-foreground">{tier.name}</h3>
                          {userHasAccess && (
                            <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                          )}
                          {isLocked && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Required Membership:</p>
                      <div className="flex flex-wrap gap-1">
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

                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-4">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-purple-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {userHasAccess ? (
                      <Button
                        onClick={() => {
                          setActiveTier(tier.tier_level);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90"
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
        )}
      </div>

    </div>
  );
};

export default VedicAstrology;
