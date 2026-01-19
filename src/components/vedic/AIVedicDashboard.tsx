import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Star, Sparkles, CheckCircle, AlertCircle, Quote, Crown, Compass, Briefcase, Heart, Leaf, Coins, Clock, Gem, Target, Brain, Wand2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile, MembershipTier } from '@/lib/vedicTypes';

interface AIVedicDashboardProps {
  user: UserProfile;
  onEditDetails?: () => void;
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8">
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 border-[3px] border-purple-500/10 rounded-full" />
      <motion.div 
        className="absolute inset-0 border-[3px] border-purple-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-4 border-[3px] border-indigo-400/20 rounded-full" />
      <motion.div 
        className="absolute inset-4 border-[3px] border-indigo-400 border-b-transparent rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-serif text-foreground animate-pulse">Calculating Karma Matrices...</h3>
      <p className="text-muted-foreground text-xs font-mono uppercase tracking-[0.3em]">Synchronizing D1 & D9 Divisions</p>
    </div>
  </div>
);

const CompassCard = ({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) => (
  <motion.div 
    className="p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-indigo-500/50 transition-all duration-500"
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center gap-3 mb-3">
      <Icon className="w-5 h-5 text-indigo-400" />
      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</h4>
    </div>
    <p className="text-xs text-foreground/80 leading-relaxed">{content}</p>
  </motion.div>
);

const BlueprintMiniCard = ({ title, content, icon }: { title: string; content: string; icon: string }) => (
  <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xl">{icon}</span>
      <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">{title}</h4>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
  </div>
);

export const AIVedicDashboard: React.FC<AIVedicDashboardProps> = ({ user, onEditDetails }) => {
  const { reading, isLoading, error, generateReading } = useAIVedicReading();

  useEffect(() => {
    if (user.birthDate && user.birthTime && user.birthPlace) {
      generateReading(user);
    }
  }, [user.plan, user.birthDate, user.birthTime, user.birthPlace, generateReading]);

  if (!user.birthDate || !user.birthTime || !user.birthPlace) {
    return (
      <Card className="border-2 border-primary/30">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Birth Details Required</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add your complete birth details to generate your personalized AI-powered Vedic reading.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card className="border-2 border-destructive/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Celestial Sync Failed</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button 
            onClick={() => generateReading(user)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            Retry Reading
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!reading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Guru Efficiency Section */}
      <motion.section 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-blue-500/30">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">Guru Efficiency Hack</h2>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{reading.guruEfficiencyHack.toolCategory} Priority</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">{reading.guruEfficiencyHack.recommendedTool}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{reading.guruEfficiencyHack.whyThisTool}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Guru's Workflow:</h4>
                    <ul className="space-y-3">
                      {reading.guruEfficiencyHack.workflow.map((step, i) => (
                        <li key={i} className="flex gap-3 text-xs text-foreground/80">
                          <span className="text-blue-500 font-bold">{i + 1}.</span> {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Expert Pro-Tip:</h4>
                      <p className="text-xs text-blue-100 italic">"{reading.guruEfficiencyHack.proTip}"</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-xl border border-border">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Limitation:</h4>
                      <p className="text-[10px] text-muted-foreground">{reading.guruEfficiencyHack.limitation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Today's Cosmic Pulse */}
      <motion.section 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <h2 className="text-2xl font-bold text-foreground font-serif">Today's Cosmic Pulse</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Badge className="px-3 py-1 bg-purple-500/10 border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                Nakshatra Insight
              </Badge>
              <h3 className="text-xl font-bold text-foreground">Current: {reading.todayInfluence.nakshatra}</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed italic mb-8 border-l-2 border-muted pl-4">
              {reading.todayInfluence.description}
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Dharmic Actions
                </h4>
                <ul className="space-y-2">
                  {reading.todayInfluence.whatToDo.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✦</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Karmic Resistance
                </h4>
                <ul className="space-y-2">
                  {reading.todayInfluence.whatToAvoid.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">✦</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-8 flex flex-col justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-4xl opacity-5 font-serif">ॐ</div>
            <Quote className="w-8 h-8 text-amber-500/40 mx-auto mb-4" />
            <h4 className="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest mb-6">Jyotish Sutra</h4>
            <p className="text-lg font-serif text-amber-100/80 leading-relaxed italic">
              "{reading.todayInfluence.wisdomQuote}"
            </p>
          </div>
        </div>
      </motion.section>

      {/* Personal Vedic Compass (Compass Tier) */}
      {user.plan !== 'free' && reading.personalCompass && (
        <motion.section 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-indigo-500 rounded-full" />
              <h2 className="text-2xl font-bold text-foreground font-serif">Personal Vedic Compass</h2>
            </div>
            <Badge className="px-4 py-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3 mr-1" />
              Active Mahadasha
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CompassCard icon={Briefcase} title="Career" content={reading.personalCompass.career} />
            <CompassCard icon={Heart} title="Harmony" content={reading.personalCompass.relationship} />
            <CompassCard icon={Leaf} title="Prana" content={reading.personalCompass.health} />
            <CompassCard icon={Coins} title="Artha" content={reading.personalCompass.financial} />
          </div>

          <div className="p-8 rounded-2xl bg-indigo-900/5 border border-indigo-500/20">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-500/30 flex items-center justify-center shrink-0">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Timing</p>
                  <p className="text-lg font-bold text-foreground">{reading.personalCompass.currentDasha.period.split(' ')[0]}</p>
                </div>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl font-bold text-foreground">Major Period: {reading.personalCompass.currentDasha.period}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{reading.personalCompass.currentDasha.meaning}</p>
                <Badge className="mt-2 px-4 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest">
                  <Target className="w-3 h-3 mr-1" />
                  Focus: {reading.personalCompass.currentDasha.focusArea}
                </Badge>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Master Soul Blueprint (Premium Tier) */}
      {user.plan === 'premium' && reading.masterBlueprint && (
        <motion.section 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
            <h2 className="text-2xl font-bold text-foreground font-serif flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              Master Soul Blueprint
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Soul Strength & Nodes */}
            <div className="space-y-6">
              <BlueprintMiniCard title="Navamsha Soul Strength (D9)" content={reading.masterBlueprint.navamshaAnalysis} icon="💎" />
              <BlueprintMiniCard title="Karmic Node Analysis" content={reading.masterBlueprint.karmicNodes} icon="🌀" />
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Divine Remedial Protocols
                </h4>
                <ul className="space-y-3">
                  {reading.masterBlueprint.divineRemedies.map((rem, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-3">
                      <span className="text-emerald-500">ॐ</span> {rem}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Central Analysis */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border relative overflow-hidden">
                <div className="absolute -right-8 -top-8 text-9xl opacity-5 pointer-events-none">✵</div>
                <h3 className="text-xl font-bold text-foreground mb-6 font-serif flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  12-House Soul Mapping
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {reading.masterBlueprint.soulMap12Houses}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/30 border border-border p-6 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Saturn Sade Sati Status</h4>
                  <p className="text-sm text-foreground font-medium">{reading.masterBlueprint.sadeSatiStatus}</p>
                </div>
                <div className="bg-muted/30 border border-border p-6 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Primary Timing Peaks</h4>
                  <p className="text-sm text-foreground font-medium">{reading.masterBlueprint.timingPeaks}</p>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-6 text-center flex items-center justify-center gap-2">
                  <Gem className="w-4 h-4" />
                  Active Planetary Yogas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reading.masterBlueprint.significantYogas.map((yoga, i) => (
                    <div key={i} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                      <h5 className="text-sm font-bold text-amber-100 mb-1">{yoga.name}</h5>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{yoga.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Soul Purpose & Karma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Soul Purpose Analysis
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{reading.masterBlueprint.soulPurpose}</p>
            </div>
            <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Karma Pattern Insights
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{reading.masterBlueprint.karmaPatterns}</p>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};
