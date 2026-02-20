import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { normalizePlanetName } from '@/lib/jyotishMantraLogic';
import { getGitaVerseForCycle, type GitaVerse } from '@/lib/gitaVerses';
import type { UserProfile } from '@/lib/vedicTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface BhagavadGitaOracleProps {
  className?: string;
}

/** Gold dust particles (Ojas) floating toward profile stats */
const GoldDustParticles: React.FC<{ count?: number; duration?: number }> = ({ count = 24, duration = 2.5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const targetX = Math.cos(angle) * distance;
        const targetY = -Math.abs(Math.sin(angle) * distance) - 100; // Flow upward and outward
        
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
            style={{
              left: '50%',
              top: '50%',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 0.9,
              scale: 1,
            }}
            animate={{
              x: [0, targetX * 0.5, targetX],
              y: [0, targetY * 0.5, targetY],
              opacity: [0.9, 0.7, 0],
              scale: [1, 0.9, 0.3],
            }}
            transition={{
              duration: duration + Math.random() * 0.3,
              delay: i * 0.04,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </>
  );
};

export const BhagavadGitaOracle: React.FC<BhagavadGitaOracleProps> = ({ className }) => {
  const { user } = useAuth();
  const { reading, generateReading } = useAIVedicReading();
  const [showParticles, setShowParticles] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  // Extract current cycle from Jyotish reading
  const currentCycle = useMemo(() => {
    if (!reading?.personalCompass?.currentDasha?.period) return null;
    const period = reading.personalCompass.currentDasha.period;
    // Extract planet from "Rahu Dasha" -> "Rahu"
    const planetName = period.split(' ')[0];
    return normalizePlanetName(planetName);
  }, [reading]);

  // Get verse for current cycle
  const verse: GitaVerse = useMemo(() => {
    return getGitaVerseForCycle(currentCycle);
  }, [currentCycle]);

  // Generate reading if user has birth details but no reading yet
  useEffect(() => {
    if (user && !reading && generateReading) {
      const fetchAndGenerate = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('birth_name, birth_date, birth_time, birth_place')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
            const userProfile: UserProfile = {
              name: data.birth_name,
              birthDate: data.birth_date,
              birthTime: data.birth_time,
              birthPlace: data.birth_place,
              plan: 'compass',
            };
            await generateReading(userProfile);
          }
        } catch (error) {
          console.error('Error fetching birth details for Gita Oracle:', error);
        }
      };
      fetchAndGenerate();
    }
  }, [user, reading, generateReading]);

  const handleTap = () => {
    setIsTapped(true);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 3000);
  };

  return (
    <Card
      className={`relative overflow-hidden border border-[#D4AF37]/60 cursor-pointer transition-all duration-300 hover:border-[#D4AF37] ${className || ''}`}
      style={{
        background: `
          linear-gradient(135deg, rgba(139, 69, 19, 0.2) 0%, rgba(101, 67, 33, 0.15) 50%, rgba(139, 69, 19, 0.1) 100%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139, 69, 19, 0.05) 2px,
            rgba(139, 69, 19, 0.05) 4px
          ),
          url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.02'%3E%3Cpath d='M50 50c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm0-30c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm0 60c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
          #1a0b2e
        `,
        boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.3)',
      }}
      onClick={handleTap}
    >
      {/* Gold knot corners (decorative corner design) */}
      <svg className="absolute top-0 left-0 w-8 h-8 opacity-50" viewBox="0 0 32 32">
        <path d="M0 0 L32 0 L32 8 L8 8 L8 32 L0 32 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        <path d="M4 4 L4 12 L12 12 L12 4 Z" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
      </svg>
      <svg className="absolute top-0 right-0 w-8 h-8 opacity-50" viewBox="0 0 32 32" transform="scale(-1, 1)">
        <path d="M0 0 L32 0 L32 8 L8 8 L8 32 L0 32 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        <path d="M4 4 L4 12 L12 12 L12 4 Z" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-8 h-8 opacity-50" viewBox="0 0 32 32" transform="scale(1, -1)">
        <path d="M0 0 L32 0 L32 8 L8 8 L8 32 L0 32 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        <path d="M4 4 L4 12 L12 12 L12 4 Z" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-8 h-8 opacity-50" viewBox="0 0 32 32" transform="scale(-1, -1)">
        <path d="M0 0 L32 0 L32 8 L8 8 L8 32 L0 32 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        <path d="M4 4 L4 12 L12 12 L12 4 Z" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm pointer-events-none" />

      {/* Gold dust particles */}
      <AnimatePresence>
        {showParticles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20"
          >
            <GoldDustParticles count={24} duration={2.5} />
          </motion.div>
        )}
      </AnimatePresence>

      <CardContent className="relative p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-lg font-serif text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            The Lord's Song (Gita)
          </h3>
        </div>

        <div className="space-y-4">
          {/* Sanskrit (Devanagari) */}
          <div className="text-2xl md:text-3xl font-serif leading-relaxed text-[#D4AF37]/90" style={{ fontFamily: 'Georgia, serif' }}>
            {verse.sanskrit}
          </div>

          {/* Transliteration */}
          <div className="text-sm md:text-base italic text-white/70 font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            {verse.transliteration}
          </div>

          {/* Producer's Translation */}
          <div className="text-sm md:text-base text-white/90 leading-relaxed max-w-2xl mx-auto">
            {verse.producersTranslation}
          </div>

          {/* Chapter/Verse reference */}
          <div className="text-xs text-[#D4AF37]/60 font-serif mt-2" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            Chapter {verse.chapter}, Verse {verse.verse}
          </div>
        </div>

        {isTapped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-xs text-[#D4AF37]/50 italic"
          >
            Ojas flows to your profile...
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
