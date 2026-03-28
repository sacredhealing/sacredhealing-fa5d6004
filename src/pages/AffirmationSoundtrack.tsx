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

  const akashaField = (
    <>
      <div className="pointer-events-none fixed inset-0 bg-[#050505] z-0" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.95] bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(212,175,55,0.11)_0%,transparent_55%),radial-gradient(ellipse_90%_55%_at_100%_25%,rgba(212,175,55,0.05)_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_0%_75%,rgba(34,211,238,0.04)_0%,transparent_45%)]"
        aria-hidden
      />
    </>
  );

  if (contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {akashaField}
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] relative z-10 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden bg-[#050505]">
      {akashaField}

      <div className="relative z-10">
        {/* Hero — Prema-Pulse header */}
        <div className="relative px-4 pt-6 pb-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 rounded-full border border-white/[0.06] bg-white/[0.02] text-[#D4AF37] hover:text-[#D4AF37] hover:bg-white/[0.05] hover:border-[#D4AF37]/25 backdrop-blur-[40px] h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-center pt-14 max-w-lg mx-auto">
            <p className="sqi-label-text mb-3 text-[#D4AF37]/70">Bhakti-Algorithm · Prema-Pulse</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-white/[0.02] px-5 py-2.5 backdrop-blur-[40px] shadow-[0_0_28px_-8px_rgba(212,175,55,0.25)] mb-5">
              <Music className="w-4 h-4 text-[#D4AF37]" />
              <TranslatedContent
                text={get('badge', 'Sacred Sound Healing')}
                className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37]"
              />
            </div>
            <h1 className="font-black text-3xl md:text-4xl tracking-[-0.05em] text-[#D4AF37] gold-glow mb-4 font-heading leading-tight">
              <TranslatedContent text={get('title', 'Personalized Affirmation Soundtrack')} />
            </h1>
            <p className="sqi-body-text text-base md:text-lg max-w-md mx-auto">
              <TranslatedContent text={get('subtitle', 'Reprogram Your Mind and Manifest Your Dreams')} />
            </p>
          </div>
        </div>

        <div className="px-4 -mt-6 space-y-6 max-w-2xl mx-auto">
          <Card className="p-6 border-white/[0.06] shadow-[0_0_48px_-16px_rgba(212,175,55,0.12)] animate-slide-up hover:border-[#D4AF37]/15">
            <TranslatedContent
              text={get('description', 'Experience a meditation crafted uniquely for you, designed to align your subconscious with your goals, dreams, and personal growth. This audio meditation combines sacred sounds, healing frequencies, and affirmations to support deep transformation.')}
              className="sqi-body-text leading-relaxed"
              as="p"
            />
          </Card>

          <Card className="p-6 border-white/[0.06] shadow-[0_0_48px_-16px_rgba(212,175,55,0.1)] animate-slide-up hover:border-[#D4AF37]/15" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-black tracking-[-0.05em] text-[#D4AF37] gold-glow mb-4 flex items-center gap-2 font-heading">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <TranslatedContent text="What's Included" />
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(212,175,55,0.35)]" />
                <div>
                  <TranslatedContent
                    text={get('included_affirmations_title', 'Custom Affirmations')}
                    className="font-black tracking-[-0.03em] text-white"
                    as="p"
                  />
                  <TranslatedContent
                    text={get('included_affirmations_desc', 'Tailored to your personal goals and challenges, designed to reprogram limiting beliefs.')}
                    className="text-sm sqi-body-text mt-1"
                    as="p"
                  />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(212,175,55,0.35)]" />
                <div>
                  <TranslatedContent
                    text={get('included_frequencies_title', 'Healing Frequencies & Sacred Sounds')}
                    className="font-black tracking-[-0.03em] text-white"
                    as="p"
                  />
                  <TranslatedContent
                    text={get('included_frequencies_desc', 'Activate relaxation, clarity, and energetic alignment.')}
                    className="text-sm sqi-body-text mt-1"
                    as="p"
                  />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(212,175,55,0.35)]" />
                <div>
                  <TranslatedContent
                    text={get('included_binaural_title', 'Binaural Beats & Soothing Music')}
                    className="font-black tracking-[-0.03em] text-white"
                    as="p"
                  />
                  <TranslatedContent
                    text={get('included_binaural_desc', 'Harmonize mind, heart, and energy for manifestation and focus.')}
                    className="text-sm sqi-body-text mt-1"
                    as="p"
                  />
                </div>
              </li>
            </ul>
          </Card>

          <Card className="p-6 border-white/[0.06] shadow-[0_0_48px_-16px_rgba(212,175,55,0.1)] animate-slide-up hover:border-[#D4AF37]/15" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-xl font-black tracking-[-0.05em] text-[#D4AF37] gold-glow mb-4 flex items-center gap-2 font-heading">
              <Heart className="w-5 h-5 text-[#D4AF37]" />
              <TranslatedContent text="Benefits" />
            </h2>
            <ul className="space-y-3">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[#D4AF37]/20 bg-white/[0.03] flex items-center justify-center shadow-[0_0_20px_-6px_rgba(212,175,55,0.35)]">
                    <benefit.icon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <TranslatedContent text={benefit.text} className="sqi-body-text text-[15px] text-white/75" />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 border-white/[0.06] shadow-[0_0_48px_-16px_rgba(212,175,55,0.1)] animate-slide-up hover:border-[#D4AF37]/15" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-black tracking-[-0.05em] text-[#D4AF37] gold-glow mb-4 flex items-center gap-2 font-heading">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <TranslatedContent text="How It Works" />
            </h2>
            <div className="space-y-4">
              {howItWorks.map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center font-black text-sm shrink-0 shadow-[0_0_20px_-6px_rgba(34,211,238,0.45)]">
                    {item.step}
                  </div>
                  <div>
                    <TranslatedContent text={item.title} className="font-black tracking-[-0.03em] text-white" as="p" />
                    <TranslatedContent text={item.desc} className="text-sm sqi-body-text mt-1" as="p" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-[#D4AF37]/25 shadow-[0_0_56px_-12px_rgba(212,175,55,0.2)] animate-slide-up hover:border-[#D4AF37]/35" style={{ animationDelay: '0.25s' }}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-black tracking-[-0.05em] text-white mb-2 font-heading">
                <TranslatedContent text={get('basic_title', 'Personalized Affirmation Soundtrack')} />
              </h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black tracking-[-0.05em] text-gradient-gold font-heading">
                  {Number(basicPrice.price).toLocaleString()}
                </span>
                <span className="text-lg sqi-body-text">{basicPrice.currency}</span>
              </div>
            </div>
            <Button
              variant="gold"
              size="lg"
              className="w-full rounded-[40px] h-12 text-xs tracking-[0.28em] uppercase"
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

          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/35 bg-white/[0.04] px-5 py-2 sqi-label-text !tracking-[0.45em] text-[#D4AF37] backdrop-blur-[40px] shadow-[0_0_24px_-6px_rgba(212,175,55,0.45)]">
                <Star className="w-3 h-3 text-[#D4AF37]" />
                <TranslatedContent text="BEST VALUE" />
              </span>
            </div>
            <Card className="p-6 pt-10 border-[#D4AF37]/30 bg-white/[0.02] shadow-[0_0_64px_-8px_rgba(212,175,55,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] animate-slide-up hover:border-[#D4AF37]/40" style={{ animationDelay: '0.3s' }}>
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-[1.65rem] font-black tracking-[-0.05em] text-[#D4AF37] gold-glow mb-2 mt-1 font-heading leading-tight">
                  <TranslatedContent text={get('ultimate_title', 'The Ultimate Soulwave Activation Package')} />
                </h2>
                <TranslatedContent
                  text={get('ultimate_subtitle', 'Achieve Your Dreams and Transform Your Life')}
                  className="sqi-body-text text-sm mb-4"
                  as="p"
                />
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black tracking-[-0.05em] text-gradient-gold font-heading">
                    {Number(ultimatePrice.price).toLocaleString()}
                  </span>
                  <span className="text-lg sqi-body-text">{ultimatePrice.currency}</span>
                </div>
                <TranslatedContent
                  text={get('ultimate_savings', 'Save 497 SEK vs purchasing separately')}
                  className="text-xs text-[#22D3EE] mt-2 font-semibold tracking-wide"
                  as="p"
                />
              </div>

              <div className="space-y-4 mb-6">
                {ultimateIncludes.map((section, i) => (
                  <div key={i} className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-[40px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <h3 className="font-black tracking-[-0.03em] text-[#D4AF37] mb-2 flex items-center gap-2 text-base">
                      <Zap className="w-4 h-4 text-[#D4AF37]" />
                      <TranslatedContent text={section.title} />
                    </h3>
                    <ul className="space-y-1.5">
                      {section.items.map((item, j) => (
                        <li key={j} className="text-sm sqi-body-text flex items-start gap-2">
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
                className="w-full rounded-[40px] h-12 text-xs tracking-[0.28em] uppercase animate-sovereign-pulse"
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
                className="text-center text-xs sqi-body-text mt-4"
                as="p"
              />
            </Card>
          </div>

          <Card className="p-6 border-[#D4AF37]/20 shadow-[0_0_48px_-12px_rgba(212,175,55,0.18)] text-center animate-slide-up hover:border-[#D4AF37]/28" style={{ animationDelay: '0.35s' }}>
            <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto mb-3 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
            <TranslatedContent
              text={get('footer_title', 'Step into alignment, clarity, and empowerment.')}
              className="font-black tracking-[-0.04em] text-[#D4AF37] gold-glow mb-2 text-lg font-heading"
              as="p"
            />
            <TranslatedContent
              text={get('footer_desc', 'Use your personalized soundtrack daily to heal, manifest, and reprogram your mind.')}
              className="text-sm sqi-body-text"
              as="p"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AffirmationSoundtrack;
