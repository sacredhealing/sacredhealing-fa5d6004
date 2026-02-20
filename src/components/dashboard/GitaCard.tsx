import React, { useMemo, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { normalizePlanetName } from '@/lib/jyotishMantraLogic';
import { getGitaVerseForCycle, type GitaVerse } from '@/lib/gitaVerses';
import { SriYantra } from '@/components/dashboard/SriYantra';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SAVED_WISDOM_KEY = 'sh_saved_gita_verses';

export function getSavedVerses(userId: string): GitaVerse[] {
  try {
    const raw = localStorage.getItem(`${SAVED_WISDOM_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveVerseToVault(userId: string, verse: GitaVerse): void {
  const saved = getSavedVerses(userId);
  const key = `${verse.chapter}-${verse.verse}`;
  if (saved.some((v) => `${v.chapter}-${v.verse}` === key)) return;
  saved.push(verse);
  try {
    localStorage.setItem(`${SAVED_WISDOM_KEY}_${userId}`, JSON.stringify(saved));
  } catch (_) {}
}

function isVerseSaved(userId: string, verse: GitaVerse): boolean {
  const saved = getSavedVerses(userId);
  const key = `${verse.chapter}-${verse.verse}`;
  return saved.some((v) => `${v.chapter}-${v.verse}` === key);
}

export const GitaCard: React.FC = () => {
  const { user } = useAuth();
  const { reading } = useAIVedicReading();
  const [savedSet, setSavedSet] = useState<Set<string>>(() => new Set());

  const currentCycle = useMemo(() => {
    if (!reading?.personalCompass?.currentDasha?.period) return null;
    const planetName = reading.personalCompass.currentDasha.period.split(' ')[0];
    return normalizePlanetName(planetName);
  }, [reading]);

  const verse: GitaVerse = useMemo(() => getGitaVerseForCycle(currentCycle), [currentCycle]);

  const verseKey = `${verse.chapter}-${verse.verse}`;
  const isSaved = user ? (savedSet.has(verseKey) || isVerseSaved(user.id, verse)) : false;

  const handleHeart = useCallback(() => {
    if (!user) {
      toast.info('Sign in to save verses to your Soul Profile');
      return;
    }
    if (isSaved) return;
    saveVerseToVault(user.id, verse);
    setSavedSet((prev) => new Set(prev).add(verseKey));
    toast.success('Verse saved to your Soul Profile');
  }, [user, verse, verseKey, isSaved]);

  return (
    <section
      className="relative rounded-2xl border border-[#D4AF37]/40 overflow-hidden mb-4"
      style={{
        background: `
          linear-gradient(135deg, rgba(210,180,140,0.25) 0%, rgba(188,158,108,0.2) 40%, rgba(160,130,90,0.18) 100%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139,90,43,0.06) 2px,
            rgba(139,90,43,0.06) 4px
          ),
          linear-gradient(180deg, rgba(94,72,48,0.12) 0%, transparent 50%),
          #1a1510
        `,
        boxShadow: '0 0 0 1px rgba(212,175,55,0.15), inset 0 0 40px rgba(0,0,0,0.2)',
      }}
    >
      {/* Sri Yantra overlay — 15% opacity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.15]">
        <SriYantra className="w-full max-w-[280px] h-auto" variant="gold" />
      </div>

      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-xs uppercase tracking-widest text-[#D4AF37]/80 font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            The Lord's Song (Gita)
          </h3>
          <button
            type="button"
            onClick={handleHeart}
            className="flex-shrink-0 p-1.5 rounded-full transition-colors hover:bg-[#D4AF37]/10"
            aria-label={isSaved ? 'Saved to Soul Profile' : 'Save to Soul Profile'}
          >
            <Heart
              className={`w-5 h-5 ${isSaved ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#D4AF37]/60 hover:text-[#D4AF37]'}`}
            />
          </button>
        </div>

        {/* Layout: Sanskrit (Top), Transliteration (Middle), Producer's Verdict (Bottom) */}
        <div className="space-y-3 text-center">
          <div className="text-xl sm:text-2xl font-serif leading-relaxed text-[#D4AF37]/95" style={{ fontFamily: 'Georgia, serif' }}>
            {verse.sanskrit}
          </div>
          <div className="text-xs sm:text-sm italic text-white/75 font-serif whitespace-pre-line" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            {verse.transliteration}
          </div>
          <div className="text-sm text-white/90 leading-relaxed max-w-xl mx-auto">
            {verse.producersTranslation}
          </div>
          <div className="text-[10px] text-[#D4AF37]/50 font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            Chapter {verse.chapter}, Verse {verse.verse}
          </div>
        </div>
      </div>
    </section>
  );
};
