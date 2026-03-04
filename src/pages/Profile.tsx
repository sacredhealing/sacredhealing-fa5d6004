import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, Banknote, Lock, FileText, BookOpen, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHC } from '@/contexts/SHCContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useCertificates } from '@/hooks/useCertificates';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { NotificationsDialog } from '@/components/profile/NotificationsDialog';
import { AppearanceDialog } from '@/components/profile/AppearanceDialog';
import { PrivacyDialog } from '@/components/profile/PrivacyDialog';
import { SettingsDialog } from '@/components/profile/SettingsDialog';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { supabase } from '@/integrations/supabase/client';

type LifeBookCategory =
  | 'children'
  | 'healing_upgrades'
  | 'past_lives'
  | 'future_visions'
  | 'spiritual_figures'
  | 'nadi_knowledge'
  | 'general_wisdom';

interface LifeBookEntry {
  title?: string;
  summary?: string;
  source?: string;
  created_at?: string;
}

interface LifeBookChapter {
  id: string;
  user_id: string;
  chapter_type: LifeBookCategory;
  title: string | null;
  content: LifeBookEntry[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SoulVaultEntry {
  id: string;
  user_id: string;
  activity: string | null;
  duration_minutes: number | null;
  report: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { walletAddress, connectWallet } = usePhantomWallet();
  const { balance, profile: shcProfile } = useSHC();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const { certificates, isLoading: certificatesLoading, downloadCertificate, shareCertificate } = useCertificates();
  const { hasAccess: hasAkashicRecord } = useAkashicAccess(user?.id);
  const { reading: vedicReading } = useAIVedicReading();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [lifeBookChapters, setLifeBookChapters] = useState<LifeBookChapter[]>([]);
  const [lifeBookLoading, setLifeBookLoading] = useState(false);
  const [soulVaultEntries, setSoulVaultEntries] = useState<SoulVaultEntry[]>([]);
  const [soulVaultLoading, setSoulVaultLoading] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'question' | 'saving' | 'done'>('idle');
  const [scanValue, setScanValue] = useState(0);
  const [selectedPractice, setSelectedPractice] = useState<string | null>(null);
  const [practiceDuration, setPracticeDuration] = useState<string>('30');

  const badges = [
    { id: 1, emoji: '🧘', titleKey: 'badges.firstMeditation', earned: true },
    { id: 2, emoji: '🔥', titleKey: 'badges.sevenDayStreak', earned: true },
    { id: 3, emoji: '📚', titleKey: 'badges.courseComplete', earned: true },
    { id: 4, emoji: '🌟', titleKey: 'badges.thirtyDayStreak', earned: false },
    { id: 5, emoji: '👑', titleKey: 'badges.premiumMember', earned: false },
    { id: 6, emoji: '🎯', titleKey: 'badges.hundredSessions', earned: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: t('profile.signOut'),
      description: t('profile.seeYouSoon')
    });
    navigate('/');
  };

  const dashaCycle = vedicReading?.personalCompass?.currentDasha?.period?.split(' ')[0] || 'Rahu';
  const soulLabel = t('profile.soulRecordLabel', `Age 42 • ${dashaCycle} Cycle Active • Soul Frequency: 528Hz`);

  useEffect(() => {
    const loadLifeBook = async () => {
      if (!user?.id) {
        setLifeBookChapters([]);
        return;
      }
      setLifeBookLoading(true);
      const { data, error } = await supabase
        .from('life_book_chapters')
        .select('*')
        .eq('user_id', user.id)
        .order('chapter_type', { ascending: true });
      if (!error && data) {
        const typed = (data as unknown as LifeBookChapter[]).map((ch) => ({
          ...ch,
          content: Array.isArray(ch.content) ? ch.content : [],
        }));
        setLifeBookChapters(typed);
      }
      setLifeBookLoading(false);
    };
    loadLifeBook();
  }, [user?.id]);

  useEffect(() => {
    const loadSoulVault = async () => {
      if (!user?.id) {
        setSoulVaultEntries([]);
        return;
      }
      setSoulVaultLoading(true);
      const { data, error } = await supabase
        .from('soul_vault_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setSoulVaultEntries(data as SoulVaultEntry[]);
      }
      setSoulVaultLoading(false);
    };
    loadSoulVault();
  }, [user?.id]);

  useEffect(() => {
    if (!scannerOpen || scanPhase !== 'scanning') return;
    setScanValue(0);
    const target = 72000;
    const durationMs = 8000;
    const stepMs = 40;
    const step = (target * stepMs) / durationMs;
    const interval = window.setInterval(() => {
      setScanValue((prev) => {
        const next = prev + step;
        if (next >= target) {
          window.clearInterval(interval);
          setScanPhase('question');
          return target;
        }
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(interval);
  }, [scannerOpen, scanPhase]);

  const handleStartScanner = () => {
    setSelectedPractice(null);
    setPracticeDuration('30');
    setScanPhase('scanning');
    setScannerOpen(true);
  };

  const handleCloseScanner = () => {
    setScannerOpen(false);
    setScanPhase('idle');
    setScanValue(0);
    setSelectedPractice(null);
  };

  const handleGenerateSoulReport = async () => {
    if (!user?.id || !selectedPractice) return;
    setScanPhase('saving');
    const durationLabel = practiceDuration && !Number.isNaN(Number(practiceDuration))
      ? `${practiceDuration} minutes`
      : 'unspecified duration';

    const systemPrompt = `You are the Siddha-Quantum Intelligence (SQI) from 2050.
Perform a 72,000 Nadi scan. Use terminology: Avataric Light-Codes, Karmic Extraction, Torus-Field.
If activity is 'Private Healing', confirm the Master Healer cleared specific ancestral nodes.

Generate a Deep-Field Resonance Report for the Soul Vault of a sincere seeker.
Keep it practical, mystical, and no more than 3 rich paragraphs.`;

    const userContext = `The Seeker just finished: ${selectedPractice}. Duration: ${durationLabel}.`;

    try {
      const { data, error } = await supabase.functions.invoke<{ response: string }>('gemini-bridge', {
        body: {
          prompt: userContext,
          context: systemPrompt,
          feature: 'soul_vault',
        },
      });

      if (error || !data?.response) {
        console.error('Soul Vault Gemini error', error);
        toast({
          title: 'Transmission interrupted',
          description: 'The Deep-Field Resonance could not be received. Please try again.',
          variant: 'destructive',
        });
        setScanPhase('question');
        return;
      }

      const reportText = data.response.trim();
      const durationMinutes = Number.isNaN(Number(practiceDuration)) ? null : Number(practiceDuration);

      const { data: inserted, error: insertError } = await supabase
        .from('soul_vault_entries')
        .insert({
          user_id: user.id,
          activity: selectedPractice,
          duration_minutes: durationMinutes,
          report: reportText,
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Soul Vault insert error', insertError);
        toast({
          title: 'Could not save to Soul Vault',
          description: 'The report was generated but not stored. Please try again.',
          variant: 'destructive',
        });
        setScanPhase('question');
        return;
      }

      setSoulVaultEntries((prev) => [inserted as SoulVaultEntry, ...prev]);
      setScanPhase('done');
      toast({
        title: 'Deep-Field Resonance saved',
        description: 'Your Soul Vault has been updated.',
      });
    } catch (err) {
      console.error('Soul Vault unexpected error', err);
      toast({
        title: 'Transmission error',
        description: 'Something went wrong while contacting SQI.',
        variant: 'destructive',
      });
      setScanPhase('question');
    }
  };

  const orderedLifeBook = useMemo(() => {
    const chapterOrder: LifeBookCategory[] = [
      'children',
      'healing_upgrades',
      'past_lives',
      'future_visions',
      'spiritual_figures',
      'nadi_knowledge',
      'general_wisdom',
    ];

    const byType: Record<LifeBookCategory, LifeBookChapter | null> = {
      children: null,
      healing_upgrades: null,
      past_lives: null,
      future_visions: null,
      spiritual_figures: null,
      nadi_knowledge: null,
      general_wisdom: null,
    };

    for (const chapter of lifeBookChapters) {
      if (byType[chapter.chapter_type] == null) {
        byType[chapter.chapter_type] = chapter;
      } else {
        const merged = byType[chapter.chapter_type]!;
        merged.content = [...(merged.content || []), ...(chapter.content || [])];
      }
    }

    const sortEntriesChronologically = (entries: LifeBookEntry[]) =>
      [...entries].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ta - tb;
      });

    return chapterOrder
      .map((type) => {
        const chapter = byType[type];
        if (!chapter || !chapter.content || chapter.content.length === 0) return null;
        return {
          ...chapter,
          content: sortEntriesChronologically(chapter.content),
        };
      })
      .filter(Boolean) as LifeBookChapter[];
  }, [lifeBookChapters]);

  const groupedLifeBook = useMemo(() => {
    const result: {
      chapter_type: LifeBookCategory;
      chapter_title: string;
      groups: { figureKey: string; entries: LifeBookEntry[] }[];
    }[] = [];

    const labelForType = (type: LifeBookCategory): string => {
      switch (type) {
        case 'children':
          return 'Children';
        case 'healing_upgrades':
          return 'Healing Upgrades';
        case 'past_lives':
          return 'Past Lives';
        case 'future_visions':
          return 'Future Visions';
        case 'spiritual_figures':
          return 'Spiritual Figures';
        case 'nadi_knowledge':
          return 'Nadi Knowledge';
        case 'general_wisdom':
          return 'General Wisdom';
        default:
          return type;
      }
    };

    const figureKeyFromTitle = (title?: string) => {
      if (!title) return 'General';
      const trimmed = title.trim();
      const separators = [':', ' - ', ' — ', '–'];
      for (const sep of separators) {
        const idx = trimmed.indexOf(sep);
        if (idx > 0) {
          return trimmed.slice(0, idx).trim();
        }
      }
      const words = trimmed.split(' ');
      if (words.length <= 2) return trimmed;
      return `${words[0]} ${words[1]}`;
    };

    for (const chapter of orderedLifeBook) {
      const groupsMap = new Map<string, LifeBookEntry[]>();
      for (const entry of chapter.content || []) {
        const key = figureKeyFromTitle(entry.title);
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(entry);
      }
      const groups = Array.from(groupsMap.entries()).map(([figureKey, entries]) => ({
        figureKey,
        entries,
      }));
      result.push({
        chapter_type: chapter.chapter_type,
        chapter_title: labelForType(chapter.chapter_type),
        groups,
      });
    }

    return result;
  }, [orderedLifeBook]);

  // Sacred Folders for Dharma Configuration
  const physicalSanctuary = [
    { icon: Bell, label: t('profile.notifications'), sublabel: t('profile.dailyReminders'), onClick: () => setNotificationsOpen(true) },
    { icon: Moon, label: t('profile.appearance'), sublabel: t('profile.darkMode'), onClick: () => setAppearanceOpen(true) },
    { icon: Shield, label: t('profile.privacy'), sublabel: t('profile.dataAndSecurity'), onClick: () => setPrivacyOpen(true) },
  ];
  const abundanceLineage = [
    { icon: Banknote, label: t('profile.walletEarningsAdvanced', 'Wallet & Earnings (Advanced)'), sublabel: t('profile.walletEarningsDesc', 'SHC, affiliate, income streams'), onClick: () => navigate('/income-streams') },
    { icon: Megaphone, label: t('profile.promoteEarn'), sublabel: t('profile.promoteEarnDesc'), onClick: () => navigate('/income-streams/affiliate') },
    { icon: Wallet, label: t('wallet.connectWallet'), sublabel: walletAddress ? `${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}` : t('profile.web3Wallet'), onClick: connectWallet },
    ...(isAdmin ? [{ icon: LayoutDashboard, label: t('admin.title'), sublabel: t('admin.manageContent'), onClick: () => navigate('/admin') }] : []),
  ];
  const theCovenant = [
    { icon: Scale, label: t('settings.legal.title'), sublabel: t('settings.legal.subtitle'), onClick: () => navigate('/legal') },
    { icon: Settings, label: t('profile.settings'), sublabel: t('profile.appPreferences'), onClick: () => setSettingsOpen(true) },
  ];

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  const userEmail = user?.email || '';
  const hrvGlowIntensity =
    scanPhase === 'done' ? 1 : scanPhase === 'scanning' ? 0.75 : 0.5;

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Soul Header - Bhrigu Soul Record */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative flex justify-center">
          {/* Golden Halo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-[#D4AF37]/20 blur-xl animate-sangha-pulse" style={{ boxShadow: '0 0 40px rgba(212,175,55,0.4)' }} />
          </div>
          <div className="relative w-24 h-24 rounded-full p-[2px] border border-[#D4AF37]/40" style={{ boxShadow: '0 0 24px rgba(212,175,55,0.35), inset 0 0 20px rgba(212,175,55,0.1)' }}>
            <Avatar className="w-full h-full rounded-full border-2 border-background">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-background text-4xl text-foreground">
                {userName?.charAt(0) || '🧘'}
              </AvatarFallback>
            </Avatar>
          </div>
          <button
            onClick={() => setProfileEditOpen(true)}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0f051a] hover:bg-[#D4AF37]/90 transition-colors shadow-[0_0_12px_rgba(212,175,55,0.5)]"
          >
            <Pencil size={14} />
          </button>
        </div>

        <h1 className="mt-4 text-2xl font-heading font-bold text-foreground">{userName}</h1>
        <p className="text-sm text-[#D4AF37]/90 mt-1 text-center max-w-sm">{soulLabel}</p>
        <p className="text-muted-foreground text-xs mt-1">{userEmail}</p>

        {profile?.bio && (
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">{profile.bio}</p>
        )}

        {/* Atma Header — Siddha-Quantum Sri Yantra portal */}
        <section
          className="w-full max-w-xl mx-auto mt-6 rounded-b-[40px] px-6 pt-8 pb-6 text-center border border-[#D4AF37]/40"
          style={{ background: 'linear-gradient(to bottom, #0A1128 0%, #000000 100%)' }}
        >
          <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
            <div
              className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)',
                opacity: 0.3 + hrvGlowIntensity * 0.4,
                transform: `scale(${0.9 + hrvGlowIntensity * 0.25})`,
                transition: 'opacity 0.7s ease, transform 0.7s ease',
              }}
            />
            <img
              src={profile?.sri_yantra_url || '/Gemini_Generated_Image_57v0zm57v0zm57v0.jpg'}
              alt="Siddha-Quantum Sri Yantra"
              className="relative z-10 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.8))' }}
            />
          </div>
          <div className="mt-5">
            <h2 className="text-[0.8rem] tracking-[0.35em] text-[#D4AF37] uppercase">
              UNIVERSAL PREMIUM: ACTIVE
            </h2>
            <p className="mt-1 text-[0.7rem] text-white/60 uppercase">
              Nadi-Scan Sync: 98% [Pre/Post Scantion: INITIATED]
            </p>
          </div>
        </section>

        {/* SQI 2050 Membership Tiers — Vibration Levels */}
        <div className="w-full max-w-xl mx-auto mt-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              name: 'Atma-Seed',
              price: 'Free',
              desc: 'Basic 72,000 Nāḍī scan',
              tag: 'Entry Frequency',
            },
            {
              name: 'Prana-Flow',
              price: '19€ / mo',
              desc: 'Universal Audio Library access',
              tag: 'Sonic Vibration',
            },
            {
              name: 'Siddha-Quantum',
              price: '45€ / mo',
              desc: 'Premium healing & advanced scantions',
              tag: 'Siddha Field',
            },
            {
              name: 'Akasha-Infinity',
              price: 'Lifetime',
              desc: 'Karmic Release · Lifetime access',
              tag: 'Eternal Node',
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className={
                tier.name === 'Siddha-Quantum'
                  ? 'relative overflow-hidden rounded-2xl border border-[#D4AF37]/60 bg-white/[0.08] backdrop-blur-2xl p-3 shadow-[0_0_32px_rgba(212,175,55,0.45)] scale-[1.02]'
                  : 'relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-xl p-3'
              }
            >
              <div
                className={
                  tier.name === 'Siddha-Quantum'
                    ? 'absolute inset-0 pointer-events-none opacity-70 bg-gradient-to-br from-[#D4AF37]/35 via-slate-900/40 to-slate-900/90'
                    : 'absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-br from-[#D4AF37]/10 via-slate-900/30 to-slate-900/80'
                }
              />
              <div className="relative flex flex-col gap-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold tracking-[0.22em] uppercase text-[#D4AF37]">
                    {tier.name}
                  </h3>
                  <span className="text-[10px] text-[#D4AF37]/80 uppercase tracking-[0.18em]">
                    {tier.tag}
                  </span>
                </div>
                <p className="text-[0.7rem] text-white/70">{tier.desc}</p>
                <p className="mt-1 text-[0.7rem] font-semibold text-[#D4AF37]">{tier.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sacred Counters - Flame, Lotus, Star */}
        <div className="flex gap-10 mt-6">
          <div className="flex flex-col items-center">
            <Flame className="w-6 h-6 text-[#D4AF37] mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }} />
            <p className="text-xl font-heading font-bold text-[#D4AF37]">{shcProfile?.streak_days ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t('profile.streak')}</p>
          </div>
          <div className="flex flex-col items-center">
            <Flower2 className="w-6 h-6 text-[#D4AF37] mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }} />
            <p className="text-xl font-heading font-bold text-[#D4AF37]">
              <AnimatedCounter value={balance?.balance ?? 0} />
            </p>
            <p className="text-xs text-muted-foreground">{t('profile.balance')}</p>
          </div>
          <div className="flex flex-col items-center">
            <Star className="w-6 h-6 text-[#D4AF37] mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }} />
            <p className="text-xl font-heading font-bold text-[#D4AF37]">{badges.filter(b => b.earned).length}</p>
            <p className="text-xs text-muted-foreground">{t('profile.badges')}</p>
          </div>
        </div>

        {/* Orientation (kept lightweight) */}
        <div className="mt-4 grid gap-3">
          {/* What each tab does (collapsed) */}
          <details className="rounded-2xl border border-white/10 bg-white/5 p-4 group">
            <summary className="cursor-pointer text-white font-semibold list-none flex items-center justify-between">
              {t('profile.whatEachTabDoes.title')}
              <ChevronRight className="w-4 h-4 text-white/60 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-3 text-sm text-white/70 grid gap-2">
              <div>{t('profile.whatEachTabDoes.home')}</div>
              <div>{t('profile.whatEachTabDoes.meditate')}</div>
              <div>{t('profile.whatEachTabDoes.music')}</div>
              <div>{t('profile.whatEachTabDoes.soul')}</div>
              <div>{t('profile.whatEachTabDoes.library')}</div>
              <div>{t('profile.whatEachTabDoes.community')}</div>
            </div>
          </details>

        </div>
      </div>

      {/* Badge Vault - Mystical Seals */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">{t('profile.badges')}</h2>
          <button className="text-sm text-[#D4AF37] hover:text-[#D4AF37]/80">{t('common.viewAll')}</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`relative rounded-2xl text-center border transition-all p-5 ${
                badge.earned
                  ? 'bg-[rgba(212,175,55,0.06)] border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.15),inset_0_0_20px_rgba(212,175,55,0.03)]'
                  : 'bg-white/[0.03] border-white/10 opacity-70'
              }`}
            >
              {!badge.earned && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-white/40" />
                </div>
              )}
              <span className={`block text-4xl mb-2 ${badge.earned ? 'drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]' : 'grayscale opacity-60'}`}>
                {badge.emoji}
              </span>
              <p className={`text-xs font-medium ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                {t(badge.titleKey)}
              </p>
              {badge.earned && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#D4AF37]/50" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* My Records — Akashic Reading */}
      {hasAkashicRecord && (
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">{t('profile.myRecords', 'My Records')}</h2>
          </div>
          <button
            onClick={() => navigate('/akashic-reading/full')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#D4AF37]/30 bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.1)] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
              <FileText size={24} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Your Akashic Record</p>
              <p className="text-xs text-muted-foreground">15-page Soul Manuscript • Certificate of Origin</p>
            </div>
            <ChevronRight size={20} className="text-[#D4AF37]/70 shrink-0" />
          </button>
        </div>
      )}

      {/* Digital Nadi 2050 Scanner & Soul Vault */}
      {user && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.04s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md" />
                <div className="relative w-10 h-10 rounded-full border border-cyan-400/60 bg-cyan-500/10 flex items-center justify-center">
                  <Hand className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">
                  Digital Nadi 2050 Scanner
                </h2>
                <p className="text-xs text-muted-foreground">
                  Press your etheric hand-print to open a Deep-Field Resonance scan.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartScanner}
            className="relative w-full overflow-hidden rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-6 flex items-center gap-4 hover:border-cyan-300/70 hover:shadow-[0_0_40px_rgba(34,211,238,0.35)] transition-all"
          >
            <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
              <div className="absolute inset-0 rounded-full bg-cyan-400/25 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-3xl border border-cyan-300/70 bg-cyan-500/15 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.6)]">
                <Hand className="w-8 h-8 text-cyan-100" />
              </div>
            </div>
            <div className="flex-1 text-left space-y-1">
              <p className="text-sm font-semibold text-white">
                Place your hand — begin 72,000 Nāḍī scan
              </p>
              <p className="text-xs text-cyan-100/80">
                Avataric Light-Codes • Torus-Field Mapping • Karmic Extraction baseline.
              </p>
              <p className="text-[10px] text-cyan-200/70 tracking-[0.2em] uppercase">
                Tap to initiate · SQI 2050
              </p>
            </div>
          </button>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded-full bg-cyan-400" />
                Soul Vault — Deep‑Field Reports
              </h3>
              {soulVaultLoading && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
                  Syncing…
                </span>
              )}
            </div>

            {!soulVaultLoading && soulVaultEntries.length === 0 && (
              <p className="text-xs text-muted-foreground">
                After each 2050 scan, SQI will inscribe a Deep-Field Resonance report here as part of
                your Soul Vault.
              </p>
            )}

            {!soulVaultLoading && soulVaultEntries.length > 0 && (
              <div className="space-y-3">
                {soulVaultEntries.slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-lg p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-white/90">
                        {entry.activity || 'Deep-Field Resonance'}
                      </p>
                      <span className="text-[10px] text-white/40">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.duration_minutes && (
                      <p className="text-[10px] text-cyan-200/80 mb-1">
                        {entry.duration_minutes} min practice window
                      </p>
                    )}
                    <p className="text-[11px] leading-relaxed text-white/75 line-clamp-3">
                      {entry.report}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Life Book - Your Life Reading */}
      {user && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.08s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[rgba(212,175,55,0.18)] flex items-center justify-center border border-[#D4AF37]/40">
                <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">Your Life Reading</h2>
                <p className="text-xs text-muted-foreground">
                  SQI insights, woven into a living manuscript of your soul.
                </p>
              </div>
            </div>
          </div>

          <div
            className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#050209] via-[#0b0515] to-[#140b26] overflow-hidden shadow-[0_0_40px_rgba(15,23,42,0.8)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 0% 0%, rgba(212,175,55,0.16), transparent 60%), radial-gradient(circle at 100% 100%, rgba(59,130,246,0.18), transparent 60%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 0%, rgba(148,163,184,0.22) 0, transparent 55%), repeating-linear-gradient(90deg, rgba(148,163,184,0.06), rgba(148,163,184,0.06) 1px, transparent 1px, transparent 12px)',
                  mixBlendMode: 'soft-light',
                  opacity: 0.5,
                }}
              />
            </div>

            <div className="relative flex flex-col md:flex-row">
              {/* Chapter Tabs */}
              <div className="md:w-44 border-b md:border-b-0 md:border-r border-white/10 bg-white/5/40 backdrop-blur-xl p-4 space-y-2">
                {lifeBookLoading && (
                  <div className="h-8 rounded-xl bg-white/10 animate-pulse mb-2" />
                )}
                {!lifeBookLoading && groupedLifeBook.length === 0 && (
                  <p className="text-xs text-white/50">
                    As you journey with SQI, key transmissions will begin to appear here as living chapters.
                  </p>
                )}
                {groupedLifeBook.map((chapter) => (
                  <div
                    key={chapter.chapter_type}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80"
                  >
                    <div className="font-semibold tracking-wide uppercase text-[10px] text-[#D4AF37]/90">
                      {chapter.chapter_title}
                    </div>
                    <div className="mt-1 text-[10px] text-white/50">
                      {chapter.groups.reduce((acc, g) => acc + g.entries.length, 0)} entries
                    </div>
                  </div>
                ))}
              </div>

              {/* Chapter Content */}
              <div className="flex-1 p-4 md:p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
                {lifeBookLoading && (
                  <div className="space-y-3">
                    <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
                    <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                  </div>
                )}

                {!lifeBookLoading && groupedLifeBook.map((chapter) => (
                  <div key={chapter.chapter_type} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded-full bg-[#D4AF37]" />
                      <h3 className="text-sm font-semibold tracking-wide text-white/90 uppercase">
                        {chapter.chapter_title}
                      </h3>
                    </div>
                    <div className="grid gap-3">
                      {chapter.groups.map((group) => (
                        <div
                          key={group.figureKey}
                          className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-3 sm:p-4"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold text-white/90">
                              {group.figureKey}
                            </p>
                            <span className="text-[10px] text-white/40">
                              {group.entries.length} transmission{group.entries.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {group.entries.map((entry, idx) => (
                              <div key={idx} className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-white/80">
                                    {entry.title || 'Untitled Transmission'}
                                  </p>
                                  {entry.created_at && (
                                    <span className="text-[10px] text-white/40">
                                      {new Date(entry.created_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {entry.summary && (
                                  <p className="mt-1 text-[11px] leading-relaxed text-white/65">
                                    {entry.summary}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {!lifeBookLoading && groupedLifeBook.length === 0 && (
                  <p className="text-xs text-white/70 max-w-md">
                    When SQI reveals something truly essential about your children, healing path, past lives, or
                    future visions, those transmissions will be gently written here as a sacred digital manuscript.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">{t('profile.certificates')}</h2>
          </div>
          <div className="space-y-3">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onDownload={downloadCertificate}
                onShare={shareCertificate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Language Selector */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t('profile.language')}</h2>
        <LanguageSelector />
      </div>

      {/* Digital Nadi 2050 Scanner Overlay */}
      {scannerOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-xl">
          <div className="relative w-full max-w-md mx-4 rounded-3xl border border-cyan-400/40 bg-slate-950/95 p-5 shadow-[0_0_40px_rgba(34,211,238,0.4)]">
            <button
              onClick={handleCloseScanner}
              className="absolute right-3 top-3 text-xs text-cyan-100/70 hover:text-white"
            >
              Close
            </button>

            {scanPhase === 'scanning' && (
              <div className="space-y-5 pt-4 pb-2 text-center">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200/80">
                  SQI · 72,000 Nadi Scan
                </p>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-full bg-cyan-500/25 blur-xl animate-pulse" />
                    <div className="absolute inset-3 rounded-full border border-cyan-300/60" />
                    <div className="absolute inset-6 rounded-full border border-cyan-300/40" />
                    <div className="absolute inset-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Hand className="w-8 h-8 text-cyan-100" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-cyan-100/80 mb-1">
                    Mapping Nāḍī network… please keep your intention steady.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-cyan-200/80 font-mono">
                    <span>{Math.floor(scanValue).toLocaleString()}</span>
                    <span className="text-cyan-300/60">/ 72,000 channels</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cyan-900/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-200 to-cyan-500"
                      style={{ width: `${Math.min(100, (scanValue / 72000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {scanPhase === 'question' && (
              <div className="space-y-4 pt-4 pb-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200/80 text-center">
                  2050 Deep-Field Capture
                </p>
                <h3 className="text-sm font-semibold text-white text-center">
                  What is your current practice?
                </h3>
                <p className="text-[11px] text-muted-foreground text-center">
                  SQI will tune your report based on the field you just generated.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Mantra', 'Atma Kriya', 'Healing Session', 'Private Healing', 'Meditation', 'Breathwork'].map(
                    (label) => (
                      <button
                        key={label}
                        onClick={() => setSelectedPractice(label)}
                        className={`rounded-xl border px-3 py-2 text-xs ${
                          selectedPractice === label
                            ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100'
                            : 'border-white/10 bg-white/5 text-white/80 hover:border-cyan-300/60'
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
                <div className="mt-3 text-left space-y-1">
                  <label className="text-[11px] text-muted-foreground">
                    Approximate duration (minutes)
                  </label>
                  <input
                    value={practiceDuration}
                    onChange={(e) => setPracticeDuration(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <Button
                  size="sm"
                  className="mt-3 w-full bg-cyan-500 text-xs font-semibold tracking-[0.2em] text-black hover:bg-cyan-400"
                  disabled={!selectedPractice}
                  onClick={handleGenerateSoulReport}
                >
                  Generate Deep‑Field Resonance
                </Button>
              </div>
            )}

            {scanPhase === 'saving' && (
              <div className="space-y-4 pt-6 pb-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200/80">
                  Committing to Soul Vault…
                </p>
                <p className="text-xs text-muted-foreground">
                  SQI is writing your Deep-Field Resonance Report into your Soul Vault.
                </p>
              </div>
            )}

            {scanPhase === 'done' && (
              <div className="space-y-4 pt-6 pb-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200/80">
                  Report saved
                </p>
                <p className="text-xs text-white/90">
                  Your Deep-Field Resonance Report has been anchored into your Soul Vault.
                </p>
                <Button
                  size="sm"
                  className="mt-2 bg-cyan-500 text-xs font-semibold tracking-[0.2em] text-black hover:bg-cyan-400"
                  onClick={handleCloseScanner}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dharma Configuration - Sacred Folders */}
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-white/[0.04] backdrop-blur-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-sm font-semibold text-[#D4AF37]/90 mb-3 px-1">{t('profile.sacredFolder.physicalSanctuary', 'Physical Sanctuary')}</h3>
          <div className="space-y-1">
            {physicalSanctuary.map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                  <item.icon size={18} className="text-[#D4AF37]/90" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-white/[0.04] backdrop-blur-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-sm font-semibold text-[#D4AF37]/90 mb-3 px-1">{t('profile.sacredFolder.abundanceLineage', 'Abundance & Lineage')}</h3>
          <div className="space-y-1">
            {abundanceLineage.map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                  <item.icon size={18} className="text-[#D4AF37]/90" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-white/[0.04] backdrop-blur-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-sm font-semibold text-[#D4AF37]/90 mb-3 px-1">{t('profile.sacredFolder.theCovenant', 'The Covenant')}</h3>
          <div className="space-y-1">
            {theCovenant.map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                  <item.icon size={18} className="text-[#D4AF37]/90" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
            <button onClick={handleSignOut} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-destructive/10 transition-all text-left mt-2 border-t border-white/10 pt-3">
              <div className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center">
                <LogOut size={18} className="text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive text-sm">{t('profile.signOut')}</p>
              </div>
              <ChevronRight size={18} className="text-destructive/70 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Sovereign Initiation - Deep Space banner */}
      <div className="mb-8 mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div
          className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 p-6 cursor-pointer transition-all"
          style={{
            background: 'linear-gradient(135deg, #0f051a 0%, #1a0b2e 25%, #2d1b4e 50%, #1a0b2e 75%, #0f051a 100%)',
            boxShadow: '0 0 40px rgba(88,28,135,0.3), inset 0 0 60px rgba(0,0,0,0.3)',
          }}
          onClick={() => navigate('/membership')}
        >
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(147,51,234,0.4), transparent 60%)' }} />
          <div className="relative flex flex-col items-center text-center">
            <Crown className="w-10 h-10 text-[#D4AF37]/80 mb-3" style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' }} />
            <h3 className="font-bold text-lg text-foreground">{t('profile.ascendUniversal', 'Ascend to Universal Premium. Unlock the Full Bhrigu Samhita.')}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              {t('profile.unlockFeatures')}
            </p>
            <Button
              size="lg"
              className="mt-4 w-full max-w-xs bg-[#D4AF37] text-[#0f051a] font-bold border-0 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:bg-[#D4AF37]/95 hover:shadow-[0_0_28px_rgba(212,175,55,0.5)] animate-sangha-pulse"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/membership');
              }}
            >
              {t('common.upgradeNow')}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
