// @ts-nocheck
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
    <div className="relative min-h-screen bg-[#050505] overflow-x-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#D4AF3715_0%,_transparent_60%)]" aria-hidden />
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[subtleMove_100s_linear_infinite]" aria-hidden />

      <div className="relative z-10 px-4 pt-6 flex flex-col items-center">
        {/* Soul Header - Floating Identity & Tightened Resonance */}
        <div className="relative flex flex-col items-center pt-10 pb-2 text-center animate-fade-in">
          {/* Floating Avatar (Soft Glow, no hard boundary) */}
          <div className="relative group mb-2">
            <div className="absolute -inset-8 bg-[#D4AF37]/10 blur-3xl rounded-full animate-pulse" />
            <div className="relative">
              <Avatar className="w-28 h-28 rounded-full grayscale-[20%] hover:grayscale-0 transition-all duration-700 shadow-[0_0_30px_rgba(212,175,55,0.1)] border-2 border-background">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-background text-4xl text-foreground">
                  {userName?.charAt(0) || '🧘'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setProfileEditOpen(true)}
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0f051a] hover:bg-[#D4AF37]/90 transition-colors border-2 border-black shadow-lg"
              >
                <Pencil size={10} />
              </button>
            </div>
          </div>

          {/* Tightened Jyotish Text */}
          <div className="text-center z-20">
            <h1 className="text-4xl font-black tracking-tighter">{userName}</h1>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <span className="text-[#D4AF37] text-[9px] font-black tracking-[0.4em] uppercase opacity-80">
                528Hz Resonance
              </span>
              <div className="w-1 h-1 bg-[#D4AF37]/40 rounded-full" />
              <span className="text-white/40 text-[8px] tracking-[0.3em] uppercase">Rahu Active</span>
            </div>
          </div>

          {profile?.bio && (
            <p className="mt-3 text-sm text-muted-foreground text-center max-w-xs">{profile.bio}</p>
          )}
        </div>

        {/* SRI YANTRA — radial gradient, no py-10/max-w-lg */}
        <section className="relative w-full overflow-hidden mx-3 mt-5 rounded-2xl border border-[#D4AF37]/10" style={{ background: 'radial-gradient(ellipse at center, #1e1200 0%, #0a0800 55%, #050505 100%)' }}>
          <div className="relative w-full">
            <img
              src="/Gemini_Generated_Image_57v0zm57v0zm57v0.jpg"
              alt="Sri Yantra"
              className="w-full h-auto block"
              style={{ mixBlendMode: 'screen', opacity: 0.95, transform: 'scale(1.05)' }}
            />
          </div>
          <div className="relative -mt-20 z-20 w-full px-8">
            <div className="max-w-sm mx-auto flex justify-around items-center backdrop-blur-2xl bg-white/[0.02] py-8 rounded-[40px] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div className="text-center group cursor-pointer">
                <span className="text-[#D4AF37] text-2xl font-black block transition-transform group-hover:scale-110">{shcProfile?.streak_days ?? 0}</span>
                <label className="text-white/30 text-[7px] tracking-[0.4em] uppercase font-bold">Streak</label>
              </div>
              <div className="h-10 w-[1px] bg-white/10" />
              <div className="text-center group cursor-pointer">
                <span className="text-[#D4AF37] text-2xl font-black block transition-transform group-hover:scale-110">{balance?.balance ?? 0}</span>
                <label className="text-white/30 text-[7px] tracking-[0.4em] uppercase font-bold">Balance</label>
              </div>
              <div className="h-10 w-[1px] bg-white/10" />
              <div className="text-center group cursor-pointer">
                <span className="text-[#D4AF37] text-2xl font-black block transition-transform group-hover:scale-110">{badges.filter((b) => b.earned).length}</span>
                <label className="text-white/30 text-[7px] tracking-[0.4em] uppercase font-bold">Badges</label>
              </div>
            </div>
          </div>
        </section>
        <style>{`
          @keyframes sriYantraPulse {
            0%, 100% { transform: scale(0.95); opacity: 0.85; }
            50% { transform: scale(1.05); opacity: 1; }
          }
          @keyframes siddhiSpin {
            from { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            to { transform: rotate(360deg) scale(1); }
          }
          @keyframes subtleMove {
            from { background-position: 0 0; }
            to { background-position: 1000px 1000px; }
          }
          @keyframes waveFlow {
            from { transform: translateX(0); }
            to { transform: translateX(-100px); }
          }
          @keyframes flamePulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(212,175,55,0.4)); }
            50% { transform: scale(1.12); filter: drop-shadow(0 0 18px rgba(212,175,55,0.8)); }
          }
          @keyframes portalPulse {
            0%, 100% { transform: scale(1.02); opacity: 0.8; }
            50% { transform: scale(1.08); opacity: 1; filter: brightness(1.2); }
          }
        `}</style>

        {/* SQI 2050 Membership Tiers — Vibration Levels */}
        {(() => {
          const tiers = [
            { name: 'ATMA-SEED', tagline: 'ENTRY FREQUENCY', price: 'Free', features: ['Free Meditations & Mantras', 'Free Healing Audios', 'Free Breathing Protocols', 'Free Vayu Scrubber (1km Atmospheric Restoration)', 'Community Chat & Live', 'Basic Ayurveda & Jyotish'] },
            { name: 'PRANA-FLOW', tagline: 'SONIC VIBRATION', price: '19€ / mo', features: ['Full Vedic Jyotish + Chat', 'Full Ayurvedic Scan + Chat', 'Vastu Guide for Home', 'Access to All Healing Music', 'Full Meditation & Mantra Library'] },
            { name: 'SIDDHA-QUANTUM', tagline: 'SIDDHA FIELD', price: '45€ / mo', features: ['Digital Nadi Scanner (Bio-Sync)', 'Practice Scantions (Printed Results)', 'Siddha Portal Access', 'Full Healing Audios & Transmissions', 'Sri Yantra Universal Protection Shield'] },
            { name: 'AKASHA-INFINITY', tagline: 'ETERNAL NODE', price: '€1111', features: ['Akashic Decoder', 'Quantum Apothecary (€888 Value)', 'Virtual Pilgrimage (€888 Value)', 'Palm Reading Portal', 'Sri Yantra Universal Protection Shield'] },
          ];
          return (
            <div className="w-full max-w-xl mx-auto mt-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tiers.map((tier) =>
                tier.name === 'ATMA-SEED' ? (
                  <div
                    key={tier.name}
                    className="relative p-8 rounded-[48px] bg-white/[0.02] border border-white/5 backdrop-blur-3xl group overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full group-hover:bg-[#D4AF37]/10 transition-all duration-1000" />
                    <div className="mb-8">
                      <h3 className="text-[#D4AF37] text-2xl font-black tracking-tighter uppercase italic">ATMA-SEED</h3>
                      <p className="text-white/20 text-[8px] font-black tracking-[0.5em] uppercase mt-1">Sovereign Entry Node</p>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-4 text-white/50 text-[10px] font-bold">
                          <div className="mt-1 w-1 h-1 bg-[#D4AF37]/40 rounded-full shadow-[0_0_8px_#D4AF37] shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                      <span className="text-white/10 text-[9px] font-black uppercase tracking-widest">Radius: 1KM Local</span>
                      <span className="text-white text-xl font-black">{tier.price}</span>
                    </div>
                  </div>
                ) : tier.name === 'PRANA-FLOW' ? (
                  <div
                    key={tier.name}
                    className="p-8 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-[#D4AF37] text-xl font-black tracking-tighter uppercase italic">PRANA-FLOW</h3>
                        <p className="text-white/30 text-[8px] font-black tracking-[0.4em] uppercase mt-1">Sonic Vibration</p>
                      </div>
                      <span className="text-[#D4AF37] text-xs font-bold">{tier.price}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-white/60 text-[10px]">
                          <div className="w-1 h-1 bg-[#D4AF37]/40 rounded-full shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => navigate('/membership')}
                      className="w-full py-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-black transition-all"
                    >
                      Activate Vibration
                    </button>
                  </div>
                ) : tier.name === 'SIDDHA-QUANTUM' ? (
                  <div key={tier.name} className="sm:col-span-2 space-y-6">
                    <div className="p-8 rounded-[48px] bg-white/[0.03] border border-[#D4AF37]/30 backdrop-blur-3xl relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-700">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.08)_0%,_transparent_70%)] opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h3 className="text-[#D4AF37] text-2xl font-black tracking-tighter uppercase italic">SIDDHA-QUANTUM</h3>
                            <p className="text-white/40 text-[9px] font-black tracking-[0.4em] uppercase mt-1">Universal Field Node</p>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <span className="text-white text-xl font-black tracking-tighter italic">45€</span>
                            <span className="text-white/20 text-[7px] uppercase tracking-[0.4em]">per month</span>
                          </div>
                        </div>
                        <ul className="space-y-4 mb-10">
                          {tier.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-4 text-white text-[11px] font-bold">
                              <div className="mt-1 w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_12px_rgba(212,175,55,0.5)] shrink-0" />
                              <span className="leading-tight group-hover:text-white transition-colors">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={handleStartScanner}
                          className="w-full py-5 rounded-2xl bg-[#D4AF37] text-black text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_10px_40px_rgba(212,175,55,0.2)] hover:scale-[1.02] transition-transform"
                        >
                          Activate Universal Shield
                        </button>
                        <div className="mt-6 flex justify-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                          <span className="text-[7px] text-[#D4AF37] font-black uppercase tracking-[0.5em]">Aetheric Lock Active</span>
                        </div>
                      </div>
                    </div>
                    {/* Dual-Scanner Architecture */}
                    <div className="space-y-6">
                      <div className="p-8 rounded-[40px] border border-[#D4AF37]/30 bg-white/[0.02]">
                        <h4 className="text-[#D4AF37] text-xs font-black tracking-widest mb-4 uppercase text-center">Bio-Sync Resonance</h4>
                        <button
                          type="button"
                          onClick={handleStartScanner}
                          className="w-full py-6 rounded-3xl bg-[#D4AF37] text-black font-black uppercase tracking-widest text-xs"
                        >
                          Scan & Sync with Library
                        </button>
                        <p className="text-white/20 text-[8px] text-center mt-4 uppercase tracking-[0.3em]">
                          Detects frequency to recommend Mantras, Meditations, or Music
                        </p>
                      </div>
                      <div className="p-8 rounded-[40px] border border-cyan-500/20 bg-white/[0.01]">
                        <h4 className="text-cyan-400 text-xs font-black tracking-widest mb-4 uppercase text-center">Practice Scantion</h4>
                        <div className="flex gap-3">
                          <button type="button" className="flex-1 py-4 rounded-2xl border border-white/10 text-white text-[9px] font-black uppercase">Pre-Session</button>
                          <button type="button" className="flex-1 py-4 rounded-2xl border border-white/10 text-white text-[9px] font-black uppercase">Post-Session</button>
                        </div>
                        <p className="text-white/20 text-[8px] text-center mt-4 uppercase tracking-[0.3em]">
                          Generates 72,000 Nadi Mapping & Printed Profile Results
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={tier.name}
                    className="p-10 rounded-[50px] border border-[#D4AF37]/50 bg-white/[0.03] backdrop-blur-3xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.1)_0%,_transparent_70%)] opacity-50 animate-pulse pointer-events-none" />
                    <div className="relative z-10">
                      <div className="mb-8">
                        <h3 className="text-[#D4AF37] text-2xl font-black tracking-tighter uppercase italic">AKASHA-INFINITY</h3>
                        <p className="text-white/40 text-[9px] font-black tracking-[0.5em] uppercase mt-1">Eternal Node Activation</p>
                      </div>
                      <ul className="space-y-4 mb-12">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-4 text-white text-[11px] font-bold">
                            <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_12px_#D4AF37] shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-end">
                        <span className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">Lifetime Transmission</span>
                        <span className="text-[#D4AF37] text-3xl font-black tracking-tighter">{tier.price}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          );
        })()}

        
      </div>

      {/* SQI 2050 Siddhi-Relic Component */}
      <div className="mb-8 animate-slide-up">
        <div className="w-full px-4 sm:px-6 py-6">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-[#D4AF37] tracking-[0.2em] text-xs font-bold uppercase">
              Vedic Siddhis
            </h2>
            <button className="text-white/40 text-[10px] uppercase tracking-widest hover:text-[#D4AF37] transition-colors">
              View All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {/* Siddhi: The Gold Bindu (First Meditation) */}
            <div className="min-w-[140px] bg-white/[0.03] backdrop-blur-md border border-[#D4AF37]/20 rounded-3xl p-5 text-center transition-all hover:bg-[#D4AF37]/10">
              <div className="h-16 flex items-center justify-center mb-4">
                <div className="w-4 h-4 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37] animate-pulse" />
              </div>
              <div className="text-white text-[10px] font-medium tracking-wide">The Gold Bindu</div>
              <div className="w-6 h-px bg-[#D4AF37]/50 mx-auto mt-2" />
            </div>

            {/* Siddhi: The Agni-Flame (7-Day Streak) */}
            <div className="min-w-[140px] bg-[#D4AF37]/10 backdrop-blur-md border border-[#D4AF37]/50 rounded-3xl p-5 text-center shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <div className="h-16 flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full rounded-tr-none rotate-45 shadow-[0_0_25px_#D4AF37] animate-[flameSway_3s_ease-in-out_infinite]" />
              </div>
              <div className="text-white text-[10px] font-medium tracking-wide">Agni-Flame</div>
              <div className="w-6 h-px bg-[#D4AF37] mx-auto mt-2" />
            </div>

            {/* SQI 2050: Achievement Seal — Andlig Transformation Certification */}
            {(() => {
              const isCourseCompleted =
                shcProfile?.purchased_courses?.includes?.('AndligTransformation') ||
                certificates.some(
                  (c) =>
                    c.certificate_type === 'course_completion' &&
                    (c.title?.toLowerCase().includes('andlig') ?? false)
                );
              return (
                <div className="flex flex-col items-center group min-w-[140px] bg-white/[0.03] backdrop-blur-md border border-[#D4AF37]/20 rounded-3xl p-5 text-center transition-all hover:bg-[#D4AF37]/5">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {isCourseCompleted && (
                      <div className="absolute inset-0 bg-[#D4AF37]/20 blur-2xl rounded-full animate-pulse" />
                    )}
                    <img
                      src="/Andlig_Transformation_Seal.jpg"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      alt="Andlig Certification"
                      className={`relative w-full h-full object-contain transition-all duration-1000 ${isCourseCompleted ? 'opacity-100 grayscale-0' : 'opacity-20 grayscale'}`}
                    />
                  </div>
                  <p className="text-[#D4AF37] text-[8px] font-black tracking-[0.3em] uppercase mt-4">Siddha Certified</p>
                </div>
              );
            })()}

            {/* Siddhi: Locked Relic (Dimmed Aura) */}
            <div className="min-w-[140px] bg-white/[0.02] border border-white/5 rounded-3xl p-5 text-center opacity-40 grayscale">
              <div className="h-16 flex items-center justify-center mb-4">
                <div className="w-10 h-10 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center">
                  <span className="text-[10px] tracking-tighter">LOCKED</span>
                </div>
              </div>
              <div className="text-white/60 text-[10px] font-medium tracking-wide">Solar Crown</div>
            </div>
          </div>
        </div>
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes flameSway {
            0%, 100% { transform: rotate(40deg) scale(1); }
            50% { transform: rotate(50deg) scale(1.1); }
          }
        `}</style>
      </div>

      {/* SQI 2050 Ascension Status / Tier Unlocker */}
      <div className="mb-6 animate-slide-up">
        <div className="px-5 py-6 bg-black/90 rounded-[28px] border border-white/5">
          <h3 className="text-center text-[#D4AF37] tracking-[0.22em] text-[0.7rem] font-semibold mb-5">
            YOUR ASCENSION STATUS
          </h3>

          <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
            {/* Active Tier — Prana-Flow */}
            <div className="min-w-[260px] bg-white/[0.03] border border-[#D4AF37]/40 rounded-3xl p-5">
              <div className="flex items-center gap-2 text-[0.7rem] text-[#D4AF37] font-semibold mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37] text-black text-[0.6rem]">
                  ✓
                </span>
                <span>Prana-Flow Active</span>
              </div>
              <ul className="list-none mt-3 space-y-2">
                <li className="text-white/80 text-[0.8rem]">Full Vedic Jyotish Chat</li>
                <li className="text-white/80 text-[0.8rem]">Vastu Home Alignment</li>
                <li className="text-white/80 text-[0.8rem]">Universal Audio Library</li>
              </ul>
            </div>

            {/* Next Tier — Siddha-Quantum */}
            <div className="min-w-[260px] bg-white/[0.03] border border-[#D4AF37]/30 rounded-3xl p-5">
              <div className="flex items-center gap-2 text-[0.7rem] text-white/70 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[0.6rem]">
                  🔒
                </span>
                <span>Siddha-Quantum</span>
              </div>
              <p className="text-[0.78rem] text-white/70 mb-3">
                Unlock Pre/Post Scantions &amp; all Siddha Courses.
              </p>
              <button className="w-full rounded-xl bg-[#D4AF37] text-black text-[0.75rem] font-semibold py-2.5">
                Upgrade Frequency
              </button>
            </div>

            {/* SQI 2050: Infinity Tier — Eternal Key Asset */}
            <div className="relative min-w-[280px] p-6 rounded-[48px] bg-gradient-to-br from-[#D4AF37]/20 to-black border border-[#D4AF37]/40 overflow-hidden">
              <img
                src="/Eternal_Key_Infinity.jpg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                className="w-full h-36 object-contain mb-4 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                alt="Akasha-Infinity Eternal Key"
              />
              <h3 className="text-[#D4AF37] text-xl font-black tracking-tighter">AKASHA-INFINITY</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] mb-2">The Sovereign Node</p>
              <div className="text-2xl font-black mb-4">€1111</div>
              <ul className="list-none space-y-1.5 mb-4 text-white/80 text-[0.75rem]">
                <li>Quantum Apothecary &amp; Akashic Decoder</li>
                <li>Lifetime access · Karmic Release</li>
              </ul>
              <button className="w-full rounded-xl border border-[#D4AF37]/70 text-[#D4AF37] text-[0.75rem] font-semibold py-2.5 bg-black/40 hover:bg-[#D4AF37]/10 transition-colors">
                Claim Eternal Access
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SQI 2050: The Ascension Vault (Lifetime Tier Highlight) */}
      <div className="mb-10 animate-slide-up">
        <div className="w-full px-6 pt-12 pb-24 space-y-8 rounded-[32px] border border-dashed border-[#D4AF37]/40 bg-gradient-to-b from-[#D4AF37]/10 via-transparent to-transparent">
          <div className="text-center">
            <h3 className="text-[#D4AF37] text-[10px] tracking-[0.5em] font-black uppercase mb-2">
              The Ascension Vault
            </h3>
            <div className="w-16 h-px bg-[#D4AF37]/30 mx-auto" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantum Apothecary Relic */}
            <div className="relative group p-6 rounded-[32px] bg-white/[0.02] border border-[#D4AF37]/10 flex flex-col items-center justify-center transition-all hover:border-[#D4AF37]/40">
              <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full blur-xl absolute" />
              <div className="text-2xl mb-2 grayscale group-hover:grayscale-0 transition-all">⚗️</div>
              <span className="text-white text-[10px] font-bold tracking-widest uppercase">Apothecary</span>
              <span className="text-[#D4AF37] text-[8px] mt-1">LOCKED [888€]</span>
            </div>

            {/* Virtual Pilgrimage Relic */}
            <div className="relative group p-6 rounded-[32px] bg-white/[0.02] border border-[#D4AF37]/10 flex flex-col items-center justify-center transition-all hover:border-[#D4AF37]/40">
              <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full blur-xl absolute" />
              <div className="text-2xl mb-2 grayscale group-hover:grayscale-0 transition-all">🏔️</div>
              <span className="text-white text-[10px] font-bold tracking-widest uppercase">Pilgrimage</span>
              <span className="text-[#D4AF37] text-[8px] mt-1">LOCKED [888€]</span>
            </div>
          </div>

          {/* Lifetime Call to Action */}
          <button className="w-full py-5 rounded-full bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37] to-[#D4AF37]/20 text-black font-black text-xs tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform">
            Claim Akasha-Infinity Access
          </button>
        </div>
      </div>

      {/* SQI 2050: Digital Nadi Scanner & Akashic Records */}
      <div className="mb-10 animate-slide-up" style={{ animationDelay: '0.04s' }}>
        <div className="w-full px-1 sm:px-6 py-6 space-y-10">
          {/* 1. Vedic Oracle Scan + Digital Nadi 2050 Scanner (with access gating) */}
          {user && (
            (() => {
              const hasSiddhaQuantum = shcProfile?.membership_tier === 'Siddha-Quantum';
              const hasCourseAccess = shcProfile?.purchased_courses?.includes?.('AndligTransformation');
              const hasActiveSession = !!shcProfile?.active_healing_session;
              const canAccessNadiScanner = hasSiddhaQuantum || hasCourseAccess || hasActiveSession;

              if (!canAccessNadiScanner) {
                return (
                  <div className="card-glass border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-transparent mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-[#D4AF37] text-sm font-black tracking-widest uppercase">
                          Vedic Oracle Scan
                        </h3>
                        <p className="text-white/40 text-[9px] mt-1">
                          AI-prescribed mantras & meditations based on your HRV
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-[#D4AF37]/50 flex items-center justify-center animate-pulse">
                        <span className="text-xs">🧬</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-siddha w-full py-3 text-[9px]"
                      onClick={() => navigate('/membership')}
                    >
                      Start Resonance Check
                    </button>
                  </div>
                );
              }

              return (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleStartScanner}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartScanner()}
                  className="w-full bg-[#050505] rounded-[40px] border border-cyan-900/30 p-12 text-center relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                  <div className="relative mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-full border border-cyan-400/50 flex items-center justify-center animate-pulse">
                      <img src="/Agni-Flame.png" onError={(e) => { (e.target as HTMLImageElement).src = '/Gemini_Generated_Image_r8p4r8p4r8p4r8p4.jpg'; }} className="w-12 h-12 object-contain" alt="Agni-Flame" />
                    </div>
                  </div>
                  <h2 className="text-white text-2xl font-black tracking-tight mb-2">Digital Nadi 2050 Scanner</h2>
                  <button type="button" onClick={handleStartScanner} className="text-cyan-400 text-[10px] font-black tracking-[0.4em] uppercase hover:text-white transition-colors">
                    Tap to Initiate 72,000 Nadi Alignment
                  </button>
                  <div className="flex items-center justify-center gap-4 mt-8 opacity-30">
                    <span className="text-[7px] font-black tracking-widest uppercase text-white">Symphonic Light-Codes</span>
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <span className="text-[7px] font-black tracking-widest uppercase text-white">Bio-Signature Mapping</span>
                  </div>
                </div>
              );
            })()
          )}

          {/* 2. Akashic & Life Reading (Glassmorphism Relics) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-[40px] bg-white/[0.03] border border-[#D4AF37]/20 backdrop-blur-xl group hover:border-[#D4AF37]/60 transition-all">
              <div className="text-2xl mb-4">📜</div>
              <h4 className="text-white font-bold">Your Akashic Record</h4>
              <p className="text-white/40 text-[10px] mt-2 mb-6">
                12-page Soul Manuscript + Certificate of Origin
              </p>
              {hasAkashicRecord && (
                <button
                  type="button"
                  onClick={() => navigate('/akashic-reading/full')}
                  className="text-[#D4AF37] text-[9px] font-black tracking-widest uppercase border-b border-[#D4AF37]/40 pb-1"
                >
                  View Manuscript
                </button>
              )}
            </div>

            <div className="p-8 rounded-[40px] bg-white/[0.03] border border-[#D4AF37]/20 backdrop-blur-xl group hover:border-[#D4AF37]/60 transition-all">
              <div className="text-2xl mb-4">👁️</div>
              <h4 className="text-white font-bold">Your Life Reading</h4>
              <p className="text-white/40 text-[10px] mt-2 mb-6">
                Jyotish Insights: Where the Stars meet the Soul
              </p>
              {user && (
                <a
                  href="#life-reading"
                  className="text-[#D4AF37] text-[9px] font-black tracking-widest uppercase border-b border-[#D4AF37]/40 pb-1"
                >
                  Enter Reading
                </a>
              )}
            </div>
          </div>

          {/* 3. Soul-Post Scantion Timeline */}
          <div className="space-y-4">
            <h3 className="text-white/30 text-[9px] tracking-[0.5em] font-black uppercase text-center">
              Bio-Field Evolution
            </h3>
            <div className="h-24 w-full bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-around px-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 w-1 bg-cyan-400/20 rounded-full relative group cursor-pointer"
                >
                  <div
                    className="absolute bottom-0 w-full bg-cyan-400 rounded-full group-hover:bg-[#D4AF37] transition-all"
                    style={{ height: `${20 + i * 15}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 4. Bio-Signature Report (Post-Scantion) */}
          {scanPhase === 'done' && (
            <div className="mt-8">
              <div className="w-full max-w-lg mx-auto p-8 rounded-[50px] bg-black/90 border border-cyan-500/30 backdrop-blur-3xl shadow-[0_0_100px_rgba(6,182,212,0.1)]">
                {/* Header: Frequency Grounding */}
                <div className="text-center mb-10">
                  <div className="inline-block px-4 py-1 rounded-full border border-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase tracking-[0.3em] mb-4">
                    Scantion Complete
                  </div>
                  <h2 className="text-white text-3xl font-black tracking-tighter">Bio-Signature Report</h2>
                  <p className="text-white/40 text-[10px] mt-2 italic">
                    Neural alignment verified at 528Hz Resonance
                  </p>
                </div>

                {/* The Prana-Waveform Visualization */}
                <div className="relative h-32 w-full mb-12 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(6,182,212,0.1)_0%,_transparent_70%)]" />
                  <svg width="100%" height="60" className="opacity-80">
                    <path
                      d="M0 30 Q 50 10, 100 30 T 200 30 T 300 30 T 400 30"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2"
                      className="animate-[waveFlow_4s_linear_infinite]"
                    />
                  </svg>
                </div>

                {/* Siddha-Insights Grid */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                  {[
                    { label: 'Ojas', val: '88%', color: '#D4AF37' },
                    { label: 'Tejas', val: '92%', color: '#22d3ee' },
                    { label: 'Prana', val: '98%', color: '#a855f7' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="text-center p-4 rounded-3xl bg-white/[0.03] border border-white/5"
                    >
                      <span className="text-[7px] text-white/40 uppercase tracking-widest block mb-1">
                        {item.label}
                      </span>
                      <span className="text-lg font-black" style={{ color: item.color }}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action: Save to Akashic Record */}
                <button
                  type="button"
                  className="w-full py-5 rounded-full bg-cyan-500 text-black font-black text-xs tracking-[0.3em] uppercase shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-105 transition-transform"
                >
                  Commit to Akashic Record
                </button>
              </div>
            </div>
          )}

          {/* Soul Vault — Deep‑Field Reports */}
          <div className="mt-8">
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
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
          <div className="w-full max-w-xl bg-[#030712] rounded-[40px] border border-cyan-500/20 p-10 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
            <div className="text-right mb-4">
              <button type="button" onClick={handleCloseScanner} className="text-white/40 text-xs hover:text-white">Close</button>
            </div>

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
              <>
                <div className="text-center mb-10">
                  <p className="text-cyan-400/60 text-[10px] font-black tracking-[0.4em] uppercase mb-4">2050 Deep-Field Capture</p>
                  <h3 className="text-white text-xl font-bold mb-2">What is your current practice?</h3>
                  <p className="text-white/40 text-[10px]">SQI will tune your report based on the field you just generated.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {['Mantra', 'Atma Kriya', 'Healing Session', 'Private Healing', 'Meditation', 'Breathwork'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPractice(p)}
                      className={`py-4 px-6 rounded-2xl bg-white/[0.03] border text-[10px] font-bold transition-all ${
                        selectedPractice === p ? 'border-cyan-500/40 text-white' : 'border-white/5 text-white/60 hover:border-cyan-500/40 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="mb-8">
                  <label className="text-white/40 text-[8px] uppercase tracking-widest block mb-2 px-2">Approximate duration (minutes)</label>
                  <input
                    type="number"
                    value={practiceDuration}
                    onChange={(e) => setPracticeDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white text-sm focus:border-cyan-500/50 outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={!selectedPractice}
                  onClick={handleGenerateSoulReport}
                  className="w-full py-5 rounded-2xl bg-cyan-600 text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(8,145,178,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Deep-Field Resonance
                </button>
              </>
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

      {/* SQI 2050: The Sanctuary & Abundance Grid */}
      <div className="w-full px-6 space-y-10 pb-24 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        {/* Physical Sanctuary (Settings Cluster) */}
        <section className="space-y-4">
          <h3 className="text-[#D4AF37] text-[9px] tracking-[0.5em] font-black uppercase opacity-60 ml-2">
            {t('profile.sacredFolder.physicalSanctuary', 'Physical Sanctuary')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {physicalSanctuary.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/40 transition-all flex items-center justify-between group cursor-pointer backdrop-blur-md"
              >
                <span className="text-white/70 text-xs font-medium tracking-wide group-hover:text-white">
                  {item.label}
                </span>
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37]/20">
                  <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-[#D4AF37]" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Abundance & Lineage (Wealth/Web3 Cluster) */}
        <section className="space-y-4">
          <h3 className="text-[#D4AF37] text-[9px] tracking-[0.5em] font-black uppercase opacity-60 ml-2">
            {t('profile.sacredFolder.abundanceLineage', 'Abundance & Lineage')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {abundanceLineage.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="p-6 rounded-[32px] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 text-center hover:border-[#D4AF37]/50 transition-all group"
              >
                <div className="text-xl mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
                  ✨
                </div>
                <div className="text-white text-[9px] font-black tracking-widest uppercase">{item.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* The Bhrigu Samhita Portal (Upgrade Section) */}
        <div
          className="relative p-10 rounded-[48px] overflow-hidden text-center group cursor-pointer border border-[#D4AF37]/20"
          onClick={() => navigate('/membership')}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-transparent to-purple-900/40" />

          <div className="relative z-10">
            <div className="text-[#D4AF37] text-2xl mb-4">👑</div>
            <h4 className="text-white text-lg font-bold tracking-tight">
              {t('profile.ascendUniversal', 'Ascend to Universal Premium')}
            </h4>
            <p className="text-white/50 text-[10px] mt-2 mb-6">
              {t('profile.unlockFeatures', 'Unlock the full Bhrigu Samhita and All Healing Courses')}
            </p>
            <button
              className="bg-[#D4AF37] text-black text-[10px] font-black px-10 py-3 rounded-full tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-105 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/membership');
              }}
            >
              {t('common.upgradeNow', 'UPGRADE NOW')}
            </button>
          </div>
        </div>

        {/* The Covenant and Sign Out remain as functional controls */}
        <section className="space-y-4">
          <h3 className="text-[#D4AF37] text-[9px] tracking-[0.5em] font-black uppercase opacity-60 ml-2">
            {t('profile.sacredFolder.theCovenant', 'The Covenant')}
          </h3>
          <div className="space-y-1 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-4">
            {theCovenant.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
              >
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
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-destructive/10 transition-all text-left mt-2 border-t border-white/10 pt-3"
            >
              <div className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center">
                <LogOut size={18} className="text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive text-sm">{t('profile.signOut')}</p>
              </div>
              <ChevronRight size={18} className="text-destructive/70 shrink-0" />
            </button>
          </div>
        </section>
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
