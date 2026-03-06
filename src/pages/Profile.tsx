// @ts-nocheck
import React, { useEffect, useMemo, useState, useRef } from 'react';
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    class Particle {
      x = 0; y = 0; size = 0; speedX = 0; speedY = 0; life = 0; maxLife = 0; growing = true; color = '212,175,55';
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.life = Math.random();
        this.maxLife = Math.random() * 0.005 + 0.001;
        this.growing = true;
        const c = ['212,175,55', '255,255,255', '34,211,238'];
        this.color = c[Math.floor(Math.random() * 3)];
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.growing) { this.life += this.maxLife; if (this.life >= 1) this.growing = false; }
        else { this.life -= this.maxLife; if (this.life <= 0) this.reset(); }
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.life * 0.6;
        ctx.fillStyle = `rgba(${this.color},1)`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    const particles = Array.from({ length: 200 }, () => new Particle());
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

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
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[stardustMove_150s_linear_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(212,175,55,0.06)_0%,_transparent_60%)]" />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-50" />

      <style>{`
        @keyframes stardustMove { from { background-position: 0 0; } to { background-position: 1000px 1000px; } }
        @keyframes siddhiSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glowBreathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanPulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
        .profile-card { animation: fadeUp 0.6s ease both; }
        .profile-card:nth-child(2) { animation-delay: 0.1s; }
        .profile-card:nth-child(3) { animation-delay: 0.2s; }
        .profile-card:nth-child(4) { animation-delay: 0.3s; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="relative z-10 max-w-[680px] mx-auto px-4 py-8 pb-24">
        {/* Section 1 — Sovereign Identity Card */}
        <div className="profile-card rounded-[28px] border border-[#D4AF37]/20 bg-white/[0.02] backdrop-blur-[40px] p-12 pt-12 pb-9 text-center mb-8">
          <div className="relative inline-block mb-6">
            <Avatar className="w-24 h-24 rounded-full border-2 border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-white/5 text-3xl text-white">
                {userName?.charAt(0) || '🧘'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => setProfileEditOpen(true)}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#050505] hover:bg-[#D4AF37]/90 transition-colors border-2 border-[#050505] shadow-lg"
            >
              <Pencil size={12} />
            </button>
          </div>
          <h1 className="text-white font-[300] italic text-[2.2rem] leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{userName}</h1>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span className="text-[#D4AF37]/70 text-[8px] font-extrabold tracking-[0.5em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>528Hz</span>
            <span className="text-[#D4AF37]/40">·</span>
            <span className="text-[#D4AF37]/70 text-[8px] font-extrabold tracking-[0.5em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Rahu Active</span>
          </div>
          {profile?.bio && (
            <p className="mt-3 text-[0.95rem] text-white/40 italic max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{profile.bio}</p>
          )}
          <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-full border border-[#D4AF37]/20 bg-white/[0.02] px-5 py-2">
            <span className="text-white/30 text-[7px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>SHC BALANCE</span>
            <span className="text-[#D4AF37] text-lg font-extrabold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <AnimatedCounter value={balance?.balance ?? 0} /> SHC
            </span>
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <div className="rounded-full border border-[#D4AF37]/10 bg-white/[0.02] px-5 py-2.5 min-w-[80px]">
              <span className="text-[#D4AF37] text-sm font-extrabold block" style={{ fontFamily: 'Montserrat, sans-serif' }}>{shcProfile?.streak_days ?? 0}</span>
              <span className="text-white/30 text-[7px] font-normal tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>STREAK</span>
            </div>
            <div className="rounded-full border border-[#D4AF37]/10 bg-white/[0.02] px-5 py-2.5 min-w-[80px]">
              <span className="text-[#D4AF37] text-sm font-extrabold block" style={{ fontFamily: 'Montserrat, sans-serif' }}>{balance?.balance ?? 0}</span>
              <span className="text-white/30 text-[7px] font-normal tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>SESSIONS</span>
            </div>
            <div className="rounded-full border border-[#D4AF37]/10 bg-white/[0.02] px-5 py-2.5 min-w-[80px]">
              <span className="text-[#D4AF37] text-sm font-extrabold block" style={{ fontFamily: 'Montserrat, sans-serif' }}>{badges.filter((b) => b.earned).length}</span>
              <span className="text-white/30 text-[7px] font-normal tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>LEVEL</span>
            </div>
          </div>
        </div>

        {/* Section 2 — Sri Yantra Resonance Card */}
        <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-xl p-8 flex flex-col items-center justify-center mb-8">
          <div className="relative flex items-center justify-center w-[280px] h-[280px]">
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', animation: 'siddhiSpin 20s ease-in-out infinite' }} />
            <svg className="w-full h-full" width="280" height="280" viewBox="0 0 280 280" fill="none" style={{ animation: 'siddhiSpin 150s linear infinite' }}>
              <circle cx="140" cy="140" r="135" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" />
              <circle cx="140" cy="140" r="125" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" />
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 22.5) * Math.PI / 180;
                const x = 140 + 118 * Math.cos(angle);
                const y = 140 + 118 * Math.sin(angle);
                const x2 = 140 + 118 * Math.cos(angle + 0.2);
                const y2 = 140 + 118 * Math.sin(angle + 0.2);
                return <path key={i} d={`M140 140 Q${x} ${y} ${x2} ${y2} Z`} stroke="#D4AF37" strokeWidth="0.6" fill="rgba(212,175,55,0.04)" opacity="0.7" />;
              })}
              <polygon points="140,30 242,198 38,198" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
              <polygon points="140,250 242,82 38,82" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
              <polygon points="140,55 222,183 58,183" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
              <polygon points="140,225 222,97 58,97" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
              <polygon points="140,82 202,168 78,168" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
              <polygon points="140,198 202,112 78,112" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
              <polygon points="140,105 186,155 94,155" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
              <polygon points="140,175 186,125 94,125" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
              <circle cx="140" cy="140" r="55" stroke="#D4AF37" strokeWidth="0.6" opacity="0.4" />
              <circle cx="140" cy="140" r="35" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
              <circle cx="140" cy="140" r="18" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
              <circle cx="140" cy="140" r="4" fill="#D4AF37" opacity="0.9" />
              <circle cx="140" cy="140" r="8" fill="rgba(212,175,55,0.2)" opacity="0.8" />
            </svg>
            <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#D4AF37', opacity: 0.3, animation: 'glowBreathe 2s ease-in-out infinite', filter: 'blur(8px)' }} />
          </div>
          <p className="mt-6 text-[#D4AF37]/50 text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>◈ AKASHIC FIELD ACTIVE · 72,000 NADIS MAPPED</p>
        </div>

        {/* Section 3 — Soul Vault Scanner */}
        <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-[40px] p-8 mb-8">
          <p className="text-[#D4AF37]/50 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>◈ SOUL VAULT — DEEP FIELD RESONANCE</p>
          <h2 className="text-white italic text-[1.8rem] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Soul Vault Scanner</h2>
          <button
            type="button"
            onClick={handleStartScanner}
            className="w-full py-5 rounded-2xl bg-[#D4AF37] text-[#050505] text-sm font-extrabold uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            INITIATE SOUL SCAN →
          </button>
        </div>

        {/* Section 4 — Vedic Siddhis */}
        <div className="profile-card mb-8">
          <p className="text-[#D4AF37]/50 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>◈ VEDIC SIDDHIS</p>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {badges.map((b) => (
              <div
                key={b.id}
                className="min-w-[140px] rounded-[20px] border bg-white/[0.02] p-5 py-5 flex flex-col items-center shrink-0"
                style={{ borderColor: b.earned ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}
              >
                <span className="text-[32px] mb-3 leading-none">{b.emoji}</span>
                <span
                  className="text-[9px] font-bold tracking-wider text-center"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: b.earned ? 'white' : 'rgba(255,255,255,0.3)' }}
                >
                  {t(b.titleKey)}
                </span>
                <div className="w-full h-1 rounded-full bg-white/10 mt-3 overflow-hidden">
                  <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: b.earned ? '100%' : '0%' }} />
                </div>
              </div>
            ))}
            {(() => {
              const isCourseCompleted =
                shcProfile?.purchased_courses?.includes?.('AndligTransformation') ||
                certificates.some(
                  (c) =>
                    c.certificate_type === 'course_completion' &&
                    (c.title?.toLowerCase().includes('andlig') ?? false)
                );
              return (
                <div
                  className="flex flex-col items-center min-w-[140px] rounded-[20px] border bg-white/[0.02] p-5 shrink-0"
                  style={{ borderColor: isCourseCompleted ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}
                >
                  <div className="relative w-12 h-12 flex items-center justify-center mb-3">
                    <img
                      src="/Andlig_Transformation_Seal.jpg"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      alt="Andlig"
                      className={`w-full h-full object-contain ${isCourseCompleted ? 'opacity-100' : 'opacity-30'}`}
                    />
                  </div>
                  <span className="text-[9px] font-bold tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif', color: isCourseCompleted ? 'white' : 'rgba(255,255,255,0.3)' }}>Siddha Certified</span>
                  <div className="w-full h-1 rounded-full bg-white/10 mt-3 overflow-hidden">
                    <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: isCourseCompleted ? '100%' : '0%' }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Section 5 — AKASHIC LIFE BOOK (Life Book + Soul Vault entries) */}
        <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-[40px] p-8 mb-8">
          <p className="text-[#D4AF37]/50 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>◈ AKASHIC LIFE BOOK</p>
          {lifeBookLoading && (
            <div className="space-y-3 py-4">
              <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
              <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          )}
          {!lifeBookLoading && groupedLifeBook.length > 0 && (
            <div className="space-y-4 mb-8">
              {groupedLifeBook.map((chapter) => (
                <div key={chapter.chapter_type} className="rounded-2xl border border-[#D4AF37]/10 bg-white/[0.02] p-5 sm:p-6">
                  <h3 className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>{chapter.chapter_title}</h3>
                  <div className="space-y-3">
                    {chapter.groups.map((group) => (
                      <div key={group.figureKey}>
                        <p className="text-white/60 text-[10px] font-bold tracking-wider uppercase mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{group.figureKey}</p>
                        {group.entries.map((entry, idx) => (
                          <div key={idx} className="mt-2">
                            <p className="text-white/40 text-base italic leading-[1.7]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{entry.summary || entry.title || '—'}</p>
                            {entry.created_at && <span className="text-white/30 text-xs">{new Date(entry.created_at).toLocaleDateString()}</span>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!lifeBookLoading && groupedLifeBook.length === 0 && (
            <p className="text-white/40 italic text-base leading-[1.7] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>As you journey with SQI, key transmissions will appear here as living chapters.</p>
          )}
          <div>
            {soulVaultLoading && <span className="text-white/30 text-[10px] uppercase tracking-wider">Syncing…</span>}
            {!soulVaultLoading && soulVaultEntries.length === 0 && (
              <p className="text-white/40 italic text-base leading-[1.7]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>After each Soul Scan, SQI inscribes a Deep-Field Resonance report here.</p>
            )}
            {!soulVaultLoading && soulVaultEntries.length > 0 && (
              <div className="space-y-4">
                {soulVaultEntries.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-[#D4AF37]/10 bg-white/[0.02] p-5 sm:p-6">
                    <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>{entry.activity || 'Deep-Field Resonance'}</p>
                    <p className="text-white/40 text-base italic leading-[1.7]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{entry.report}</p>
                    <span className="text-white/30 text-xs mt-2 block">{new Date(entry.created_at).toLocaleDateString()}{entry.duration_minutes ? ` · ${entry.duration_minutes} min` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 6 — Certificates (Sovereign Seals) */}
        {certificates.length > 0 && (
          <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-[40px] p-8 mb-8">
            <p className="text-[#D4AF37]/50 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>◈ SOVEREIGN SEALS</p>
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

        {/* Section 7 — Settings row + Sign out */}
        <div className="profile-card flex flex-wrap items-center justify-center gap-6 mb-8">
          <button type="button" onClick={() => setNotificationsOpen(true)} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
              <Bell size={20} />
            </div>
            <span className="text-white/20 text-[6px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Alerts</span>
          </button>
          <button type="button" onClick={() => setAppearanceOpen(true)} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
              <Moon size={20} />
            </div>
            <span className="text-white/20 text-[6px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Theme</span>
          </button>
          <button type="button" onClick={() => setPrivacyOpen(true)} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
              <Shield size={20} />
            </div>
            <span className="text-white/20 text-[6px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Privacy</span>
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
              <Settings size={20} />
            </div>
            <span className="text-white/20 text-[6px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Settings</span>
          </button>
          <button type="button" onClick={() => setProfileEditOpen(true)} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
              <Pencil size={20} />
            </div>
            <span className="text-white/20 text-[6px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Profile</span>
          </button>
          {abundanceLineage.map((item) => (
            <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
                <item.icon size={20} />
              </div>
              <span className="text-white/20 text-[6px] font-extrabold tracking-widest uppercase max-w-[60px] truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>{item.label}</span>
            </button>
          ))}
          {theCovenant.map((item) => (
            <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
                <item.icon size={20} />
              </div>
              <span className="text-white/20 text-[6px] font-extrabold tracking-widest uppercase max-w-[60px] truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>{item.label}</span>
            </button>
          ))}
          <button type="button" onClick={handleSignOut} className="flex flex-col items-center gap-2 text-white/30 hover:text-red-500/60 transition-colors">
            <LogOut size={20} />
            <span className="text-[8px] font-extrabold tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>Sign Out</span>
          </button>
        </div>

        {/* Language Selector — untouched */}
        <div className="mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t('profile.language')}</h2>
          <LanguageSelector />
        </div>
      </div>

      {/* Digital Nadi 2050 Scanner Overlay — restyled */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/50">
          <div className="w-full max-w-xl bg-[#050505] rounded-[28px] border border-[#D4AF37]/20 p-10 shadow-[0_0_50px_rgba(212,175,55,0.08)]">
            <div className="text-right mb-4">
              <button type="button" onClick={handleCloseScanner} className="text-white/40 text-xs hover:text-white transition-colors">Close</button>
            </div>

            {scanPhase === 'scanning' && (
              <div className="space-y-5 pt-4 pb-2 text-center">
                <p className="text-[#D4AF37]/80 text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  SQI · 72,000 Nadi Scan
                </p>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/40 animate-[scanPulse_1.5s_ease-in-out_infinite]" />
                    <div className="absolute inset-4 rounded-full border border-[#D4AF37]/30" />
                    <div className="absolute inset-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                      <Hand className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Mapping Nāḍī network… please keep your intention steady.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#D4AF37]/80 font-mono">
                    <span>{Math.floor(scanValue).toLocaleString()}</span>
                    <span className="text-white/40">/ 72,000 channels</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${Math.min(100, (scanValue / 72000) * 100)}%` }} />
                  </div>
                </div>
              </div>
            )}

            {scanPhase === 'question' && (
              <>
                <div className="text-center mb-8">
                  <p className="text-[#D4AF37]/60 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>2050 Deep-Field Capture</p>
                  <h3 className="text-white text-xl font-bold mb-2">What is your current practice?</h3>
                  <p className="text-white/40 text-[10px]">SQI will tune your report based on the field you just generated.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {['Mantra', 'Atma Kriya', 'Healing Session', 'Private Healing', 'Meditation', 'Breathwork'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPractice(p)}
                      className={`py-4 px-6 rounded-2xl border text-[10px] font-bold transition-all ${
                        selectedPractice === p
                          ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-[#D4AF37]/30 hover:text-white'
                      }`}
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="text-white/40 text-[8px] uppercase tracking-widest block mb-2 px-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Approximate duration (minutes)</label>
                  <input
                    type="number"
                    value={practiceDuration}
                    onChange={(e) => setPracticeDuration(e.target.value)}
                    className="w-full bg-white/[0.02] border border-[#D4AF37]/20 rounded-xl py-4 px-6 text-white text-sm focus:border-[#D4AF37]/40 outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={!selectedPractice}
                  onClick={handleGenerateSoulReport}
                  className="w-full py-5 rounded-2xl bg-[#D4AF37] text-[#050505] text-[11px] font-extrabold uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Generate Deep-Field Resonance
                </button>
              </>
            )}

            {scanPhase === 'saving' && (
              <div className="space-y-4 pt-6 pb-4 text-center">
                <p className="text-[#D4AF37]/80 text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Committing to Soul Vault…</p>
                <p className="text-white/50 text-sm italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>SQI is writing your Deep-Field Resonance Report into your Soul Vault.</p>
              </div>
            )}

            {scanPhase === 'done' && (
              <div className="space-y-4 pt-6 pb-4 text-center">
                <p className="text-[#D4AF37]/80 text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Report saved</p>
                <p className="text-white/70 text-base italic leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your Deep-Field Resonance Report has been anchored into your Soul Vault.</p>
                <Button size="sm" className="mt-2 bg-[#D4AF37] text-[#050505] text-xs font-semibold tracking-[0.2em] hover:bg-[#D4AF37]/90" onClick={handleCloseScanner}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}

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
