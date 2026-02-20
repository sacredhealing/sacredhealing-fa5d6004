import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GoldDustParticles } from '@/components/effects/GoldDustParticles';
import AkashicSiddhaReading from '@/components/vedic/AkashicSiddhaReading';
import KarmicDebtMeter from '@/components/vedic/KarmicDebtMeter';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Hand, Lock } from 'lucide-react';
import type { UserProfile } from '@/lib/vedicTypes';

// Determine house from Jyotish reading (defaults to Ketu's house 12)
function getUserHouse(reading: any): number {
  // For now, default to house 12 (Ketu) - can be enhanced with actual Jyotish house calculation
  // This could be extracted from reading.masterBlueprint?.soulMap12Houses or similar
  return 12;
}

const SacredSpace: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reading, generateReading } = useAIVedicReading();
  const [karmicDebtLevel, setKarmicDebtLevel] = useState(58); // % debt remaining → 42% purified (Rahu age 42 reference)
  const [revealedArchetype, setRevealedArchetype] = useState<string | null>(null);
  const [showGoldDust, setShowGoldDust] = useState(false);

  // Determine user house from Jyotish reading
  const userHouse = useMemo(() => {
    return getUserHouse(reading);
  }, [reading]);

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
              plan: 'compass', // Default plan
            };
            await generateReading(userProfile);
          }
        } catch (error) {
          console.error('Error generating reading:', error);
        }
      };
      fetchAndGenerate();
    }
  }, [user, reading, generateReading]);

  const handleAkashicComplete = (archetype: string) => {
    setRevealedArchetype(archetype);
    // Update karmic debt meter - reduce debt when archetype is revealed
    setKarmicDebtLevel(prev => Math.max(0, prev - 15));
    
    // Show gold dust particles if Sovereign Atma is revealed
    if (archetype === 'The Sovereign Atma') {
      setShowGoldDust(true);
      setTimeout(() => setShowGoldDust(false), 3000);
    }
  };

  const navigate = useNavigate();
  const hubBottomTools = [
    {
      id: 'hand-analyzer',
      title: 'Hand Analyzer',
      description: 'Vedic palm reading',
      icon: Hand,
      gradient: 'from-amber-900/60 via-yellow-800/40 to-black/60',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
      iconColor: 'text-amber-300',
      iconBg: 'bg-amber-500/20',
      href: '/hand-analyzer',
    },
    {
      id: 'secret-wisdom-vault',
      title: 'Secret Wisdom Vault',
      description: 'Saved verses & soul profile',
      icon: Lock,
      gradient: 'from-purple-900/60 via-violet-800/40 to-black/60',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
      iconColor: 'text-purple-300',
      iconBg: 'bg-purple-500/20',
      href: '/explore',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] px-4 pb-24 pt-6 relative overflow-hidden">
      {/* Gold Dust Particles Background Effect */}
      <AnimatePresence>
        {showGoldDust && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <GoldDustParticles count={30} duration={3} />
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          Sacred Space
        </h1>
        <p className="text-white/70 text-lg" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          Access your karmic blueprint and sacred tools
        </p>
      </div>

      {/* HUB TOP: Karmic Debt Meter — 42% purified (Rahu age 42 reference) */}
      <div className="mb-8">
        <KarmicDebtMeter progress={Math.round(100 - karmicDebtLevel)} />
      </div>

      {/* HUB MIDDLE: Akashic Siddha Reading (inline) */}
      <section className="mb-8 rounded-2xl border border-[#D4AF37]/20 bg-black/30 backdrop-blur-sm overflow-hidden">
        <AkashicSiddhaReading
          userHouse={userHouse}
          onComplete={handleAkashicComplete}
          isModal={false}
        />
      </section>

      {/* HUB BOTTOM: Hand Analyzer + Secret Wisdom Vault */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          Sacred Tools
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {hubBottomTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                onClick={() => tool.href && navigate(tool.href)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden rounded-2xl border ${tool.border} bg-gradient-to-br ${tool.gradient} p-5 text-left shadow-lg ${tool.glow} transition-all duration-200`}
              >
                <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                </div>
                <div className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  {tool.title}
                </div>
                <div className="text-xs text-white/60" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  {tool.description}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SacredSpace;
