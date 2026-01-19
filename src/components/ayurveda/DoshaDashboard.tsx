import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Brain, Heart, Leaf, Sparkles, RotateCcw, Utensils, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { getDoshaEmoji } from '@/lib/ayurvedaTypes';

interface DoshaDashboardProps {
  profile: AyurvedaUserProfile;
  dosha: DoshaProfile;
  dailyGuidance: string;
  isLoadingGuidance: boolean;
  onRestart: () => void;
  onFetchGuidance: () => void;
  isPremium?: boolean;
}

const DoshaChart = ({ vata, pitta, kapha }: { vata: number; pitta: number; kapha: number }) => {
  const data = [
    { name: 'Vata', value: vata, color: '#93c5fd' },
    { name: 'Pitta', value: pitta, color: '#f87171' },
    { name: 'Kapha', value: kapha, color: '#4ade80' },
  ];

  return (
    <div className="flex items-center justify-center gap-6">
      {data.map((item) => (
        <div key={item.name} className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/20" />
              <motion.circle 
                cx="40" cy="40" r="35" 
                stroke={item.color} 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={220}
                initial={{ strokeDashoffset: 220 }}
                animate={{ strokeDashoffset: 220 - (220 * item.value) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">{item.value}%</span>
            </div>
          </div>
          <span className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">{item.name}</span>
        </div>
      ))}
    </div>
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
  useEffect(() => {
    onFetchGuidance();
  }, [onFetchGuidance]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: Physical & Daily */}
      <div className="lg:col-span-4 space-y-8">
        <motion.div 
          className="bg-card p-8 rounded-3xl shadow-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-5 mb-8">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-3xl font-bold shadow-inner">
              {profile.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">{profile.name}</h2>
              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs">
                {getDoshaEmoji(dosha.primary)} {dosha.primary} Prakriti
              </Badge>
            </div>
          </div>
          
          <DoshaChart vata={dosha.vata} pitta={dosha.pitta} kapha={dosha.kapha} />
          
          <Button 
            variant="ghost"
            onClick={onRestart}
            className="w-full mt-6 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Reset Cosmic Blueprint
          </Button>
        </motion.div>

        <motion.div 
          className="bg-emerald-900 dark:bg-emerald-950 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sun className="w-16 h-16" />
          </div>
          <h3 className="font-serif text-2xl mb-6 flex items-center gap-3">
            <Moon className="w-5 h-5 text-amber-400" />
            Daily Guidance
          </h3>
          {isLoadingGuidance ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-emerald-800 rounded w-3/4" />
              <div className="h-4 bg-emerald-800 rounded" />
              <div className="h-4 bg-emerald-800 rounded w-5/6" />
            </div>
          ) : (
            <p className="text-base leading-relaxed opacity-90 italic">"{dailyGuidance}"</p>
          )}
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Personality & Advice */}
      <div className="lg:col-span-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            className="bg-card p-8 rounded-3xl shadow-xl border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-serif text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              Personality & Mind
            </h3>
            <Badge variant="outline" className="mb-3 text-xs">
              {dosha.mentalConstitution}
            </Badge>
            <p className="text-muted-foreground leading-relaxed">
              {dosha.personalitySummary}
            </p>
          </motion.div>

          <motion.div 
            className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-3xl shadow-xl border border-amber-100 dark:border-amber-800/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-serif text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-600" />
              Life Situation Advice
            </h3>
            <p className="text-amber-900/80 dark:text-amber-100/80 leading-relaxed italic">
              {dosha.lifeSituationAdvice}
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="bg-card p-10 rounded-3xl shadow-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-serif text-foreground mb-8">Integrated Healing Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground uppercase tracking-widest text-xs">Dietary Protocol</h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                {dosha.guidelines.diet.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-emerald-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-6">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground uppercase tracking-widest text-xs">Lifestyle Rituals</h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                {dosha.guidelines.lifestyle.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-emerald-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                <Leaf className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground uppercase tracking-widest text-xs">Botanical Support</h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                {dosha.guidelines.herbs.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-emerald-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {!isPremium && (
          <motion.div 
            className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-10 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="max-w-md">
              <h3 className="text-3xl font-serif mb-4">Deepen Your Practice</h3>
              <p className="opacity-80 leading-relaxed">
                Unlock AI Chat Consultations and the Live Audio Doctor for direct spoken healing sessions.
              </p>
            </div>
            <Button className="bg-amber-400 text-emerald-900 font-black px-10 py-5 h-auto rounded-3xl shadow-xl hover:bg-amber-300 hover:scale-105 transition-all uppercase tracking-widest text-sm">
              Upgrade to Premium
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};