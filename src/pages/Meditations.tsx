import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Clock, Sparkles, ArrowLeft, Loader2, Compass } from 'lucide-react';
import BabajiShadow from '@/components/meditation/BabajiShadow';
import { TranslatedText } from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { useUserDailyState } from '@/hooks/useUserDailyState';
import { getDayPhase } from '@/utils/postSessionContext';
import { StartNowCard } from '@/features/meditations/StartNowCard';
import { LanguageToggle } from '@/features/meditations/LanguageToggle';
import { useMeditationContentLanguage } from '@/features/meditations/useContentLanguage';
import { selectStartNowItem } from '@/features/meditations/startNowSelector';
import { MeditationSection } from '@/features/meditations/MeditationSection';
import { BackToTopFab } from '@/features/meditations/BackToTopFab';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { IntentionThreshold, IntentionType } from '@/components/meditation/IntentionThreshold';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import WealthMeditationService from '@/components/meditation/WealthMeditationService';
import CustomMeditationBooking from '@/components/meditation/CustomMeditationBooking';
import CustomMeditationCreation from '@/components/meditation/CustomMeditationCreation';

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
  language?: string;
}

const JyotishMeditationCard = () => {
  const jyotish = useJyotishProfile();
  if (jyotish.isLoading || !jyotish.mahadasha) return null;
  return (
    <div className="mx-0 mb-8 p-6 rounded-3xl bg-gradient-to-br from-[#2d1b4e]/40 to-[#0f051a]/60 border border-[#D4AF37]/20 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <Compass size={80} className="text-[#D4AF37]" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="text-[#D4AF37] w-4 h-4" />
          <span className="text-[10px] font-black font-serif text-[#D4AF37] uppercase tracking-[0.3em]">
            Celestial Guidance
          </span>
        </div>
        <p className="text-sm text-stone-200 leading-relaxed italic">
          Your <strong className="text-[#D4AF37] font-bold">{jyotish.mahadasha} Mahadasha</strong> cycle suggests focus on{' '}
          <strong className="text-white underline decoration-[#D4AF37]/40">{jyotish.meditationType || 'Deep Stillness'}</strong> for soul alignment.
        </p>
      </div>
    </div>
  );
};

const Meditations: React.FC = () => {
  const { t } = useTranslation();
  const { playUniversalAudio, currentAudio, isPlaying, progress: playerProgress } = useMusicPlayer();
  const { language, setLanguage } = useMeditationContentLanguage();
  const { userState } = useUserDailyState();
  const dayPhase = getDayPhase();
  const [searchParams] = useSearchParams();

  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingMeditation, setPendingMeditation] = useState<Meditation | null>(null);

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    try {
      const { data, error } = await supabase
        .from('meditations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMeditations(data || []);
    } catch (err) {
      console.error("Error fetching meditations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Logic: Filter by language then build sections manually to ensure 'healing' works
  const filtered = useMemo(() => {
    return meditations.filter(m => {
      const medLang = (m as any).language || 'en';
      return medLang === language;
    });
  }, [meditations, language]);

  const sections = useMemo(() => {
    return {
      short: filtered.filter(m => m.duration_minutes <= 5),
      morning: filtered.filter(m => m.category?.toLowerCase() === 'morning'),
      sleep: filtered.filter(m => m.category?.toLowerCase() === 'sleep'),
      healing: filtered.filter(m => m.category?.toLowerCase() === 'healing'),
      focus: filtered.filter(m => m.category?.toLowerCase() === 'focus'),
      nature: filtered.filter(m => m.category?.toLowerCase() === 'nature'),
      all: filtered
    };
  }, [filtered]);

  const startNowItem = useMemo(() => {
    return selectStartNowItem(meditations, { dayPhase, userState, language });
  }, [meditations, dayPhase, userState, language]);

  const startPlayback = async (meditation: Meditation) => {
    const audioItem: UniversalAudioItem = {
      id: meditation.id,
      title: meditation.title,
      artist: 'Siddha Healing',
      audio_url: meditation.audio_url,
      cover_image_url: meditation.cover_image_url,
      duration_seconds: meditation.duration_minutes * 60,
      shc_reward: meditation.shc_reward,
      contentType: 'meditation',
      originalData: meditation,
    };

    playUniversalAudio(audioItem);
    await supabase.from('meditations').update({ play_count: (meditation.play_count || 0) + 1 }).eq('id', meditation.id);
  };

  const initiatePlay = (meditation: Meditation) => {
    if (currentAudio?.id === meditation.id && currentAudio?.contentType === 'meditation') {
      playUniversalAudio({ ...currentAudio }); // Resume
      return;
    }
    setPendingMeditation(meditation);
    setShowThreshold(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f051a]">
      <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
    </div>
  );

  return (
    <div className="min-h-screen px-4 pt-8 pb-32 selection:bg-[#D4AF37]/30"
         style={{ background: 'radial-gradient(circle at 50% 0%, #1a0b2e 0%, #0f051a 100%)' }}>
      
      <IntentionThreshold
        isOpen={showThreshold}
        onSelectIntention={() => {
          if (pendingMeditation) startPlayback(pendingMeditation);
          setShowThreshold(false);
          setPendingMeditation(null);
        }}
        onClose={() => setShowThreshold(false)}
      />

      <header className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-light text-white tracking-widest uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
            Hall of Stillness
          </h1>
          <span className="text-[9px] text-[#D4AF37]/50 uppercase tracking-[0.4em] mt-1">The Sacred Void</span>
        </div>
        <LanguageToggle language={language} setLanguage={setLanguage} compact />
      </header>

      <StartNowCard
        item={startNowItem}
        dayPhase={dayPhase}
        userState={userState}
        onStart={(item) => startPlayback(item as Meditation)}
      />

      <JyotishMeditationCard />

      <div className="space-y-10">
        <MeditationSection
          title="Healing Sanctuary"
          subtitle="Transmissions to support what is tender."
          items={sections.healing}
          defaultExpanded={sections.healing.length > 0}
          onPlay={initiatePlay}
          isCurrentlyPlaying={(id) => currentAudio?.id === id && isPlaying}
          getProgress={(id) => currentAudio?.id === id ? playerProgress : 0}
          isPlaying={isPlaying}
        />

        <MeditationSection
          title="Morning Resonance"
          subtitle="Align with the emerging light."
          items={sections.morning}
          onPlay={initiatePlay}
          isCurrentlyPlaying={(id) => currentAudio?.id === id && isPlaying}
          getProgress={(id) => currentAudio?.id === id ? playerProgress : 0}
          isPlaying={isPlaying}
        />

        <MeditationSection
          title="Nidra & Sleep"
          subtitle="Dissolve into the deep peace."
          items={sections.sleep}
          onPlay={initiatePlay}
          isCurrentlyPlaying={(id) => currentAudio?.id === id && isPlaying}
          getProgress={(id) => currentAudio?.id === id ? playerProgress : 0}
          isPlaying={isPlaying}
        />

        <MeditationSection
          title="Deep Focus"
          subtitle="Sharpen the arrow of attention."
          items={sections.focus}
          onPlay={initiatePlay}
          isCurrentlyPlaying={(id) => currentAudio?.id === id && isPlaying}
          getProgress={(id) => currentAudio?.id === id ? playerProgress : 0}
          isPlaying={isPlaying}
        />

        <MeditationSection
          title="Earth Grounding"
          subtitle="Meditations with the presence of Nature."
          items={sections.nature}
          onPlay={initiatePlay}
          isCurrentlyPlaying={(id) => currentAudio?.id === id && isPlaying}
          getProgress={(id) => currentAudio?.id === id ? playerProgress : 0}
          isPlaying={isPlaying}
        />
      </div>

      <div className="mt-20 border-t border-white/5 pt-12">
        <h2 className="text-xl font-light text-white tracking-widest uppercase mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Sacred Commissions
        </h2>
        <p className="text-xs text-stone-500 mb-8 tracking-wide">Personal transmissions channeled specifically for your soul.</p>
        
        <MeditationMembershipBanner />
        
        <div className="grid gap-4 mt-6">
          <WealthMeditationService />
          <CustomMeditationBooking />
          <CustomMeditationCreation />
        </div>
      </div>

      <BackToTopFab />
    </div>
  );
};

export default Meditations;
