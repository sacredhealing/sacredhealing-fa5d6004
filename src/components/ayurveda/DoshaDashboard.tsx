import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Brain, Heart, Leaf, Sparkles, RotateCcw, Moon, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { getDoshaEmoji } from '@/lib/ayurvedaTypes';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';

interface DoshaDashboardProps {
  profile: AyurvedaUserProfile;
  dosha: DoshaProfile;
  dailyGuidance: string;
  isLoadingGuidance: boolean;
  onRestart: () => void;
  onFetchGuidance: () => void;
  isPremium?: boolean;
}

/* ─── SIDDHA HERB DATA ─── */
const SIDDHA_HERBS: Record<string, { siddhaProperty: string; element: string }> = {
  ashwagandha: { siddhaProperty: 'Ojas Builder', element: '🌍 Earth' },
  brahmi: { siddhaProperty: 'Medha Rasayana', element: '💧 Water' },
  turmeric: { siddhaProperty: 'Agni Kindler', element: '🔥 Fire' },
  tulsi: { siddhaProperty: 'Sattva Amplifier', element: '🌬️ Air' },
  triphala: { siddhaProperty: 'Tridosha Balancer', element: '☯️ Ether' },
  shatavari: { siddhaProperty: 'Soma Nectar', element: '💧 Water' },
  neem: { siddhaProperty: 'Rakta Shodhana', element: '🌬️ Air' },
  ginger: { siddhaProperty: 'Deepana Fire', element: '🔥 Fire' },
  licorice: { siddhaProperty: 'Rasa Builder', element: '🌍 Earth' },
  guggulu: { siddhaProperty: 'Lekhana Catalyst', element: '🔥 Fire' },
};

const getSiddhaProperty = (herbName: string) => {
  const key = herbName.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
  return SIDDHA_HERBS[key] || { siddhaProperty: 'Sacred Essence', element: '☯️ Ether' };
};

/* ─── RITUAL TIMELINE ─── */
const RITUAL_PHASES = [
  { time: '5:00 AM', label: 'Brahma Muhurta', icon: '🌅', phase: 'dawn' },
  { time: '7:00 AM', label: 'Morning Agni', icon: '☀️', phase: 'morning' },
  { time: '12:00 PM', label: 'Pitta Peak', icon: '🔥', phase: 'midday' },
  { time: '6:00 PM', label: 'Sandhya Kala', icon: '🌇', phase: 'evening' },
  { time: '9:00 PM', label: 'Kapha Rest', icon: '🌙', phase: 'night' },
];

/* ─── DOSHA ORB COMPONENT ─── */
const DoshaOrb = ({ name, value, color, glowColor, delay }: { 
  name: string; value: number; color: string; glowColor: string; delay: number 
}) => {
  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8, type: 'spring' }}
    >
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-[-8px] rounded-full opacity-40"
          style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
        />
        {/* Main orb */}
        <motion.div
          className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
          style={{ 
            background: `radial-gradient(circle at 35% 35%, ${color}88, ${color}44 50%, ${color}22 80%)`,
            boxShadow: `0 0 30px ${glowColor}66, inset 0 0 20px ${glowColor}33`,
            border: `1.5px solid ${glowColor}55`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {/* Inner highlight */}
          <motion.div
            className="absolute w-8 h-8 rounded-full"
            style={{ 
              background: `radial-gradient(circle, ${color}99, transparent)`,
              top: '15%', left: '20%',
              filter: 'blur(4px)',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative z-10 text-center">
            <span className="text-2xl font-black text-white drop-shadow-lg">{value}%</span>
          </div>
        </motion.div>
      </div>
      <span className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">{name}</span>
    </motion.div>
  );
};

export const DoshaDashboard: React.FC<DoshaDashboardProps> = ({ 
  profile, 
  dosha, 
  dailyGuidance,
  isLoadingGuidance,
  onRestart,
  onFetchGuidance,
  isPremium = false
}) => {
  const [syncing, setSyncing] = useState(false);
  const jyotish = useJyotishProfile();

  useEffect(() => {
    onFetchGuidance();
  }, [onFetchGuidance]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  // Map guidelines to ritual phases
  const getRitualItems = (phase: string) => {
    const allItems = [
      ...dosha.guidelines.diet.map(d => ({ text: d, type: 'diet' as const })),
      ...dosha.guidelines.lifestyle.map(l => ({ text: l, type: 'lifestyle' as const })),
    ];
    const perPhase = Math.ceil(allItems.length / RITUAL_PHASES.length);
    const idx = RITUAL_PHASES.findIndex(r => r.phase === phase);
    return allItems.slice(idx * perPhase, (idx + 1) * perPhase);
  };

  return (
    <div className="space-y-8">
      {/* ─── PROFILE & DOSHA ORBS ─── */}
      <motion.div 
        className="relative p-8 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,10,40,0.95), rgba(10,5,25,0.98))',
          border: '1px solid rgba(147,51,234,0.2)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Ambient bg */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(147,51,234,0.3), transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,242,254,0.2), transparent 50%)',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
              style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(147,51,234,0.3)' }}>
              <span className="text-purple-200">{profile.name[0]}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{profile.name}</h2>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold uppercase tracking-widest text-[10px]">
                {getDoshaEmoji(dosha.primary)} {dosha.primary} Prakriti
              </Badge>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Jyotish Sync'}
              </Button>
            </div>
          </div>

          {/* Dosha Planetary Orbs */}
          <div className="flex items-center justify-center gap-10 py-4">
            <DoshaOrb name="Vata" value={dosha.vata} color="#60a5fa" glowColor="#3b82f6" delay={0} />
            <DoshaOrb name="Pitta" value={dosha.pitta} color="#f59e0b" glowColor="#d97706" delay={0.2} />
            <DoshaOrb name="Kapha" value={dosha.kapha} color="#34d399" glowColor="#10b981" delay={0.4} />
          </div>

          {/* ─── JYOTISH DOSHA INSIGHT ─── */}
          {!jyotish.isLoading && (
            <motion.div
              className="mt-6 p-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(217,170,0,0.08), rgba(168,85,247,0.06))',
                border: '1px solid rgba(217,170,0,0.15)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-300/80">
                  Jyotish Dosha Sync
                </span>
              </div>
              <p className="text-purple-200/70 text-sm leading-relaxed">
                Your <span className="text-amber-300 font-bold">{jyotish.mahadasha} Mahadasha</span> aligns with{' '}
                <span className="text-purple-300 font-bold">{jyotish.primaryDosha}</span> constitution.{' '}
                Current karma focus: <span className="text-amber-200/90 italic">{jyotish.karmaFocus}</span>.
                {jyotish.doshaImbalance && (
                  <> Watch for <span className="text-rose-300/80">{jyotish.doshaImbalance}</span> during this transit.</>
                )}
              </p>
            </motion.div>
          )}

          <AnimatePresence>
            {syncing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 text-center text-purple-300/70 text-xs italic"
              >
                ✦ Aligning Dosha frequencies with current planetary transits... ✦
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            variant="ghost"
            onClick={onRestart}
            className="w-full mt-4 text-[10px] text-purple-400/50 uppercase tracking-[0.2em] font-black hover:text-purple-300"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Reset Cosmic Blueprint
          </Button>
        </div>
      </motion.div>

      {/* ─── RISHI'S MIRROR & PERSONALITY ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          className="p-8 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(20,10,40,0.95), rgba(30,15,50,0.9))',
            border: '1px solid rgba(147,51,234,0.15)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-serif text-purple-200 mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Personality & Mind
          </h3>
          <Badge className="mb-3 text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20">
            {dosha.mentalConstitution}
          </Badge>
          <p className="text-purple-200/70 leading-relaxed text-sm">
            {dosha.personalitySummary}
          </p>
        </motion.div>

        {/* RISHI'S MIRROR — Sovereign Verdict */}
        <motion.div 
          className="relative p-8 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(40,10,60,0.98), rgba(20,5,35,0.95))',
            border: '1px solid rgba(168,85,247,0.25)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Palm leaf texture overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg, transparent, transparent 8px, rgba(168,85,247,0.3) 8px, rgba(168,85,247,0.3) 9px
            )`,
          }} />
          <div className="relative z-10">
            <h3 className="text-lg font-serif text-amber-300 mb-1 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-400" />
              The Rishi's Mirror
            </h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400/60 mb-4 font-bold">
              Your Karmic Constitution
            </p>
            <p className="text-purple-100/80 leading-relaxed italic text-sm">
              "{dosha.lifeSituationAdvice}"
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── DAILY GUIDANCE ─── */}
      <motion.div 
        className="p-8 rounded-3xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,10,40,0.95), rgba(15,5,30,0.98))',
          border: '1px solid rgba(147,51,234,0.15)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sun className="w-16 h-16 text-amber-400" />
        </div>
        <h3 className="font-serif text-xl mb-4 flex items-center gap-3 text-purple-100">
          <Moon className="w-5 h-5 text-amber-400" />
          Daily Guidance
        </h3>
        {isLoadingGuidance ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-purple-900/40 rounded w-3/4" />
            <div className="h-4 bg-purple-900/40 rounded" />
            <div className="h-4 bg-purple-900/40 rounded w-5/6" />
          </div>
        ) : (
          <p className="text-base leading-relaxed text-purple-200/80 italic">"{dailyGuidance}"</p>
        )}
      </motion.div>

      {/* ─── SACRED DAILY RITUAL TIMELINE ─── */}
      <motion.div 
        className="p-8 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(20,10,40,0.95), rgba(10,5,25,0.98))',
          border: '1px solid rgba(147,51,234,0.15)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-serif text-white mb-2">Sacred Daily Ritual</h2>
        <p className="text-purple-400/60 text-xs uppercase tracking-[0.15em] font-bold mb-8">Integrated Healing Timeline</p>

        <div className="relative">
          {/* Gold Thread */}
          <div className="absolute left-6 top-0 bottom-0 w-px" 
            style={{ background: 'linear-gradient(to bottom, rgba(217,170,0,0.6), rgba(217,170,0,0.1))' }} />

          <div className="space-y-6">
            {RITUAL_PHASES.map((ritual, idx) => {
              const items = getRitualItems(ritual.phase);
              return (
                <motion.div
                  key={ritual.phase}
                  className="flex gap-5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                >
                  {/* Gold node */}
                  <div className="relative z-10 flex-shrink-0 w-12 flex items-start justify-center pt-1">
                    <div className="w-3 h-3 rounded-full" style={{
                      background: 'linear-gradient(135deg, #d9aa00, #f5d442)',
                      boxShadow: '0 0 10px rgba(217,170,0,0.5)',
                    }} />
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{ritual.icon}</span>
                      <div>
                        <span className="text-amber-300/90 text-xs font-bold">{ritual.time}</span>
                        <h4 className="text-white text-sm font-bold">{ritual.label}</h4>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <ul className="space-y-1.5 ml-1">
                        {items.map((item, i) => (
                          <li key={i} className="text-purple-200/60 text-xs flex items-start gap-2">
                            <span className="text-amber-400/60 mt-0.5">•</span>
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ─── SACRED HERBARIUM ─── */}
      <motion.div 
        className="p-8 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(20,10,40,0.95), rgba(10,5,25,0.98))',
          border: '1px solid rgba(147,51,234,0.15)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-serif text-white mb-2">Sacred Herbarium</h2>
        <p className="text-purple-400/60 text-xs uppercase tracking-[0.15em] font-bold mb-6">Botanical Essence Cards</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dosha.guidelines.herbs.map((herb, i) => {
            const { siddhaProperty, element } = getSiddhaProperty(herb);
            return (
              <motion.div
                key={i}
                className="relative p-5 rounded-2xl overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(30,15,50,0.8), rgba(20,10,35,0.9))',
                  border: '1px solid rgba(52,211,153,0.15)',
                }}
                whileHover={{ scale: 1.02, borderColor: 'rgba(52,211,153,0.4)' }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                {/* Molecular aura glow */}
                <motion.div
                  className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ background: `radial-gradient(circle, rgba(52,211,153,0.6), transparent 70%)` }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400/60">{element}</span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{herb}</h4>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] font-bold">
                    {siddhaProperty}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── UPGRADE CTA ─── */}
      {!isPremium && (
        <motion.div 
          className="p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8"
          style={{
            background: 'linear-gradient(135deg, rgba(40,10,60,0.95), rgba(20,5,35,0.98))',
            border: '1px solid rgba(168,85,247,0.2)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="max-w-md">
            <h3 className="text-2xl font-serif mb-3 text-white">Deepen Your Practice</h3>
            <p className="text-purple-300/60 leading-relaxed text-sm">
              Unlock the Divine Physician and Live Audio Doctor for direct spoken healing sessions.
            </p>
          </div>
          <Button className="bg-amber-400 text-black font-black px-10 py-5 h-auto rounded-2xl shadow-xl hover:bg-amber-300 hover:scale-105 transition-all uppercase tracking-widest text-sm">
            <Zap className="w-4 h-4 mr-2" /> Upgrade
          </Button>
        </motion.div>
      )}
    </div>
  );
};
