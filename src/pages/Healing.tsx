import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { useAllSiteContent } from '@/hooks/useSiteContent';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { TranslatedContent } from '@/components/TranslatedContent';

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
}

const faqs = [
  { question: "How do I prepare myself for the healing?", answer: "You can receive the healing energy anytime, but choosing a specific time allows deeper connection. Sit or lie down comfortably, invite the energy to flow, and optionally listen to our healing music on Spotify or YouTube." },
  { question: "When will my healing start?", answer: "Healing begins after registration and booking your preferred date and time. The energy is programmed to flow according to your selected schedule." },
  { question: "How do I receive the healing at a distance?", answer: "Choose a time to receive the healing. Energy flows through the quantum field without restrictions. This encourages surrender and trust." },
  { question: "Do I have to do anything to make the healing work?", answer: "No special action is required, but meditation or being open enhances receptivity. Visualize receiving the energy and optionally pray for all beings. You can also send healing to someone else." },
  { question: "Is The Sacred Healing Vibration the same as Reiki?", answer: "Both draw from the universal source, but Sacred Healing Vibration does not follow a learned Reiki method. Frequencies are intuitively scanned and sent to support your unique needs." },
  { question: "Who can receive the healing?", answer: "Anyone or anything: adults, children, animals, those passing away, recently passed, or spaces like homes and vehicles. Healing works anywhere in the quantum universe." },
  { question: "How long is the healing sent for, and how often?", answer: "Each session is sent for approximately 30 minutes on the date and time booked." },
  { question: "How does the healing transform?", answer: "The Sacred Healing Vibration transmits divine love and light to the physical, emotional, mental, and spiritual levels. It works face-to-face or remotely. Being open enhances the experience." },
  { question: "What exactly will the energy heal?", answer: "Supports organ health, immune system, circulation, vitality, spiritual growth, focus, motivation, calmness, sleep, emotional balance, recovery, pain relief, and any other frequencies needed for your healing journey." },
  { question: "Does the healing cure physical symptoms or diseases?", answer: "Healing works on spiritual, mental, emotional, and physical levels. Spiritual and mental effects are noticed first, while emotional and physical improvements may take longer. Detox-like effects may occur. Not a substitute for medical care." },
  { question: "Can I sign someone else up for the healing?", answer: "Yes, you can register family, friends, or pets. Provide a photograph of the recipient after payment." },
  { question: "If I give the healing to someone else, do they have to know?", answer: "No. Healing works subtly on their body, mind, emotions, and spirit. Out of respect, ask first if possible." },
  { question: "Does the healing negatively affect other medical treatments?", answer: "No, the energy works on a subtle level and does not interfere with mainstream or alternative treatments. Temporary detox symptoms may occur." },
  { question: "Does it cost anything to receive the healing?", answer: "Pricing: 30-Day Healing €197, 14-Day Healing €147, 7-Day Healing €97. Option to subscribe 3 months for €147 per month." }
];

const testimonials = [
  { 
    name: "Michelle Folhmann", 
    videos: [
      "https://www.youtube.com/embed/xOHaZqrykjg?start=1", 
      "https://www.youtube.com/embed/NX-aI9_PTR4", 
      "https://www.youtube.com/embed/rk1MdyH3BV0"
    ] 
  },
  { 
    name: "Cathrine Nummiranta", 
    text: "I 'randomly' came into contact with Adam & Laila, and from that day on my life has gone through positive transformations on every level. My life has taken turns I never thought were possible, and for that I am forever grateful." 
  },
  { 
    name: "Anonymous", 
    text: "Everything changed at Adam's workshop. I am free from old stress and totally cured from the panic attacks I had since I was 14 years old. I listen daily to Adam & Laila's meditations. There are no words for how much it means to me." 
  }
];

const Healing: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { balance } = useSHCBalance();
  const { content, isLoading: contentLoading } = useAllSiteContent();
  const [audioTracks, setAudioTracks] = useState<HealingAudio[]>([]);
  const [ownedAudioIds, setOwnedAudioIds] = useState<Set<string>>(new Set());
  const [hasHealingAccess, setHasHealingAccess] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getContent = (key: string, fallback: string) => content[key] || fallback;

  useEffect(() => {
    fetchAudioTracks();
    checkHealingAccess();
    checkOwnedAudio();

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: t('healing.paymentSuccess', 'Payment Successful!'),
        description: t('healing.welcomeJourney', 'Welcome to your Sacred Healing Journey'),
      });
      window.history.replaceState({}, '', '/healing');
      checkHealingAccess();
    }
  }, []);

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

    setHasHealingAccess(data && data.length > 0);
  };

  const checkOwnedAudio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('healing_audio_purchases')
      .select('audio_id')
      .eq('user_id', user.id);

    if (data) {
      setOwnedAudioIds(new Set(data.map(p => p.audio_id)));
    }
  };

  const handlePurchasePlan = async (planType: string) => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('common.signIn', 'Please sign in'), variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-healing-checkout', {
        body: { planType },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: t('common.error', 'Error'), description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseAudio = async (audio: HealingAudio, method: 'shc' | 'stripe') => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('common.signIn', 'Please sign in'), variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('purchase-healing-audio', {
        body: { audioId: audio.id, paymentMethod: method },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else if (data?.success) {
        toast({ title: t('healing.purchaseComplete', 'Purchase Complete!'), description: t('healing.youNowOwn', 'You now own') + ` ${audio.title}` });
        setOwnedAudioIds(prev => new Set([...prev, audio.id]));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: t('common.error', 'Error'), description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = (audio: HealingAudio) => {
    const canPlay = audio.is_free || ownedAudioIds.has(audio.id);
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;

    if (!audioUrl) return;

    if (playingId === audio.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(audio.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const freeAudios = audioTracks.filter(a => a.is_free);
  const paidAudios = audioTracks.filter(a => !a.is_free);

  return (
    <div className="min-h-screen p-6 space-y-10">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-primary/30 to-pink-500/30 border-none text-center overflow-hidden">
        <CardContent className="py-10 px-6">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">30 Days of Sacred Healing</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience energetic, emotional, mental, and spiritual transformation with Adam & Laila's Sacred Healing Vibration.
          </p>
        </CardContent>
      </Card>

      {/* Main Content Sections */}
      <div className="space-y-6">
        <Card className="border-border">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              More About the Healing
            </h2>
            <p className="text-muted-foreground">
              The 30 Days of Healing is designed to support your overall well-being and enhance multiple aspects of your life. Through this regular healing practice, we help you replenish your energy and vitality using divine energies of love, light, peace, and chi. This process may help promote balance, calm, and clarity, supporting body, mind, and spirit.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Star className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Health & Vitality</h3>
              <p className="text-sm text-muted-foreground">
                Supports energetic balance, vitality, organ and immune system function, circulation, digestive and reproductive health, stress relief, and overall wellness.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Heart className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Mental & Emotional Balance</h3>
              <p className="text-sm text-muted-foreground">
                Helps reduce stress, anxiety, and negative thought patterns while promoting emotional stability, self-love, and positive mindset.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Sparkles className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Spiritual Transformation</h3>
              <p className="text-sm text-muted-foreground">
                Supports awakening your spiritual potential, deeper meditation, higher vibration, wisdom, and connection with inner divinity.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-foreground">Testimonials</h2>
        <div className="space-y-4">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">{t.name}</h3>
                {t.text && <p className="text-muted-foreground italic">"{t.text}"</p>}
                {t.videos && (
                  <div className="grid md:grid-cols-3 gap-4">
                    {t.videos.map((url, j) => (
                      <div key={j} className="aspect-video">
                        <iframe
                          className="w-full h-full rounded-lg"
                          src={url}
                          title={`Video testimonial ${j+1}`}
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
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-foreground">Frequently Asked Questions</h2>
        <Accordion type="multiple" className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Purchase Section */}
      {!hasHealingAccess && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Join the Healing</h2>
            <p className="text-muted-foreground">Select the package that fits your needs:</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="gold" 
              size="lg"
              onClick={() => handlePurchasePlan('7_day')}
              disabled={isProcessing}
            >
              7-Day Healing - €97
            </Button>
            <Button 
              variant="gold" 
              size="lg"
              onClick={() => handlePurchasePlan('14_day')}
              disabled={isProcessing}
            >
              14-Day Healing - €147
            </Button>
            <Button 
              variant="gold" 
              size="lg"
              onClick={() => handlePurchasePlan('30_day')}
              disabled={isProcessing}
            >
              30-Day Healing - €197
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handlePurchasePlan('subscription')}
              disabled={isProcessing}
            >
              Subscribe 3 Months - €147/mo
            </Button>
          </div>
        </div>
      )}

      {/* Access Badge */}
      {hasHealingAccess && (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{t('healing.activeAccess', 'You have active healing access!')}</span>
          </div>
        </Card>
      )}

      {/* Free Audio Section */}
      {freeAudios.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            {t('healing.freeAudio', 'Free Healing Audio')}
          </h2>
          
          <div className="grid gap-3">
            {freeAudios.map(audio => (
              <Card key={audio.id} className="p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => togglePlay(audio)}
                    className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                  >
                    {playingId === audio.id ? (
                      <Pause className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-primary ml-1" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground"><TranslatedContent text={audio.title} /></h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(audio.duration_seconds)}</span>
                      <span className="text-green-500 font-medium">• {t('healing.free', 'FREE')}</span>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Premium Audio Section */}
      {paidAudios.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('healing.premiumAudio', 'Premium Healing Audio')}
          </h2>
          
          <div className="grid gap-3">
            {paidAudios.map(audio => {
              const owned = ownedAudioIds.has(audio.id);
              
              return (
                <Card key={audio.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePlay(audio)}
                      className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors relative"
                    >
                      {!owned && !hasHealingAccess && (
                        <Lock className="w-4 h-4 text-muted-foreground absolute -top-1 -right-1" />
                      )}
                      {playingId === audio.id ? (
                        <Pause className="w-5 h-5 text-primary" />
                      ) : (
                        <Play className="w-5 h-5 text-primary ml-1" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground"><TranslatedContent text={audio.title} /></h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(audio.duration_seconds)}</span>
                        {owned || hasHealingAccess ? (
                          <span className="text-green-500 font-medium">• {t('healing.owned', 'OWNED')}</span>
                        ) : (
                          <span className="text-primary font-medium">• ${audio.price_usd}</span>
                        )}
                      </div>
                    </div>
                    
                    {owned || hasHealingAccess ? (
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="gold" 
                          size="sm"
                          onClick={() => handlePurchaseAudio(audio, 'stripe')}
                          disabled={isProcessing}
                        >
                          ${audio.price_usd}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <ReviewSection contentType="healing" contentId="general" />
    </div>
  );
};

export default Healing;
