import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Star, Sparkles, CheckCircle, AlertCircle, Quote, Crown, Compass, 
  Briefcase, Heart, Leaf, Coins, Clock, Gem, Target, Brain, Wand2, User, 
  RefreshCw, Volume2, VolumeX, Timer, MessageCircle, ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile, HoraInfo } from '@/lib/vedicTypes';
import { getPlanetEmoji, getEnergyGradient, getSuccessColor } from '@/lib/vedicTypes';
import { CosmicConsultation } from './CosmicConsultation';
import { TimezoneSelector, useUserTimezone } from './TimezoneSelector';
import { AccurateHoraWatch } from './AccurateHoraWatch';
import { HoraDateTimePicker } from './HoraDateTimePicker';

interface AIVedicDashboardProps {
  user: UserProfile;
  onEditDetails?: () => void;
  onUpgrade?: () => void;
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
      <h3 className="text-xl font-serif text-foreground animate-pulse">Syncing Hora Watch...</h3>
      <p className="text-muted-foreground text-xs font-mono uppercase tracking-[0.3em]">Calculating Planetary Success Ratings</p>
    </div>
  </div>
);

// Compass Pillar Card
const CompassCard = ({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) => {
  // Convert long text to bullet points
  const bullets = content.split(/[.!]/).filter(s => s.trim().length > 5).slice(0, 3);
  return (
    <motion.div 
      className="p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-indigo-500/50 transition-all duration-500"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5 text-indigo-400" />
        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{title}</h4>
      </div>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span>{b.trim()}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// Tappable Blueprint Card with expand
const BlueprintCard = ({ title, preview, content, icon }: { title: string; preview: string; content: string; icon: string }) => {
  const [expanded, setExpanded] = useState(false);
  // Extract a short preview from content
  const shortPreview = preview || content.split('.')[0] + '.';
  // Convert to bullets
  const bullets = content.split(/[.!]/).filter(s => s.trim().length > 5).slice(0, 5);

  return (
    <motion.button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h4 className="text-xs font-black text-amber-200 uppercase tracking-widest">{title}</h4>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-amber-400/60" />
        </motion.div>
      </div>
      {!expanded && (
        <p className="text-sm text-amber-100/60 italic pl-10 truncate">{shortPreview}</p>
      )}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden pl-10 pt-3"
          >
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
                  <span className="text-amber-400">◈</span>
                  <span>{b.trim()}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const AIVedicDashboard: React.FC<AIVedicDashboardProps> = ({ user, onEditDetails, onUpgrade }) => {
  const { reading, isLoading, error, generateReading } = useAIVedicReading();
  const { timezone, setTimezone, loading: timezoneLoading } = useUserTimezone();
  const [lastSync, setLastSync] = useState<string>("");
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [checkedRemedies, setCheckedRemedies] = useState<Record<number, boolean>>({});
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (user.birthDate && user.birthTime && user.birthPlace && !timezoneLoading) {
      generateReading(user, timeOffset, timezone);
      try {
        const targetTime = new Date(Date.now() + timeOffset * 60000);
        setLastSync(targetTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: timezone }));
      } catch {
        setLastSync(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }
    }
  }, [user.plan, user.birthDate, user.birthTime, user.birthPlace, timeOffset, timezone, timezoneLoading]);

  const handleTimeOffsetChange = (value: number[]) => setTimeOffset(value[0]);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

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

  if (error) {
    return (
      <Card className="border-2 border-destructive/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Celestial Sync Failed</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => generateReading(user, timeOffset)} className="mt-4">Retry Reading</Button>
        </CardContent>
      </Card>
    );
  }

  if (!reading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Cosmic Sync Status Header */}
      <div id="overview" />
      <motion.div 
        className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-card/50 backdrop-blur-md border border-border/50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Cosmic Coordinate Sync</p>
            <p className="text-xs text-foreground font-mono">{lastSync} | {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onEditDetails && (
            <Button variant="outline" size="sm" onClick={onEditDetails} className="text-[10px] font-bold uppercase tracking-widest h-8">
              Adjust Birth Data
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => generateReading(user, timeOffset, timezone)} disabled={isLoading} className="h-8">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* ══════════ HORA WATCH ══════════ */}
      <div id="hora" />
      <motion.section className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h2 className="text-[clamp(32px,5vw,50px)] font-black text-amber-300 font-serif leading-tight flex items-center gap-3">
          <Timer className="w-10 h-10 text-amber-400" />
          Hora Watch
        </h2>
        <p className="text-[11px] text-amber-500/80 font-black uppercase tracking-[0.3em] -mt-3">Planetary Success Timing • Dr. Pillai Method</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <TimezoneSelector currentTimezone={timezone} onTimezoneChange={setTimezone} compact />
          </div>

          <HoraDateTimePicker timeOffset={timeOffset} onTimeOffsetChange={(v) => setTimeOffset(v)} />

          {user.plan !== 'free' && (
            <div className="bg-background/80 border border-border p-5 rounded-3xl shadow-2xl space-y-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Time-Travel Scrubber</span>
              <Slider value={[timeOffset]} min={-720} max={720} step={30} onValueChange={handleTimeOffsetChange} className="w-full" />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>-12h</span>
                <span>{timeOffset === 0 ? 'Now' : `${timeOffset > 0 ? '+' : ''}${timeOffset}m`}</span>
                <span>+12h</span>
              </div>
            </div>
          )}
        </div>

        <AccurateHoraWatch timezone={timezone} timeOffset={timeOffset} userBirthChart={{}} />
      </motion.section>

      {/* ══════════ GURU ORACLE with SPEECH BUBBLE ══════════ */}
      <div id="consult-guru" />
      <section className="space-y-6">
        <h2 className="text-[clamp(32px,5vw,50px)] font-black text-purple-300 font-serif leading-tight flex items-center gap-3">
          <MessageCircle className="w-10 h-10 text-purple-400" />
          Consult the Guru
        </h2>
        {user.plan === 'premium' && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] uppercase tracking-widest">
            Oracle Active
          </Badge>
        )}

        {/* Akashic Verdict Speech Bubble Banner */}
        {reading.todayInfluence && (
          <motion.div
            className="relative p-6 rounded-3xl bg-purple-900/15 border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)]"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Speech bubble tail */}
            <div className="absolute -bottom-3 left-10 w-6 h-6 bg-purple-900/15 border-b border-r border-purple-500/30 transform rotate-45" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] block mb-2">Akashic Verdict</span>
                <p className="text-base sm:text-lg font-serif italic text-purple-100/90 leading-relaxed">
                  "{reading.todayInfluence.wisdomQuote}"
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSpeak(`${reading.todayInfluence.wisdomQuote}. Today's Nakshatra is ${reading.todayInfluence.nakshatra}. ${reading.todayInfluence.description}`)}
                className={`flex-shrink-0 rounded-2xl ${isSpeaking ? 'bg-purple-500 text-white border-purple-500' : 'border-purple-500/40 text-purple-300'}`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="ml-1.5 text-[10px] font-bold uppercase hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
              </Button>
            </div>
          </motion.div>
        )}

        <CosmicConsultation user={user} onUpgrade={onUpgrade} />
      </section>

      {/* ══════════ COSMIC PULSE (Nakshatra) ══════════ */}
      <div id="nakshatra" />
      <motion.section className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h2 className="text-[clamp(32px,5vw,50px)] font-black text-purple-300 font-serif leading-tight">
          Cosmic Pulse
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-purple-500/30">
            <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest block mb-1">Nakshatra Focus</span>
            <h3 className="text-3xl font-black text-foreground mb-4">{reading.todayInfluence.nakshatra}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 border-l-2 border-muted pl-4 italic">
              {reading.todayInfluence.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Optimal Flow
                </h4>
                <ul className="space-y-2">
                  {reading.todayInfluence.whatToDo.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Karmic Friction
                </h4>
                <ul className="space-y-2">
                  {reading.todayInfluence.whatToAvoid.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Soul Seed Quote */}
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-center text-center relative overflow-hidden">
            <div className="absolute top-4 right-4 text-4xl opacity-5">ॐ</div>
            <Quote className="w-8 h-8 text-amber-500/40 mx-auto mb-4" />
            <h4 className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-4">Soul Seed</h4>
            <p className="text-lg font-serif text-amber-100/80 leading-relaxed italic">
              "{reading.todayInfluence.wisdomQuote}"
            </p>
          </div>
        </div>
      </motion.section>

      {/* ══════════ 4 ETERNAL PILLARS (Compass Tier) ══════════ */}
      {user.plan !== 'free' && reading.personalCompass && (
        <motion.section className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className="text-[clamp(32px,5vw,50px)] font-black text-indigo-300 font-serif leading-tight">
            The 4 Eternal Pillars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <CompassCard icon={Briefcase} title="Career" content={reading.personalCompass.career} />
            <CompassCard icon={Heart} title="Harmony" content={reading.personalCompass.relationship} />
            <CompassCard icon={Leaf} title="Health" content={reading.personalCompass.health} />
            <CompassCard icon={Coins} title="Financial" content={reading.personalCompass.financial} />
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-indigo-900/5 border border-indigo-500/20">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-500/30 flex items-center justify-center shrink-0">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Timing</p>
                  <p className="text-lg font-bold text-foreground">{reading.personalCompass.currentDasha.period.split(' ')[0]}</p>
                </div>
              </div>
              <div className="space-y-2 text-center sm:text-left">
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

      {/* ══════════ SOUL BLUEPRINT - TAPPABLE CARD GRID ══════════ */}
      <div id="blueprint" />
      {user.plan === 'premium' && reading.masterBlueprint && (
        <motion.section className="space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <h2 className="text-[clamp(32px,5vw,50px)] font-black text-amber-300 font-serif leading-tight flex items-center gap-3">
            <Crown className="w-10 h-10 text-amber-400" />
            Soul Blueprint
          </h2>

          {/* Tappable Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BlueprintCard
              title="Soul Purpose"
              preview={reading.masterBlueprint.soulPurpose.split('.')[0]}
              content={reading.masterBlueprint.soulPurpose}
              icon="🔥"
            />
            <BlueprintCard
              title="D9 Navamsha"
              preview={reading.masterBlueprint.navamshaAnalysis.split('.')[0]}
              content={reading.masterBlueprint.navamshaAnalysis}
              icon="💎"
            />
            <BlueprintCard
              title="Karmic Nodes"
              preview={reading.masterBlueprint.karmicNodes.split('.')[0]}
              content={reading.masterBlueprint.karmicNodes}
              icon="🌀"
            />
            <BlueprintCard
              title="Karma Patterns"
              preview={reading.masterBlueprint.karmaPatterns.split('.')[0]}
              content={reading.masterBlueprint.karmaPatterns}
              icon="⚡"
            />
            <BlueprintCard
              title="12-House Mapping"
              preview={reading.masterBlueprint.soulMap12Houses.split('.')[0]}
              content={reading.masterBlueprint.soulMap12Houses}
              icon="✵"
            />
            <BlueprintCard
              title="Sade Sati Status"
              preview={reading.masterBlueprint.sadeSatiStatus}
              content={reading.masterBlueprint.sadeSatiStatus}
              icon="♄"
            />
          </div>

          {/* Active Planetary Yogas */}
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20">
            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-4 text-center flex items-center justify-center gap-2">
              <Gem className="w-4 h-4" />
              Active Planetary Yogas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reading.masterBlueprint.significantYogas.map((yoga, i) => (
                <div key={i} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                  <h5 className="text-sm font-bold text-amber-100 mb-1">{yoga.name}</h5>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{yoga.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════ REMEDIAL PROTOCOLS - ACTION BANNER ══════════ */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900/15 to-teal-900/10 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-center gap-3 mb-6">
              <Wand2 className="w-6 h-6 text-emerald-400" />
              <h3 className="text-[clamp(24px,4vw,36px)] font-black text-emerald-300 font-serif">Remedial Protocols</h3>
            </div>
            <p className="text-xs text-emerald-300/60 uppercase tracking-widest font-bold mb-6">
              Tap to mark as completed today
            </p>
            <div className="space-y-4">
              {reading.masterBlueprint.divineRemedies.map((remedy, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                    checkedRemedies[i]
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-card/30 border-border/40 hover:border-emerald-500/20'
                  }`}
                >
                  <Checkbox
                    checked={!!checkedRemedies[i]}
                    onCheckedChange={(checked) => setCheckedRemedies(prev => ({ ...prev, [i]: !!checked }))}
                    className="w-6 h-6 rounded-lg border-2 border-emerald-500/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <span className={`text-sm leading-relaxed ${checkedRemedies[i] ? 'text-emerald-300 line-through opacity-70' : 'text-foreground/80'}`}>
                    {remedy}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Timing Peaks */}
          <div className="p-5 rounded-2xl bg-muted/20 border border-border">
            <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">Primary Timing Peaks</h4>
            <p className="text-sm text-foreground font-medium">{reading.masterBlueprint.timingPeaks}</p>
          </div>
        </motion.section>
      )}
    </div>
  );
};
