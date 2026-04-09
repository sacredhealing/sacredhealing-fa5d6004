import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';
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
            <Flame className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37' }}>
              Paramahamsa Vishwananda
            </h3>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(212,175,55,0.55)', marginTop: 2 }}>
              {t("explore.vishwanandaDaily", "Today's inspiration & wisdom")}
            </p>
            {quote && (
              <blockquote
                className={`mt-3 leading-relaxed italic transition-opacity duration-300 ${
                  isVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{ fontSize: '0.92rem', color: 'rgba(212,175,55,0.75)' }}
              >
                "{quote}"
              </blockquote>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
