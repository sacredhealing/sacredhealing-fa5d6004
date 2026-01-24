import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Timer, Sunrise, Sunset, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { getPlanetEmoji, getEnergyGradient, getSuccessColor, type HoraEnergyType } from '@/lib/vedicTypes';

interface AccurateHoraWatchProps {
  timezone: string;
  timeOffset?: number;
  userBirthChart?: {
    moonSign?: string;
    ascendant?: string;
    sunSign?: string;
  };
}

// Calculate success rating based on birth chart interaction (simplified)
function calculateSuccessRating(planet: string, birthChart?: AccurateHoraWatchProps['userBirthChart']): number {
  // Base ratings for each planet
  const baseRatings: Record<string, number> = {
    Jupiter: 85,
    Venus: 80,
    Mercury: 70,
    Moon: 65,
    Sun: 75,
    Mars: 55,
    Saturn: 45,
  };
  
  let rating = baseRatings[planet] || 60;
  
  // Adjust based on birth chart if available
  if (birthChart) {
    // Jupiter/Venus in chart = better Jupiter/Venus horas
    if (birthChart.moonSign?.toLowerCase().includes('sagittarius') || 
        birthChart.moonSign?.toLowerCase().includes('pisces')) {
      if (planet === 'Jupiter') rating += 10;
    }
    if (birthChart.moonSign?.toLowerCase().includes('taurus') || 
        birthChart.moonSign?.toLowerCase().includes('libra')) {
      if (planet === 'Venus') rating += 10;
    }
  }
  
  return Math.min(100, Math.max(0, rating));
}

// Determine energy type based on planet
function getEnergyType(planet: string): HoraEnergyType {
  const auspicious = ['Jupiter', 'Venus', 'Mercury'];
  const inauspicious = ['Saturn', 'Mars'];
  
  if (auspicious.includes(planet)) return 'Auspicious';
  if (inauspicious.includes(planet)) return 'Inauspicious';
  return 'Neutral';
}

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

// Countdown Timer Component
const CountdownTimer = ({ remainingTime, remainingMs }: { remainingTime: string; remainingMs: number }) => {
  const isUrgent = remainingMs < 5 * 60 * 1000; // Less than 5 minutes
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
      isUrgent 
        ? 'bg-rose-500/20 border border-rose-500/30' 
        : 'bg-primary/10 border border-primary/20'
    }`}>
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-primary'}`} />
      <span className={`font-mono text-lg font-bold ${isUrgent ? 'text-rose-400' : 'text-foreground'}`}>
        {remainingTime}
      </span>
      <span className="text-[9px] text-muted-foreground uppercase">remaining</span>
    </div>
  );
};

// Upcoming Hora Card
const UpcomingHoraCard = ({ 
  planet, 
  startTime, 
  successRating 
}: { 
  planet: string; 
  startTime: string; 
  successRating: number;
}) => (
  <div className="flex items-center justify-between p-3 rounded-2xl bg-background/40 hover:bg-primary/5 transition-all group">
    <div className="flex items-center gap-3">
      <span className="text-xl">{getPlanetEmoji(planet)}</span>
      <div>
        <p className="text-xs font-bold text-foreground">{planet}</p>
        <p className="text-[9px] text-muted-foreground font-bold">{startTime}</p>
      </div>
    </div>
    <div className={`text-[10px] font-bold ${getSuccessColor(successRating)}`}>
      {successRating}%
    </div>
  </div>
);

export const AccurateHoraWatch: React.FC<AccurateHoraWatchProps> = ({
  timezone,
  timeOffset = 0,
  userBirthChart,
}) => {
  const { 
    calculation, 
    remainingTimeStr, 
    remainingMs, 
    isLoading,
    recalculate,
  } = useHoraWatch({
    timezone,
    timeOffset,
  });
  
  // Memoize derived values
  const horaData = useMemo(() => {
    if (!calculation) return null;
    
    const { currentHora, upcomingHoras, sunrise, sunset, dayRuler } = calculation;
    const successRating = calculateSuccessRating(currentHora.planet, userBirthChart);
    const energyType = getEnergyType(currentHora.planet);
    
    return {
      currentHora: {
        ...currentHora,
        successRating,
        energyType,
      },
      upcomingHoras: upcomingHoras.map(hora => ({
        ...hora,
        successRating: calculateSuccessRating(hora.planet, userBirthChart),
        energyType: getEnergyType(hora.planet),
      })),
      sunrise: sunrise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      sunset: sunset.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      dayRuler,
    };
  }, [calculation, userBirthChart]);
  
  if (isLoading || !horaData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-muted-foreground">Calculating Hora...</p>
        </div>
      </div>
    );
  }
  
  const { currentHora, upcomingHoras, sunrise, sunset, dayRuler } = horaData;
  
  return (
    <div className="space-y-6">
      {/* Sun Times Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Sunrise className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Sunrise:</span>
            <span className="text-xs font-bold text-foreground">{sunrise}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sunset className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Sunset:</span>
            <span className="text-xs font-bold text-foreground">{sunset}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Day Ruler:</span>
          <span className="text-xs font-bold text-foreground">{getPlanetEmoji(dayRuler)} {dayRuler}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Watch Card */}
        <div className="md:col-span-2 relative group">
          <div className={`absolute -inset-0.5 bg-gradient-to-br ${getEnergyGradient(currentHora.energyType)} rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000`}></div>
          <div className="relative p-10 rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 h-full overflow-hidden">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Success Meter Circle */}
              <SuccessMeter rating={currentHora.successRating} />

              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-foreground">{currentHora.planet}</h3>
                  <div className="text-4xl">{getPlanetEmoji(currentHora.planet)}</div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] ${
                      currentHora.energyType === 'Auspicious' 
                        ? 'border-emerald-500/30 text-emerald-400' 
                        : currentHora.energyType === 'Neutral'
                        ? 'border-amber-500/30 text-amber-400'
                        : 'border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {currentHora.energyType} • {currentHora.startTimeStr} - {currentHora.endTimeStr}
                  </Badge>
                  
                  {/* Duration Badge */}
                  <Badge variant="secondary" className="text-[9px]">
                    ~{currentHora.durationMinutes} min {currentHora.isDay ? '☀️' : '🌙'}
                  </Badge>
                </div>

                {/* Countdown Timer */}
                <CountdownTimer remainingTime={remainingTimeStr} remainingMs={remainingMs} />

                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{currentHora.ruler}"
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {currentHora.bestFor.slice(0, 3).map((item, i) => (
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
          {upcomingHoras.map((hora, i) => (
            <UpcomingHoraCard 
              key={i} 
              planet={hora.planet} 
              startTime={hora.startTimeStr}
              successRating={hora.successRating}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
