import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, Users, Sparkles, ArrowRight, Coins, 
  GraduationCap, Bot, Cpu, Heart, Star, Zap, Globe, Shield,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { SHCBalanceCard } from '@/components/dashboard/SHCBalanceCard';
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
};

const IncomeStreams: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get current language reactively
  const currentLang = i18n.language?.split('-')[0] || 'en';

  useEffect(() => {
    fetchStreams();
  }, [currentLang]); // Re-fetch when language changes to ensure fresh render

  const fetchStreams = async () => {
    const { data, error } = await supabase
      .from('income_streams')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (data) {
      setStreams(data as unknown as IncomeStream[]);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 w-full max-w-full overflow-x-hidden">
      {/* SHC Balance Banner */}
      <div className="px-4 pt-6 pb-4">
        <SHCBalanceCard />
      </div>

      {/* Wallet Button */}
      <div className="px-4 pb-4">
        <Link to="/wallet">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-base py-6 shadow-[0_0_30px_rgba(0,242,254,0.4)]">
            <Wallet className="w-5 h-5 mr-2" />
            {t('nav.wallet', 'Wallet')}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 pt-2 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('incomeStreams.title', 'Income Streams')}</h1>
            <p className="text-sm text-muted-foreground">{t('incomeStreams.subtitle', 'Choose your path to financial growth')}</p>
          </div>
        </div>
      </div>

      {/* Income Stream Cards Grid */}
      <div className="px-4 grid gap-4 w-full max-w-full box-border">
        {streams.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('incomeStreams.noStreams', 'No income streams available yet.')}</p>
            </CardContent>
          </Card>
        ) : (
          streams.map((stream) => {
            const IconComponent = getIcon(stream.icon_name);
            const title = getLocalizedField(stream, 'title') || stream.title;
            const description = getLocalizedField(stream, 'description') || stream.description;
            const badge = getLocalizedField(stream, 'badge_text') || stream.badge_text;
            const earnings = getLocalizedField(stream, 'potential_earnings');
            const colorFrom = stream.color_from || 'primary';
            const colorTo = stream.color_to || 'primary/70';

            const cardContent = (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer w-full max-w-full">
                <CardContent className="p-0">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
                    {/* Icon */}
                    <div 
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-${colorFrom} to-${colorTo} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                      style={{
                        background: `linear-gradient(to bottom right, var(--${colorFrom.replace('/', '-').replace('-500', '')}, hsl(var(--primary))), var(--${colorTo.replace('/', '-').replace('-600', '').replace('-500', '')}, hsl(var(--primary) / 0.7)))`
                      }}
                    >
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{title}</h3>
                        {badge && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                            {badge}
                          </Badge>
                        )}
                        {stream.is_featured && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] sm:text-xs shrink-0">
                            ⭐
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
                        {description || t('incomeStreams.exploreOpportunity', 'Explore this opportunity')}
                      </p>
                      {earnings && (
                        <p className="text-[10px] sm:text-xs text-primary mt-1 truncate">
                          💰 {earnings}
                        </p>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1 sm:mt-0" />
                  </div>
                </CardContent>
              </Card>
            );

            if (isInternalLink(stream.link)) {
              return (
                <Link key={stream.id} to={stream.link} className="block w-full max-w-full">
                  {cardContent}
                </Link>
              );
            }

            return (
              <a key={stream.id} href={stream.link} target="_blank" rel="noopener noreferrer" className="block w-full max-w-full">
                {cardContent}
              </a>
            );
          })
        )}
      </div>

      {/* Bottom CTA */}
      {streams.length > 0 && (
        <div className="px-4 mt-8">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                {t('incomeStreams.ctaText', 'Ready to start earning? Explore any stream above to get started.')}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/income-streams/affiliate">
                  <Users className="w-4 h-4 mr-2" />
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