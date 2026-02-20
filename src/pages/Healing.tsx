import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star, CreditCard, Wallet, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { HealingProgressCard } from '@/components/healing/HealingProgressCard';
import { useAdminRole } from '@/hooks/useAdminRole';
import { IntentionThreshold, IntentionType } from '@/components/meditation/IntentionThreshold';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { useHealingMeditationLanguage } from '@/hooks/useHealingMeditationLanguage';
import { HealingLanguageToggle } from '@/features/healing/HealingLanguageToggle';
import { getHealingSessions, type HealingSessionItem } from '@/features/healing/getHealingSessions';

interface HealingAudio {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  preview_url: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  price_usd: number;
  price_shc: number;
  category: string;
  language?: string | null;
  tags?: string[] | null;
  play_count?: number;
}

interface HealingPlan {
  id: string;
  name: string;
  price: number;
  days: number;
}

const HEALING_PLANS: HealingPlan[] = [
  { id: '7_day', name: '7 days', price: 97, days: 7 },
  { id: '14_day', name: '14 days', price: 147, days: 14 },
  { id: '30_day', name: '30 days', price: 197, days: 30 },
];

/** Rishi-style energy exchange: "Exchange: $50 / 550kr" (USD → SEK ~11) */
function formatEnergyExchange(priceUsd: number): string {
  const sek = Math.round(priceUsd * 11);
  return `Exchange: $${priceUsd} / ${sek}kr`;
}

const DIRECT_HEALING_HERO_IMAGE = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80';

const faqTranslations: Record<string, { question: string; answer: string }[]> = {
  en: [
    { question: "How do I prepare myself for the session?", answer: "You can receive the energy anytime. Sit or lie down comfortably, invite the energy to flow, and optionally listen to our music on Spotify or YouTube." },
    { question: "When will my session start?", answer: "Sessions begin after registration and booking your preferred date and time. The energy is programmed to flow according to your selected schedule." },
    { question: "How do I receive at a distance?", answer: "Choose a time to receive. Energy flows through the quantum field without restrictions." },
    { question: "Is this the same as Reiki?", answer: "Both draw from the universal source. Sacred Healing Vibration does not follow a learned Reiki method. Frequencies are intuitively scanned and sent to support your unique needs." },
    { question: "Who can receive?", answer: "Anyone or anything: adults, children, animals, those passing away, recently passed, or spaces like homes and vehicles." },
    { question: "Does it cost anything?", answer: "Pricing: 30-Day €197, 14-Day €147, 7-Day €97. Option to subscribe 3 months for €147 per month." },
  ],
  sv: [
    { question: "Hur förbereder jag mig?", answer: "Du kan ta emot energin när som helst. Sitt eller ligg bekvämt, bjud in energin att flöda, och lyssna gärna på vår musik på Spotify eller YouTube." },
    { question: "När börjar min session?", answer: "Sessioner börjar efter registrering och bokning av datum och tid. Energin är programmerad att flöda enligt ditt valda schema." },
    { question: "Hur tar jag emot på distans?", answer: "Välj en tid för att ta emot. Energi flödar genom kvantfältet utan begränsningar." },
    { question: "Är det samma som Reiki?", answer: "Båda hämtar från den universella källan. Sacred Healing Vibration följer inte en inlärd Reiki-metod." },
    { question: "Vem kan ta emot?", answer: "Vem som helst eller vad som helst: vuxna, barn, djur, utrymmen som hem och fordon." },
    { question: "Kostar det något?", answer: "30-dagar €197, 14-dagar €147, 7-dagar €97. Möjlighet att prenumerera 3 månader för €147 per månad." },
  ],
};

const testimonials = [
  { name: "Michelle Folhmann", text: "I 'randomly' came into contact with Adam & Laila, and from that day on my life has gone through positive transformations on every level." },
  { name: "Cathrine Nummiranta", text: "Everything changed at Adam's workshop. I am free from old stress and totally cured from the panic attacks I had since I was 14 years old." },
  { name: "Michelle Folhmann", videos: ["https://www.youtube.com/embed/xOHaZqrykjg?start=1", "https://www.youtube.com/embed/NX-aI9_PTR4", "https://www.youtube.com/embed/rk1MdyH3BV0"] },
];

const Healing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { walletAddress, isPhantomInstalled, connectWallet } = usePhantomWallet();
  const { isAdmin } = useAdminRole();
  const { language, setLanguage } = useHealingMeditationLanguage();

  const tSafe = useMemo(() => (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  }, [t]);

  const [audioTracks, setAudioTracks] = useState<HealingAudio[]>([]);
  const [ownedAudioIds, setOwnedAudioIds] = useState<Set<string>>(new Set());
  const [hasHealingAccess, setHasHealingAccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<HealingPlan | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<HealingAudio | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [shortExpanded, setShortExpanded] = useState(false);
  const [deepExpanded, setDeepExpanded] = useState(false);
  const [testimonialsExpanded, setTestimonialsExpanded] = useState(false);
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false);
  const [resonatingTicker, setResonatingTicker] = useState({ count: 32, title: 'Abundance Activation', isPremium: true });

  const { playUniversalAudio, currentAudio, isPlaying: playerIsPlaying } = useMusicPlayer();

  const currentLang = (i18n.language?.split('-')[0] || 'en') as keyof typeof faqTranslations;
  const faqItems = faqTranslations[currentLang] ?? faqTranslations.en;

  const testimonialVideos = useMemo(() => {
    const entry = testimonials.find((x): x is typeof x & { videos: string[] } => 'videos' in x && Array.isArray((x as { videos?: string[] }).videos));
    return entry?.videos ?? [];
  }, []);

  const sessions = useMemo(
    () => getHealingSessions(audioTracks as HealingSessionItem[], language),
    [audioTracks, language]
  );
  const recommendedSession = sessions.recommended[0];
  const recommendedIds = new Set(sessions.recommended.map((a) => a.id));
  const shortOnly = sessions.shortSessions.filter((a) => !recommendedIds.has(a.id));
  const deepOnly = sessions.deepSessions.filter((a) => !recommendedIds.has(a.id));
  const freeSessions = useMemo(() => sessions.allInLanguage.filter((a) => a.is_free), [sessions.allInLanguage]);
  const premiumSessions = useMemo(() => sessions.allInLanguage.filter((a) => !a.is_free), [sessions.allInLanguage]);

  const isHealingPlaying = (audioId: string) =>
    currentAudio?.id === audioId && currentAudio?.contentType === 'healing' && playerIsPlaying;

  useEffect(() => {
    fetchAudioTracks();
    checkHealingAccess();
    checkOwnedAudio();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: t('healing.paymentSuccess'),
        description: t('healing.welcomeJourney'),
      });
      window.history.replaceState({}, '', '/healing');
      checkHealingAccess();
    }
  }, [t, toast]);

  const fetchAudioTracks = async () => {
    const { data } = await supabase
      .from('healing_audio')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAudioTracks(data);
  };

  const checkHealingAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('healing_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .limit(1);
    setHasHealingAccess(!!(data && data.length > 0));
  };

  const checkOwnedAudio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('healing_audio_purchases')
      .select('audio_id')
      .eq('user_id', user.id);
    if (data) setOwnedAudioIds(new Set(data.map((p) => p.audio_id)));
  };

  const openPaymentModal = (plan: HealingPlan) => {
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handleStripePayment = async (planType: string) => {
    setIsProcessing(true);
    setPaymentModalOpen(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('common.signIn'), variant: 'destructive' });
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-healing-checkout', { body: { planType } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: t('common.error'), description: message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = async (plan: HealingPlan) => {
    setPaymentModalOpen(false);
    if (!isPhantomInstalled) {
      toast({ title: 'Phantom Not Installed', description: 'Please install Phantom wallet to pay with crypto', variant: 'destructive' });
      window.open('https://phantom.app/', '_blank');
      return;
    }
    if (!walletAddress) {
      try {
        await connectWallet();
      } catch {
        toast({ title: 'Connection Failed', description: 'Please connect your Phantom wallet', variant: 'destructive' });
      }
      return;
    }
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: t('common.signIn'), variant: 'destructive' });
        return;
      }
      const treasuryWallet = 'BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j';
      const solAmount = (plan.price * 0.005).toFixed(4);
      toast({
        title: 'Send SOL to Complete Purchase',
        description: `Please send ${solAmount} SOL. Contact support after sending to activate your access.`,
      });
      window.open(`https://phantom.app/ul/v1/browse/https://solscan.io/account/${treasuryWallet}`, '_blank');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      toast({ title: 'Payment Failed', description: message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscriptionStripe = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('common.signIn'), variant: 'destructive' });
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-healing-checkout', { body: { planType: 'subscription' } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: t('common.error'), description: message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseAudio = async (audio: HealingAudio, method: 'shc' | 'stripe') => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('common.signIn'), variant: 'destructive' });
        return;
      }
      const { data, error } = await supabase.functions.invoke('purchase-healing-audio', {
        body: { audioId: audio.id, paymentMethod: method },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
      else if (data?.success) {
        toast({ title: t('healing.purchaseComplete'), description: `${t('healing.youNowOwn')} ${audio.title}` });
        setOwnedAudioIds((prev) => new Set([...prev, audio.id]));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: t('common.error'), description: message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const initiatePlay = (audio: HealingAudio) => {
    const canPlay = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;
    if (!audioUrl) {
      if (canPlay && !audio.audio_url) {
        sonnerToast.error('Audio not yet uploaded', { description: 'This session is coming soon.' });
      }
      return;
    }
    if (currentAudio?.id === audio.id && currentAudio?.contentType === 'healing') {
      playUniversalAudio({
        id: audio.id,
        title: audio.title,
        artist: 'Sacred Soul',
        audio_url: audioUrl,
        cover_image_url: audio.cover_image_url,
        duration_seconds: audio.duration_seconds,
        shc_reward: audio.is_free ? 0 : audio.price_shc,
        contentType: 'healing',
        originalData: audio,
      });
      return;
    }
    setPendingAudio(audio);
    setShowThreshold(true);
  };

  const handleIntentionSelected = (intention: IntentionType) => {
    setShowThreshold(false);
    if (pendingAudio) {
      startPlayback(pendingAudio);
      setPendingAudio(null);
    }
  };

  const handleThresholdClose = () => {
    setShowThreshold(false);
    if (pendingAudio) {
      startPlayback(pendingAudio);
      setPendingAudio(null);
    }
  };

  const startPlayback = (audio: HealingAudio) => {
    const canPlay = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;
    if (!audioUrl) return;
    playUniversalAudio({
      id: audio.id,
      title: audio.title,
      artist: 'Sacred Soul',
      audio_url: audioUrl,
      cover_image_url: audio.cover_image_url,
      duration_seconds: audio.duration_seconds,
      shc_reward: audio.is_free ? 0 : audio.price_shc,
      contentType: 'healing',
      originalData: audio,
    });
  };

  const togglePlay = (audio: HealingAudio) => {
    initiatePlay(audio);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecommendedSession = () => {
    if (recommendedSession) {
      startPlayback(recommendedSession as HealingAudio);
    } else {
      navigate('/meditations');
    }
  };

  const hasAnyFilteredAudio = sessions.allInLanguage.length > 0;

  return (
    <>
      <IntentionThreshold
        isOpen={showThreshold}
        onSelectIntention={handleIntentionSelected}
        onClose={handleThresholdClose}
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          <MeditationMembershipBanner />

          <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <HealingLanguageToggle language={language} setLanguage={setLanguage} />
          </section>

          {/* Direct Healing Transmission — Session booking hero */}
          <section className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 0 10px rgba(212, 175, 55, 0.35), 0 0 40px rgba(212, 175, 55, 0.2)' }}>
            <div className="relative aspect-[21/9] min-h-[180px] bg-muted">
              <img
                src={DIRECT_HEALING_HERO_IMAGE}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Direct Healing Transmission</h2>
                <p className="text-white/90 text-sm md:text-base max-w-xl mb-4">
                  Personalized Alchemical Sound Healing with Adam. Limited Sacred Windows available.
                </p>
                <Link to="/private-sessions">
                  <Button size="lg" className="bg-[#D4AF37] text-black font-semibold hover:bg-[#c4a030] animate-sovereign-white-pulse">
                    Book Your Session
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Sacred Portal Hero — Kriya Purple, Flower of Life, Sovereign Gold CTA */}
          <Card className="relative border-none text-center overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
            <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
              <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="flower-of-life" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="0.5" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="20" cy="4" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="34" cy="20" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="20" cy="36" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="6" cy="20" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="27" cy="10" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="13" cy="10" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="27" cy="30" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                    <circle cx="13" cy="30" r="8" fill="none" stroke="white" strokeWidth="0.35" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#flower-of-life)" />
              </svg>
            </div>
            <CardContent className="relative py-10 px-6">
              <Sparkles className="w-12 h-12 text-amber-200/90 mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {tSafe('healing.pageTitle', '30 Days of Sacred Support')}
              </h1>
              <p className="text-white/80 max-w-2xl mx-auto">
                {tSafe('healing.pageSubtitle', 'Calm, guided sessions and transmissions. Just listen and rest.')}
              </p>
              <Button
                size="lg"
                className="mt-6 bg-[#D4AF37] text-black font-semibold hover:bg-[#c4a030] animate-sovereign-white-pulse"
                onClick={startRecommendedSession}
              >
                <Play className="w-5 h-5 mr-2" />
                {tSafe('healing.ctaStartSession', 'Start a session')}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>{tSafe('healing.reassurance1', "You don't have to believe anything.")}</p>
            <p>{tSafe('healing.reassurance2', 'Just try one session and notice how you feel afterward.')}</p>
          </div>

          <HealingProgressCard variant="full" />

          <Card className="border-border">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                {tSafe('healing.whatHappensTitle', 'What happens in a session')}
              </h2>
              <ul className="mt-1 text-sm text-muted-foreground space-y-1">
                <li>• {tSafe('healing.whatHappensBullet1', 'You sit or lie down')}</li>
                <li>• {tSafe('healing.whatHappensBullet2', 'You listen')}</li>
                <li>• {tSafe('healing.whatHappensBullet3', 'The body settles naturally')}</li>
                <li>• {tSafe('healing.whatHappensBullet4', 'No effort needed')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Now Resonating — live feed ticker */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
            <p className="text-sm text-foreground/90 text-center">
              <span className="font-medium text-amber-200">{resonatingTicker.count} Souls</span>
              {' are currently listening to '}
              <span className="font-medium text-foreground">&quot;{resonatingTicker.title}&quot;</span>
              {resonatingTicker.isPremium && <span className="text-amber-400/90"> (Premium)</span>}
            </p>
          </div>

          {/* Tiered Audio Engine: Sacred Frequencies (Free) | Temple Transmissions (Premium) */}
          <Tabs defaultValue="free" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50">
              <TabsTrigger value="free" className="data-[state=active]:bg-background">
                Sacred Frequencies
              </TabsTrigger>
              <TabsTrigger value="premium" className="data-[state=active]:bg-background">
                Temple Transmissions
              </TabsTrigger>
            </TabsList>
            <TabsContent value="free" className="space-y-3 mt-4">
              {freeSessions.length > 0 ? (
                freeSessions.map((audio) => (
                  <SessionRow
                    key={audio.id}
                    audio={audio as HealingAudio}
                    isPlaying={isHealingPlaying(audio.id)}
                    onTogglePlay={togglePlay}
                    formatDuration={formatDuration}
                    isAdmin={isAdmin}
                    ownedAudioIds={ownedAudioIds}
                    hasHealingAccess={hasHealingAccess}
                    onPurchase={handlePurchaseAudio}
                    isProcessing={isProcessing}
                    tSafe={tSafe}
                    formatEnergyExchange={formatEnergyExchange}
                    isPremiumTier={false}
                    onRequestUpgrade={() => {}}
                  />
                ))
              ) : (
                <Card className="border-border">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {tSafe('healing.noFreeSessions', 'No free sessions in this language yet.')}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="premium" className="space-y-3 mt-4">
              {premiumSessions.length > 0 ? (
                premiumSessions.map((audio) => (
                  <SessionRow
                    key={audio.id}
                    audio={audio as HealingAudio}
                    isPlaying={isHealingPlaying(audio.id)}
                    onTogglePlay={togglePlay}
                    formatDuration={formatDuration}
                    isAdmin={isAdmin}
                    ownedAudioIds={ownedAudioIds}
                    hasHealingAccess={hasHealingAccess}
                    onPurchase={handlePurchaseAudio}
                    isProcessing={isProcessing}
                    tSafe={tSafe}
                    formatEnergyExchange={formatEnergyExchange}
                    isPremiumTier
                    onRequestUpgrade={() => setUpgradeSheetOpen(true)}
                  />
                ))
              ) : (
                <Card className="border-border">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {tSafe('healing.noPremiumSessions', 'No premium transmissions in this language yet.')}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <Button variant="outline" className="w-full" onClick={() => navigate('/meditations')}>
            {tSafe('healing.viewAllSessions', 'View all sessions')}
          </Button>

          {!hasAnyFilteredAudio && (
            <Card className="border-border bg-muted/30">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? tSafe('healing.noSessionsInEnglish', 'No sessions in English yet. More will be added soon.') : tSafe('healing.noSessionsInSwedish', 'No sessions in Swedish yet. More will be added soon.')}
                </p>
              </CardContent>
            </Card>
          )}

          <section className="space-y-4" aria-labelledby="what-people-noticed">
            <h2 id="what-people-noticed" className="text-lg font-bold text-center text-foreground">
              {tSafe('healing.testimonialsTitle', 'What people noticed')}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {tSafe('healing.testimonialsSubtitle', 'Everyone experiences it differently.')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonialVideos.map((url, j) => (
                <div key={j} className="aspect-video rounded-lg overflow-hidden border border-border">
                  <iframe
                    className="w-full h-full"
                    src={url}
                    title={tSafe('healing.testimonialVideo', 'Testimonial') + ` ${j + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {testimonials.filter((x): x is typeof x & { text: string } => 'text' in x && !!x.text).slice(0, 2).map((testimonial, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-foreground text-lg">{testimonial.name}</h3>
                    <p className="text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>
                  </CardContent>
                </Card>
              ))}
              <Button variant="ghost" className="w-full" onClick={() => setTestimonialsExpanded(!testimonialsExpanded)}>
                {testimonialsExpanded ? tSafe('healing.seeLess', 'See less') : tSafe('healing.seeMore', 'See more')}
              </Button>
              {testimonialsExpanded && testimonials.filter((x): x is typeof x & { text: string } => 'text' in x && !!x.text).slice(2).map((testimonial, i) => (
                <Card key={`more-${i}`} className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-foreground text-lg">{testimonial.name}</h3>
                    <p className="text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="space-y-4">
            <Button variant="outline" className="w-full flex items-center justify-between py-6" onClick={() => setFaqOpen(!faqOpen)}>
              <span className="text-lg font-semibold">{tSafe('healing.faqTitle', 'Frequently Asked Questions')}</span>
              {faqOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
            {faqOpen && (
              <Accordion type="multiple" className="space-y-2">
                {faqItems.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                    <AccordionTrigger className="text-left text-foreground hover:no-underline">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {!hasHealingAccess && (
            <Card className="border-border">
              <CardContent className="pt-6 pb-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{tSafe('healing.chooseDurationTitle', 'Choose how long you want to practice')}</h2>
                  <p className="text-sm text-muted-foreground">{tSafe('healing.choosePlanSubtitle', 'Unlock all sessions for your chosen period.')}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {HEALING_PLANS.map((plan) => (
                    <Button
                      key={plan.id}
                      size="lg"
                      className={`bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] border-0 transition-shadow ${selectedPlan?.id === plan.id ? 'violet-aura ring-2 ring-violet-400 ring-offset-2 ring-offset-background' : ''}`}
                      onClick={() => openPaymentModal(plan)}
                      disabled={isProcessing}
                    >
                      {plan.days} {tSafe('common.days', 'days')}
                    </Button>
                  ))}
                  <Button
                    size="lg"
                    className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] border-0"
                    onClick={handleSubscriptionStripe}
                    disabled={isProcessing}
                  >
                    {tSafe('healing.ongoing', 'Ongoing')}
                  </Button>
                </div>
                <Card className="mt-4 border-border/60 bg-muted/40">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-muted-foreground">{tSafe('healing.distanceDisclosure', 'Remote support sessions. This app is for spiritual and entertainment purposes only. It is not intended to provide medical advice, diagnosis, or treatment.')}</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {hasHealingAccess && (
            <Card className="p-4 bg-green-500/10 border-green-500/30">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{tSafe('healing.activeAccess', 'You have active access')}</span>
              </div>
            </Card>
          )}

          <ReviewSection contentType="healing" contentId="general" />
        </div>
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tSafe('healing.choosePaymentMethod', 'Choose payment method')}</DialogTitle>
            <DialogDescription>
              {selectedPlan && `${selectedPlan.name} - €${selectedPlan.price}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              size="lg"
              className="w-full flex items-center justify-center gap-3 bg-[#00F2FE] text-black font-extrabold border-0"
              onClick={() => selectedPlan && handleStripePayment(selectedPlan.id)}
              disabled={isProcessing}
            >
              <CreditCard className="w-5 h-5" />
              {tSafe('healing.payWithCard', 'Pay with card')}
            </Button>
            <Button
              size="lg"
              className="w-full flex items-center justify-center gap-3 bg-white/10 text-white border border-white/20 hover:bg-white/20"
              onClick={() => selectedPlan && handleCryptoPayment(selectedPlan)}
              disabled={isProcessing}
            >
              <Wallet className="w-5 h-5" />
              {tSafe('healing.payWithCrypto', 'Pay with crypto')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade to Sovereign — slide-up modal for premium */}
      <Sheet open={upgradeSheetOpen} onOpenChange={setUpgradeSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-t border-amber-500/30 bg-gradient-to-b from-background to-amber-950/20">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              Upgrade to Sovereign
            </SheetTitle>
            <SheetDescription>
              Unlock Temple Transmissions and all premium sound healing sessions. Choose your sacred window below.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-6">
            {HEALING_PLANS.map((plan) => (
              <Button
                key={plan.id}
                size="lg"
                className="w-full bg-[#D4AF37] text-black font-semibold hover:bg-[#c4a030]"
                onClick={() => {
                  setUpgradeSheetOpen(false);
                  openPaymentModal(plan);
                }}
                disabled={isProcessing}
              >
                {plan.days} {tSafe('common.days', 'days')} — {formatEnergyExchange(plan.price)}
              </Button>
            ))}
            <Button
              size="lg"
              variant="outline"
              className="w-full border-amber-500/50 text-foreground"
              onClick={() => {
                setUpgradeSheetOpen(false);
                handleSubscriptionStripe();
              }}
              disabled={isProcessing}
            >
              {tSafe('healing.ongoing', 'Ongoing')}
            </Button>
          </div>
          <SheetFooter className="flex-row justify-center sm:justify-center">
            <p className="text-xs text-muted-foreground">Energy exchanges support the lineage and future transmissions.</p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

function SessionRow({
  audio,
  isPlaying,
  onTogglePlay,
  formatDuration,
  isAdmin,
  ownedAudioIds,
  hasHealingAccess,
  onPurchase,
  isProcessing,
  tSafe,
  showResonanceIcon = false,
  isSoulBlueprintMatch = false,
  formatEnergyExchange,
  isPremiumTier = false,
  onRequestUpgrade,
}: {
  audio: HealingAudio;
  isPlaying: boolean;
  onTogglePlay: (a: HealingAudio) => void;
  formatDuration: (s: number) => string;
  isAdmin: boolean;
  ownedAudioIds: Set<string>;
  hasHealingAccess: boolean;
  onPurchase: (a: HealingAudio, m: 'shc' | 'stripe') => void;
  isProcessing: boolean;
  tSafe: (key: string, fallback: string) => string;
  showResonanceIcon?: boolean;
  isSoulBlueprintMatch?: boolean;
  formatEnergyExchange?: (priceUsd: number) => string;
  isPremiumTier?: boolean;
  onRequestUpgrade?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const owned = isAdmin || ownedAudioIds.has(audio.id);
  const hasAccess = isAdmin || owned || hasHealingAccess;
  const isLockedPremium = isPremiumTier && !hasAccess;
  const priceLabel = formatEnergyExchange ? formatEnergyExchange(audio.price_usd) : `$${audio.price_usd}`;

  const handlePlayClick = () => {
    if (isLockedPremium && onRequestUpgrade) {
      onRequestUpgrade();
      return;
    }
    onTogglePlay(audio);
  };

  return (
    <Card
      className="p-4 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlayClick}
          className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors relative"
        >
          {isLockedPremium && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/90 text-black" title="Stargate — Premium">
              <Lock className="w-3 h-3" />
            </span>
          )}
          {!hasAccess && !isLockedPremium && <Lock className="w-4 h-4 text-muted-foreground absolute -top-1 -right-1" />}
          {hasAccess && isPlaying ? <Pause className="w-5 h-5 text-primary" /> : <Play className="w-5 h-5 text-primary ml-1" />}
          {isLockedPremium && <Play className="w-5 h-5 text-primary/70 ml-1" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground">{audio.title}</h3>
            {showResonanceIcon && (
              <span
                className={`inline-flex items-center text-amber-400/90 transition-transform duration-300 ${hovered ? 'scale-110 animate-pulse' : ''}`}
                title="Resonance"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M9 18V5l12-2v13" />
                  <path d="m9 9 12-2" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </span>
            )}
            {isSoulBlueprintMatch && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40">
                Soul Blueprint
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(audio.duration_seconds)}</span>
            {hasAccess ? (
              <span className="text-green-500 font-medium">• {tSafe('healing.owned', 'Owned')}</span>
            ) : (
              <span className="text-primary font-medium">• {priceLabel}</span>
            )}
          </div>
        </div>
        {hasAccess ? (
          <Button variant="ghost" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        ) : isLockedPremium ? (
          <Button
            size="sm"
            className="bg-[#D4AF37] text-black font-semibold border-0"
            onClick={onRequestUpgrade}
          >
            Unlock
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-[#00F2FE] text-black font-extrabold border-0 text-xs whitespace-nowrap max-w-[140px]"
            onClick={() => onPurchase(audio, 'stripe')}
            disabled={isProcessing}
          >
            {priceLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default Healing;
