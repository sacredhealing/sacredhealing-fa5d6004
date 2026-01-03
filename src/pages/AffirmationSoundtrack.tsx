import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Music, Heart, CheckCircle, Star, Zap, Clock, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const AffirmationSoundtrack: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);

  const benefits = [
    { icon: Heart, text: t('affirmation.benefits.reprogram') },
    { icon: Sparkles, text: t('affirmation.benefits.manifest') },
    { icon: Star, text: t('affirmation.benefits.clarity') },
    { icon: Music, text: t('affirmation.benefits.spiritual') },
  ];

  const howItWorks = [
    { step: 1, title: t('affirmation.howItWorks.step1.title'), desc: t('affirmation.howItWorks.step1.desc') },
    { step: 2, title: t('affirmation.howItWorks.step2.title'), desc: t('affirmation.howItWorks.step2.desc') },
    { step: 3, title: t('affirmation.howItWorks.step3.title'), desc: t('affirmation.howItWorks.step3.desc') },
  ];

  const ultimateIncludes = [
    {
      title: t('affirmation.ultimate.soundtrack.title'),
      items: [
        t('affirmation.ultimate.soundtrack.item1'),
        t('affirmation.ultimate.soundtrack.item2'),
        t('affirmation.ultimate.soundtrack.item3')
      ]
    },
    {
      title: t('affirmation.ultimate.healing.title'),
      items: [
        t('affirmation.ultimate.healing.item1'),
        t('affirmation.ultimate.healing.item2'),
        t('affirmation.ultimate.healing.item3')
      ]
    },
    {
      title: t('affirmation.ultimate.session.title'),
      items: [
        t('affirmation.ultimate.session.item1'),
        t('affirmation.ultimate.session.item2'),
        t('affirmation.ultimate.session.item3')
      ]
    }
  ];

  const handlePurchase = async (packageType: 'basic' | 'ultimate') => {
    setLoadingPackage(packageType);
    try {
      const response = await supabase.functions.invoke('create-affirmation-checkout', {
        body: { packageType }
      });

      if (response.error) throw response.error;

      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('affirmation.checkoutError'),
        variant: 'destructive'
      });
    } finally {
      setLoadingPackage(null);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Section */}
      <div className="relative bg-gradient-spiritual px-4 pt-6 pb-16">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-foreground/80"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center pt-12 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-4">
            <Music className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">{t('affirmation.badge')}</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
            {t('affirmation.title')}
          </h1>
          <p className="text-foreground/80 text-lg">
            {t('affirmation.subtitle')}
          </p>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-6 max-w-2xl mx-auto">
        {/* Main Card */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up">
          <p className="text-muted-foreground leading-relaxed">
            {t('affirmation.description')}
          </p>
        </Card>

        {/* What's Included */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            {t('affirmation.whatsIncluded')}
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{t('affirmation.included.affirmations.title')}</p>
                <p className="text-sm text-muted-foreground">{t('affirmation.included.affirmations.desc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{t('affirmation.included.frequencies.title')}</p>
                <p className="text-sm text-muted-foreground">{t('affirmation.included.frequencies.desc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{t('affirmation.included.binaural.title')}</p>
                <p className="text-sm text-muted-foreground">{t('affirmation.included.binaural.desc')}</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Benefits */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            {t('affirmation.benefitsTitle')}
          </h2>
          <ul className="space-y-3">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* How It Works */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            {t('affirmation.howItWorksTitle')}
          </h2>
          <div className="space-y-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Basic Package */}
        <Card className="p-6 bg-gradient-card border-secondary/50 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
              {t('affirmation.basicPackage.title')}
            </h2>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-heading font-bold text-gradient-gold">1,497</span>
              <span className="text-lg text-muted-foreground">SEK</span>
            </div>
          </div>
          <Button 
            variant="gold" 
            size="lg" 
            className="w-full"
            onClick={() => handlePurchase('basic')}
            disabled={loadingPackage === 'basic'}
          >
            {loadingPackage === 'basic' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t('affirmation.basicPackage.cta')}
              </>
            )}
          </Button>
        </Card>

        {/* Ultimate Package Upsell */}
        <div className="relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              ⭐ {t('affirmation.ultimatePackage.badge')}
            </span>
          </div>
          <Card className="p-6 bg-gradient-to-br from-secondary/20 to-primary/10 border-secondary animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2 mt-2">
                {t('affirmation.ultimatePackage.title')}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {t('affirmation.ultimatePackage.subtitle')}
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-heading font-bold text-gradient-gold">2,997</span>
                <span className="text-lg text-muted-foreground">SEK</span>
              </div>
              <p className="text-xs text-accent mt-1">{t('affirmation.ultimatePackage.savings')}</p>
            </div>

            <div className="space-y-4 mb-6">
              {ultimateIncludes.map((section, i) => (
                <div key={i} className="bg-background/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-secondary" />
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Button 
              variant="gold" 
              size="lg" 
              className="w-full"
              onClick={() => handlePurchase('ultimate')}
              disabled={loadingPackage === 'ultimate'}
            >
              {loadingPackage === 'ultimate' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Star className="w-5 h-5 mr-2" />
                  {t('affirmation.ultimatePackage.cta')}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              {t('affirmation.ultimatePackage.includes')}
            </p>
          </Card>
        </div>

        {/* CTA Footer */}
        <Card className="p-6 bg-gradient-healing border-primary/30 text-center animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <Sparkles className="w-8 h-8 text-secondary mx-auto mb-3" />
          <p className="font-heading font-semibold text-foreground mb-2">
            {t('affirmation.footer.title')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('affirmation.footer.desc')}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AffirmationSoundtrack;
