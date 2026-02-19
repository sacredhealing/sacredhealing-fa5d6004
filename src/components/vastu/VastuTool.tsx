import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, Unlock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface VastuToolProps {
  isAdmin?: boolean;
}

export const VastuTool: React.FC<VastuToolProps> = ({ isAdmin = false }) => {
  const { t } = useTranslation();
  const [isUnlocked, setIsUnlocked] = useState(isAdmin);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">
            {t('vastu.title', 'Vastu Abundance Architect')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('vastu.subtitle', 'Transform your living space into a sanctuary of abundance through ancient Vastu wisdom and modern spatial design.')}
        </p>
      </div>

      <Card className="p-8 mb-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {t('vastu.whatIs', 'What is Vastu?')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('vastu.description', 'Vastu Shastra is the ancient Indian science of architecture and spatial design. It teaches how to align your physical environment with cosmic energies to attract prosperity, health, and harmony.')}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {t('vastu.courseContent', 'Course Content')}
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• {t('vastu.module1', '10 comprehensive modules covering every aspect of your home')}</li>
              <li>• {t('vastu.module2', 'AI-powered spatial analysis and recommendations')}</li>
              <li>• {t('vastu.module3', 'Sound alchemy and mantra transmissions')}</li>
              <li>• {t('vastu.module4', '48-hour integration periods for energy settling')}</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <Button size="lg" className="text-lg px-8">
          {t('vastu.startCourse', 'Begin Your Vastu Journey')}
        </Button>
      </div>
    </div>
  );
};
