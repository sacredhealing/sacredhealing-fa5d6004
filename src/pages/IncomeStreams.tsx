import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, Users, Sparkles, ArrowRight, Coins, 
  GraduationCap, Bot, Cpu, Heart, Star, Zap, Globe, Shield,
  Wallet, Info, Brain,
  type LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { SHCBalanceCard } from '@/components/dashboard/SHCBalanceCard';
import { useAdminRole } from '@/hooks/useAdminRole';
interface IncomeStream {
  id: string;
  title: string;
  title_sv: string | null;
  title_es: string | null;
  title_no: string | null;
  description: string | null;
  description_sv: string | null;
  description_es: string | null;
  description_no: string | null;
  link: string;
  category: string;
  potential_earnings: string | null;
  potential_earnings_sv: string | null;
  potential_earnings_es: string | null;
  potential_earnings_no: string | null;
  is_featured: boolean;
  image_url: string | null;
  order_index: number;
  icon_name: string | null;
  badge_text: string | null;
  badge_text_sv: string | null;
  badge_text_es: string | null;
  badge_text_no: string | null;
  color_from: string | null;
  color_to: string | null;
  internal_slug: string | null;
  cta_button_text: string | null;
  cta_button_text_sv: string | null;
  cta_button_text_es: string | null;
  cta_button_text_no: string | null;
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Users,
  Coins,
  TrendingUp,
  Cpu,
  Bot,
  GraduationCap,
  Sparkles,
  Heart,
  Star,
  Zap,
  Globe,
  Shield,
  DollarSign,
  Brain,
};

const IncomeStreams: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get current language reactively
  const currentLang = i18n.language?.split('-')[0] || 'en';

  useEffect(() => {
    fetchStreams();
  }, [currentLang, isAdmin]); // Re-fetch when language or admin role resolves

  const fetchStreams = async () => {
    const { data, error } = await supabase
      .from('income_streams')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (data) {
      const fetched = data as unknown as IncomeStream[];

      // Remove Automated Forex Income from /income-streams (even if present in DB)
      const withoutForex = fetched.filter((s) => {
        const slug = (s.internal_slug || '').toLowerCase();
        const title = (s.title || '').toLowerCase();
        return !(
          slug.includes('forex') ||
          title.includes('forex') ||
          title.includes('automated forex')
        );
      });

      // Ensure the Polymarket Bot stream exists even if DB row isn't created yet
      // (UI-only fallback; does not modify affiliate/Stripe logic)
      const hasPolymarketBot = withoutForex.some(
        (s) =>
          s.internal_slug === 'polymarket-bot' ||
          s.link === '/income-streams/polymarket-bot'
      );
      const hasCopyTradingBot = withoutForex.some(
        (s) =>
          s.internal_slug === 'polymarket-copy-trading' ||
          s.link === '/income-streams/polymarket-copy-trading'
      );
      const hasAIBot = withoutForex.some(
        (s) =>
          s.internal_slug === 'prediction-market-bot' ||
          s.link === '/prediction-market-bot'
      );
      const hasFomoBot = withoutForex.some(
        (s) =>
          s.internal_slug === 'fomo-copy-bot' ||
          s.link === '/income-streams/fomo-copy-bot'
      );
      const hasSqiSovereignBot = withoutForex.some(
        (s) =>
          s.internal_slug === 'sqi-sovereign-bot' ||
          s.link === '/income-streams/sqi-sovereign-bot'
      );

      const polymarketFallback: IncomeStream = {
        id: 'polymarket-bot-fallback',
        title: 'Polymarket HFT Bot',
        title_sv: null,
        title_es: null,
        title_no: null,
        description:
          'Live HFT engine. Whale mirror + latency arb + volatility scalper. Connect wallet, start engine, trade.',
        description_sv: null,
        description_es: null,
        description_no: null,
        link: '/income-streams/polymarket-bot',
        category: 'AI',
        potential_earnings: 'WHALE MIRROR · LATENCY ARB · VOL SCALPER',
        potential_earnings_sv: null,
        potential_earnings_es: null,
        potential_earnings_no: null,
        is_featured: true,
        image_url: null,
        order_index: -3,
        icon_name: 'Bot',
        badge_text: 'NEW • SQI 2050',
        badge_text_sv: null,
        badge_text_es: null,
        badge_text_no: null,
        color_from: null,
        color_to: null,
        internal_slug: 'polymarket-bot',
        cta_button_text: 'Open Terminal',
        cta_button_text_sv: null,
        cta_button_text_es: null,
        cta_button_text_no: null,
      };

      const copyTradingFallback: IncomeStream = {
        id: 'polymarket-copy-trading-fallback',
        title: 'Polymarket Copy-Trading Bot',
        title_sv: null,
        title_es: null,
        title_no: null,
        description:
          'VPS bot mirrors whale wallets on-chain via Polygon. Pure copy-trading — no signal lag.',
        description_sv: null,
        description_es: null,
        description_no: null,
        link: '/income-streams/polymarket-copy-trading',
        category: 'AI',
        potential_earnings: 'ON-CHAIN WHALE COPY · POLYGON CTF',
        potential_earnings_sv: null,
        potential_earnings_es: null,
        potential_earnings_no: null,
        is_featured: true,
        image_url: null,
        order_index: -2,
        icon_name: 'Zap',
        badge_text: 'SQI 2050 • VPS',
        badge_text_sv: null,
        badge_text_es: null,
        badge_text_no: null,
        color_from: null,
        color_to: null,
        internal_slug: 'polymarket-copy-trading',
        cta_button_text: 'Setup guide',
        cta_button_text_sv: null,
        cta_button_text_es: null,
        cta_button_text_no: null,
      };

      const aiBotFallback: IncomeStream = {
        id: 'prediction-market-bot-fallback',
        title: 'AI Prediction Engine',
        title_sv: null,
        title_es: null,
        title_no: null,
        description:
          'Gemini AI analyses 50 live markets every 90s. Kelly sizing. Signals with confidence score, edge %, and reasoning. No coding needed.',
        description_sv: null,
        description_es: null,
        description_no: null,
        link: '/prediction-market-bot',
        category: 'AI',
        potential_earnings: 'GEMINI · KELLY CRITERION · LIVE SIGNALS',
        potential_earnings_sv: null,
        potential_earnings_es: null,
        potential_earnings_no: null,
        is_featured: true,
        image_url: null,
        order_index: -1,
        icon_name: 'Brain',
        badge_text: 'AI · GEMINI',
        badge_text_sv: null,
        badge_text_es: null,
        badge_text_no: null,
        color_from: null,
        color_to: null,
        internal_slug: 'prediction-market-bot',
        cta_button_text: 'Open AI Engine',
        cta_button_text_sv: null,
        cta_button_text_es: null,
        cta_button_text_no: null,
      };

      const sqiSovereignBotFallback: IncomeStream = {
        id: 'sqi-sovereign-bot-fallback',
        title: 'SQI Sovereign Bot (Admin)',
        title_sv: null,
        title_es: null,
        title_no: null,
        description:
          'BTC paper terminal: Gemini feed, TA stack, trading modes, optional Claude oracle. Admin only.',
        description_sv: null,
        description_es: null,
        description_no: null,
        link: '/income-streams/sqi-sovereign-bot',
        category: 'AI',
        potential_earnings: 'BTC · TA · PAPER',
        potential_earnings_sv: null,
        potential_earnings_es: null,
        potential_earnings_no: null,
        is_featured: true,
        image_url: null,
        order_index: -5,
        icon_name: 'Bot',
        badge_text: 'ADMIN · SQI',
        badge_text_sv: null,
        badge_text_es: null,
        badge_text_no: null,
        color_from: null,
        color_to: null,
        internal_slug: 'sqi-sovereign-bot',
        cta_button_text: 'Open SQI bot',
        cta_button_text_sv: null,
        cta_button_text_es: null,
        cta_button_text_no: null,
      };

      const fomoCopyBotFallback: IncomeStream = {
        id: 'fomo-copy-bot-fallback',
        title: 'FOMO Copy Bot (Admin)',
        title_sv: null,
        title_es: null,
        title_no: null,
        description:
          'Solana lab: mirror wallets, paper or live Jupiter swaps, Pump.fun / Raydium signals. Admin only.',
        description_sv: null,
        description_es: null,
        description_no: null,
        link: '/income-streams/fomo-copy-bot',
        category: 'AI',
        potential_earnings: 'SOLANA · JUPITER · PHANTOM',
        potential_earnings_sv: null,
        potential_earnings_es: null,
        potential_earnings_no: null,
        is_featured: true,
        image_url: null,
        order_index: -4,
        icon_name: 'Cpu',
        badge_text: 'ADMIN · LAB',
        badge_text_sv: null,
        badge_text_es: null,
        badge_text_no: null,
        color_from: null,
        color_to: null,
        internal_slug: 'fomo-copy-bot',
        cta_button_text: 'Open FOMO bot',
        cta_button_text_sv: null,
        cta_button_text_es: null,
        cta_button_text_no: null,
      };

      let merged = [...withoutForex];
      // Polymarket bots are admin-only: only inject fallbacks for admins
      if (isAdmin) {
        if (!hasSqiSovereignBot) merged = [sqiSovereignBotFallback, ...merged];
        if (!hasFomoBot) merged = [fomoCopyBotFallback, ...merged];
        if (!hasAIBot) merged = [aiBotFallback, ...merged];
        if (!hasCopyTradingBot) merged = [copyTradingFallback, ...merged];
        if (!hasPolymarketBot) merged = [polymarketFallback, ...merged];
      }

      setStreams(merged);
    }
    if (error) console.error('Error fetching streams:', error);
    setIsLoading(false);
  };

  const getLocalizedField = (stream: IncomeStream, field: 'title' | 'description' | 'potential_earnings' | 'badge_text' | 'cta_button_text') => {
    if (currentLang === 'sv' && stream[`${field}_sv` as keyof IncomeStream]) {
      return stream[`${field}_sv` as keyof IncomeStream] as string;
    }
    if (currentLang === 'es' && stream[`${field}_es` as keyof IncomeStream]) {
      return stream[`${field}_es` as keyof IncomeStream] as string;
    }
    if (currentLang === 'no' && stream[`${field}_no` as keyof IncomeStream]) {
      return stream[`${field}_no` as keyof IncomeStream] as string;
    }
    return stream[field] as string | null;
  };

  const getIcon = (iconName: string | null): LucideIcon => {
    if (!iconName) return Sparkles;
    return iconMap[iconName] || Sparkles;
  };

  const isInternalLink = (link: string) => {
    return link.startsWith('/');
  };

  if (isLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 w-full max-w-full overflow-x-hidden bg-[#050505]">
      {/* SHC Balance Banner */}
      <div className="px-4 pt-6 pb-4">
        <SHCBalanceCard />
      </div>

      {/* Wallet Button */}
      <div className="px-4 pb-4">
        <Link to="/wallet">
          <Button className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-black text-base py-6 rounded-[40px] shadow-[0_0_35px_rgba(212,175,55,0.25)]">
            <Wallet className="w-5 h-5 mr-2" />
            {t('nav.wallet', 'Wallet')}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 pt-2 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-[24px] glass-card gold-border">
            <DollarSign className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold tracking-[0.5em] uppercase text-white/50">
              {t('incomeStreams.subtitle', 'Choose your path to financial growth')}
            </div>
            <h1 className="text-3xl font-black tracking-[-0.05em] text-white gold-glow">
              {t('incomeStreams.title', 'Income Streams')}
            </h1>
          </div>
        </div>
      </div>

      {/* Income Stream Cards Grid */}
      <div className="box-border grid w-full max-w-full gap-4 px-4">
        {streams.length === 0 ? (
          <Card className="w-full max-w-full rounded-[20px] bg-card/50">
            <CardContent className="py-12 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t('incomeStreams.noStreams', 'No income streams available yet.')}</p>
            </CardContent>
          </Card>
        ) : (
          streams.filter((stream) => {
            // Polymarket + FOMO + SQI Sovereign lab cards are admin-only
            const isPolymarketStream =
              stream.internal_slug === 'polymarket-bot' ||
              stream.internal_slug === 'polymarket-copy-trading' ||
              stream.internal_slug === 'polymarket-bot-general' ||
              stream.internal_slug === 'prediction-market-bot' ||
              stream.internal_slug === 'fomo-copy-bot' ||
              stream.internal_slug === 'sqi-sovereign-bot';
            if (isPolymarketStream && !isAdmin) return false;
            return true;
          }).map((stream) => {
            const IconComponent = getIcon(stream.icon_name);
            const isPolymarket = stream.internal_slug === 'polymarket-bot';
            const isGeneralBot = stream.internal_slug === 'polymarket-bot-general';
            const isCopyTrading = stream.internal_slug === 'polymarket-copy-trading';
            const isAIBot = stream.internal_slug === 'prediction-market-bot';
            const isFomo = stream.internal_slug === 'fomo-copy-bot';
            const isSqiSovereign = stream.internal_slug === 'sqi-sovereign-bot';
            const title = isPolymarket
              ? t('incomeStreams.hftCard.title')
              : isCopyTrading
                ? t('incomeStreams.copyBotCard.title')
                : isSqiSovereign
                  ? t('incomeStreams.sqiSovereignBotCard.title')
                  : isFomo
                    ? t('incomeStreams.fomoCopyBotCard.title')
                    : isAIBot
                      ? t('incomeStreams.aiPredictionCard.title')
                      : isGeneralBot
                        ? t('incomeStreams.strategyGuideCard.title')
                        : getLocalizedField(stream, 'title') || stream.title;
            const description = isPolymarket
              ? t('incomeStreams.hftCard.description')
              : isCopyTrading
                ? t('incomeStreams.copyBotCard.description')
                : isSqiSovereign
                  ? t('incomeStreams.sqiSovereignBotCard.description')
                  : isFomo
                    ? t('incomeStreams.fomoCopyBotCard.description')
                    : isAIBot
                      ? t('incomeStreams.aiPredictionCard.description')
                      : isGeneralBot
                        ? t('incomeStreams.strategyGuideCard.description')
                        : getLocalizedField(stream, 'description') || stream.description;
            const badge = getLocalizedField(stream, 'badge_text') || stream.badge_text;
            const earnings = isPolymarket
              ? t('incomeStreams.hftCard.footerTag')
              : isCopyTrading
                ? t('incomeStreams.copyBotCard.footerTag')
                : isSqiSovereign
                  ? t('incomeStreams.sqiSovereignBotCard.footerTag')
                  : isFomo
                    ? t('incomeStreams.fomoCopyBotCard.footerTag')
                    : isAIBot
                      ? t('incomeStreams.aiPredictionCard.footerTag')
                      : isGeneralBot
                        ? t('incomeStreams.strategyGuideCard.footerTag')
                        : getLocalizedField(stream, 'potential_earnings');

            const cardContent = (
              <Card className="group glass-card gold-border w-full max-w-full cursor-pointer overflow-hidden rounded-[20px] transition-all duration-300 hover:border-[#D4AF37]/25 hover:shadow-[0_0_30px_rgba(212,175,55,0.10)]">
                <CardContent className="w-full min-w-0 p-0">
                  <div
                    className={`flex w-full min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 ${isCopyTrading ? 'pr-12 sm:pr-14' : ''}`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                      {/* Icon */}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] transition-transform group-hover:scale-[1.03]"
                        style={{
                          background:
                            isAIBot || isFomo || isSqiSovereign
                              ? 'linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(212,175,55,0.12) 100%)'
                              : isPolymarket || isCopyTrading || isGeneralBot
                              ? 'linear-gradient(135deg, rgba(212,175,55,0.20) 0%, rgba(34,211,238,0.10) 100%)'
                              : 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(255,255,255,0.03) 100%)',
                          border: '1px solid rgba(212,175,55,0.16)',
                        }}
                      >
                        <IconComponent className="h-7 w-7 text-[#D4AF37]" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 overflow-hidden pr-0 sm:pr-2">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 max-w-full break-words text-base font-black tracking-[-0.02em] text-white">
                            {title}
                          </h3>
                          {isPolymarket ? (
                            <>
                              <span
                                className="shrink-0 rounded-full border border-[#D4AF37] bg-transparent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#D4AF37]"
                              >
                                {t('incomeStreams.hftCard.badgeNew')}
                              </span>
                              <span
                                className="shrink-0 rounded-full border border-[#D4AF37] bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#050505]"
                              >
                                {t('incomeStreams.hftCard.badgeSovereign')}
                              </span>
                            </>
                          ) : isGeneralBot ? (
                            <>
                              <span className="shrink-0 rounded-full border border-[#D4AF37] bg-transparent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#D4AF37]">
                                {t('incomeStreams.strategyGuideCard.badgeLine')}
                              </span>
                              <span className="shrink-0 rounded-full border border-[#D4AF37] bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#050505]">
                                {t('incomeStreams.strategyGuideCard.badgeSovereign')}
                              </span>
                            </>
                          ) : isSqiSovereign ? (
                            <>
                              <span className="shrink-0 rounded-full border border-[#22D3EE] bg-transparent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#22D3EE]">
                                {t('incomeStreams.sqiSovereignBotCard.badgeLine')}
                              </span>
                              <span className="shrink-0 rounded-full border border-[#D4AF37] bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#050505]">
                                {t('incomeStreams.sqiSovereignBotCard.badgeSovereign')}
                              </span>
                            </>
                          ) : isFomo ? (
                            <>
                              <span className="shrink-0 rounded-full border border-[#22D3EE] bg-transparent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#22D3EE]">
                                {t('incomeStreams.fomoCopyBotCard.badgeLine')}
                              </span>
                              <span className="shrink-0 rounded-full border border-[#D4AF37] bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#050505]">
                                {t('incomeStreams.fomoCopyBotCard.badgeSovereign')}
                              </span>
                            </>
                          ) : isAIBot ? (
                            <>
                              <span className="shrink-0 rounded-full border border-[#22D3EE] bg-transparent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#22D3EE]">
                                {t('incomeStreams.aiPredictionCard.badgeLine')}
                              </span>
                              <span className="shrink-0 rounded-full border border-[#D4AF37] bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#050505]">
                                {t('incomeStreams.aiPredictionCard.badgeSovereign')}
                              </span>
                            </>
                          ) : isCopyTrading ? (
                            <>
                              <span className="shrink-0 rounded-full border border-[#D4AF37] bg-transparent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#D4AF37]">
                                {t('incomeStreams.copyBotCard.badgeLine')}
                              </span>
                              <span className="shrink-0 rounded-full border border-[#D4AF37] bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#050505]">
                                {t('incomeStreams.copyBotCard.badgeSovereign')}
                              </span>
                            </>
                          ) : (
                            <>
                              {badge && (
                                <Badge
                                  variant="secondary"
                                  className="shrink-0 rounded-full border border-white/10 bg-white/5 text-[10px] text-white/70"
                                >
                                  {badge}
                                </Badge>
                              )}
                              {stream.is_featured && (
                                <Badge className="shrink-0 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/15 text-[10px] text-[#D4AF37]">
                                  SOVEREIGN
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <p className="line-clamp-2 break-words text-sm leading-relaxed text-white/60">
                          {description || t('incomeStreams.exploreOpportunity', 'Explore this opportunity')}
                        </p>
                        {earnings && (
                          <p className="mt-2 max-w-full break-words text-[10px] font-extrabold tracking-[0.35em] text-[#D4AF37]/80 uppercase">
                            {earnings}
                          </p>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="hidden h-5 w-5 shrink-0 text-white/30 transition-all group-hover:translate-x-1 group-hover:text-[#D4AF37] sm:block" />
                  </div>
                </CardContent>
              </Card>
            );

            if (isInternalLink(stream.link)) {
              if (isCopyTrading) {
                return (
                  <div key={stream.id} className="relative w-full max-w-full min-w-0">
                    <Link to={stream.link} className="block w-full max-w-full min-w-0">
                      {cardContent}
                    </Link>
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#050505]/90 text-[#D4AF37] shadow-lg backdrop-blur-md transition-colors hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10"
                      aria-label={t('incomeStreams.copyBotCard.infoAria')}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`${stream.link}#sovereign-setup`);
                      }}
                    >
                      <Info className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                );
              }
              return (
                <Link key={stream.id} to={stream.link} className="block w-full max-w-full min-w-0">
                  {cardContent}
                </Link>
              );
            }

            return (
              <a
                key={stream.id}
                href={stream.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-full min-w-0"
              >
                {cardContent}
              </a>
            );
          })
        )}
      </div>

      {/* Bottom CTA */}
      {streams.length > 0 && (
        <div className="mt-8 w-full max-w-full px-4">
          <Card className="w-full max-w-full rounded-[20px] border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10">
            <CardContent className="w-full min-w-0 p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="mb-3 text-sm text-muted-foreground">
                {t('incomeStreams.ctaText', 'Ready to start earning? Explore any stream above to get started.')}
              </p>
              <Button variant="outline" size="sm" className="w-full rounded-[20px] sm:w-auto" asChild>
                <Link to="/income-streams/affiliate" className="w-full justify-center sm:w-auto">
                  <Users className="mr-2 h-4 w-4 shrink-0" />
                  {t('incomeStreams.quickStart', 'Quick Start: Affiliate Program')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IncomeStreams;