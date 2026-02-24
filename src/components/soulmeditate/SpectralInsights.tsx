import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Loader2, Brain, Heart, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FrequencyState, DSPSettings } from '@/hooks/useSoulMeditateEngine';

interface SpectralInsightsProps {
  frequencies: FrequencyState;
  dsp: DSPSettings;
  atmosphereId: string | null;
  neuralSource: string | null;
}

interface InsightData {
  title: string;
  neurological: string;
  emotional: string;
  spiritual: string;
  recommendation: string;
}

export default function SpectralInsights({
  frequencies,
  dsp,
  atmosphereId,
  neuralSource,
}: SpectralInsightsProps) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const prompt = buildInsightPrompt(frequencies, dsp, atmosphereId, neuralSource);
      
      const { data, error } = await supabase.functions.invoke('spectral-insights', {
        body: { prompt }
      });

      if (error) throw error;

      setInsights(data.insights);
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setInsights(generateLocalInsights(frequencies, dsp, atmosphereId));
      toast.info('Using local analysis engine');
    } finally {
      setIsLoading(false);
    }
  }, [frequencies, dsp, atmosphereId, neuralSource]);

  return (
    <Card className="bg-[#0B0112]/60 backdrop-blur-xl border-amber-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-100/90">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          Alchemical Insight
          <Badge variant="outline" className="ml-auto text-xs border-amber-500/30 text-amber-400">
            AI Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights && !isLoading && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-sm text-amber-200/60 mb-4">
              Reveal the sacred properties of your alchemical mix
            </p>
            <Button
              onClick={generateInsights}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Reveal Insights
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
            <p className="text-sm text-amber-200/60">Divining sacred patterns...</p>
          </div>
        )}

        {insights && !isLoading && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <h3 className="font-semibold text-amber-100/90 mb-1">{insights.title}</h3>
            </div>

            <div className="grid gap-3">
              <InsightCard icon={<Brain className="w-4 h-4" />} title="Neurological Effects" content={insights.neurological} color="amber" />
              <InsightCard icon={<Heart className="w-4 h-4" />} title="Emotional Benefits" content={insights.emotional} color="orange" />
              <InsightCard icon={<Zap className="w-4 h-4" />} title="Spiritual Alignment" content={insights.spiritual} color="gold" />
            </div>

            <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-900/20">
              <div className="text-xs text-amber-200/50 mb-1">Recommendation</div>
              <p className="text-sm text-amber-200/80">{insights.recommendation}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              className="w-full bg-amber-900/10 border-amber-900/30 text-amber-200/70 hover:text-amber-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({
  icon,
  title,
  content,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  color: 'amber' | 'orange' | 'gold';
}) {
  const colors = {
    amber: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
    gold: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`p-3 rounded-lg bg-gradient-to-r ${colors[color]} border`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className="text-xs text-amber-200/70">{content}</p>
    </div>
  );
}

function buildInsightPrompt(
  frequencies: FrequencyState,
  dsp: DSPSettings,
  atmosphereId: string | null,
  neuralSource: string | null
): string {
  const parts: string[] = [];

  if (frequencies.solfeggio.enabled) {
    parts.push(`Solfeggio frequency: ${frequencies.solfeggio.hz} Hz`);
  }
  if (frequencies.binaural.enabled) {
    parts.push(`Binaural beat: ${frequencies.binaural.beatHz} Hz (${frequencies.binaural.carrierHz} Hz carrier)`);
  }
  if (atmosphereId) {
    parts.push(`Atmosphere: ${atmosphereId}`);
  }
  if (dsp.reverb.enabled) {
    parts.push(`Reverb: ${dsp.reverb.decay}s decay`);
  }
  if (dsp.warmth?.enabled) {
    parts.push(`Harmonic warmth: ${Math.round(dsp.warmth.drive * 100)}% drive`);
  }

  return `Analyze the neuro-acoustic benefits of this meditation configuration: ${parts.join(', ')}. 
  Provide insights on neurological effects, emotional benefits, spiritual alignment, and a personalized recommendation.`;
}

function generateLocalInsights(
  frequencies: FrequencyState,
  dsp: DSPSettings,
  atmosphereId: string | null
): InsightData {
  const solfeggioEffects: Record<number, string> = {
    174: 'foundation and grounding energy',
    285: 'quantum cognition enhancement',
    396: 'liberation from fear and guilt',
    417: 'facilitating change and transformation',
    432: 'natural harmonic resonance with Earth',
    528: 'DNA restore and cellular alignment',
    639: 'heart coherence and connection',
    741: 'awakening intuition and clarity',
    852: 'third eye activation',
    963: 'crown chakra activation and unity consciousness',
  };

  const binauralEffects: Record<number, string> = {
    0.5: 'transcendental states',
    2: 'deep healing sleep',
    4: 'profound meditation',
    6: 'creative visualization',
    10: 'relaxed focus',
    14: 'active problem-solving',
    40: 'peak cognitive performance',
  };

  let title = 'Alchemical Analysis';
  let neurological = 'This configuration promotes relaxation and mental clarity.';
  let emotional = 'Gentle emotional regulation and stress reduction.';
  let spiritual = 'Opens pathways for inner reflection.';
  let recommendation = 'Continue with 15-30 minute sessions for optimal benefits.';

  if (frequencies.solfeggio.enabled) {
    const effect = solfeggioEffects[frequencies.solfeggio.hz] || 'healing frequencies';
    title = `${frequencies.solfeggio.hz} Hz Sacred Alchemy Session`;
    neurological = `The ${frequencies.solfeggio.hz} Hz frequency promotes ${effect}. Neural pathways associated with healing and restoration are activated.`;
    spiritual = `This frequency aligns with ${effect}, facilitating deep spiritual connection.`;
  }

  if (frequencies.binaural.enabled) {
    const effect = binauralEffects[frequencies.binaural.beatHz] || 'altered states';
    neurological += ` The ${frequencies.binaural.beatHz} Hz binaural beat entrains brainwaves toward ${effect}.`;
    emotional = `Binaural entrainment at ${frequencies.binaural.beatHz} Hz supports emotional balance and ${effect}.`;
    recommendation = 'Use stereo headphones for optimal binaural effect. Session length: 20-45 minutes.';
  }

  if (dsp.reverb.enabled && dsp.reverb.decay > 2) {
    emotional += ' The sacred reverb creates a sense of temple expansiveness and safety.';
  }

  if (atmosphereId) {
    const atmosphereDescriptions: Record<string, string> = {
      vedic: 'The Vedic atmosphere connects you to ancient wisdom traditions.',
      shamanic: 'Shamanic elements ground you in earth-based healing practices.',
      tibetan: 'Tibetan bowls harmonize your energy centers.',
      ocean: 'Ocean sounds synchronize with your natural breathing rhythm.',
      forest: 'Forest ambience activates parasympathetic nervous system.',
      cosmic: 'Cosmic textures expand consciousness beyond ordinary perception.',
    };
    spiritual += ` ${atmosphereDescriptions[atmosphereId] || 'The chosen atmosphere enhances your practice.'}`;
  }

  return { title, neurological, emotional, spiritual, recommendation };
}
