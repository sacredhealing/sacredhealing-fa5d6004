import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Play, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { normalizePlanetName, type Planet } from '@/lib/jyotishMantraLogic';
import type { PalmArchetype } from '@/lib/palmScanStore';
const DASHA_MANTRA_DISPLAY: Record<string, string> = {
  Jupiter: 'Om Gurave Namaha',
  Rahu: 'Om Ram Rahave Namah',
  Venus: 'Om Shum Shukraya Namah',
  Sun: 'Om Hrim Suryaya Namah',
  Moon: 'Om Shrim Chandramase Namah',
  Mars: 'Om Krim Mangalaya Namah',
  Mercury: 'Om Budhaya Namah',
  Saturn: 'Om Sham Shanaye Namah',
  Ketu: 'Om Kem Ketave Namah',
};

/** Palm + Dasha mantra mapping: triggers remedy revelation when hand analysis complete */
function getRevealedMantra(
  handAnalysisComplete: boolean,
  palmArchetype: PalmArchetype | null | undefined,
  dashaPlanet: Planet | null,
  prescribedText: string | null
): { text: string; planet: Planet | null } | null {
  // If we have both palm and dasha
  if (handAnalysisComplete && palmArchetype && dashaPlanet) {
    if (palmArchetype === 'Spiritual Mastery' && dashaPlanet === 'Jupiter') {
      return { text: 'Om Gurave Namaha', planet: 'Jupiter' };
    }
    if (palmArchetype === 'Karmic Debt' && dashaPlanet === 'Rahu') {
      return { text: 'Om Ram Rahave Namah', planet: 'Rahu' };
    }
  }
  // If we have dasha planet with prescribed text
  if (dashaPlanet && prescribedText) {
    return { text: prescribedText, planet: dashaPlanet };
  }
  // If we have dasha planet, use known mantra display map
  if (dashaPlanet && DASHA_MANTRA_DISPLAY[dashaPlanet]) {
    return { text: DASHA_MANTRA_DISPLAY[dashaPlanet], planet: dashaPlanet };
  }
  // Palm-only fallbacks
  if (handAnalysisComplete && palmArchetype) {
    if (palmArchetype === 'Spiritual Mastery') {
      return { text: 'Om Gurave Namaha', planet: 'Jupiter' };
    }
    if (palmArchetype === 'Karmic Debt') {
      return { text: 'Om Ram Rahave Namah', planet: 'Rahu' };
    }
  }
  return null;
}

export interface BhriguCardProps {
  handAnalysisComplete: boolean;
  palmArchetype?: PalmArchetype | null;
  activeDasha: Planet | null;
  prescribedText: string | null;
  onPlayRemedy: (planet: Planet) => void;
  t: (key: string, fallback?: string) => string;
  heartLineLeak?: boolean;
  onPlayHeartHealing?: () => void;
  heartHealingMantraTitle?: string | null;
}

const BhriguCard: React.FC<BhriguCardProps> = ({
  handAnalysisComplete,
  palmArchetype,
  activeDasha,
  prescribedText,
  onPlayRemedy,
  t,
  heartLineLeak,
  onPlayHeartHealing,
  heartHealingMantraTitle,
}) => {
  const revealed = getRevealedMantra(handAnalysisComplete, palmArchetype, activeDasha, prescribedText);
  const isRevealed = !!revealed;

  return (
    <section className="px-4 mt-4 mb-4">
      <Card
        className={`relative overflow-hidden rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/10 via-amber-950/40 to-black/60 shadow-[0_0_24px_rgba(212,175,55,0.25)] ${!isRevealed ? 'animate-sovereign-pulse' : ''} ${heartLineLeak ? 'ring-2 ring-rose-400/50' : ''}`}
        style={{
          boxShadow: heartLineLeak
            ? '0 0 0 2px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.2), 0 0 40px rgba(244,63,94,0.15)'
            : '0 0 0 2px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.2), 0 0 40px rgba(212,175,55,0.1)',
        }}
      >
        <div className="absolute top-3 right-3 text-[#D4AF37]/80" aria-hidden>
          <Leaf className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Bhrigu Samhita</span>
          </div>
          {heartLineLeak && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-400/30">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-1">From your palm scan</p>
              <p className="text-sm text-white/90 mb-2">432Hz Heart-Healing (Anahata) Mantra recommended</p>
              {onPlayHeartHealing && (
                <Button
                  onClick={onPlayHeartHealing}
                  variant="outline"
                  size="sm"
                  className="w-full border-rose-400/50 text-rose-200 hover:bg-rose-500/20"
                >
                  <Play className="w-3 h-3 mr-2 inline" />
                  {heartHealingMantraTitle ? `Play ${heartHealingMantraTitle}` : 'Play Heart-Healing Mantra'}
                </Button>
              )}
            </div>
          )}
          {isRevealed && revealed ? (
            <>
              {handAnalysisComplete && (
                <p className="text-xs text-[#D4AF37]/80 mb-2 italic">
                  Siddha Verdict: Based on your Palm Mandala and current Dasha, this frequency is your required medicine.
                </p>
              )}
              <h2 className="text-lg font-bold text-white mb-2 pr-8">Holy Remedy</h2>
              <p className="text-sm text-white/70 mb-2">{revealed.planet} Remedy</p>
              <motion.p
                key={revealed.text}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-xl font-serif text-[#D4AF37] mb-4 tracking-wide pr-2 relative overflow-hidden"
                style={{ fontFamily: 'Georgia, Cinzel, serif' }}
              >
                <span className="relative inline-block">
                  {revealed.text}
                  <span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
                    style={{ animation: 'shimmer 2s ease-in-out' }}
                  />
                </span>
              </motion.p>
              <Button
                onClick={() => revealed.planet && onPlayRemedy(revealed.planet)}
                className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold py-2.5 rounded-xl border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/30"
              >
                <Play className="w-4 h-4 mr-2 inline" />
                Play {revealed.planet} Remedy
              </Button>
            </>
          ) : (
            <div className="py-2 pr-8">
              <p className="text-[#D4AF37]/90 text-sm animate-pulse" style={{ animationDuration: '2s' }}>
                Calculating your Soul&apos;s Frequency...
              </p>
              <p className="text-white/50 text-xs mt-1">Bhrigu calculation in progress</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default BhriguCard;
