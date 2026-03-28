import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import {
  GraduationCap,
  Heart,
  Sparkles,
  Music,
  Brain,
  Users,
  Shield,
  CheckCircle2,
  Star,
  Clock,
  Award,
  BookOpen,
} from 'lucide-react';

const MODULE_DEFS: { icon: LucideIcon; titleKey: string; itemKeys: string[] }[] = [
  {
    icon: Heart,
    titleKey: 'mod1Title',
    itemKeys: ['mod1i1', 'mod1i2', 'mod1i3'],
  },
  {
    icon: Sparkles,
    titleKey: 'mod2Title',
    itemKeys: ['mod2i1', 'mod2i2', 'mod2i3'],
  },
  {
    icon: Music,
    titleKey: 'mod3Title',
    itemKeys: ['mod3i1', 'mod3i2', 'mod3i3'],
  },
  {
    icon: Brain,
    titleKey: 'mod4Title',
    itemKeys: ['mod4i1', 'mod4i2', 'mod4i3'],
  },
  {
    icon: Users,
    titleKey: 'mod5Title',
    itemKeys: ['mod5i1', 'mod5i2', 'mod5i3', 'mod5i4'],
  },
  {
    icon: Shield,
    titleKey: 'mod6Title',
    itemKeys: ['mod6i1', 'mod6i2', 'mod6i3'],
  },
];

const p = (key: string) => `certificationPage.${key}`;

const PractitionerCertification = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<'onetime' | 'monthly' | null>(null);

  const modules = useMemo(
    () =>
      MODULE_DEFS.map((def) => ({
        icon: def.icon,
        title: t(p(def.titleKey)),
        items: def.itemKeys.map((ik) => t(p(ik))),
      })),
    [t]
  );

  const requirements = useMemo(
    () => [t(p('req1')), t(p('req2')), t(p('req3')), t(p('req4'))],
    [t]
  );

  const outcomes = useMemo(
    () => [t(p('out1')), t(p('out2')), t(p('out3')), t(p('out4'))],
    [t]
  );

  const bonuses = useMemo(
    () => [t(p('bonus1')), t(p('bonus2')), t(p('bonus3')), t(p('bonus4'))],
    [t]
  );

  const howItems = useMemo(
    () => [t(p('how1')), t(p('how2')), t(p('how3')), t(p('how4'))],
    [t]
  );

  const handleEnroll = async (paymentType: 'onetime' | 'monthly') => {
    if (!isAuthenticated) {
      toast.error(t(p('toastSignIn')));
      return;
    }

    setIsLoading(paymentType);
    try {
      const { data, error } = await supabase.functions.invoke('create-certification-checkout', {
        body: { paymentType },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toast.error(t(p('toastCheckoutFailed')));
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
            <GraduationCap className="w-4 h-4 mr-2" />
            {t(p('badge'))}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {t(p('title'))}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">{t(p('subtitle'))}</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5 text-primary" />
              <span>{t(p('meta12Months'))}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>{t(p('meta6Modules'))}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-5 h-5 text-primary" />
              <span>{t(p('metaOfficial'))}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t(p('sectionIncluded'))}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Card
                key={index}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <module.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">{t(p('sectionRequirements'))}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {requirements.map((req, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">{t(p('sectionOutcomes'))}</h2>
          <p className="text-center text-muted-foreground mb-8">{t(p('outcomesIntro'))}</p>
          <div className="space-y-4">
            {outcomes.map((outcome, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20"
              >
                <Star className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">{t(p('sectionBonus'))}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {bonuses.map((bonus, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20"
              >
                <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
                <span>{bonus}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">{t(p('sectionHow'))}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {howItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t(p('sectionInvestment'))}</h2>
          <p className="text-center text-muted-foreground mb-12">{t(p('investmentSub'))}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/50 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground">{t(p('bestValue'))}</Badge>
              </div>
              <CardHeader className="text-center pt-12">
                <CardTitle className="text-2xl mb-2">{t(p('oneTimeTitle'))}</CardTitle>
                <div className="text-4xl font-bold text-primary">{t(p('priceOneTime'))}</div>
                <p className="text-muted-foreground">{t(p('fullYearAccess'))}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{t(p('oneTimeBul1'))}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{t(p('oneTimeBul2'))}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{t(p('oneTimeBul3'))}</span>
                  </li>
                </ul>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleEnroll('onetime')}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'onetime' ? t(p('processing')) : t(p('enrollOneTime'))}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader className="text-center pt-12">
                <CardTitle className="text-2xl mb-2">{t(p('monthlyTitle'))}</CardTitle>
                <div className="text-4xl font-bold">{t(p('priceMonthly'))}</div>
                <p className="text-muted-foreground">{t(p('monthlySub'))}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{t(p('monthlyBul1'))}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{t(p('monthlyBul2'))}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{t(p('monthlyBul3'))}</span>
                  </li>
                </ul>
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => handleEnroll('monthly')}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'monthly' ? t(p('processing')) : t(p('enrollMonthly'))}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PractitionerCertification;
