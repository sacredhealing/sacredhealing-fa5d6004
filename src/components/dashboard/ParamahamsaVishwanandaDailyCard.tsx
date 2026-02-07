import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useDailyQuote } from '@/hooks/useDailyQuote';

export const ParamahamsaVishwanandaDailyCard: React.FC = () => {
  const { t } = useTranslation();
  const { quote, isVisible } = useDailyQuote();

  return (
    <div>
      <Card className="rounded-2xl p-5 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15 border-amber-500/30 overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 shrink-0">
            <Sun className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-foreground text-base">
              Paramahamsa Vishwananda
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("explore.vishwanandaDaily", "Today's inspiration & wisdom")}
            </p>
            {quote && (
              <blockquote
                className={`mt-3 text-sm sm:text-base text-foreground/90 leading-relaxed italic transition-opacity duration-300 ${
                  isVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                "{quote}"
              </blockquote>
            )}
            <a
              href="https://paramahamsavishwananda.com/inspirations/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-amber-600 dark:text-amber-400 text-sm font-medium hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
            >
              <span>{t("explore.viewDaily", "View daily quote")}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};
