import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MeditationPlayerProps {
  bpm: number | null;
  hrv: number | null;
}

const TRACK_COLORS = [
  'from-stone-900 to-orange-950',
  'from-blue-900 to-emerald-950',
] as const;

const LYRIC_COUNT = 4;
const TRACK_COUNT = 2;

export const MeditationPlayer: React.FC<MeditationPlayerProps> = ({ bpm, hrv: _hrv }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMantraIdx, setCurrentMantraIdx] = useState(0);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);

  const lyrics = useMemo(() => {
    return Array.from({ length: LYRIC_COUNT }, (_, i) =>
      t(`digitalNadi.meditationPlayer.track${currentMantraIdx}.line${i}`)
    );
  }, [currentMantraIdx, t]);

  const title = t(`digitalNadi.meditationPlayer.track${currentMantraIdx}.title`);
  const subtitle = t(`digitalNadi.meditationPlayer.track${currentMantraIdx}.subtitle`);
  const colorClass = TRACK_COLORS[currentMantraIdx] ?? TRACK_COLORS[0];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentLineIdx(prev => (prev + 1) % lyrics.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, lyrics.length]);

  useEffect(() => {
    if (bpm && bpm > 90 && currentMantraIdx !== 1) {
      setCurrentMantraIdx(1);
      setCurrentLineIdx(0);
    } else if (bpm && bpm <= 75 && currentMantraIdx !== 0) {
      setCurrentMantraIdx(0);
      setCurrentLineIdx(0);
    }
  }, [bpm, currentMantraIdx]);

  return (
    <div
      className={`flex flex-col p-8 rounded-[32px] border border-white/10 overflow-hidden relative min-h-[400px] transition-all duration-1000 bg-gradient-to-br ${colorClass}`}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full h-full mix-blend-overlay"
          style={{
            backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1 block">
              {t('digitalNadi.meditationPlayer.currentSession')}
            </span>
            <h2 className="text-3xl font-serif italic text-white">{title}</h2>
            <p className="text-sm text-white/40 font-light">{subtitle}</p>
          </div>
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <Sparkles size={20} className="text-[#FF6B4A]" />
          </div>
        </div>

        <div className="flex-grow flex flex-col justify-center items-center text-center space-y-6 py-12">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${currentMantraIdx}-${currentLineIdx}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="text-2xl font-serif italic text-white/90 leading-relaxed max-w-xs"
            >
              {lyrics[currentLineIdx]}
            </motion.p>
          </AnimatePresence>

          <div className="flex gap-1">
            {lyrics.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 transition-all duration-1000 ${i === currentLineIdx ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
              </button>
              <button
                onClick={() => {
                  setCurrentMantraIdx(i => (i + 1) % TRACK_COUNT);
                  setCurrentLineIdx(0);
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <SkipForward size={24} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Volume2 size={18} />
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-white/40" />
              </div>
            </div>
          </div>

          {bpm && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-white/5 self-start">
              <div className="w-2 h-2 rounded-full bg-[#FF6B4A] animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-white/60">
                {t('digitalNadi.meditationPlayer.resonatingNadi', { bpm })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
