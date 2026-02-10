import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Star, Crown, Lock, CheckCircle, User, Calendar, Compass, Zap, MessageCircle, Clock, Eye, Timer, BookOpen } from 'lucide-react';
import { useVedicAstrology } from '@/hooks/useVedicAstrology';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BirthDetailsForm } from '@/components/vedic/BirthDetailsForm';
import { AIVedicDashboard } from '@/components/vedic/AIVedicDashboard';
import { DailyVedicInsight } from '@/components/vedic/DailyVedicInsight';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePersistedState } from '@/features/vedic/usePersistedState';
import type { MembershipTier, UserProfile } from '@/lib/vedicTypes';

// Map existing DB tiers to new AI tier system
const mapToAITier = (dbTier: 'basic' | 'premium' | 'master'): MembershipTier => {
  switch (dbTier) {
    case 'basic': return 'free';
    case 'premium': return 'compass';
    case 'master': return 'premium';
    default: return 'free';
  }
};

const SECTION_NAV = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'consult-guru', label: 'Guru', icon: MessageCircle },
  { id: 'hora', label: 'Hora', icon: Timer },
  { id: 'nakshatra', label: 'Nakshatra', icon: Star },
  { id: 'blueprint', label: 'Blueprint', icon: BookOpen },
] as const;

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const VedicAstrology: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tiers, isLoading, hasAccess, getHighestAccessLevel } = useVedicAstrology();
  const { tier: membershipTier } = useMembership();
  const [birthDetailsDialogOpen, setBirthDetailsDialogOpen] = useState(false);

  const userKey = user?.id ?? 'anon';
  const lsKey = (k: string) => `sh:vedic:${userKey}:${k}`;

  // Persisted state (survives unmount / navigation)
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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      {/* Midnight Temple Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[100px]" />
      </div>

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
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg font-light tracking-wide">
            Merging the geometric precision of the stars with{' '}
            <span className="text-blue-400 font-medium">AI-Powered Efficiency</span>.
          </p>
        </motion.header>

        {/* Profile Snapshot Card (basic info about me) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          {hasBirthDetails ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
              <div className="flex items-center gap-3 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-foreground text-sm">
                  {birthDetails?.birth_name || 'Your Chart'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                {(birthDetails?.birth_place || 'Unknown location')} • {birthDetails?.birth_date} {birthDetails?.birth_time}
              </p>
              <div className="mt-3 flex items-center justify-between ml-7">
                <span className="text-[10px] text-muted-foreground/60">
                  {synced && lastSyncedAt
                    ? `Synced • ${new Date(lastSyncedAt).toLocaleString()}`
                    : 'Not synced yet'}
                </span>
                <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      Edit details
                    </button>
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
                        setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
                        setSyncError(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              {syncError ? (
                <div className="mt-3 text-[10px] text-red-400 ml-7">
                  {syncError}
                </div>
              ) : null}
            </div>
          ) : (
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

        {/* Primary Consult Guru CTA near top */}
        <button
          onClick={() => {
            if (!hasBirthDetails) {
              setBirthDetailsDialogOpen(true);
              return;
            }
            scrollTo('consult-guru');
          }}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition"
        >
          <div className="text-white font-semibold">Consult the Guru</div>
          <div className="mt-1 text-sm text-white/60">
            Ask a question and receive guidance based on your chart.
          </div>
          <div className="mt-4">
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
              Ask now
            </span>
          </div>
        </button>

        {/* Mode Toggle */}
        {hasBirthDetails && activeTier && (
          <div className="flex justify-center mb-4">
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

        {/* Sticky Section Nav (jump between major sections) */}
        {hasBirthDetails && activeTier && useAIMode && (
          <motion.div
            className="sticky top-0 z-50 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="flex bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-1.5 rounded-2xl gap-1 shadow-2xl overflow-x-auto">
              {SECTION_NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="flex-1 flex items-center justify-center py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all duration-200 whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Tier Content */}
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

      {/* Sticky "Consult Guru" CTA for synced users */}
      {synced && hasBirthDetails && useAIMode && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => scrollTo('consult-guru')}
            className="bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 rounded-full px-5 py-3 text-xs font-bold uppercase tracking-wider"
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Consult Guru
          </Button>
        </div>
      )}
    </div>
  );
};

export default VedicAstrology;
