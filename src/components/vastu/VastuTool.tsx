import React, { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface VastuToolProps {
  isAdmin?: boolean;
}

export const VastuTool: React.FC<VastuToolProps> = ({ isAdmin = false }) => {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);

  const modules = [
    { number: 1, title: t('vastu.m1Title', 'Foundation & Five Elements'), desc: t('vastu.m1Desc', 'Understand the Pancha Bhutas and how earth, water, fire, air, and space govern your home.') },
    { number: 2, title: t('vastu.m2Title', 'Entrance & Brahmasthan'), desc: t('vastu.m2Desc', 'Harness the power of the main entrance and the sacred center point of your space.') },
    { number: 3, title: t('vastu.m3Title', 'Zones & Directions'), desc: t('vastu.m3Desc', 'Map the 16 Vastu zones and align each room with its optimal directional energy.') },
    { number: 4, title: t('vastu.m4Title', 'AI Spatial Analysis'), desc: t('vastu.m4Desc', 'Upload your floor plan and receive AI-powered Vastu recommendations tailored to your space.') },
    { number: 5, title: t('vastu.m5Title', 'Sound Alchemy & Mantras'), desc: t('vastu.m5Desc', 'Activate your space with sacred sound frequencies and mantra transmissions.') },
    { number: 6, title: t('vastu.m6Title', 'Colour & Material Wisdom'), desc: t('vastu.m6Desc', 'Choose colours and materials that amplify the energetic quality of each zone.') },
    { number: 7, title: t('vastu.m7Title', 'Water & Wealth Corners'), desc: t('vastu.m7Desc', 'Position water elements and wealth activators for maximum abundance flow.') },
    { number: 8, title: t('vastu.m8Title', 'Sleep & Bedroom Harmonics'), desc: t('vastu.m8Desc', 'Optimise your bedroom orientation and decor for deep rest and rejuvenation.') },
    { number: 9, title: t('vastu.m9Title', 'Kitchen & Fire Zone'), desc: t('vastu.m9Desc', 'Balance fire energy in the kitchen to support health, digestion, and family harmony.') },
    { number: 10, title: t('vastu.m10Title', '48-Hour Integration Ritual'), desc: t('vastu.m10Desc', 'Complete the transformation with a guided 48-hour energy-settling integration period.') },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
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

      {!started ? (
        <>
          <Card className="p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  {t('vastu.whatIs', 'What is Vastu?')}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('vastu.description', 'Vastu Shastra is the ancient Indian science of architecture and spatial design. It teaches how to align your physical environment with cosmic energies to attract prosperity, health, and harmony.')}
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  {t('vastu.courseContent', 'Course Content')}
                </h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span>{t('vastu.module1', '10 comprehensive modules covering every aspect of your home')}</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span>{t('vastu.module2', 'AI-powered spatial analysis and recommendations')}</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span>{t('vastu.module3', 'Sound alchemy and mantra transmissions')}</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✦</span>{t('vastu.module4', '48-hour integration periods for energy settling')}</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Button
              size="lg"
              className="text-lg px-10"
              onClick={() => setStarted(true)}
            >
              {t('vastu.startCourse', 'Begin Your Vastu Journey')}
              <ChevronDown className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {t('vastu.modulesTitle', 'Your 10-Module Journey')}
          </h2>
          {modules.map((mod) => (
            <Card key={mod.number} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {mod.number}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{mod.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
