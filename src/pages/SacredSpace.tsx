import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { GoldDustParticles } from '@/components/effects/GoldDustParticles';
import AkashicSiddhaReading from '@/components/vedic/AkashicSiddhaReading';
import { BookOpen, Sparkles, Hand, Heart, Zap } from 'lucide-react';
import type { UserProfile } from '@/lib/vedicTypes';

// Determine house from Jyotish reading (defaults to Ketu's house 12)
function getUserHouse(reading: any): number {
  // For now, default to house 12 (Ketu) - can be enhanced with actual Jyotish house calculation
  // This could be extracted from reading.masterBlueprint?.soulMap12Houses or similar
  return 12;
}

// Karmic Debt Meter Component
interface KarmicDebtMeterProps {
  debtLevel: number; // 0-100
  archetype?: string;
}

const KarmicDebtMeter: React.FC<KarmicDebtMeterProps> = ({ debtLevel, archetype }) => {
  const getDebtColor = (level: number) => {
    if (level < 30) return 'from-emerald-500/20 to-teal-500/20';
    if (level < 60) return 'from-amber-500/20 to-orange-500/20';
    return 'from-rose-500/20 to-red-500/20';
  };

  const getDebtLabel = (level: number) => {
    if (level < 30) return 'Light Karma';
    if (level < 60) return 'Moderate Karma';
    return 'Deep Karma';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-900/30 via-violet-800/20 to-black border-purple-500/30">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            Karmic Debt Meter
          </h3>
          {archetype && (
            <span className="text-xs uppercase tracking-widest text-[#D4AF37]/70" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {archetype}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {getDebtLabel(debtLevel)}
            </span>
            <span className="text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {debtLevel}%
            </span>
          </div>
          
          <div className="relative h-3 bg-black/40 rounded-full overflow-hidden border border-[#D4AF37]/20">
            <motion.div
              className={`h-full bg-gradient-to-r ${getDebtColor(debtLevel)}`}
              initial={{ width: 0 }}
              animate={{ width: `${debtLevel}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
};

const SacredSpace: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reading, generateReading } = useAIVedicReading();
  const [akashicModalOpen, setAkashicModalOpen] = useState(false);
  const [karmicDebtLevel, setKarmicDebtLevel] = useState(45); // Initial debt level
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

  const sacredTools = [
    {
      id: 'akashic',
      title: 'Akashic Records',
      description: 'Access your past life archetype',
      icon: BookOpen,
      gradient: 'from-purple-900/60 via-violet-800/40 to-black/60',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
      iconColor: 'text-purple-300',
      iconBg: 'bg-purple-500/20',
    },
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
      id: 'vedic-astrology',
      title: 'Vedic Astrology',
      description: 'Daily influence + blueprint',
      icon: Sparkles,
      gradient: 'from-cyan-900/60 via-blue-800/40 to-black/60',
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-500/20',
      iconColor: 'text-cyan-300',
      iconBg: 'bg-cyan-500/20',
      href: '/vedic-astrology',
    },
    {
      id: 'mantras',
      title: 'Mantras',
      description: 'Sacred sound healing',
      icon: Heart,
      gradient: 'from-rose-900/60 via-pink-800/40 to-black/60',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
      iconColor: 'text-rose-300',
      iconBg: 'bg-rose-500/20',
      href: '/mantras',
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

      {/* Karmic Debt Meter */}
      <div className="mb-8">
        <KarmicDebtMeter debtLevel={karmicDebtLevel} archetype={revealedArchetype || undefined} />
      </div>

      {/* Sacred Tools Grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          Sacred Tools
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {sacredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                onClick={() => {
                  if (tool.id === 'akashic') {
                    setAkashicModalOpen(true);
                  } else if (tool.href) {
                    window.location.href = tool.href;
                  }
                }}
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

      {/* Akashic Records Modal */}
      <Dialog open={akashicModalOpen} onOpenChange={setAkashicModalOpen}>
        <DialogContent className="max-w-3xl bg-[#0a0a0a] border-[#D4AF37]/30 p-0 overflow-hidden">
          <div className="relative">
            <AkashicSiddhaReading 
              userHouse={userHouse} 
              onComplete={handleAkashicComplete}
              isModal={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SacredSpace;
