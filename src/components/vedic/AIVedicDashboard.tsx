import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Star, Sparkles, CheckCircle, AlertCircle, Quote, Crown, Compass, 
  Briefcase, Heart, Leaf, Coins, Clock, Gem, Target, Brain, Wand2, User, 
  RefreshCw, Volume2, VolumeX, Timer, MessageCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile, HoraInfo } from '@/lib/vedicTypes';
import { getPlanetEmoji, getEnergyGradient, getSuccessColor } from '@/lib/vedicTypes';
import { CosmicConsultation } from './CosmicConsultation';
import { TimezoneSelector, useUserTimezone } from './TimezoneSelector';

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

// Success Meter Circle Component
const SuccessMeter = ({ rating }: { rating: number }) => {
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (circumference * rating) / 100;
  
  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle 
          cx="64" cy="64" r="58" 
          stroke="currentColor" 
          strokeWidth="8" 
          fill="transparent" 
          className="text-muted/20" 
        />
        <motion.circle 
          cx="64" cy="64" r="58" 
          stroke="currentColor" 
          strokeWidth="8" 
          fill="transparent" 
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={getSuccessColor(rating)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-2xl font-bold text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {rating}%
        </motion.span>
        <span className="text-[8px] text-muted-foreground font-bold uppercase">Success</span>
      </div>
    </div>
  );
};

// Upcoming Hora Card
const UpcomingHoraCard = ({ hora }: { hora: HoraInfo }) => (
  <div className="flex items-center justify-between p-3 rounded-2xl bg-background/40 hover:bg-primary/5 transition-all group">
    <div className="flex items-center gap-3">
      <span className="text-xl">{getPlanetEmoji(hora.planet)}</span>
      <div>
        <p className="text-xs font-bold text-foreground">{hora.planet}</p>
        <p className="text-[9px] text-muted-foreground font-bold">{hora.startTime}</p>
      </div>
    </div>
    <div className={`text-[10px] font-bold ${getSuccessColor(hora.successRating)}`}>
      {hora.successRating}%
    </div>
  </div>
);

export const AIVedicDashboard: React.FC<AIVedicDashboardProps> = ({ user, onEditDetails, onUpgrade }) => {
  const { reading, isLoading, error, generateReading } = useAIVedicReading();
  const { timezone, setTimezone, loading: timezoneLoading } = useUserTimezone();
  const [lastSync, setLastSync] = useState<string>("");
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Generate reading when user details, time offset, or timezone changes
  useEffect(() => {
    if (user.birthDate && user.birthTime && user.birthPlace && !timezoneLoading) {
      console.log('Triggering Vedic reading generation for:', user.name, 'timezone:', timezone);
      generateReading(user, timeOffset, timezone);
      
      // Format sync time in user's timezone
      try {
        const targetTime = new Date(Date.now() + timeOffset * 60000);
        setLastSync(targetTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: timezone,
        }));
      } catch {
        setLastSync(new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
        }));
      }
    }
  }, [user.plan, user.birthDate, user.birthTime, user.birthPlace, timeOffset, timezone, timezoneLoading]);

  // Auto-refresh Hora Watch every hour to keep it accurate
  useEffect(() => {
    if (!user.birthDate || !user.birthTime || !user.birthPlace || timezoneLoading) return;
    
    // Calculate ms until next hour boundary (when hora changes)
    const now = new Date();
    const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
    
    // Set timeout to refresh at the next hour mark
    const timeoutId = setTimeout(() => {
      console.log('Auto-refreshing Hora Watch at hour boundary');
      generateReading(user, timeOffset, timezone);
    }, msUntilNextHour);
    
    return () => clearTimeout(timeoutId);
  }, [user, timeOffset, timezone, timezoneLoading, reading]);

  const handleTimeOffsetChange = (value: number[]) => {
    setTimeOffset(value[0]);
  };

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

  if (isLoading && !reading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card className="border-2 border-destructive/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Celestial Sync Failed</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button 
            onClick={() => generateReading(user, timeOffset)}
            className="mt-4"
          >
            Retry Reading
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!reading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Cosmic Sync Status Header */}
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEditDetails}
              className="text-[10px] font-bold uppercase tracking-widest h-8"
            >
              Adjust Birth Data
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateReading(user, timeOffset, timezone)}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* HORA WATCH - DR PILLAI EDITION */}
      {reading.horaWatch && (
        <motion.section 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-4xl font-bold text-foreground font-serif italic flex items-center gap-3">
                  <Timer className="w-8 h-8 text-amber-400" />
                  Hora Watch
                </h2>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em]">Planetary Success Timing</p>
              </div>

              {/* Timezone Selector - Compact version */}
              <TimezoneSelector
                currentTimezone={timezone}
                onTimezoneChange={setTimezone}
                compact
              />
            </div>

            {/* Time Travel Scrubber (Subscribers only) */}
            {user.plan !== 'free' && (
              <div className="bg-background/80 border border-border p-5 rounded-3xl shadow-2xl">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase mb-3">
                  <span className="text-indigo-400">Time-Travel Scrubber</span>
                  <span>{timeOffset === 0 ? 'Live Now' : `${timeOffset > 0 ? '+' : ''}${timeOffset}m`}</span>
                </div>
                <Slider
                  value={[timeOffset]}
                  min={-720}
                  max={720}
                  step={30}
                  onValueChange={handleTimeOffsetChange}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-2">
                  <span>-12h</span>
                  <span>Now</span>
                  <span>+12h</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Watch Card */}
            <div className="md:col-span-2 relative group">
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${getEnergyGradient(reading.horaWatch.currentHora.energyType)} rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000`}></div>
              <div className="relative p-10 rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 h-full overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Success Meter Circle */}
                  <SuccessMeter rating={reading.horaWatch.currentHora.successRating} />

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-bold text-foreground">{reading.horaWatch.currentHora.planet}</h3>
                      <div className="text-4xl">{getPlanetEmoji(reading.horaWatch.currentHora.planet)}</div>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] ${
                        reading.horaWatch.currentHora.energyType === 'Auspicious' 
                          ? 'border-emerald-500/30 text-emerald-400' 
                          : reading.horaWatch.currentHora.energyType === 'Neutral'
                          ? 'border-amber-500/30 text-amber-400'
                          : 'border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {reading.horaWatch.currentHora.energyType} • {reading.horaWatch.currentHora.startTime} - {reading.horaWatch.currentHora.endTime}
                    </Badge>

                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{reading.horaWatch.currentHora.description}"
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {reading.horaWatch.currentHora.bestFor.slice(0, 3).map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-primary font-bold uppercase tracking-widest">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Flux List */}
            <div className="bg-card/50 border border-border/50 rounded-3xl p-6 space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">Upcoming Flow</h4>
              {reading.horaWatch.upcomingHoras?.map((hora, i) => (
                <UpcomingHoraCard key={i} hora={hora} />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Today's Cosmic Pulse with Audio */}
      <motion.section 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h2 className="text-2xl font-bold text-foreground font-serif italic">Cosmic Pulse</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSpeak(`${reading.todayInfluence.wisdomQuote}. Today's Nakshatra is ${reading.todayInfluence.nakshatra}. ${reading.todayInfluence.description}`)}
            className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isSpeaking ? 'bg-purple-500 text-white border-purple-500' : ''}`}
          >
            {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {isSpeaking ? 'Stop' : 'Listen'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-10 rounded-3xl bg-card/80 backdrop-blur-sm border border-purple-500/30">
            <div className="mb-6">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Nakshatra Focus</span>
              <h3 className="text-3xl font-bold text-foreground">{reading.todayInfluence.nakshatra}</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 border-l-2 border-muted pl-6 italic">
              {reading.todayInfluence.description}
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Optimal Flow
                </h4>
                <ul className="space-y-3">
                  {reading.todayInfluence.whatToDo.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-500">◈</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Karmic Friction
                </h4>
                <ul className="space-y-3">
                  {reading.todayInfluence.whatToAvoid.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-500">◈</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="p-10 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-center text-center relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-4xl opacity-5 group-hover:opacity-10 transition-opacity">ॐ</div>
            <Quote className="w-8 h-8 text-amber-500/40 mx-auto mb-4" />
            <h4 className="text-[10px] font-bold text-amber-500/60 uppercase tracking-[0.3em] mb-6">Wisdom Seed</h4>
            <p className="text-xl font-serif text-amber-100/80 leading-relaxed italic">
              "{reading.todayInfluence.wisdomQuote}"
            </p>
          </div>
        </div>
      </motion.section>

      {/* Guru Efficiency Hack */}
      <motion.section 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative p-10 rounded-3xl bg-card/80 backdrop-blur-sm border border-blue-500/30">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">Google Guru Efficiency Hack</h2>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                    Active Tool for the {reading.horaWatch?.currentHora.planet || 'Current'} Hora
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-foreground leading-tight">{reading.guruEfficiencyHack.recommendedTool}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{reading.guruEfficiencyHack.whyThisTool}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Master Workflow:</h4>
                    <ul className="space-y-3">
                      {reading.guruEfficiencyHack.workflow.map((step, i) => (
                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-3">
                          <span className="text-blue-500">◈</span> {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-3xl">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Guru's Pro-Tip:</p>
                    <p className="text-xs text-blue-100 leading-relaxed italic">"{reading.guruEfficiencyHack.proTip}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Personal Vedic Compass (Compass Tier) */}
      {user.plan !== 'free' && reading.personalCompass && (
        <motion.section 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <h2 className="text-2xl font-bold text-foreground font-serif italic">The 4 Eternal Pillars</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CompassCard icon={Briefcase} title="Career" content={reading.personalCompass.career} />
            <CompassCard icon={Heart} title="Harmony" content={reading.personalCompass.relationship} />
            <CompassCard icon={Leaf} title="Health" content={reading.personalCompass.health} />
            <CompassCard icon={Coins} title="Financial" content={reading.personalCompass.financial} />
          </div>

          <div className="p-8 rounded-3xl bg-indigo-900/5 border border-indigo-500/20">
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
          className="space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
            <h2 className="text-2xl font-bold text-foreground font-serif italic flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              Master Soul Blueprint
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BlueprintMiniCard title="D9 Navamsha Soul Strength" content={reading.masterBlueprint.navamshaAnalysis} icon="💎" />
            <BlueprintMiniCard title="Karmic Node Analysis" content={reading.masterBlueprint.karmicNodes} icon="🌀" />
            <div className="p-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Remedial Protocols
              </h4>
              <ul className="space-y-4">
                {reading.masterBlueprint.divineRemedies.map((rem, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-3">
                    <span className="text-emerald-500">ॐ</span> {rem}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 12-House Soul Mapping */}
          <div className="p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-border relative overflow-hidden">
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

          <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20">
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

      {/* Consult Guru - Live Oracle Chat */}
      <motion.section 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          <h2 className="text-2xl font-bold text-foreground font-serif italic flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-400" />
            Consult the Guru
          </h2>
          {user.plan === 'premium' && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] uppercase tracking-widest">
              Oracle Active
            </Badge>
          )}
        </div>
        <CosmicConsultation user={user} onUpgrade={onUpgrade} />
      </motion.section>
    </div>
  );
};