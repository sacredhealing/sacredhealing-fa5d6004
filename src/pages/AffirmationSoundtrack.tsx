import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Music, Heart, CheckCircle, Star, Zap, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAffirmationContent } from '@/hooks/useAffirmationContent';
import { TranslatedContent } from '@/components/TranslatedContent';

const AffirmationSoundtrack: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { get, getPrice, isLoading: contentLoading } = useAffirmationContent();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);

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
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive'
      });
    } finally {
      setLoadingPackage(null);
    }
  };

  const basicPrice = getPrice('basic_price');
  const ultimatePrice = getPrice('ultimate_price');

  const benefits = [
    { icon: Heart, text: get('benefit_1', 'Reprogram subconscious patterns and old thought loops') },
    { icon: Sparkles, text: get('benefit_2', 'Support manifestation of goals and desires') },
    { icon: Star, text: get('benefit_3', 'Enhance clarity, confidence, and inner calm') },
    { icon: Music, text: get('benefit_4', 'Integrate daily spiritual practice with ease') },
  ];

  const howItWorks = [
    { step: 1, title: get('step_1_title', 'Questionnaire'), desc: get('step_1_desc', 'Share your personal goals, challenges, and intentions.') },
    { step: 2, title: get('step_2_title', 'Custom Meditation'), desc: get('step_2_desc', 'Receive a one-of-a-kind affirmation soundtrack created for your energy.') },
    { step: 3, title: get('step_3_title', 'Daily Use'), desc: get('step_3_desc', 'Listen regularly to amplify transformation and manifestation in your life.') },
  ];

  const ultimateIncludes = [
    {
      title: get('ultimate_soundtrack_title', 'Personalized Affirmation Soundtrack'),
      items: [
        get('ultimate_soundtrack_item1', 'Tailored affirmations to reprogram your subconscious mind'),
        get('ultimate_soundtrack_item2', 'Sacred sounds and healing frequencies'),
        get('ultimate_soundtrack_item3', 'Binaural beats and soothing background music')
      ]
    },
    {
      title: get('ultimate_healing_title', '30 Days of Healing Transmission'),
      items: [
        get('ultimate_healing_item1', 'Daily healing sessions with divine energies'),
        get('ultimate_healing_item2', 'Strengthen immune system & clear negativity'),
        get('ultimate_healing_item3', 'Overcome physical and mental challenges')
      ]
    },
    {
      title: get('ultimate_session_title', 'Private Online Session'),
      items: [
        get('ultimate_session_item1', 'One-on-one session to explore your fears and goals'),
        get('ultimate_session_item2', 'Written game plan for your journey'),
        get('ultimate_session_item3', 'Direct guidance from sacred healers')
      ]
    }
  ];

  if (contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <TranslatedContent 
              text={get('badge', 'Sacred Sound Healing')} 
              className="text-sm font-medium text-accent"
            />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
            <TranslatedContent text={get('title', 'Personalized Affirmation Soundtrack')} />
          </h1>
          <p className="text-foreground/80 text-lg">
            <TranslatedContent text={get('subtitle', 'Reprogram Your Mind and Manifest Your Dreams')} />
          </p>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-6 max-w-2xl mx-auto">
        {/* Main Card */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up">
          <TranslatedContent 
            text={get('description', 'Experience a meditation crafted uniquely for you, designed to align your subconscious with your goals, dreams, and personal growth. This audio meditation combines sacred sounds, healing frequencies, and affirmations to support deep transformation.')} 
            className="text-muted-foreground leading-relaxed"
            as="p"
          />
        </Card>

        {/* What's Included */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            <TranslatedContent text="What's Included" />
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <TranslatedContent 
                  text={get('included_affirmations_title', 'Custom Affirmations')} 
                  className="font-medium text-foreground"
                  as="p"
                />
                <TranslatedContent 
                  text={get('included_affirmations_desc', 'Tailored to your personal goals and challenges, designed to reprogram limiting beliefs.')} 
                  className="text-sm text-muted-foreground"
                  as="p"
                />
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <TranslatedContent 
                  text={get('included_frequencies_title', 'Healing Frequencies & Sacred Sounds')} 
                  className="font-medium text-foreground"
                  as="p"
                />
                <TranslatedContent 
                  text={get('included_frequencies_desc', 'Activate relaxation, clarity, and energetic alignment.')} 
                  className="text-sm text-muted-foreground"
                  as="p"
                />
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <TranslatedContent 
                  text={get('included_binaural_title', 'Binaural Beats & Soothing Music')} 
                  className="font-medium text-foreground"
                  as="p"
                />
                <TranslatedContent 
                  text={get('included_binaural_desc', 'Harmonize mind, heart, and energy for manifestation and focus.')} 
                  className="text-sm text-muted-foreground"
                  as="p"
                />
              </div>
            </li>
          </ul>
        </Card>

        {/* Benefits */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <TranslatedContent text="Benefits" />
          </h2>
          <ul className="space-y-3">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <TranslatedContent text={benefit.text} className="text-foreground" />
              </li>
            ))}
          </ul>
        </Card>

        {/* How It Works */}
        <Card className="p-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            <TranslatedContent text="How It Works" />
          </h2>
          <div className="space-y-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <TranslatedContent text={item.title} className="font-medium text-foreground" as="p" />
                  <TranslatedContent text={item.desc} className="text-sm text-muted-foreground" as="p" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Basic Package */}
        <Card className="p-6 bg-gradient-card border-secondary/50 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
              <TranslatedContent text={get('basic_title', 'Personalized Affirmation Soundtrack')} />
            </h2>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-heading font-bold text-gradient-gold">
                {Number(basicPrice.price).toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">{basicPrice.currency}</span>
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
                <TranslatedContent text={get('basic_cta', 'Get Your Personalized Soundtrack')} />
              </>
            )}
          </Button>
        </Card>

        {/* Ultimate Package Upsell */}
        <div className="relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              ⭐ <TranslatedContent text="BEST VALUE" />
            </span>
          </div>
          <Card className="p-6 bg-gradient-to-br from-secondary/20 to-primary/10 border-secondary animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2 mt-2">
                <TranslatedContent text={get('ultimate_title', 'The Ultimate Soulwave Activation Package')} />
              </h2>
              <TranslatedContent 
                text={get('ultimate_subtitle', 'Achieve Your Dreams and Transform Your Life')} 
                className="text-muted-foreground text-sm mb-4"
                as="p"
              />
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-heading font-bold text-gradient-gold">
                  {Number(ultimatePrice.price).toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground">{ultimatePrice.currency}</span>
              </div>
              <TranslatedContent 
                text={get('ultimate_savings', 'Save 497 SEK vs purchasing separately')} 
                className="text-xs text-accent mt-1"
                as="p"
              />
            </div>

            <div className="space-y-4 mb-6">
              {ultimateIncludes.map((section, i) => (
                <div key={i} className="bg-background/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-secondary" />
                    <TranslatedContent text={section.title} />
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <TranslatedContent text={item} />
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
                  <TranslatedContent text={get('ultimate_cta', 'Get The Ultimate Package')} />
                </>
              )}
            </Button>

            <TranslatedContent 
              text={get('ultimate_includes', 'Includes 30 Days of Healing + Personalized Soundtrack + Private Session')} 
              className="text-center text-xs text-muted-foreground mt-4"
              as="p"
            />
          </Card>
        </div>

        {/* CTA Footer */}
        <Card className="p-6 bg-gradient-healing border-primary/30 text-center animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <Sparkles className="w-8 h-8 text-secondary mx-auto mb-3" />
          <TranslatedContent 
            text={get('footer_title', 'Step into alignment, clarity, and empowerment.')} 
            className="font-heading font-semibold text-foreground mb-2"
            as="p"
          />
          <TranslatedContent 
            text={get('footer_desc', 'Use your personalized soundtrack daily to heal, manifest, and reprogram your mind.')} 
            className="text-sm text-muted-foreground"
            as="p"
          />
        </Card>
      </div>
    </div>
  );
};

export default AffirmationSoundtrack;
