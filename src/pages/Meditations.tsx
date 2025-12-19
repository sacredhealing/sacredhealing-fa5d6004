import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Clock, Sparkles, Leaf, Moon, Sun, Heart, Brain } from 'lucide-react';
import { TranslatedText } from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CustomMeditationBooking from '@/components/meditation/CustomMeditationBooking';
import CustomMeditationCreation from '@/components/meditation/CustomMeditationCreation';
import WealthMeditationService from '@/components/meditation/WealthMeditationService';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCBalance } from '@/hooks/useSHCBalance';

interface Meditation {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_minutes: number;
  category: string;
  shc_reward: number;
  is_premium: boolean;
  play_count: number;
}

const Meditations: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshBalance } = useSHCBalance();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchParams] = useSearchParams();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playStartTimeRef = useRef<number>(0);

  const categories = [
    { id: 'all', label: t('meditations.categories.all', 'All'), icon: Sparkles },
    { id: 'morning', label: t('meditations.categories.morning', 'Morning'), icon: Sun },
    { id: 'sleep', label: t('meditations.categories.sleep', 'Sleep'), icon: Moon },
    { id: 'healing', label: t('meditations.categories.healing', 'Healing'), icon: Heart },
    { id: 'focus', label: t('meditations.categories.focus', 'Focus'), icon: Brain },
    { id: 'nature', label: t('meditations.categories.nature', 'Nature'), icon: Leaf },
  ];

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    const { data, error } = await supabase
      .from('meditations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setMeditations(data);
    }
    setLoading(false);
  };

  const filteredMeditations = activeCategory === 'all' 
    ? meditations 
    : meditations.filter(m => m.category === activeCategory);

  // Handle payment success/cancel
  useEffect(() => {
    const success = searchParams.get('success');
    const wealthSuccess = searchParams.get('wealth_success');
    const cancelled = searchParams.get('cancelled');
    const membershipSuccess = searchParams.get('membership_success');
    const membershipCancelled = searchParams.get('membership_cancelled');
    
    if (success === 'true') {
      toast.success(t('meditations.paymentSuccess', 'Payment successful! Adam will begin channeling your meditation.'));
    } else if (wealthSuccess === 'true') {
      toast.success(t('meditations.wealthSuccess', 'Payment successful! Check your email for the 108 affirmations.'));
    } else if (membershipSuccess) {
      toast.success(t('meditations.membershipSuccess', 'Welcome to Meditation Membership! Your subscription is now active.'));
    } else if (cancelled === 'true' || membershipCancelled === 'true') {
      toast.info(t('meditations.paymentCancelled', 'Payment was cancelled'));
    }
  }, [searchParams, t]);

  const handlePlay = async (meditation: Meditation) => {
    if (playingId === meditation.id) {
      // Pause
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio
    const audio = new Audio(meditation.audio_url);
    audioRef.current = audio;
    playStartTimeRef.current = Date.now();

    audio.addEventListener('timeupdate', () => {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      setProgress(prev => ({ ...prev, [meditation.id]: progressPercent }));
    });

    audio.addEventListener('ended', async () => {
      setPlayingId(null);
      setProgress(prev => ({ ...prev, [meditation.id]: 0 }));
      
      // Award SHC if logged in with anti-farming validation
      if (user) {
        await awardMeditationReward(meditation);
      }
    });

    try {
      await audio.play();
      setPlayingId(meditation.id);
      
      // Update play count
      await supabase
        .from('meditations')
        .update({ play_count: meditation.play_count + 1 })
        .eq('id', meditation.id);
    } catch (error) {
      toast.error('Failed to play audio');
    }
  };

  const awardMeditationReward = async (meditation: Meditation) => {
    if (!user) return;

    try {
      const durationListened = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
      const minDuration = Math.floor(meditation.duration_minutes * 60 * 0.8); // 80% minimum

      // Check if user completed this meditation in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentCompletion } = await supabase
        .from('meditation_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('meditation_id', meditation.id)
        .gte('completed_at', twentyFourHoursAgo)
        .limit(1);

      if (recentCompletion && recentCompletion.length > 0) {
        toast.info('Already completed today', {
          description: 'Earn rewards again after 24 hours',
        });
        return;
      }

      if (durationListened < minDuration) {
        toast.info('Listen longer', {
          description: 'Listen to at least 80% to earn rewards',
        });
        return;
      }

      // Record completion
      await supabase.from('meditation_completions').insert({
        user_id: user.id,
        meditation_id: meditation.id,
        duration_listened: durationListened,
        shc_earned: meditation.shc_reward,
      });

      // Update user balance
      const { data: balanceData } = await supabase
        .from('user_balances')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceData) {
        await supabase
          .from('user_balances')
          .update({
            balance: balanceData.balance + meditation.shc_reward,
            total_earned: balanceData.total_earned + meditation.shc_reward,
          })
          .eq('user_id', user.id);
      }

      // Record transaction
      await supabase.from('shc_transactions').insert({
        user_id: user.id,
        type: 'earned',
        amount: meditation.shc_reward,
        description: `Meditation completed: ${meditation.title}`,
        status: 'completed',
      });

      toast.success(`+${meditation.shc_reward} SHC earned!`, {
        description: 'Thank you for your practice',
        icon: '✨',
      });

      refreshBalance();
    } catch (error) {
      console.error('Error awarding meditation reward:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">{t('meditations.title', 'Meditations')}</h1>
        <p className="text-muted-foreground mt-1">{t('meditations.subtitle', 'Find your inner peace')}</p>
      </header>

      {/* Meditation Membership */}
      <MeditationMembershipBanner />

      {/* Services - Compact row style */}
      <div className="space-y-3 mb-6">
        <WealthMeditationService />
        <CustomMeditationBooking />
        <CustomMeditationCreation />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide animate-slide-up">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground glow-purple'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <cat.icon size={16} />
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Meditation List */}
      <div className="space-y-4">
        {filteredMeditations.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No meditations found</h3>
            <p className="text-muted-foreground text-sm">
              {activeCategory === 'all' ? 'Meditations will be added soon.' : 'Try selecting a different category.'}
            </p>
          </div>
        ) : (
          filteredMeditations.map((meditation, index) => {
            const isPlaying = playingId === meditation.id;
            const currentProgress = progress[meditation.id] || 0;

            return (
              <div
                key={meditation.id}
                className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 p-5 animate-slide-up hover:scale-[1.02] transition-transform duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {meditation.is_premium && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-accent/20 rounded-full">
                    <span className="text-xs font-medium text-accent">{t('meditations.premium', 'Premium')}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handlePlay(meditation)}
                    className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center glow-purple hover:scale-110 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause size={24} className="text-primary" />
                    ) : (
                      <Play size={24} className="text-primary ml-1" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-foreground">
                      <TranslatedText>{meditation.title}</TranslatedText>
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {meditation.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles size={14} className="text-accent" />
                        +{meditation.shc_reward} SHC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {isPlaying && (
                  <div className="mt-4">
                    <Progress value={currentProgress} className="h-1" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Featured */}
      <div className="mt-8 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">{t('meditations.featuredSeries', 'Featured Series')}</h2>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-healing p-6 glow-turquoise">
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/30 rounded-full blur-2xl" />
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">
            {t('meditations.healingJourney', '21-Day Healing Journey')}
          </h3>
          <p className="text-foreground/80 text-sm mb-4">
            {t('meditations.healingJourneyDesc', 'Transform your life with daily guided meditations')}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="glass" size="sm">
              <Play size={16} />
              {t('meditations.startJourney', 'Start Journey')}
            </Button>
            <span className="text-sm text-foreground/70">
              <Sparkles size={14} className="inline text-accent mr-1" />
              +200 SHC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meditations;
