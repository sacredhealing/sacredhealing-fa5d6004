import React, { useEffect, useState } from "react";
import { Sparkles, Quote, Star, AlertCircle, CheckCircle, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDailyVedicInfluence,
  getPremiumDailyGuidance,
  getMasterDeepReading,
  type BirthDetails,
} from "@/lib/vedicCalculations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DailyVedicInsightProps {
  tier: "basic" | "premium" | "master";
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
          .from("profiles")
          .select("birth_name, birth_date, birth_time, birth_place")
          .eq("user_id", user.id)
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
        console.error("Error fetching birth details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBirthDetails();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const dailyInfluence = getDailyVedicInfluence(birthDetails || undefined, tier);
  const premiumGuidance =
    tier === "premium" || tier === "master" ? getPremiumDailyGuidance(birthDetails || undefined) : null;
  const masterReading = tier === "master" ? getMasterDeepReading(birthDetails || undefined) : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-4 pb-20 overflow-x-hidden">
      {/* 1. Main Daily Insight Card */}
      <Card className="border-0 bg-white/[0.03] backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <CardHeader className="relative z-10 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Daily Vedic Influence
            </CardTitle>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/20">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-6 pt-6">
          {/* Nakshatra Bubble */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">Nakshatra: {dailyInfluence.nakshatra}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{dailyInfluence.theme}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400/70">Planetary Guidance</p>
            <p className="text-sm text-slate-200 leading-relaxed">{dailyInfluence.planetaryInfluence}</p>
          </div>

          {/* Teacher's Wisdom */}
          <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 italic">
            <div className="flex gap-3">
              <Quote className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-slate-200 text-sm leading-relaxed mb-2">"{dailyInfluence.wisdomQuote}"</p>
                <p className="text-xs text-amber-500/80 not-italic">— {dailyInfluence.teacher}</p>
              </div>
            </div>
          </div>

          {/* Do's & Don'ts - Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Sacred Actions</span>
              </div>
              <ul className="space-y-2">
                {dailyInfluence.do.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-white text-sm">Guard Against</span>
              </div>
              <ul className="space-y-2">
                {dailyInfluence.avoid.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-rose-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Premium Guidance */}
      {premiumGuidance && (
        <Card className="border-0 bg-white/[0.02] backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Crown className="w-5 h-5 text-purple-400" />
              Vedic Compass
            </CardTitle>
            <p className="text-xs text-slate-400">{premiumGuidance.personalizedMessage}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Career", text: premiumGuidance.career, icon: "💼", color: "blue" },
                { title: "Love", text: premiumGuidance.relationships, icon: "💕", color: "pink" },
                { title: "Health", text: premiumGuidance.health, icon: "🌿", color: "emerald" },
                { title: "Finance", text: premiumGuidance.finances, icon: "💰", color: "amber" },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl bg-${item.color}-500/5 border border-${item.color}-500/10`}>
                  <h4 className="font-bold text-xs mb-1 text-white flex items-center gap-2">
                    {item.icon} {item.title}
                  </h4>
                  <p className="text-xs text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Master Blueprint */}
      {masterReading && (
        <Card className="border-0 bg-amber-500/[0.03] backdrop-blur-2xl border-t border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5" />
              Soul Destined Reading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-xs font-bold text-amber-400 mb-2 uppercase">Soul Purpose</h4>
              <p className="text-sm text-slate-200 leading-relaxed">{masterReading.soulPurpose}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-xs font-bold text-purple-400 mb-2 uppercase">Karmic Patterns</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{masterReading.karmaPatterns}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-xs font-bold text-blue-400 mb-2 uppercase">Destiny Peaks</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{masterReading.timingPeaks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!birthDetails && (
        <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 border-dashed">
          <p className="text-xs text-slate-400">
            ✨ Add your birth details in settings for personalized cosmic mapping.
          </p>
        </div>
      )}
    </div>
  );
};
