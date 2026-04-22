import React, { useEffect, useState } from 'react';
import { Sparkles, Quote, Star, AlertCircle, CheckCircle, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDailyVedicInfluence, getPremiumDailyGuidance, getMasterDeepReading, type BirthDetails } from '@/lib/vedicCalculations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TempleSection } from './TempleSection';
import { useTranslation } from '@/hooks/useTranslation';
import { vedicLocaleTag } from '@/lib/vedicLocale';

/** Split on sentence boundaries without RegExp lookbehind (older Safari compatibility). */
function splitIntoParagraphs(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '.' || ch === '!' || ch === '?') {
      const next = t[i + 1];
      if (next === undefined || /\s/.test(next)) {
        const seg = t.slice(start, i + 1).trim();
        if (seg) out.push(seg);
        start = i + 1;
        while (start < t.length && /\s/.test(t[start])) start++;
        i = start - 1;
      }
    }
  }
  const tail = t.slice(start).trim();
  if (tail) out.push(tail);
  return out.length ? out : [text];
}

/** Splits long text into paragraphs - Siddha temple body text */
const VedicParagraphs: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length <= 1) {
    return <p className={`text-sm text-amber-100/60 leading-relaxed text-left font-serif ${className}`}>{text}</p>;
  }
  return (
    <div className={`space-y-3 text-left ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm text-amber-100/60 leading-relaxed font-serif">
          {para}
        </p>
      ))}
    </div>
  );
};

interface DailyVedicInsightProps {
  tier: 'basic' | 'premium' | 'master';
}

export const DailyVedicInsight: React.FC<DailyVedicInsightProps> = ({ tier }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const locale = vedicLocaleTag(language);
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
      <div className="p-8 rounded-2xl bg-[#0d0d14] border border-amber-900/20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500/30 border-t-amber-400"></div>
      </div>
    );
  }

  const dailyInfluence = getDailyVedicInfluence(t, birthDetails || undefined, tier);
  const premiumGuidance = (tier === 'premium' || tier === 'master')
    ? getPremiumDailyGuidance(t, birthDetails || undefined)
    : null;
  const masterReading = tier === 'master'
    ? getMasterDeepReading(t, birthDetails || undefined)
    : null;

  return (
    <div className="space-y-2 w-full max-w-full">
      <TempleSection title={t('vedicAstrology.dailyTitle')} icon="✨" defaultOpen={true}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-700/30 text-[10px] sm:text-xs w-fit">
            {new Date().toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
        {/* Nakshatra Info */}
        <div className="p-3 sm:p-4 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full mb-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Star className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-serif font-semibold text-amber-200/80 text-sm sm:text-base">
              {t('vedicAstrology.dailyNakshatra', { name: dailyInfluence.nakshatra })}
            </span>
          </div>
          <p className="text-sm text-amber-100/60 leading-relaxed font-serif">{dailyInfluence.theme}</p>
        </div>

        {/* Planetary Influence */}
        <div className="w-full mb-4">
          <p className="text-sm font-serif font-medium text-amber-200/80 mb-1">{t('vedicAstrology.dailyPlanetary')}</p>
          <p className="text-sm text-amber-100/60 leading-relaxed font-serif">{dailyInfluence.planetaryInfluence}</p>
        </div>

        {/* Teacher Wisdom */}
        <div className="p-3 sm:p-4 rounded-xl bg-amber-900/10 border border-amber-700/20 w-full mb-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm italic text-amber-100/80 mb-1 leading-relaxed font-serif">
                "{dailyInfluence.wisdomQuote}"
              </p>
              <p className="text-[10px] sm:text-xs text-amber-200/50 font-serif">
                — {dailyInfluence.teacher}
              </p>
            </div>
          </div>
        </div>

        {/* Do's and Don'ts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="p-3 sm:p-4 rounded-xl bg-emerald-900/10 border border-emerald-800/20 w-full">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="font-serif font-semibold text-amber-200/80 text-sm">{t('vedicAstrology.dailyWhatToDo')}</span>
            </div>
            <ul className="space-y-0.5 sm:space-y-1">
              {dailyInfluence.do.map((item, idx) => (
                <li key={idx} className="text-sm text-amber-100/60 flex items-start gap-2 leading-relaxed font-serif">
                  <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-red-900/10 border border-red-800/20 w-full">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 shrink-0" />
              <span className="font-serif font-semibold text-amber-200/80 text-sm">{t('vedicAstrology.dailyWhatToAvoid')}</span>
            </div>
            <ul className="space-y-0.5 sm:space-y-1">
              {dailyInfluence.avoid.map((item, idx) => (
                <li key={idx} className="text-sm text-amber-100/60 flex items-start gap-2 leading-relaxed font-serif">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {!birthDetails && (
          <div className="p-3 rounded-xl bg-amber-900/10 border border-amber-900/20 w-full">
            <p className="text-xs text-amber-200/60 text-center font-serif">
              {t('vedicAstrology.dailyTip')}
            </p>
          </div>
        )}
      </TempleSection>

      {premiumGuidance && (
        <TempleSection title={t('vedicAstrology.dailyCompassTitle')} icon="🧭" defaultOpen={false}>
          <p className="text-sm text-amber-100/60 leading-relaxed font-serif mb-4">{premiumGuidance.personalizedMessage}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left">
              <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2">{t('vedicAstrology.dailyCareer')}</h4>
              <VedicParagraphs text={premiumGuidance.career} />
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left">
              <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2">{t('vedicAstrology.dailyRelations')}</h4>
              <VedicParagraphs text={premiumGuidance.relationships} />
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left">
              <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2">{t('vedicAstrology.dailyHealth')}</h4>
              <VedicParagraphs text={premiumGuidance.health} />
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left">
              <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-2 flex items-center gap-2">{t('vedicAstrology.dailyFinance')}</h4>
              <VedicParagraphs text={premiumGuidance.finances} />
            </div>
          </div>
          {!birthDetails && (
            <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-700/20 mt-4">
              <p className="text-xs text-amber-200/60 text-center font-serif">
                {t('vedicAstrology.dailyUnlockCompass')}
              </p>
            </div>
          )}
        </TempleSection>
      )}

      {masterReading && (
        <TempleSection title={t('vedicAstrology.dailyMasterTitle')} icon="📜" defaultOpen={false}>
          <p className="text-sm text-amber-100/60 leading-relaxed font-serif mb-4">{t('vedicAstrology.dailyMasterIntro')}</p>
          <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left mb-4">
            <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2">{t('vedicAstrology.dailySoulPurpose')}</h4>
            <VedicParagraphs text={masterReading.soulPurpose} />
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left mb-4">
            <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2">{t('vedicAstrology.dailyKarma')}</h4>
            <VedicParagraphs text={masterReading.karmaPatterns} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mb-4">
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left">
              <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2">{t('vedicAstrology.dailyStrengths')}</h4>
              <VedicParagraphs text={masterReading.strengths} />
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left">
              <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2">{t('vedicAstrology.dailyChallenges')}</h4>
              <VedicParagraphs text={masterReading.challenges} />
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-[#0d0d14] border border-amber-900/20 w-full text-left mb-4">
            <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2">{t('vedicAstrology.dailyTiming')}</h4>
            <VedicParagraphs text={masterReading.timingPeaks} />
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-amber-900/10 border border-amber-700/20 w-full text-left mb-4">
            <h4 className="font-serif font-semibold text-amber-200/80 text-sm mb-3 flex items-center gap-2">{t('vedicAstrology.dailyBirthChart')}</h4>
            <VedicParagraphs text={masterReading.birthChartSummary} />
          </div>
          {!birthDetails && (
            <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-700/20">
              <p className="text-xs text-amber-200/60 text-center font-serif">
                {t('vedicAstrology.dailyUnlockMaster')}
              </p>
            </div>
          )}
        </TempleSection>
      )}
    </div>
  );
};

