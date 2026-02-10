import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star, CreditCard, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSHCBalance } from '@/hooks/useSHCBalance';
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
  const { balance } = useSHCBalance();
  const { walletAddress, isPhantomInstalled, connectWallet, isConnecting } = usePhantomWallet();
  const { isAdmin } = useAdminRole();
  const { language, setLanguage } = useHealingMeditationLanguage();

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

  const { playUniversalAudio, currentAudio, isPlaying: playerIsPlaying } = useMusicPlayer();

  const currentLang = (i18n.language?.split('-')[0] || 'en') as keyof typeof faqTranslations;
  const faqItems = faqTranslations[currentLang] ?? faqTranslations.en;

  const sessions = useMemo(
    () => getHealingSessions(audioTracks as HealingSessionItem[], language),
    [audioTracks, language]
  );
  const recommendedSession = sessions.recommended[0];
  const recommendedIds = new Set(sessions.recommended.map((a) => a.id));
  const shortOnly = sessions.shortSessions.filter((a) => !recommendedIds.has(a.id));
  const deepOnly = sessions.deepSessions.filter((a) => !recommendedIds.has(a.id));

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

          <Card className="bg-gradient-to-r from-primary/30 to-pink-500/30 border-none text-center overflow-hidden">
          <CardContent className="py-10 px-6">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t('healing.pageTitle')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('healing.pageSubtitle')}
            </p>
            <Button
              size="lg"
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={startRecommendedSession}
            >
              <Play className="w-5 h-5 mr-2" />
              {t('healing.ctaStartSession')}
            </Button>
          </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>{t('healing.reassurance1')}</p>
            <p>{t('healing.reassurance2')}</p>
          </div>

          <HealingProgressCard variant="full" />

          <Card className="border-border">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                {t('healing.whatHappensTitle')}
              </h2>
              <ul className="mt-1 text-sm text-muted-foreground space-y-1">
                <li>• {t('healing.whatHappensBullet1')}</li>
                <li>• {t('healing.whatHappensBullet2')}</li>
                <li>• {t('healing.whatHappensBullet3')}</li>
                <li>• {t('healing.whatHappensBullet4')}</li>
              </ul>
            </CardContent>
          </Card>

            {sessions.recommended.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                {t('healing.recommendedForYou')}
              </h2>
              <div className="grid gap-3">
                {sessions.recommended.map((audio) => (
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
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

            {shortOnly.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left"
                onClick={() => setShortExpanded(!shortExpanded)}
              >
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  {t('healing.shortSessions')}
                </h2>
                {shortExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {shortExpanded && (
                <div className="grid gap-3">
                  {shortOnly.map((audio) => (
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
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {deepOnly.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left"
                onClick={() => setDeepExpanded(!deepExpanded)}
              >
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {t('healing.deepSessions')}
                </h2>
                {deepExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {deepExpanded && (
                <div className="grid gap-3">
                  {deepOnly.map((audio) => (
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
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate('/meditations')}>
            {t('healing.viewAllSessions')}
          </Button>

          {!hasAnyFilteredAudio && (
            <Card className="border-border bg-muted/30">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? t('healing.noSessionsInEnglish') : t('healing.noSessionsInSwedish')}
                </p>
              </CardContent>
            </Card>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-center text-foreground">{t('healing.testimonialsTitle')}</h2>
            <p className="text-sm text-muted-foreground text-center">{t('healing.testimonialsSubtitle')}</p>
            <div className="space-y-4">
              {testimonials.slice(0, 2).map((testimonial, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-foreground text-lg">{testimonial.name}</h3>
                    {testimonial.text && <p className="text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>}
                  </CardContent>
                </Card>
              ))}
              <Button variant="ghost" className="w-full" onClick={() => setTestimonialsExpanded(!testimonialsExpanded)}>
                {testimonialsExpanded ? t('healing.seeLess') : t('healing.seeMore')}
              </Button>
              {testimonialsExpanded &&
                testimonials.slice(2).map((testimonial, i) => (
                  <Card key={`more-${i}`} className="border-border">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-foreground text-lg">{testimonial.name}</h3>
                      {testimonial.text && <p className="text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>}
                      {'videos' in testimonial && testimonial.videos && (
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                          {testimonial.videos.map((url, j) => (
                            <div key={j} className="aspect-video">
                              <iframe
                                className="w-full h-full rounded-lg"
                                src={url}
                                title={`Video ${j + 1}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>

          <div className="space-y-4">
            <Button variant="outline" className="w-full flex items-center justify-between py-6" onClick={() => setFaqOpen(!faqOpen)}>
              <span className="text-lg font-semibold">{t('soul.faqTitle')}</span>
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
                  <h2 className="text-xl font-bold text-foreground mb-2">{t('healing.choosePlanTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('healing.choosePlanSubtitle')}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {HEALING_PLANS.map((plan) => (
                    <Button
                      key={plan.id}
                      size="lg"
                      className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] border-0"
                      onClick={() => openPaymentModal(plan)}
                      disabled={isProcessing}
                    >
                      {plan.days} {t('common.days')}
                    </Button>
                  ))}
                  <Button
                    size="lg"
                    className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] border-0"
                    onClick={handleSubscriptionStripe}
                    disabled={isProcessing}
                  >
                    {t('healing.ongoing')}
                  </Button>
                </div>
                <Card className="mt-4 border-border/60 bg-muted/40">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-muted-foreground">{t('healing.distanceDisclosure')}</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {hasHealingAccess && (
            <Card className="p-4 bg-green-500/10 border-green-500/30">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{t('healing.activeAccess')}</span>
              </div>
            </Card>
          )}

          <ReviewSection contentType="healing" contentId="general" />
        </div>
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('healing.choosePaymentMethod')}</DialogTitle>
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
              {t('healing.payWithCard')}
            </Button>
            <Button
              size="lg"
              className="w-full flex items-center justify-center gap-3 bg-white/10 text-white border border-white/20 hover:bg-white/20"
              onClick={() => selectedPlan && handleCryptoPayment(selectedPlan)}
              disabled={isProcessing}
            >
              <Wallet className="w-5 h-5" />
              {t('healing.payWithCrypto')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
  t,
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
  t: (key: string, fallback?: string) => string;
}) {
  const owned = isAdmin || ownedAudioIds.has(audio.id);
  const hasAccess = isAdmin || owned || hasHealingAccess;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onTogglePlay(audio)}
          className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors relative"
        >
          {!hasAccess && <Lock className="w-4 h-4 text-muted-foreground absolute -top-1 -right-1" />}
          {isPlaying ? <Pause className="w-5 h-5 text-primary" /> : <Play className="w-5 h-5 text-primary ml-1" />}
        </button>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{audio.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(audio.duration_seconds)}</span>
            {hasAccess ? (
              <span className="text-green-500 font-medium">• {t('healing.owned')}</span>
            ) : (
              <span className="text-primary font-medium">• ${audio.price_usd}</span>
            )}
          </div>
        </div>
        {hasAccess ? (
          <Button variant="ghost" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-[#00F2FE] text-black font-extrabold border-0"
            onClick={() => onPurchase(audio, 'stripe')}
            disabled={isProcessing}
          >
            ${audio.price_usd}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default Healing;
