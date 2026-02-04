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
    <div className="space-y-4 w-full min-w-0 max-w-full">
      {/* Daily Influence Card */}
      <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5 w-full max-w-full">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
              <span>Today's Vedic Influence</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] sm:text-xs w-fit shrink-0">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-3 sm:pt-4 w-full min-w-0">
          {/* Nakshatra Info */}
          <div className="p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/20 w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Star className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground text-sm sm:text-base">Current Nakshatra: {dailyInfluence.nakshatra}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">{dailyInfluence.theme}</p>
          </div>

          {/* Planetary Influence */}
          <div className="w-full min-w-0 overflow-hidden">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Planetary Influence:</p>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">{dailyInfluence.planetaryInfluence}</p>
          </div>

          {/* Teacher Wisdom */}
          <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full min-w-0 overflow-hidden">
            <div className="flex items-start gap-2 sm:gap-3">
              <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm italic text-foreground mb-1 break-words">
                  "{dailyInfluence.wisdomQuote}"
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  — {dailyInfluence.teacher}
                </p>
              </div>
            </div>
          </div>

          {/* Do's and Don'ts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 w-full min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                <span className="font-semibold text-foreground text-xs sm:text-sm">What to Do</span>
              </div>
              <ul className="space-y-0.5 sm:space-y-1">
                {dailyInfluence.do.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2 break-words">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 w-full min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 shrink-0" />
                <span className="font-semibold text-foreground text-xs sm:text-sm">What to Avoid</span>
              </div>
              <ul className="space-y-0.5 sm:space-y-1">
                {dailyInfluence.avoid.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2 break-words">
                    <span className="text-red-500 mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {!birthDetails && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50 w-full min-w-0 overflow-hidden">
              <p className="text-xs text-muted-foreground text-center">
                💡 <strong>Tip:</strong> Add your birth details for personalized daily guidance based on your unique chart.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Guidance - Personal Vedic Compass */}
      {premiumGuidance && (
        <Card className="overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 w-full max-w-full">
          <CardHeader className="w-full min-w-0 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
              Personal Vedic Compass
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground w-full break-words mt-1">
              {premiumGuidance.personalizedMessage}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 w-full min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 w-full min-w-0 overflow-hidden">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                  💼 Career Insights
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{premiumGuidance.career}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 w-full min-w-0 overflow-hidden">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                  💕 Relationship Harmony
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{premiumGuidance.relationships}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 w-full min-w-0 overflow-hidden">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                  🌿 Health Recommendations
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{premiumGuidance.health}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full min-w-0 overflow-hidden">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                  💰 Financial Timing
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{premiumGuidance.finances}</p>
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
        <Card className="overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 w-full max-w-full">
          <CardHeader className="w-full min-w-0 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              Master Vedic Blueprint
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground w-full break-words mt-1">
              Comprehensive insights into your soul's journey and cosmic destiny
            </p>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-5 p-4 sm:p-6 pt-0 w-full min-w-0">
            {/* Soul Purpose */}
            <div className="p-3 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 w-full min-w-0 overflow-hidden">
              <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                🔮 Soul Purpose Analysis
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{masterReading.soulPurpose}</p>
            </div>

            {/* Karma Patterns */}
            <div className="p-3 sm:p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 w-full min-w-0 overflow-hidden">
              <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                ⚖️ Karma Pattern Insights
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{masterReading.karmaPatterns}</p>
            </div>

            {/* Strengths & Challenges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
              <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 w-full min-w-0 overflow-hidden">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                  ⭐ Strengths Mapping
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{masterReading.strengths}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 w-full min-w-0 overflow-hidden">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                  🎯 Challenge Mapping
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{masterReading.challenges}</p>
              </div>
            </div>

            {/* Timing Peaks */}
            <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 w-full min-w-0 overflow-hidden">
              <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                📅 Timing Peak Predictions
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{masterReading.timingPeaks}</p>
            </div>

            {/* Birth Chart Summary */}
            <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full min-w-0 overflow-hidden">
              <h4 className="font-semibold text-xs sm:text-sm mb-1 text-foreground flex items-center gap-2">
                📜 Detailed Birth Chart Analysis
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{masterReading.birthChartSummary}</p>
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

