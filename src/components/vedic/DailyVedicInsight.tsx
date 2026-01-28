import React, { useEffect, useState } from 'react';
import { Sparkles, Quote, Star, AlertCircle, CheckCircle, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDailyVedicInfluence, getPremiumDailyGuidance, getMasterDeepReading, type BirthDetails } from '@/lib/vedicCalculations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DailyVedicInsightProps {
  tier: 'basic' | 'premium' | 'master';
}

export const DailyVedicInsight: React.FC<DailyVedicInsightProps> = ({ tier }) => {
  const { user } = useAuth();
  const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBirthDetails = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('birth_name, birth_date, birth_time, birth_place')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
          setBirthDetails({
            name: data.birth_name,
            date: data.birth_date,
            time: data.birth_time,
            place: data.birth_place,
          });
        }
      } catch (error) {
        console.error('Error fetching birth details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBirthDetails();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const dailyInfluence = getDailyVedicInfluence(birthDetails || undefined, tier);
  const premiumGuidance = (tier === 'premium' || tier === 'master')
    ? getPremiumDailyGuidance(birthDetails || undefined)
    : null;
  const masterReading = tier === 'master'
    ? getMasterDeepReading(birthDetails || undefined)
    : null;

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Daily Influence Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5 w-full max-w-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Today's Vedic Influence
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 w-full min-w-0">
          {/* Nakshatra Info */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Current Nakshatra: {dailyInfluence.nakshatra}</span>
            </div>
            <p className="text-sm text-muted-foreground">{dailyInfluence.theme}</p>
          </div>

          {/* Planetary Influence */}
          <div className="w-full min-w-0">
            <p className="text-sm font-medium text-foreground mb-2">Planetary Influence:</p>
            <p className="text-sm text-muted-foreground w-full">{dailyInfluence.planetaryInfluence}</p>
          </div>

          {/* Teacher Wisdom */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm italic text-foreground mb-2">
                  "{dailyInfluence.wisdomQuote}"
                </p>
                <p className="text-xs text-muted-foreground">
                  — {dailyInfluence.teacher}
                </p>
              </div>
            </div>
          </div>

          {/* Do's and Don'ts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-foreground text-sm">What to Do</span>
              </div>
              <ul className="space-y-1">
                {dailyInfluence.do.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-foreground text-sm">What to Avoid</span>
              </div>
              <ul className="space-y-1">
                {dailyInfluence.avoid.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {!birthDetails && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                💡 <strong>Tip:</strong> Add your birth details for personalized daily guidance based on your unique chart.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Guidance - Personal Vedic Compass */}
      {premiumGuidance && (
        <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 w-full max-w-none">
          <CardHeader className="w-full min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Personal Vedic Compass
            </CardTitle>
            <p className="text-sm text-muted-foreground w-full">
              {premiumGuidance.personalizedMessage}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 w-full min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 w-full min-w-0">
                <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                  💼 Career Insights
                </h4>
                <p className="text-sm text-muted-foreground w-full">{premiumGuidance.career}</p>
              </div>
              <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20 w-full min-w-0">
                <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                  💕 Relationship Harmony
                </h4>
                <p className="text-sm text-muted-foreground w-full">{premiumGuidance.relationships}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 w-full min-w-0">
                <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                  🌿 Health Recommendations
                </h4>
                <p className="text-sm text-muted-foreground w-full">{premiumGuidance.health}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 w-full min-w-0">
                <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                  💰 Financial Timing
                </h4>
                <p className="text-sm text-muted-foreground w-full">{premiumGuidance.finances}</p>
              </div>
            </div>
            
            {!birthDetails && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-muted-foreground text-center">
                  ✨ <strong>Unlock personalized guidance:</strong> Add your birth details above for readings tailored specifically to your unique cosmic blueprint.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Master Deep Reading - Master Vedic Blueprint */}
      {masterReading && (
        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 w-full max-w-none">
          <CardHeader className="w-full min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Master Vedic Blueprint
            </CardTitle>
            <p className="text-sm text-muted-foreground w-full">
              Comprehensive insights into your soul's journey and cosmic destiny
            </p>
          </CardHeader>
          <CardContent className="space-y-5 w-full min-w-0">
            {/* Soul Purpose */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 w-full min-w-0">
              <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                🔮 Soul Purpose Analysis
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed w-full">{masterReading.soulPurpose}</p>
            </div>

            {/* Karma Patterns */}
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 w-full min-w-0">
              <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                ⚖️ Karma Pattern Insights
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed w-full">{masterReading.karmaPatterns}</p>
            </div>

            {/* Strengths & Challenges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 w-full min-w-0">
                <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                  ⭐ Strengths Mapping
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed w-full">{masterReading.strengths}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 w-full min-w-0">
                <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                  🎯 Challenge Mapping
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed w-full">{masterReading.challenges}</p>
              </div>
            </div>

            {/* Timing Peaks */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 w-full min-w-0">
              <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                📅 Timing Peak Predictions
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed w-full">{masterReading.timingPeaks}</p>
            </div>

            {/* Birth Chart Summary */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 w-full min-w-0">
              <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                📜 Detailed Birth Chart Analysis
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed w-full">{masterReading.birthChartSummary}</p>
            </div>

            {!birthDetails && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-muted-foreground text-center">
                  👑 <strong>Unlock your full cosmic blueprint:</strong> Add your complete birth details above to receive your personalized Master reading with detailed chart analysis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

