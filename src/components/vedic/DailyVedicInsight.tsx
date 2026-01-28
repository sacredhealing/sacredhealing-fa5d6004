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
    <div className="w-full space-y-4">
      {/* Daily Influence Card */}
      <Card className="w-full border-2 border-primary/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              Today's Vedic Influence
            </CardTitle>
            <Badge variant="outline" className="text-xs w-fit">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Nakshatra Info - More Horizontal Layout */}
          <div className="p-4 sm:p-6 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg text-foreground">Current Nakshatra:</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-bold text-lg sm:text-xl text-primary">{dailyInfluence.nakshatra}</span>
                <span className="text-sm sm:text-base text-muted-foreground">{dailyInfluence.theme}</span>
              </div>
            </div>
          </div>

          {/* Planetary Influence */}
          <div className="w-full">
            <p className="text-base sm:text-lg font-medium text-foreground mb-2">Planetary Influence:</p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed w-full">{dailyInfluence.planetaryInfluence}</p>
          </div>

          {/* Teacher Wisdom */}
          <div className="p-4 sm:p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-base sm:text-lg italic text-foreground mb-2 leading-relaxed">
                  "{dailyInfluence.wisdomQuote}"
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  — {dailyInfluence.teacher}
                </p>
              </div>
            </div>
          </div>

          {/* Do's and Don'ts - Grid Layout for Better Width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="w-full p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-base sm:text-lg text-foreground">What to Do</span>
              </div>
              <ul className="space-y-2 w-full">
                {dailyInfluence.do.map((item, idx) => (
                  <li key={idx} className="text-base text-foreground flex items-start gap-2 w-full">
                    <span className="text-green-500 mt-1.5 flex-shrink-0">•</span>
                    <span className="leading-relaxed flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full p-4 sm:p-6 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-base sm:text-lg text-foreground">What to Avoid</span>
              </div>
              <ul className="space-y-2 w-full">
                {dailyInfluence.avoid.map((item, idx) => (
                  <li key={idx} className="text-base text-foreground flex items-start gap-2 w-full">
                    <span className="text-red-500 mt-1.5 flex-shrink-0">•</span>
                    <span className="leading-relaxed flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {!birthDetails && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                💡 <strong>Tip:</strong> Add your birth details for personalized daily guidance based on your unique chart.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Guidance - Personal Vedic Compass */}
      {premiumGuidance && (
        <Card className="w-full border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Personal Vedic Compass
            </CardTitle>
            <p className="text-base sm:text-lg text-muted-foreground mt-2">
              {premiumGuidance.personalizedMessage}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="w-full p-4 sm:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                  💼 Career Insights
                </h4>
                <p className="text-base leading-relaxed text-foreground w-full">{premiumGuidance.career}</p>
              </div>
              <div className="w-full p-4 sm:p-6 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                  💕 Relationship Harmony
                </h4>
                <p className="text-base leading-relaxed text-foreground w-full">{premiumGuidance.relationships}</p>
              </div>
              <div className="w-full p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                  🌿 Health Recommendations
                </h4>
                <p className="text-base leading-relaxed text-foreground w-full">{premiumGuidance.health}</p>
              </div>
              <div className="w-full p-4 sm:p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                  💰 Financial Timing
                </h4>
                <p className="text-base leading-relaxed text-foreground w-full">{premiumGuidance.finances}</p>
              </div>
            </div>
            
            {!birthDetails && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm sm:text-base text-muted-foreground text-center">
                  ✨ <strong>Unlock personalized guidance:</strong> Add your birth details above for readings tailored specifically to your unique cosmic blueprint.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Master Deep Reading - Master Vedic Blueprint */}
      {masterReading && (
        <Card className="w-full border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Master Vedic Blueprint
            </CardTitle>
            <p className="text-base sm:text-lg text-muted-foreground mt-2">
              Comprehensive insights into your soul's journey and cosmic destiny
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Soul Purpose */}
            <div className="w-full p-4 sm:p-6 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                🔮 Soul Purpose Analysis
              </h4>
              <p className="text-base leading-relaxed text-foreground w-full">{masterReading.soulPurpose}</p>
            </div>

            {/* Karma Patterns */}
            <div className="w-full p-4 sm:p-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                ⚖️ Karma Pattern Insights
              </h4>
              <p className="text-base leading-relaxed text-foreground w-full">{masterReading.karmaPatterns}</p>
            </div>

            {/* Strengths & Challenges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="w-full p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                  ⭐ Strengths Mapping
                </h4>
                <p className="text-base leading-relaxed text-foreground w-full">{masterReading.strengths}</p>
              </div>
              <div className="w-full p-4 sm:p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                  🎯 Challenge Mapping
                </h4>
                <p className="text-base leading-relaxed text-foreground w-full">{masterReading.challenges}</p>
              </div>
            </div>

            {/* Timing Peaks */}
            <div className="w-full p-4 sm:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                📅 Timing Peak Predictions
              </h4>
              <p className="text-base leading-relaxed text-foreground w-full">{masterReading.timingPeaks}</p>
            </div>

            {/* Birth Chart Summary */}
            <div className="w-full p-4 sm:p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                📜 Detailed Birth Chart Analysis
              </h4>
              <p className="text-base leading-relaxed text-foreground w-full">{masterReading.birthChartSummary}</p>
            </div>

            {!birthDetails && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm sm:text-base text-muted-foreground text-center">
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

