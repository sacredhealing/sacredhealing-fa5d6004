import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  // Get content from database with fallbacks
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

  const handlePurchasePlan = async (planType: 'one_time' | 'subscription') => {
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

  const oneTimePrice = getContent('healing_price_onetime', '197');
  const monthlyPrice = getContent('healing_price_monthly', '50');

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            <TranslatedContent text={getContent('healing_main_title', 'Sacred Healing Space')} />
          </h1>
        </div>
        <p className="text-muted-foreground">
          <TranslatedContent text={getContent('healing_main_subtitle', 'Begin your transformative journey')} />
        </p>
      </div>

      {/* Private Sessions CTA */}
      <Card className="p-6 bg-gradient-to-r from-accent/20 via-primary/20 to-secondary/20 border-accent/30">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
            <Calendar className="w-8 h-8 text-accent" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-heading font-bold text-foreground">{t('healing.bookPrivateSession', 'Book a Private Session')}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {t('healing.privateSessionDesc', '1-on-1 transformative sessions with Adam or Laila. Yoga, voice healing, trauma release & more.')}
            </p>
          </div>
          <Link to="/private-sessions">
            <Button variant="gold" className="shrink-0">
              <Calendar className="w-4 h-4 mr-2" />
              {t('healing.bookSession', 'Book Session')}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Healing Description Section */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('healing.howItWorks', 'How Sacred Healing Works')}</h2>
          </div>
          
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p><TranslatedContent text={getContent('healing_intro', 'Welcome to a sacred space designed for deep healing and transformation. Our healing program combines ancient wisdom with modern energy healing techniques to help you release blockages, restore balance, and awaken your inner healing power.')} /></p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-background/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> 
                  <TranslatedContent text={getContent('healing_feature_1_title', 'Daily Healing Sessions')} />
                </h3>
                <p className="text-sm mt-2">
                  <TranslatedContent text={getContent('healing_feature_1_text', 'Guided meditations and energy transmissions to align your chakras.')} />
                </p>
              </div>
              
              <div className="bg-background/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> 
                  <TranslatedContent text={getContent('healing_feature_2_title', 'Frequency Healing')} />
                </h3>
                <p className="text-sm mt-2">
                  <TranslatedContent text={getContent('healing_feature_2_text', 'Special audio tracks infused with healing frequencies.')} />
                </p>
              </div>
              
              <div className="bg-background/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> 
                  <TranslatedContent text={getContent('healing_feature_3_title', 'Chakra Balancing')} />
                </h3>
                <p className="text-sm mt-2">
                  <TranslatedContent text={getContent('healing_feature_3_text', 'Targeted healing sessions for each of your seven main chakras.')} />
                </p>
              </div>
              
              <div className="bg-background/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> 
                  <TranslatedContent text={getContent('healing_feature_4_title', 'Emotional Release')} />
                </h3>
                <p className="text-sm mt-2">
                  <TranslatedContent text={getContent('healing_feature_4_text', 'Gentle techniques to help you process and release old emotions.')} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing Plans */}
      {!hasHealingAccess && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center text-foreground">{t('healing.chooseJourney', 'Choose Your Healing Journey')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* One-time Plan */}
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {t('healing.bestValue', 'Best Value')}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{t('healing.thirtyDayJourney', '30-Day Healing Journey')}</h3>
                  <p className="text-muted-foreground text-sm">{t('healing.oneTimePayment', 'One-time payment, full access')}</p>
                </div>
                
                <div className="text-3xl font-bold text-primary">
                  ${oneTimePrice}
                  <span className="text-sm font-normal text-muted-foreground"> / {t('healing.thirtyDays', '30 days')}</span>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t('healing.fullAccess', 'Full access for 30 days')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t('healing.allTracks', 'All healing audio tracks')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t('healing.dailySessions', 'Daily guided sessions')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t('healing.noCommitment', 'No commitment')}</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full" 
                  variant="gold"
                  onClick={() => handlePurchasePlan('one_time')}
                  disabled={isProcessing}
                >
                  {t('healing.startJourney', 'Start Your Journey')}
                </Button>
              </div>
            </Card>

            {/* Subscription Plan */}
            <Card className="p-6 border border-border">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{t('healing.monthlyHealing', 'Monthly Healing')}</h3>
                  <p className="text-muted-foreground text-sm">{t('healing.subscriptionMin', 'Subscription (min. 3 months)')}</p>
                </div>
                
                <div className="text-3xl font-bold text-foreground">
                  ${monthlyPrice}
                  <span className="text-sm font-normal text-muted-foreground"> / {t('healing.month', 'month')}</span>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t('healing.continuousAccess', 'Continuous access')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t('healing.allTracks', 'All healing audio tracks')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t('healing.cancelAfter', 'Cancel after 3 months')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>${parseInt(monthlyPrice) * 3} {t('healing.totalMinimum', 'total minimum')}</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handlePurchasePlan('subscription')}
                  disabled={isProcessing}
                >
                  {t('healing.subscribeMonthly', 'Subscribe Monthly')}
                </Button>
              </div>
            </Card>
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
                      {playingId === audio.id ? (
                        <Pause className="w-5 h-5 text-primary" />
                      ) : (
                        <Play className="w-5 h-5 text-primary ml-1" />
                      )}
                      {!owned && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-accent-foreground" />
                        </div>
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground"><TranslatedContent text={audio.title} /></h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(audio.duration_seconds)}</span>
                        {owned ? (
                          <span className="text-green-500 font-medium">• {t('healing.owned', 'OWNED')}</span>
                        ) : (
                          <>
                            <span className="text-primary font-medium">• ${audio.price_usd}</span>
                            <span className="text-accent font-medium">/ {audio.price_shc} SHC</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {owned ? (
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePurchaseAudio(audio, 'shc')}
                          disabled={isProcessing || (balance?.balance ?? 0) < audio.price_shc}
                        >
                          {audio.price_shc} SHC
                        </Button>
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
      <ReviewSection contentType="healing" contentId="healing-page" />
    </div>
  );
};

export default Healing;