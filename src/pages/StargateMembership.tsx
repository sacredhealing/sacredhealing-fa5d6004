import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Calendar, Heart, Users, MessageCircle, Sparkles, Check, Loader2, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { HiddenWisdomVault } from '@/components/stargate/HiddenWisdomVault';

const GOLD = '#D4AF37';
const AKASHA = '#050505';
const GLASS_BG = 'rgba(255, 255, 255, 0.02)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.05)';
const CYAN = '#22D3EE';

const glassCard =
  'rounded-[40px] border backdrop-blur-[40px] shadow-[0_0_40px_rgba(212,175,55,0.08)] border-[rgba(255,255,255,0.06)]';

const bodyMuted = { color: 'rgba(255,255,255,0.6)', fontWeight: 400 as const, lineHeight: 1.6 };

const primaryBtnClass =
  'rounded-full font-black tracking-tight border border-[rgba(212,175,55,0.45)] shadow-[0_0_28px_rgba(212,175,55,0.2)] transition-all hover:shadow-[0_0_36px_rgba(212,175,55,0.28)] disabled:opacity-50';

const StargateMembership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  useEffect(() => {
    const handleSuccess = async () => {
      if (searchParams.get('success') === 'true' && user) {
        toast.success('Välkommen till Stargate Membership!');

        try {
          const { data: { session } } = await supabase.auth.getSession();
          const { data, error } = await supabase.functions.invoke('send-telegram-invite', {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (!error && data?.invite_link) {
            setTelegramLink(data.invite_link);
            toast.success('Din Telegram-inbjudan är klar!');
          }
        } catch (err) {
          console.error('Error getting Telegram invite:', err);
        }
      }
    };

    handleSuccess();

    if (searchParams.get('canceled') === 'true') {
      toast.info('Betalningen avbröts.');
    }
  }, [searchParams, user]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('create-stargate-checkout', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Kunde inte starta betalningen. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Star,
      title: 'Mantrachanting (Måndagar)',
      description:
        'Helig ljudsession för att lugna sinnet, öppna hjärtat och höja frekvensen. Perfekt start på veckan.',
    },
    {
      icon: Sparkles,
      title: 'Healing Chamber (Tisdagar)',
      description:
        'Guidad meditationsupplevelse i ett högfrekvent healingfält som arbetar på nervsystem, chakran och blockeringar.',
    },
    {
      icon: Heart,
      title: 'Bhagavad Gita Class + Q&A',
      description: 'Levande undervisning med yogiska perspektiv på livets frågor. Ställ frågor och få djup andlig vägledning.',
    },
    {
      icon: MessageCircle,
      title: 'Telegram-grupp',
      description: 'Privat community med daglig inspiration, stöd mellan sessionerna och möjlighet att dela upplevelser.',
    },
  ];

  const benefits = [
    'Leva i högre klarhet och hjärtenergi',
    'Släppa stress, oro och gamla mönster',
    'Stärka nervsystemet',
    'Utveckla intuition och andlig förståelse',
    'Få regelbunden healing och guidning',
    'Vara del av ett helande community',
  ];

  const pageFont = { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };

  return (
    <div className="min-h-screen pb-28" style={{ ...pageFont, background: AKASHA, color: 'rgba(255,255,255,0.92)' }}>
      {telegramLink && (
        <div className="px-4 py-6">
          <Card
            className={`max-w-lg mx-auto p-8 text-center ${glassCard}`}
            style={{ background: GLASS_BG, borderColor: 'rgba(34,211,238,0.22)', boxShadow: '0 0 40px rgba(34,211,238,0.1)' }}
          >
            <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: CYAN }} strokeWidth={2} />
            <h3 className="text-xl font-black mb-2 tracking-tight text-white" style={{ letterSpacing: '-0.03em' }}>
              Välkommen till Stargate! 🎉
            </h3>
            <p className="mb-6 text-[15px]" style={bodyMuted}>
              Klicka nedan för att gå med i vår privata Telegram-grupp:
            </p>
            <Button
              asChild
              className={`${primaryBtnClass} text-[#050505]`}
              style={{ background: `linear-gradient(135deg, ${GOLD}, #c9a227)` }}
            >
              <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Gå med i Telegram-gruppen
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </Card>
        </div>
      )}

      <div className="relative px-4 py-12 md:py-16 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,175,55,0.14), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 80%, rgba(34,211,238,0.06), transparent 45%)',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p
            className="text-[8px] font-extrabold uppercase tracking-[0.5em] mb-4"
            style={{ color: 'rgba(212,175,55,0.78)' }}
          >
            Bhakti-Algorithm · Prema-Pulse · Vedic Light-Codes
          </p>
          <Badge
            variant="outline"
            className="mb-5 rounded-full border-[rgba(212,175,55,0.35)] px-4 py-1 text-[9px] font-extrabold uppercase tracking-[0.35em]"
            style={{ background: 'rgba(212,175,55,0.08)', color: GOLD, borderColor: 'rgba(212,175,55,0.3)' }}
          >
            Andligt Medlemskap
          </Badge>
          <h1
            className="text-3xl md:text-5xl font-black mb-4 tracking-tight"
            style={{ color: GOLD, textShadow: '0 0 28px rgba(212,175,55,0.25)', letterSpacing: '-0.05em' }}
          >
            Stargate Membership
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-[15px] md:text-base" style={bodyMuted}>
            Ett andligt och helande medlemskap med regelbundna livesessioner, djup energihealing, mantrachanting och
            vägledning i yogisk visdom.
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-4xl md:text-5xl font-black tabular-nums text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              $25
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-[0.4em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              / månad
            </span>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            size="lg"
            className={`${primaryBtnClass} px-10 py-6 text-sm text-[#050505]`}
            style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c547)` }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Laddar...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" strokeWidth={2} />
                Bli Medlem Nu
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-3 tracking-tight text-white" style={{ letterSpacing: '-0.04em' }}>
          Vad som ingår
        </h2>
        <p className="text-center text-[8px] font-extrabold uppercase tracking-[0.45em] mb-10" style={{ color: 'rgba(212,175,55,0.55)' }}>
          Sovereign field
        </p>

        <div className="grid gap-5 max-w-2xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className={`p-6 md:p-7 ${glassCard}`} style={{ background: GLASS_BG }}>
              <div className="flex gap-4">
                <div
                  className="p-3 rounded-[20px] h-fit shrink-0 border"
                  style={{ background: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.2)' }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: GOLD }} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-black text-white mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={bodyMuted}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Calendar className="w-7 h-7 shrink-0" style={{ color: CYAN }} strokeWidth={2} />
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              Hur ofta vi ses
            </h2>
          </div>

          <Card className={`p-8 ${glassCard}`} style={{ background: GLASS_BG }}>
            <p className="text-center mb-6 text-[15px]" style={bodyMuted}>
              Vi möts <strong className="text-white font-bold">2 gånger per vecka</strong>,{' '}
              <strong className="text-white font-bold">3 veckor varje månad</strong>, live via Zoom:
            </p>

            <div className="space-y-3">
              <div
                className="flex items-center gap-3 p-4 rounded-[24px] border"
                style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.15)' }}
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CYAN }} />
                <span className="text-white">
                  <strong>Måndagar:</strong> Mantrachanting
                </span>
              </div>
              <div
                className="flex items-center gap-3 p-4 rounded-[24px] border"
                style={{ background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.18)' }}
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: GOLD }} />
                <span className="text-white">
                  <strong>Tisdagar:</strong> Healing Chamber eller Bhagavad Gita
                </span>
              </div>
            </div>

            <p className="text-center text-sm mt-6 italic" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Den fjärde veckan är en integrationsvecka för vila, reflektion och integration av energin.
            </p>
          </Card>
        </div>
      </div>

      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Users className="w-7 h-7 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              Syftet med medlemskapet
            </h2>
          </div>

          <Card className={`p-8 ${glassCard}`} style={{ background: GLASS_BG, borderColor: 'rgba(212,175,55,0.15)' }}>
            <p className="text-center mb-6 text-[15px]" style={bodyMuted}>
              Stargate är för dig som vill:
            </p>

            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} strokeWidth={2.5} />
                  <span className="text-white leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-10 tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            Hur det fungerar
          </h2>

          <div className="grid gap-3">
            {[
              'Alla sessioner sker online via Zoom',
              'Du får länkar och tider direkt i appen',
              'Du kan delta hemifrån, slappna av och ta emot',
              'Du får både live-sessioner och community-stöd',
            ].map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 rounded-[24px] border ${glassCard}`}
                style={{ background: GLASS_BG }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm border"
                  style={{ background: 'rgba(212,175,55,0.12)', borderColor: 'rgba(212,175,55,0.25)', color: GOLD }}
                >
                  {index + 1}
                </div>
                <span className="text-white leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {user && (
        <div className="px-4 py-10">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="membership" className="w-full">
              <TabsList
                className="grid w-full grid-cols-2 h-auto rounded-[40px] p-1.5 border gap-1"
                style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}
              >
                <TabsTrigger
                  value="membership"
                  className="rounded-[36px] py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#050505] data-[state=active]:shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                >
                  Medlemskap
                </TabsTrigger>
                <TabsTrigger
                  value="wisdom"
                  className="rounded-[36px] py-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#050505] data-[state=active]:shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                >
                  <BookOpen className="w-4 h-4 mr-2 inline" strokeWidth={2} />
                  Hidden Wisdom Vault
                </TabsTrigger>
              </TabsList>
              <TabsContent value="membership" className="mt-8">
                <Card className={`max-w-2xl mx-auto p-8 md:p-10 text-center ${glassCard}`} style={{ background: GLASS_BG, borderColor: 'rgba(212,175,55,0.2)' }}>
                  <h2 className="text-2xl font-black text-white mb-4 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                    Är du redo att transformera ditt liv?
                  </h2>
                  <p className="mb-8 text-[15px]" style={bodyMuted}>
                    Gå med i Stargate Membership idag och börja din resa mot klarhet, healing och andlig utveckling.
                  </p>

                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-3xl font-black tabular-nums text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                      $25
                    </span>
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.35em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      / månad
                    </span>
                  </div>

                  <Button
                    onClick={handleSubscribe}
                    disabled={loading}
                    size="lg"
                    className={`${primaryBtnClass} px-10 py-6 text-sm text-[#050505]`}
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c547)` }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Laddar...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" strokeWidth={2} />
                        Starta Ditt Medlemskap
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Du kan avsluta när som helst. Inga bindningstider.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="wisdom" className="mt-8">
                <HiddenWisdomVault />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {!user && (
        <div className="px-4 py-12">
          <Card className={`max-w-2xl mx-auto p-8 md:p-10 text-center ${glassCard}`} style={{ background: GLASS_BG, borderColor: 'rgba(212,175,55,0.2)' }}>
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              Är du redo att transformera ditt liv?
            </h2>
            <p className="mb-8 text-[15px]" style={bodyMuted}>
              Gå med i Stargate Membership idag och börja din resa mot klarhet, healing och andlig utveckling.
            </p>

            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-3xl font-black tabular-nums text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                $25
              </span>
              <span className="text-[8px] font-extrabold uppercase tracking-[0.35em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                / månad
              </span>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              size="lg"
              className={`${primaryBtnClass} px-10 py-6 text-sm text-[#050505]`}
              style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c547)` }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Laddar...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" strokeWidth={2} />
                  Starta Ditt Medlemskap
                </>
              )}
            </Button>

            <p className="text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Du kan avsluta när som helst. Inga bindningstider.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StargateMembership;
