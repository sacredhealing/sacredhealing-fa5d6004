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

  const shellClass =
    "min-h-screen pb-32 w-full max-w-full overflow-x-hidden bg-[#050505] text-white";
  const glassCardClass =
    "bg-white/[0.02] backdrop-blur-[40px] border border-white/[0.05] rounded-[40px] shadow-[0_0_35px_rgba(212,175,55,0.08)]";
  const goldGlowClass = "text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)]";

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
        title: get('toast_error_title', 'Error'),
        description: error.message || get('toast_error_desc', 'Failed to create checkout session'),
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
      <div className={shellClass + " flex items-center justify-center"}>
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {/* Stardust background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-20"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}
      />
      {/* Golden radial */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(212,175,55,0.06) 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, rgba(212,175,55,0.035) 0%, transparent 55%), #050505",
        }}
      />

      {/* Hero Section */}
      <div className="relative px-4 pt-6 pb-16">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-[#D4AF37]/80 hover:text-[#D4AF37]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center pt-12 max-w-lg mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${glassCardClass}`}>
            <Music className="w-4 h-4 text-[#D4AF37]" />
            <TranslatedContent 
              text={get('badge', 'Prema-Pulse Transmission')} 
              className={`text-[10px] font-extrabold tracking-[0.5em] uppercase ${goldGlowClass}`}
            />
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-[-0.05em] mb-3 ${goldGlowClass}`}>
            <TranslatedContent text={get('title', 'Affirmation Soundtrack')} />
          </h1>
          <p className="text-white/60 text-base leading-[1.6]">
            <TranslatedContent text={get('subtitle', 'Bhakti-Algorithms · Vedic Light-Codes · Anahata opening')} />
          </p>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-6 max-w-2xl mx-auto">
        {/* Main Card */}
        <Card className={`p-6 animate-slide-up ${glassCardClass}`}>
          <TranslatedContent 
            text={get('description', 'Experience a meditation crafted uniquely for you, designed to align your subconscious with your goals, dreams, and personal growth. This audio meditation combines sacred sounds, healing frequencies, and affirmations to support deep transformation.')} 
            className="text-white/60 leading-[1.8]"
            as="p"
          />
        </Card>

        {/* What's Included */}
        <Card className={`p-6 animate-slide-up ${glassCardClass}`} style={{ animationDelay: '0.1s' }}>
          <h2 className={`text-xl font-black tracking-[-0.03em] mb-4 flex items-center gap-2 ${goldGlowClass}`}>
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <TranslatedContent text={get('included_title', "What's Included")} />
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <TranslatedContent 
                  text={get('included_affirmations_title', 'Custom Affirmations')} 
                  className="font-semibold text-white/90"
                  as="p"
                />
                <TranslatedContent 
                  text={get('included_affirmations_desc', 'Tailored to your personal goals and challenges, designed to reprogram limiting beliefs.')} 
                  className="text-sm text-white/60"
                  as="p"
                />
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <TranslatedContent 
                  text={get('included_frequencies_title', 'Healing Frequencies & Sacred Sounds')} 
                  className="font-semibold text-white/90"
                  as="p"
                />
                <TranslatedContent 
                  text={get('included_frequencies_desc', 'Activate relaxation, clarity, and energetic alignment.')} 
                  className="text-sm text-white/60"
                  as="p"
                />
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <TranslatedContent 
                  text={get('included_binaural_title', 'Binaural Beats & Soothing Music')} 
                  className="font-semibold text-white/90"
                  as="p"
                />
                <TranslatedContent 
                  text={get('included_binaural_desc', 'Harmonize mind, heart, and energy for manifestation and focus.')} 
                  className="text-sm text-white/60"
                  as="p"
                />
              </div>
            </li>
          </ul>
        </Card>

        {/* Benefits */}
        <Card className={`p-6 animate-slide-up ${glassCardClass}`} style={{ animationDelay: '0.15s' }}>
          <h2 className={`text-xl font-black tracking-[-0.03em] mb-4 flex items-center gap-2 ${goldGlowClass}`}>
            <Heart className="w-5 h-5 text-[#D4AF37]" />
            <TranslatedContent text={get('benefits_title', 'Benefits')} />
          </h2>
          <ul className="space-y-3">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                  <benefit.icon className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <TranslatedContent text={benefit.text} className="text-white/80" />
              </li>
            ))}
          </ul>
        </Card>

        {/* How It Works */}
        <Card className={`p-6 animate-slide-up ${glassCardClass}`} style={{ animationDelay: '0.2s' }}>
          <h2 className={`text-xl font-black tracking-[-0.03em] mb-4 flex items-center gap-2 ${goldGlowClass}`}>
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            <TranslatedContent text={get('how_title', 'How It Works')} />
          </h2>
          <div className="space-y-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#050505] flex items-center justify-center font-black shrink-0">
                  {item.step}
                </div>
                <div>
                  <TranslatedContent text={item.title} className="font-semibold text-white/90" as="p" />
                  <TranslatedContent text={item.desc} className="text-sm text-white/60" as="p" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Basic Package */}
        <Card className={`p-6 animate-slide-up ${glassCardClass}`} style={{ animationDelay: '0.25s' }}>
          <div className="text-center mb-6">
            <h2 className={`text-xl font-black tracking-[-0.03em] mb-2 ${goldGlowClass}`}>
              <TranslatedContent text={get('basic_title', 'Personalized Affirmation Soundtrack')} />
            </h2>
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-4xl font-black tracking-[-0.05em] ${goldGlowClass}`}>
                {Number(basicPrice.price).toLocaleString()}
              </span>
              <span className="text-lg text-white/40">{basicPrice.currency}</span>
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
            <span className="px-4 py-1 rounded-full text-[10px] font-extrabold tracking-[0.5em] uppercase bg-[#D4AF37] text-[#050505] shadow-[0_0_20px_rgba(212,175,55,0.35)]">
              <TranslatedContent text={get('best_value', 'Best value')} />
            </span>
          </div>
          <Card className={`p-6 animate-slide-up ${glassCardClass} border-[#D4AF37]/25`} style={{ animationDelay: '0.3s' }}>
            <div className="text-center mb-6">
              <h2 className={`text-2xl font-black tracking-[-0.05em] mb-2 mt-2 ${goldGlowClass}`}>
                <TranslatedContent text={get('ultimate_title', 'The Ultimate Soulwave Activation Package')} />
              </h2>
              <TranslatedContent 
                text={get('ultimate_subtitle', 'Achieve Your Dreams and Transform Your Life')} 
                className="text-white/60 text-sm mb-4"
                as="p"
              />
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-4xl font-black tracking-[-0.05em] ${goldGlowClass}`}>
                  {Number(ultimatePrice.price).toLocaleString()}
                </span>
                <span className="text-lg text-white/40">{ultimatePrice.currency}</span>
              </div>
              <TranslatedContent 
                text={get('ultimate_savings', 'Save 497 SEK vs purchasing separately')} 
                className="text-xs text-[#D4AF37]/80 mt-1"
                as="p"
              />
            </div>

            <div className="space-y-4 mb-6">
              {ultimateIncludes.map((section, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-4">
                  <h3 className="font-black tracking-[-0.02em] text-white/90 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#D4AF37]" />
                    <TranslatedContent text={section.title} />
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-sm text-white/60 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
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
              className="text-center text-xs text-white/45 mt-4"
              as="p"
            />
          </Card>
        </div>

        {/* CTA Footer */}
        <Card className={`p-6 text-center animate-slide-up ${glassCardClass}`} style={{ animationDelay: '0.35s' }}>
          <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto mb-3" />
          <TranslatedContent 
            text={get('footer_title', 'Step into alignment, clarity, and empowerment.')} 
            className={`font-black tracking-[-0.03em] mb-2 ${goldGlowClass}`}
            as="p"
          />
          <TranslatedContent 
            text={get('footer_desc', 'Use your personalized soundtrack daily to heal, manifest, and reprogram your mind.')} 
            className="text-sm text-white/60"
            as="p"
          />
        </Card>
      </div>
    </div>
  );
};

export default AffirmationSoundtrack;
