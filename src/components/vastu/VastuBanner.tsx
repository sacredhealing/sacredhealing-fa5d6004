import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export const VastuBanner: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-50/50">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-amber-100 border border-amber-200">
                <Sparkles className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-stone-900">
                  {t('vastu.banner.title', 'Vastu Abundance Architect')}
                </h3>
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mt-1">
                  {t('vastu.banner.badge', 'Premium Course')}
                </p>
              </div>
            </div>
            
            <p className="text-stone-700 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
              {t('vastu.banner.description', 'Transform your living space into a sanctuary of abundance through ancient Vastu wisdom. Learn to align your home with cosmic energies for prosperity, health, and harmony.')}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-medium">
                {t('vastu.banner.feature1', '10 Modules')}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-medium">
                {t('vastu.banner.feature2', 'AI Analysis')}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-medium">
                {t('vastu.banner.feature3', 'Sound Alchemy')}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button
              onClick={() => navigate('/vastu')}
              size="lg"
              className="bg-amber-700 hover:bg-amber-800 text-white shadow-lg shadow-amber-900/20 flex items-center gap-2"
            >
              {t('vastu.banner.cta', 'Start Course')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
