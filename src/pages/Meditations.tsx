import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Clock, Sparkles, Leaf, Moon, Sun, Heart, Brain, ArrowLeft, Loader2 } from 'lucide-react';
import { TranslatedText } from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CustomMeditationBooking from '@/components/meditation/CustomMeditationBooking';
import CustomMeditationCreation from '@/components/meditation/CustomMeditationCreation';
import WealthMeditationService from '@/components/meditation/WealthMeditationService';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { CuratedMeditationCard } from '@/components/meditation/CuratedMeditationCard';
import { IntentionThreshold, IntentionType } from '@/components/meditation/IntentionThreshold';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCuratedPlaylists, CuratedPlaylist } from '@/hooks/useCuratedPlaylists';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { useUserDailyState } from '@/hooks/useUserDailyState';
import { getDayPhase } from '@/utils/postSessionContext';
import { StartNowCard } from '@/features/meditations/StartNowCard';
import { LanguageToggle } from '@/features/meditations/LanguageToggle';
import { useContentLanguage } from '@/features/meditations/useContentLanguage';
import { selectStartNowItem } from '@/features/meditations/startNowSelector';
import { getItemLanguage } from '@/features/meditations/getItemLanguage';

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
  const { playUniversalAudio, currentAudio, isPlaying, progress: playerProgress } = useMusicPlayer();
  const { language, setLanguage } = useContentLanguage();
  const { userState } = useUserDailyState();
  const dayPhase = getDayPhase();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchParams] = useSearchParams();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);

  // Intention threshold state
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingMeditation, setPendingMeditation] = useState<Meditation | null>(null);
  const [currentIntention, setCurrentIntention] = useState<IntentionType | null>(null);

  // Curated playlists
  const { playlists: curatedPlaylists, getPlaylistItems } = useCuratedPlaylists('meditation');
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [playlistMeditations, setPlaylistMeditations] = useState<Meditation[]>([]);

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
    const { data } = await supabase
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

  // Filter by content language (unknown = show in both)
  const languageFilter = (item: Meditation) => {
    const lang = getItemLanguage(item);
    return lang === 'unknown' || lang === language;
  };

  const filteredByLanguage = filteredMeditations.filter(languageFilter);

  // Start Now: one-tap selection (no browsing)
  const startNowItem = useMemo(() => {
    return selectStartNowItem(meditations, { dayPhase, userState, language });
  }, [meditations, dayPhase, userState, language]);

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

  // Check if a meditation is currently playing via the unified player
  const isCurrentlyPlaying = (meditationId: string) => {
    return currentAudio?.id === meditationId && currentAudio?.contentType === 'meditation' && isPlaying;
  };

  // Get progress for a meditation from unified player
  const getMeditationProgress = (meditationId: string) => {
    if (currentAudio?.id === meditationId && currentAudio?.contentType === 'meditation') {
      return playerProgress;
    }
    return 0;
  };

  // Actual audio playback logic - uses unified player
  const startPlayback = async (meditation: Meditation) => {
    const audioItem: UniversalAudioItem = {
      id: meditation.id,
      title: meditation.title,
      artist: 'Sacred Healing',
      audio_url: meditation.audio_url,
      cover_image_url: meditation.cover_image_url,
      duration_seconds: meditation.duration_minutes * 60,
      shc_reward: meditation.shc_reward,
      contentType: 'meditation',
      originalData: meditation,
    };

    playUniversalAudio(audioItem);

    await supabase
      .from('meditations')
      .update({ play_count: meditation.play_count + 1 })
      .eq('id', meditation.id);
  };

  // Start Now: one tap, no threshold (second-start UX)
  const onStartNow = (item: any) => {
    const m = item as Meditation;
    startPlayback(m);
  };

  // Opens the intention threshold before starting (library flow)
  const initiatePlay = (meditation: Meditation) => {
    if (currentAudio?.id === meditation.id && currentAudio?.contentType === 'meditation') {
      const audioItem: UniversalAudioItem = {
        id: meditation.id,
        title: meditation.title,
        artist: 'Sacred Healing',
        audio_url: meditation.audio_url,
        cover_image_url: meditation.cover_image_url,
        duration_seconds: meditation.duration_minutes * 60,
        shc_reward: meditation.shc_reward,
        contentType: 'meditation',
        originalData: meditation,
      };
      playUniversalAudio(audioItem);
      return;
    }

    setPendingMeditation(meditation);
    setShowThreshold(true);
  };

  const handleIntentionSelected = (intention: IntentionType) => {
    setCurrentIntention(intention);
    setShowThreshold(false);

    if (pendingMeditation) {
      startPlayback(pendingMeditation);
      setPendingMeditation(null);
    }
  };

  const handleThresholdClose = () => {
    setShowThreshold(false);
    if (pendingMeditation) {
      startPlayback(pendingMeditation);
      setPendingMeditation(null);
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
    <>
      <IntentionThreshold
        isOpen={showThreshold}
        onSelectIntention={handleIntentionSelected}
        onClose={handleThresholdClose}
      />

      <div className="min-h-screen px-4 pt-6 pb-24">
        {/* Header */}
        <header className="mb-4 animate-fade-in">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {language === 'sv' ? 'Meditationer' : t('meditations.title', 'Meditations')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'sv' ? 'Hitta din inre frid' : t('meditations.subtitle', 'Find your inner peace')}
          </p>
        </header>

        {/* START NOW (Second Start) - zero browsing */}
        <StartNowCard
          item={loading ? null : startNowItem}
          language={language}
          dayPhase={dayPhase}
          userState={userState}
          onStart={onStartNow}
        />

        {/* Language toggle */}
        <LanguageToggle language={language} setLanguage={setLanguage} />

        {selectedPlaylist ? (
          /* Playlist Detail View */
          <>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedPlaylist(null); setPlaylistMeditations([]); }}
              >
                <ArrowLeft size={16} className="mr-1" /> Back
              </Button>
            </div>

            <div className="flex gap-4 mb-6">
              {selectedPlaylist.cover_image_url ? (
                <img
                  src={selectedPlaylist.cover_image_url}
                  alt={selectedPlaylist.title}
                  className="w-24 h-24 rounded-xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Sparkles size={32} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedPlaylist.title}</h2>
                {selectedPlaylist.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedPlaylist.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedPlaylist.track_count} sessions • {Math.floor(selectedPlaylist.total_duration / 60)} min
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {playlistMeditations.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                playlistMeditations.map((meditation) => {
                  const isMeditationPlaying = isCurrentlyPlaying(meditation.id);
                  const currentProgress = getMeditationProgress(meditation.id);

                  return (
                    <div
                      key={meditation.id}
                      className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 p-5 hover:scale-[1.02] transition-transform duration-300"
                    >
                      {meditation.is_premium && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-accent/20 rounded-full">
                          <span className="text-xs font-medium text-accent">{t('meditations.premium', 'Premium')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => initiatePlay(meditation)}
                          className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center glow-purple hover:scale-110 transition-transform"
                        >
                          {isMeditationPlaying ? (
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
          </>
        ) : (
          /* Main Browse View - Library */
          <>
            {/* Curated Playlists */}
            {curatedPlaylists.length > 0 && (
              <div className="mt-6 mb-6">
                <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
                  {t('meditations.featuredCollections', 'Featured Collections')}
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {curatedPlaylists.map(playlist => (
                    <CuratedMeditationCard
                      key={playlist.id}
                      playlist={playlist}
                      onClick={async () => {
                        setSelectedPlaylist(playlist);
                        const items = await getPlaylistItems(playlist.id);
                        setPlaylistMeditations(items as Meditation[]);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Meditations */}
            <div className="mt-6">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
                {language === 'sv' ? 'Alla meditationer' : t('meditations.allMeditations', 'All Meditations')}
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide animate-slide-up">
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

              {/* Premium Meditations */}
              {filteredByLanguage.filter(m => m.is_premium).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Premium Meditations ({filteredByLanguage.filter(m => m.is_premium).length})
                  </h3>
                  <div className="space-y-4 mb-6">
                    {filteredByLanguage
                      .filter(m => m.is_premium)
                      .map((meditation, index) => {
                        const isMeditationPlaying = isCurrentlyPlaying(meditation.id);
                        const currentProgress = getMeditationProgress(meditation.id);

                        return (
                          <div
                            key={meditation.id}
                            className="relative overflow-hidden rounded-2xl bg-gradient-card border border-primary/30 p-5 animate-slide-up hover:scale-[1.02] transition-transform duration-300"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="absolute top-3 right-3 px-2 py-1 bg-primary/20 rounded-full">
                              <span className="text-xs font-medium text-primary">Premium</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => initiatePlay(meditation)}
                                className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center glow-purple hover:scale-110 transition-transform"
                              >
                                {isMeditationPlaying ? (
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
                            {isPlaying && (
                              <div className="mt-4">
                                <Progress value={currentProgress} className="h-1" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Free Meditations */}
              {filteredByLanguage.filter(m => !m.is_premium).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Free Meditations ({filteredByLanguage.filter(m => !m.is_premium).length})
                  </h3>
                </div>
              )}

              {/* Meditation List */}
              <div className="space-y-4">
                {filteredByLanguage.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No meditations found</h3>
                    <p className="text-muted-foreground text-sm">
                      {activeCategory === 'all' ? 'Meditations will be added soon.' : 'Try selecting a different category.'}
                    </p>
                  </div>
                ) : (
                  filteredByLanguage
                    .filter(m => !m.is_premium)
                    .map((meditation, index) => {
                      const isMeditationPlaying = isCurrentlyPlaying(meditation.id);
                      const currentProgress = getMeditationProgress(meditation.id);

                      return (
                        <div
                          key={meditation.id}
                          className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 p-5 animate-slide-up hover:scale-[1.02] transition-transform duration-300"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => initiatePlay(meditation)}
                              className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center glow-purple hover:scale-110 transition-transform"
                            >
                              {isMeditationPlaying ? (
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
            </div>

            {/* Go deeper (optional) - paid offerings moved DOWN */}
            <div className="mt-10">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
                {language === 'sv' ? 'Fördjupa (valfritt)' : 'Go deeper (optional)'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'sv'
                  ? 'När du vill investera i något mer personligt.'
                  : 'When you want something more personal.'}
              </p>

              <MeditationMembershipBanner />

              <div className="space-y-3 mt-4">
                <WealthMeditationService />
                <CustomMeditationBooking />
                <CustomMeditationCreation />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Meditations;
