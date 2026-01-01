import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Pause, RotateCcw, Wind, Heart, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useSiteContent } from '@/hooks/useSiteContent';

import { supabase } from '@/integrations/supabase/client';

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdOut' | 'idle';

interface BreathingPattern {
  id: string;
  name: string;
  description: string | null;
  inhale: number;
  hold: number;
  exhale: number;
  hold_out: number;
  cycles: number;
}

const defaultPatterns: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal counts for calm and focus. Used by Navy SEALs.',
    inhale: 4,
    hold: 4,
    exhale: 4,
    hold_out: 4,
    cycles: 4,
  },
];

const Breathing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { content } = useSiteContent([
    'breathing_title',
    'breathing_subtitle',
    'breathing_description',
  ]);

  const [patterns, setPatterns] = useState<BreathingPattern[]>(defaultPatterns);
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(defaultPatterns[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch patterns from database
  useEffect(() => {
    const fetchPatterns = async () => {
      const { data, error } = await supabase
        .from('breathing_patterns')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        setPatterns(data);
        setSelectedPattern(data[0]);
      }
    };
    fetchPatterns();
  }, []);

  const phaseColors: Record<BreathPhase, string> = {
    inhale: 'from-blue-500 to-cyan-500',
    hold: 'from-purple-500 to-pink-500',
    exhale: 'from-green-500 to-emerald-500',
    holdOut: 'from-amber-500 to-orange-500',
    idle: 'from-muted to-muted',
  };

  const phaseLabels: Record<BreathPhase, string> = {
    inhale: t('breathing.inhale', 'Breathe In'),
    hold: t('breathing.hold', 'Hold'),
    exhale: t('breathing.exhale', 'Breathe Out'),
    holdOut: t('breathing.holdOut', 'Hold'),
    idle: t('breathing.ready', 'Ready'),
  };

  const getNextPhase = (current: BreathPhase): BreathPhase => {
    const pattern = selectedPattern;
    switch (current) {
      case 'inhale':
        return pattern.hold > 0 ? 'hold' : 'exhale';
      case 'hold':
        return 'exhale';
      case 'exhale':
        return pattern.hold_out > 0 ? 'holdOut' : 'inhale';
      case 'holdOut':
        return 'inhale';
      default:
        return 'inhale';
    }
  };

  const getPhaseDuration = (p: BreathPhase): number => {
    switch (p) {
      case 'inhale': return selectedPattern.inhale;
      case 'hold': return selectedPattern.hold;
      case 'exhale': return selectedPattern.exhale;
      case 'holdOut': return selectedPattern.hold_out;
      default: return 0;
    }
  };

  const startExercise = () => {
    setIsActive(true);
    setCurrentCycle(1);
    setPhase('inhale');
    setTimeLeft(selectedPattern.inhale);
    setTotalSeconds(0);
  };

  const stopExercise = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeLeft(0);
    setCurrentCycle(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetExercise = () => {
    stopExercise();
  };

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
      setTimeLeft(prev => {
        if (prev <= 1) {
          const nextPhase = getNextPhase(phase);
          const nextDuration = getPhaseDuration(nextPhase);
          
          if (nextPhase === 'inhale' && phase !== 'idle') {
            if (currentCycle >= selectedPattern.cycles) {
              stopExercise();
              return 0;
            }
            setCurrentCycle(c => c + 1);
          }
          
          if (nextDuration === 0) {
            // Skip phases with 0 duration
            const skipPhase = getNextPhase(nextPhase);
            setPhase(skipPhase);
            return getPhaseDuration(skipPhase);
          }
          
          setPhase(nextPhase);
          return nextDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, phase, currentCycle, selectedPattern]);

  const circleScale = phase === 'inhale' ? 'scale-110' : phase === 'exhale' ? 'scale-90' : 'scale-100';

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('common.back', 'Back')}</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Wind className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {content['breathing_title'] || t('breathing.title', 'Breathing Exercises')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {content['breathing_subtitle'] || t('breathing.subtitle', 'Calm your mind, energize your body')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Description */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              {content['breathing_description'] || t('breathing.description', 'Breathing exercises help reduce stress, improve focus, and promote relaxation. Choose a pattern below and follow along.')}
            </p>
          </CardContent>
        </Card>

        {/* Breathing Circle */}
        <div className="flex flex-col items-center py-8">
          <div 
            className={`w-48 h-48 rounded-full bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center transition-all duration-1000 ease-in-out ${circleScale} shadow-2xl`}
          >
            <div className="text-center text-white">
              <p className="text-lg font-semibold mb-1">{phaseLabels[phase]}</p>
              {isActive && (
                <p className="text-4xl font-bold">{timeLeft}</p>
              )}
            </div>
          </div>
          
          {isActive && (
            <div className="mt-4 flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{t('breathing.cycle', 'Cycle')} {currentCycle}/{selectedPattern.cycles}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!isActive ? (
            <Button onClick={startExercise} size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Play className="w-5 h-5 mr-2" />
              {t('breathing.start', 'Start')}
            </Button>
          ) : (
            <>
              <Button onClick={stopExercise} size="lg" variant="outline">
                <Pause className="w-5 h-5 mr-2" />
                {t('breathing.stop', 'Stop')}
              </Button>
              <Button onClick={resetExercise} size="lg" variant="ghost">
                <RotateCcw className="w-5 h-5 mr-2" />
                {t('breathing.reset', 'Reset')}
              </Button>
            </>
          )}
        </div>

        {/* Pattern Selection */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('breathing.choosePattern', 'Choose a Pattern')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => {
                  if (!isActive) {
                    setSelectedPattern(pattern);
                  }
                }}
                disabled={isActive}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedPattern.id === pattern.id
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-background/50 border border-border/50 hover:border-primary/30'
                } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-foreground">{pattern.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {pattern.inhale}-{pattern.hold}-{pattern.exhale}{pattern.hold_out > 0 ? `-${pattern.hold_out}` : ''}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{pattern.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-lg">✨ {t('breathing.benefits', 'Benefits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                t('breathing.benefit1', 'Reduces stress and anxiety'),
                t('breathing.benefit2', 'Improves focus and concentration'),
                t('breathing.benefit3', 'Promotes better sleep'),
                t('breathing.benefit4', 'Lowers blood pressure'),
                t('breathing.benefit5', 'Increases energy levels'),
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Breathing;
