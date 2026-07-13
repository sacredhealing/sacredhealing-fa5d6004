import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Calendar, Heart, Users, MessageCircle, Sparkles, Check, Loader2, ExternalLink, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useStargateAccess } from '@/hooks/useStargateAccess';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { HiddenWisdomVault } from '@/components/stargate/HiddenWisdomVault';
import RecordingsList from '@/components/recordings/RecordingsList';

/** SQI 2050 — reusable 8px system label (gold or muted) */
const SystemLabel: React.FC<{ children: React.ReactNode; gold?: boolean; className?: string }> = ({
  children,
  gold,
  className = '',
}) => (
  <div
    className={`text-[8px] font-extrabold tracking-[0.5em] uppercase ${
      gold ? 'text-[#D4AF37]' : 'text-white/40'
    } ${className}`}
  >
    {children}
  </div>
);

/** SQI 2050 gold vault tab trigger */
const vaultTabClass =
  'rounded-full text-[10px] font-extrabold tracking-[0.1em] uppercase py-2.5 ' +
  'data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-white/50 flex items-center justify-center gap-1';

const StargateMembership = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tier } = useMembership();
  const isPayingMember = ['prana-flow', 'siddha-quantum'].includes((tier || '').toLowerCase());
  const isAkashaInfinity = (tier || '').toLowerCase() === 'akasha-infinity';
  const stargatePriceLabel = isAkashaInfinity ? 'Included Free' : isPayingMember ? '€6/mo' : '€25/mo';
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { isStargateMember, loading: stargateLoading } = useStargateAccess();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [memberTab, setMemberTab] = useState<'membership' | 'healing' | 'gita' | 'wisdom'>('gita');

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

  useEffect(() => {
    if (user && isAdmin && !adminLoading) {
      setMemberTab('wisdom');
    }
  }, [user, isAdmin, adminLoading]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isAdmin) {
      toast.info(t('stargate.adminCheckoutSkipped'));
      return;
    }
    if (isAkashaInfinity) {
      toast.success('Stargate is included free with Akasha-Infinity — no checkout needed.');
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
      description: 'Helig ljudsession för att lugna sinnet, öppna hjärtat och höja frekvensen. Perfekt start på veckan.',
    },
    {
      icon: Sparkles,
      title: 'Healing Chamber (Tisdagar)',
      description: 'Guidad meditationsupplevelse i ett högfrekvent healingfält som arbetar på nervsystem, chakran och blockeringar.',
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

  const SubscribeButton: React.FC<{ full?: boolean }> = ({ full }) => (
    <button
      onClick={handleSubscribe}
      disabled={loading || (isAdmin && !!user) || (isAkashaInfinity && !!user)}
      className={`btn-siddha disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 ${
        full ? 'w-full sm:w-auto' : ''
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Laddar...
        </span>
      ) : isAdmin && user ? (
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {t('stargate.adminFullAccessBadge')}
        </span>
      ) : isAkashaInfinity && user ? (
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Included with Akasha-Infinity
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          Bli Medlem Nu
        </span>
      )}
    </button>
  );

  // Members (admin, Stargate subscribers, manually-added, grant) get the recordings vault directly
  // instead of the sales landing page.
  if (user && isStargateMember && !stargateLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pb-24">
        <div className="relative bg-gradient-sanctuary px-4 py-12 text-center overflow-hidden">
          <div className="relative z-10">
            <SystemLabel gold className="justify-center flex mb-4">
              {isAdmin ? t('stargate.adminFullAccessBadge') : 'Stargate Member'}
            </SystemLabel>
            <h1 className="sqi-title text-3xl md:text-4xl mb-3">✨ Stargate Vault ✨</h1>
            <p className="text-white/50 max-w-2xl mx-auto text-sm">
              Alla inspelade Bhagavad Gita-klasser, Healing Chamber-sessioner och dold visdom.
            </p>
          </div>
        </div>

        <div className="px-4 py-8 max-w-4xl mx-auto">
          <Tabs value={memberTab} onValueChange={(v) => setMemberTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/[0.02] border border-white/5 rounded-full p-1 h-auto">
              <TabsTrigger value="gita" className={vaultTabClass}>Bhagavad Gita</TabsTrigger>
              <TabsTrigger value="healing" className={vaultTabClass}>Healing Chamber</TabsTrigger>
              <TabsTrigger value="wisdom" className={vaultTabClass}>
                <BookOpen className="w-3.5 h-3.5" />
                Wisdom
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gita" className="mt-6">
              <h3 className="sqi-title text-lg mb-4">Bhagavad Gita Class Sessions</h3>
              <RecordingsList callType="stargate" stargateCategory="bhagavad-gita" emptyText="No Bhagavad Gita class recordings yet." />
            </TabsContent>
            <TabsContent value="healing" className="mt-6">
              <h3 className="sqi-title text-lg mb-4">Healing Chamber Sessions</h3>
              <RecordingsList callType="stargate" stargateCategory="healing-chamber" emptyText="No Healing Chamber recordings yet." />
            </TabsContent>
            <TabsContent value="wisdom" className="mt-6">
              <HiddenWisdomVault />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      {/* Telegram Invite Card */}
      {telegramLink && (
        <div className="px-4 py-6">
          <div className="max-w-lg mx-auto card-glass text-center border-[#22D3EE]/20">
            <MessageCircle className="w-10 h-10 text-[#22D3EE] mx-auto mb-3" />
            <h3 className="text-lg font-black text-white mb-2">Välkommen till Stargate! 🎉</h3>
            <p className="text-white/50 text-sm mb-5">
              Klicka nedan för att gå med i vår privata Telegram-grupp:
            </p>
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-siddha inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Gå med i Telegram-gruppen
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Hero Section — Akasha-Black + Siddha-Gold radial field */}
      <div className="relative bg-gradient-sanctuary px-4 py-14 text-center overflow-hidden">
        <div className="relative z-10">
          <SystemLabel gold className="justify-center flex mb-4">Andligt Medlemskap</SystemLabel>
          <h1 className="sqi-title text-3xl md:text-5xl mb-4">✨ Stargate Membership ✨</h1>
          <p className="text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
            Ett andligt och helande medlemskap med regelbundna livesessioner, djup energihealing,
            mantrachanting och vägledning i yogisk visdom.
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-4xl font-black gold-glow">{stargatePriceLabel}</span>
          </div>

          <SubscribeButton />
        </div>
      </div>

      {/* What's Included */}
      <div className="px-4 py-10">
        <SystemLabel gold className="justify-center flex mb-3">Vad som ingår</SystemLabel>
        <h2 className="sqi-title text-2xl text-center mb-8">Sessioner &amp; Innehåll</h2>

        <div className="grid gap-4 max-w-2xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="card-glass !p-5 flex gap-4">
              <div className="p-3 rounded-2xl bg-[#D4AF37]/10 h-fit">
                <feature.icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="px-4 py-10 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="sqi-title text-2xl">Hur ofta vi ses</h2>
          </div>

          <div className="card-glass">
            <p className="text-center text-white/50 mb-5">
              Vi möts <strong className="text-white">2 gånger per vecka</strong>, <strong className="text-white">3 veckor varje månad</strong>, live via Zoom:
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#D4AF37]/[0.06] border border-[#D4AF37]/10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                <span className="text-white/80"><strong className="text-white">Måndagar:</strong> Mantrachanting</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#22D3EE]/[0.06] border border-[#22D3EE]/10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]" />
                <span className="text-white/80"><strong className="text-white">Tisdagar:</strong> Healing Chamber eller Bhagavad Gita</span>
              </div>
            </div>

            <p className="text-center text-xs text-white/30 mt-5 italic">
              Den fjärde veckan är en integrationsvecka för vila, reflektion och integration av energin.
            </p>
          </div>
        </div>
      </div>

      {/* Purpose */}
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="sqi-title text-2xl">Syftet med medlemskapet</h2>
          </div>

          <div className="card-glass">
            <p className="text-center text-white/50 mb-5">Stargate är för dig som vill:</p>

            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-white/80">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="px-4 py-10 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-2xl mx-auto">
          <SystemLabel gold className="justify-center flex mb-3">Hur det fungerar</SystemLabel>
          <h2 className="sqi-title text-2xl text-center mb-8">Processen</h2>

          <div className="grid gap-3">
            {[
              'Alla sessioner sker online via Zoom',
              'Du får länkar och tider direkt i appen',
              'Du kan delta hemifrån, slappna av och ta emot',
              'Du får både live-sessioner och community-stöd',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4AF37] font-black text-xs">{index + 1}</span>
                </div>
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section (for non-members / logged out) */}
      <div className="px-4 py-14">
        <div className="max-w-2xl mx-auto card-glass text-center border-[#D4AF37]/20">
          <h2 className="sqi-title text-xl mb-3">Är du redo att transformera ditt liv?</h2>
          <p className="text-white/50 mb-6 text-sm">
            Gå med i Stargate Membership idag och börja din resa mot klarhet, healing och andlig utveckling.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-3xl font-black gold-glow">{stargatePriceLabel}</span>
          </div>

          <SubscribeButton />

          <p className="text-[11px] text-white/30 mt-4">
            Du kan avsluta när som helst. Inga bindningstider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StargateMembership;
