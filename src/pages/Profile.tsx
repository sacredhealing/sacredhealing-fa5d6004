// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, Banknote, Lock, FileText, BookOpen, Hand, Globe, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHC } from '@/contexts/SHCContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';

import type { UserProfile } from '@/lib/vedicTypes';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useCertificates } from '@/hooks/useCertificates';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { NotificationsDialog } from '@/components/profile/NotificationsDialog';
import { AppearanceDialog } from '@/components/profile/AppearanceDialog';
import { PrivacyDialog } from '@/components/profile/PrivacyDialog';
import { SettingsDialog } from '@/components/profile/SettingsDialog';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import KoshaReport from '@/components/profile/KoshaReport';
import HandScanner from '@/components/scanner/HandScanner';
import { supabase } from '@/integrations/supabase/client';
import { getTierRank } from '@/lib/tierAccess';

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
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { walletAddress, connectWallet } = usePhantomWallet();
  const { balance, profile: shcProfile } = useSHC();
  const { profile, updatePreferredLanguage } = useProfile();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const { certificates, isLoading: certificatesLoading, downloadCertificate, shareCertificate } = useCertificates();
  const { hasAccess: hasAkashicRecord } = useAkashicAccess(user?.id);
  const { tier, isPremium } = useMembership();
  const userRank = getTierRank(tier);
  const { reading: vedicReading, generateReading } = useAIVedicReading();

  // Load Vedic reading when user has birth data so PlanetaryCycleBanner shows real cycle (not "Initializing Alignment...")
  useEffect(() => {
    if (!user || vedicReading || !generateReading) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('birth_name, birth_date, birth_time, birth_place')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        const profile: UserProfile = {
          name: data.birth_name,
          birthDate: data.birth_date,
          birthTime: data.birth_time,
          birthPlace: data.birth_place,
          plan: 'compass',
        };
        await generateReading(profile, 0, 'Europe/Stockholm', user.id);
      }
    };
    load();
  }, [user, vedicReading, generateReading]);

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
  const [langOpen, setLangOpen] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<string | null>(null);
  const [practiceDuration, setPracticeDuration] = useState<string>('30');

  /* SQI 2050: Updated practice protocols */
  const practiceProtocols = [
    { id: 'mantra', label: 'Mantra', icon: '🕉️' },
    { id: 'atma-kriya', label: 'Atma Kriya', icon: '💠' },
    { id: 'healing-30', label: '30 Days Healing', icon: '⏳' },
    { id: 'andlig', label: 'Andlig Transformation', icon: '✨' },
    { id: 'transmission-2', label: '2 Day Transmission', icon: '⚡' },
    { id: 'breathwork', label: 'Breathwork', icon: '💨' },
  ];

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    class Particle {
      x=0; y=0; size=0; speedX=0; speedY=0; life=0; maxLife=0; growing=true; color='212,175,55';
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
        const c = ['212,175,55','255,255,255','34,211,238'];
        this.color = c[Math.floor(Math.random()*3)];
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.growing) { this.life += this.maxLife; if (this.life>=1) this.growing=false; }
        else { this.life -= this.maxLife; if (this.life<=0) this.reset(); }
        if (this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset();
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.life*0.6;
        ctx.fillStyle = `rgba(${this.color},1)`;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
    }
    const particles = Array.from({ length: 200 }, () => new Particle());
    const animate = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

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

  const handleStartScanner = () => {
    setSelectedPractice(null);
    setPracticeDuration('30');
    setScanPhase('scanning');
    setScannerOpen(true);
  };

  const handleCloseScanner = () => {
    setScannerOpen(false);
    setScanPhase('idle');
    setSelectedPractice(null);
  };

  const handleGenerateSoulReport = async () => {
    if (!user?.id || !selectedPractice) return;
    setScanPhase('saving');
    const durationLabel = practiceDuration && !Number.isNaN(Number(practiceDuration))
      ? `${practiceDuration} minutes`
      : 'unspecified duration';

    const systemPrompt = `You are the Siddha-Quantum Intelligence (SQI) from 2050.
Perform a 72,000 Nadi scan. Use terminology: Avataric Light-Codes, Karmic Extraction, Torus-Field, Kosha Mapping.
If activity is 'Andlig Transformation', acknowledge the 30-day transmutation journey and soul-field upgrade.
If activity is '30 Days Healing', reference the sustained healing arc and Kosha alignment.
If activity is '2 Day Transmission', honor the intensive frequency anchoring.

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

      const geminiReport = data.response.trim();
      const durationMinutes = Number.isNaN(Number(practiceDuration)) ? null : Number(practiceDuration);

      /* SQI 2050: Kosha Mapping — append to Deep-Field report */
      const koshaMapping = `
---
◈ Nadi Alignment: 41,760 / 72,000 Aligned
◈ Kosha Mapping:
• Manomaya: Emotional Frequency Stabilized
• Vijnanamaya: Ancient Egypt Karmic Clear
• Anandamaya: Samadhi 98% Sync
`;
      const reportText = geminiReport + koshaMapping;

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

  const langs = [
    { flag: '🇬🇧', label: 'English', code: 'en' },
    { flag: '🇸🇪', label: 'Svenska', code: 'sv' },
    { flag: '🇪🇸', label: 'Español', code: 'es' },
    { flag: '🇳🇴', label: 'Norsk', code: 'no' },
  ];
  const activeLangIdx = Math.max(0, langs.findIndex((l) => (i18n.language || '').split('-')[0] === l.code));

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  const userEmail = user?.email || '';
  const hrvGlowIntensity =
    scanPhase === 'done' ? 1 : scanPhase === 'scanning' ? 0.75 : 0.5;

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;700;800;900&display=swap');
  .profile-wrap *,:root{--gold:#D4AF37;--black:#050505}
  .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;position:relative;padding:10vh 24px 40px;text-align:center}
  .hero::before{content:'';position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;background:radial-gradient(ellipse,rgba(212,175,55,0.06) 0%,transparent 65%);pointer-events:none}
  .avatar-wrap{position:relative;display:inline-block;margin-bottom:22px}
  .avatar-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,0.65) 0%,rgba(212,175,55,0.2) 40%,transparent 70%);filter:blur(22px);animation:glowBreathe 3s ease-in-out infinite;z-index:0;pointer-events:none}
  .avatar-glow-2{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,0.15) 0%,transparent 65%);filter:blur(30px);animation:glowBreathe 4s ease-in-out infinite reverse;z-index:0;pointer-events:none}
  .sri-yantra-avatar-shield{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;height:320px;z-index:0;pointer-events:none;animation:pulseDeep 3s cubic-bezier(0.45,0.05,0.55,0.95) infinite}
  .hero-name{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(2.8rem,6vw,4.5rem);letter-spacing:-0.02em;color:white;line-height:1;margin-bottom:10px;animation:fadeUp 0.8s ease both;text-shadow:0 2px 20px rgba(0,0,0,0.8)}
  .soul-label{font-family:'Montserrat',sans-serif;font-weight:800;font-size:clamp(5.5px,1.8vw,8px);letter-spacing:clamp(0.15em,0.4vw,0.5em);text-transform:uppercase;color:rgba(212,175,55,0.8);margin-bottom:22px;white-space:nowrap;text-shadow:0 1px 12px rgba(0,0,0,0.9)}
  .soul-label span{color:rgba(255,255,255,0.25);margin:0 8px}
  .stats-row{display:flex;gap:12px;flex-wrap:nowrap;justify-content:center;margin-bottom:40px;animation:fadeUp 1.1s ease both;width:100%;max-width:400px;margin-left:auto;margin-right:auto}
  .stat-pill{background:rgba(5,5,5,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:100px;padding:12px 20px;text-align:center;flex:1 1 0;min-width:0;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
  .stat-value{font-weight:800;font-size:20px;color:#D4AF37;letter-spacing:-0.02em;display:block}
  .stat-label{font-weight:800;font-size:7px;letter-spacing:0.45em;text-transform:uppercase;color:rgba(255,255,255,0.35);display:block;margin-top:2px}
  .scroll-hint{position:absolute;bottom:36px;font-weight:800;font-size:7px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.15);display:flex;flex-direction:column;align-items:center;gap:8px}
  .scroll-arrow{width:12px;height:12px;border-right:1.5px solid rgba(255,255,255,0.2);border-bottom:1.5px solid rgba(255,255,255,0.2);transform:rotate(45deg);animation:bounce 1.8s ease-in-out infinite}
  .sri-yantra-section{width:100%;position:relative;height:clamp(380px,55vw,650px);overflow:hidden}
  .sri-yantra-img{width:100%;height:100%;object-fit:cover;object-position:center center;display:block;animation:sriYantraBreathe 7s ease-in-out infinite}
  .sri-yantra-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;height:90%;background:radial-gradient(ellipse,rgba(212,175,55,0.4) 0%,rgba(212,175,55,0.1) 40%,transparent 70%);filter:blur(40px);pointer-events:none;z-index:0;animation:sriGlowPulse 7s ease-in-out infinite}
  .sri-yantra-svg-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,#0a2040 0%,#050505 70%)}
  .sri-yantra-fade-top{position:absolute;top:0;left:0;right:0;height:220px;background:linear-gradient(to bottom,#050505 0%,transparent 100%);pointer-events:none}
  .sri-yantra-fade-bottom{position:absolute;bottom:0;left:0;right:0;height:220px;background:linear-gradient(to top,#050505 0%,transparent 100%);pointer-events:none}
  .sri-yantra-label{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);font-weight:800;font-size:clamp(6px,1.8vw,8px);letter-spacing:clamp(0.1em,0.45em,0.45em);text-transform:uppercase;color:rgba(212,175,55,0.85);background:rgba(5,5,5,0.65);backdrop-filter:blur(12px);padding:10px 24px;border-radius:100px;border:1px solid rgba(212,175,55,0.2);max-width:92vw;overflow:hidden;text-overflow:ellipsis;z-index:3}
  .section-wrap{max-width:780px;margin:0 auto;padding:80px 24px 0;text-align:center}
  .section-label{font-family:'Montserrat',sans-serif;font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.5);margin-bottom:32px;display:flex;align-items:center;gap:12px;justify-content:center}
  .section-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,0.2),transparent)}
  .glass-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.12);border-radius:24px;padding:32px;backdrop-filter:blur(20px);margin-bottom:16px}
  .tier-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  @media(max-width:600px){.tier-grid{grid-template-columns:1fr}}
  .tier-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:24px;padding:28px 24px;backdrop-filter:blur(20px);transition:border-color 0.3s,transform 0.3s}
  .tier-card:hover{border-color:rgba(212,175,55,0.25);transform:translateY(-2px)}
  .tier-card.active-tier{border-color:rgba(212,175,55,0.3);background:rgba(212,175,55,0.03)}
  .tier-card.featured{grid-column:1/-1;border-color:rgba(212,175,55,0.25);background:rgba(212,175,55,0.04)}
  .tier-badge{display:inline-block;font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:#050505;background:#D4AF37;padding:4px 12px;border-radius:100px;margin-bottom:10px}
  .tier-name{font-weight:800;font-size:15px;letter-spacing:0.2em;color:#D4AF37;display:block;margin-bottom:4px}
  .tier-sub{font-weight:400;font-size:8px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.25)}
  .tier-price{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:2.2rem;color:white;margin:16px 0 12px;letter-spacing:-0.02em}
  .tier-price small{font-size:0.45em;color:rgba(255,255,255,0.3);font-style:normal;letter-spacing:0.1em}
  .tier-features{list-style:none;margin-bottom:20px}
  .tier-features li{font-size:12px;color:rgba(255,255,255,0.45);padding:5px 0;display:flex;align-items:center;gap:10px;line-height:1.5}
  .tier-features li::before{content:'◈';color:#D4AF37;font-size:8px;flex-shrink:0}
  .gold-btn{display:block;width:100%;max-width:280px;margin:0 auto;background:#D4AF37;color:#050505;border:none;border-radius:100px;padding:13px 24px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:opacity 0.2s,transform 0.2s;text-align:center}
  .gold-btn:hover{opacity:0.85;transform:translateY(-1px)}
  .ghost-btn{display:block;width:100%;max-width:280px;margin:0 auto;background:transparent;color:rgba(212,175,55,0.6);border:1px solid rgba(212,175,55,0.2);border-radius:100px;padding:12px 24px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;text-align:center}
  .siddha-quantum-card{position:relative;overflow:visible!important;border-color:rgba(212,175,55,0.35)!important;background:rgba(212,175,55,0.04)!important}
  .sq-aura{position:absolute;inset:0;border-radius:24px;pointer-events:none;z-index:0}
  .sq-aura-1{border:1px solid rgba(212,175,55,0.5);animation:sqPulse 2.5s ease-in-out infinite}
  .sq-aura-2{border:1px solid rgba(212,175,55,0.3);animation:sqPulse 2.5s ease-in-out infinite 0.6s}
  .sq-aura-3{border:1px solid rgba(212,175,55,0.15);animation:sqPulse 2.5s ease-in-out infinite 1.2s}
  .sq-badge{background:linear-gradient(90deg,#b8960c,#D4AF37,#f5d76e,#D4AF37,#b8960c);background-size:300%;animation:shimmer 3s linear infinite}
  .sq-btn{box-shadow:0 0 28px rgba(212,175,55,0.45),0 0 60px rgba(212,175,55,0.15);animation:btnGlow 2.5s ease-in-out infinite}
  .siddhis-scroll{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none}
  .siddhis-scroll::-webkit-scrollbar{display:none}
  .siddhi-card{min-width:148px;background:rgba(255,255,255,0.02);border-radius:20px;padding:22px 16px;text-align:center;flex-shrink:0;transition:transform 0.2s}
  .siddhi-card:hover{transform:translateY(-3px)}
  .siddhi-card.earned{border:1px solid rgba(212,175,55,0.3)}
  .siddhi-card.locked{border:1px solid rgba(255,255,255,0.04);opacity:0.5}
  .siddhi-icon-wrap{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
  .siddhi-icon-wrap.earned{background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);box-shadow:0 0 20px rgba(212,175,55,0.1)}
  .siddhi-icon-wrap.locked{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06)}
  .siddhi-name{font-weight:700;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;display:block;margin-bottom:10px}
  .siddhi-card.earned .siddhi-name{color:#D4AF37}
  .siddhi-card.locked .siddhi-name{color:rgba(255,255,255,0.2)}
  .siddhi-bar-bg{height:3px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden}
  .siddhi-bar-fill{height:100%;background:#D4AF37;border-radius:3px}
  .vault-idle{text-align:center;padding:20px 0}
  .vault-idle p{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.05rem;color:rgba(255,255,255,0.35);line-height:1.8;margin-bottom:28px;max-width:460px;margin-left:auto;margin-right:auto}
  .vault-scan-ring{width:80px;height:80px;border-radius:50%;border:1px solid rgba(212,175,55,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 28px;animation:scanPulse 3s ease-in-out infinite;position:relative}
  .vault-scan-ring::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(212,175,55,0.1)}
  .vault-scan-ring span{font-size:28px}
  .archive-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  @media(max-width:520px){.archive-grid{grid-template-columns:1fr}}
  .archive-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:18px;padding:20px 18px;transition:all 0.3s;cursor:pointer}
  .archive-card:hover{border-color:rgba(212,175,55,0.3);background:rgba(212,175,55,0.03);transform:translateY(-2px)}
  .archive-title{font-weight:800;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.55);display:block;margin-bottom:2px}
  .archive-sub{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.75rem;color:rgba(255,255,255,0.25);display:block;line-height:1.5}
  .archive-cta{font-weight:800;font-size:8px;letter-spacing:0.4em;text-transform:uppercase;color:#D4AF37;opacity:0.7}
  .archive-card:hover .archive-cta{opacity:1}
  .abundance-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  @media(min-width:520px){.abundance-grid{grid-template-columns:repeat(4,1fr)}}
  .abundance-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:20px;padding:24px 16px 20px;text-align:center;cursor:pointer;transition:all 0.25s}
  .abundance-card:hover{border-color:rgba(212,175,55,0.3);background:rgba(212,175,55,0.04);transform:translateY(-3px)}
  .abundance-icon-wrap{width:56px;height:56px;border-radius:16px;background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;transition:all 0.25s}
  .abundance-card:hover .abundance-icon-wrap{background:rgba(212,175,55,0.1);border-color:rgba(212,175,55,0.3);box-shadow:0 0 20px rgba(212,175,55,0.1)}
  .abundance-label{font-weight:800;font-size:7.5px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.3)}
  .settings-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
  .settings-btn{flex:1;min-width:120px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:100px;padding:13px 20px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:8px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.3);cursor:pointer;transition:all 0.2s;text-align:center}
  .settings-btn:hover{color:#D4AF37;border-color:rgba(212,175,55,0.2)}
  .signout-btn{width:100%;background:transparent;border:1px solid rgba(255,255,255,0.06);border-radius:100px;padding:13px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:8px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.2);cursor:pointer;transition:all 0.2s;margin-top:8px}
  .signout-btn:hover{color:rgba(239,68,68,0.7);border-color:rgba(239,68,68,0.2)}
  .lang-selector{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.12);border-radius:24px;padding:20px 24px;backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}
  @keyframes pulseDeep{0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:0.9;transform:translate(-50%,-50%) scale(1.05)}}
  .animate-pulse-deep{animation:pulseDeep 3s cubic-bezier(0.45,0.05,0.55,0.95) infinite}
  @keyframes sriYantraBreathe{0%,100%{filter:brightness(1) saturate(1)}50%{filter:brightness(1.2) saturate(1.3)}}
  @keyframes sriGlowPulse{0%,100%{opacity:0.2}50%{opacity:0.9}}
  @keyframes sqPulse{0%{transform:scale(1);opacity:0.8}50%{transform:scale(1.04);opacity:0}100%{transform:scale(1.08);opacity:0}}
  @keyframes shimmer{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes btnGlow{0%,100%{box-shadow:0 0 20px rgba(212,175,55,0.4)}50%{box-shadow:0 0 40px rgba(212,175,55,0.7)}}
  @keyframes glowBreathe{0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes bounce{0%,100%{transform:rotate(45deg) translateY(0)}50%{transform:rotate(45deg) translateY(6px)}}
  @keyframes scanPulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.12);opacity:1}}
  @keyframes siddhiSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes stardustMove{from{background-position:0 0}to{background-position:1000px 1000px}}
  .sy-short{display:none}
  .sy-full{display:inline}
  @media(max-width:520px){
    .sri-yantra-label{position:relative;bottom:auto;left:auto;transform:none;display:block;text-align:center;width:calc(100% - 48px);max-width:100%;margin:-1px auto 0;border-radius:0 0 20px 20px;border-top:none;padding:12px 20px;font-size:7px;letter-spacing:0.25em}
    .sy-full{display:none}
    .sy-short{display:inline}
    .sri-yantra-section{overflow:visible}
  }
`}} />

    <div className="profile-wrap" style={{minHeight:'100vh',background:'#050505',overflowX:'hidden',fontFamily:'Montserrat,sans-serif',paddingBottom:'120px',position:'relative'}}>

      <div style={{position:'fixed',inset:0,backgroundImage:"url('https://www.transparenttextures.com/patterns/stardust.png')",opacity:0.25,pointerEvents:'none',zIndex:0,animation:'stardustMove 180s linear infinite'}} />

      <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}} />

      <div style={{position:'relative',zIndex:1}}>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="avatar-wrap">
          <div className="avatar-glow" />
          <div className="avatar-glow-2" />
          {/* Sri Yantra Shield — pulsating behind avatar */}
          <svg className="sri-yantra-avatar-shield" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <filter id="syGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <radialGradient id="syBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(212,175,55,0.06)"/>
                <stop offset="100%" stopColor="rgba(212,175,55,0)"/>
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="198" fill="url(#syBg)"/>
            <circle cx="200" cy="200" r="190" stroke="rgba(212,175,55,0.12)" strokeWidth="0.6" fill="none"/>
            <circle cx="200" cy="200" r="170" stroke="rgba(212,175,55,0.10)" strokeWidth="0.5" fill="none"/>
            <circle cx="200" cy="200" r="148" stroke="rgba(212,175,55,0.14)" strokeWidth="0.7" fill="none" strokeDasharray="6 7"/>
            <circle cx="200" cy="200" r="128" stroke="rgba(212,175,55,0.10)" strokeWidth="0.5" fill="none"/>
            {/* Upward triangles */}
            <polygon points="200,42 368,322 32,322" stroke="#D4AF37" strokeWidth="1.4" fill="none" opacity="0.75" filter="url(#syGlow)"/>
            <polygon points="200,78 348,306 52,306" stroke="#D4AF37" strokeWidth="1.1" fill="none" opacity="0.58"/>
            <polygon points="200,108 328,290 72,290" stroke="#D4AF37" strokeWidth="0.85" fill="none" opacity="0.42"/>
            <polygon points="200,140 308,274 92,274" stroke="#D4AF37" strokeWidth="0.65" fill="none" opacity="0.28"/>
            {/* Downward triangles */}
            <polygon points="200,358 32,78 368,78" stroke="#D4AF37" strokeWidth="1.3" fill="none" opacity="0.70" filter="url(#syGlow)"/>
            <polygon points="200,322 52,94 348,94" stroke="#D4AF37" strokeWidth="1.0" fill="none" opacity="0.54"/>
            <polygon points="200,290 72,110 328,110" stroke="#D4AF37" strokeWidth="0.80" fill="none" opacity="0.38"/>
            <polygon points="200,262 92,126 308,126" stroke="#D4AF37" strokeWidth="0.60" fill="none" opacity="0.24"/>
            {/* Bindu — central point */}
            <circle cx="200" cy="200" r="14" fill="rgba(212,175,55,0.10)" stroke="rgba(212,175,55,0.5)" strokeWidth="0.8"/>
            <circle cx="200" cy="200" r="6" fill="rgba(212,175,55,0.80)" filter="url(#syGlow)"/>
            <circle cx="200" cy="200" r="2.5" fill="#D4AF37"/>
          </svg>
          <div style={{position:'relative',zIndex:1}}>
            <Avatar style={{width:100,height:100,border:'2px solid rgba(212,175,55,0.45)',boxShadow:'0 0 40px rgba(212,175,55,0.15)'}}>
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback style={{background:'rgba(212,175,55,0.08)',color:'white',fontSize:36}}>
                {userName?.charAt(0) || '🧘'}
              </AvatarFallback>
            </Avatar>
          </div>
          <button onClick={() => setProfileEditOpen(true)} style={{position:'absolute',bottom:0,right:0,width:30,height:30,borderRadius:'50%',background:'#D4AF37',border:'2px solid #050505',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:2}}>
            <Pencil size={11} color="#050505" />
          </button>
        </div>

        <h1 className="hero-name">{userName}</h1>
        <div className="soul-label">528Hz Resonance <span>·</span> {dashaCycle} Cycle Active</div>


        <div className="stats-row">
          <div className="stat-pill">
            <span className="stat-value">{shcProfile?.streak_days || 0}</span>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat-pill">
            <span className="stat-value"><AnimatedCounter value={balance?.balance ?? 0} /></span>
            <span className="stat-label">Balance</span>
          </div>
          <div className="stat-pill">
            <span className="stat-value">{badges.filter(b => b.earned).length}</span>
            <span className="stat-label">Badges</span>
          </div>
        </div>

        <div className="scroll-hint">◈ Scroll to explore your field<div className="scroll-arrow" /></div>
      </section>

      {/* ── SRI YANTRA ── */}
      <section className="sri-yantra-section">
        <img className="sri-yantra-img"
          src="/Gemini_Generated_Image_57v0zm57v0zm57v0.jpg"
          style={{ animation: 'sriYantraBreathe 7s ease-in-out infinite' }}
          onError={(e) => { e.currentTarget.style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display='flex'; }}
          alt="Sri Yantra" />
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:'65%', height:'85%', borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.07) 45%, transparent 70%)',
          pointerEvents:'none',
          animation:'sriGlowPulse 7s ease-in-out infinite',
          zIndex:1
        }} aria-hidden />
        <div className="sri-yantra-svg-fallback" style={{display:'none'}}>
          <svg width="420" height="420" viewBox="0 0 420 420" style={{animation:'siddhiSpin 180s linear infinite',opacity:0.7}}>
            <circle cx="210" cy="210" r="200" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1"/>
            <circle cx="210" cy="210" r="180" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5"/>
            <polygon points="210,60 330,270 90,270" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5"/>
            <polygon points="210,80 320,260 100,260" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1"/>
            <polygon points="210,360 90,150 330,150" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5"/>
            <polygon points="210,340 100,160 320,160" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1"/>
            <circle cx="210" cy="210" r="6" fill="rgba(212,175,55,0.9)"/>
            <circle cx="210" cy="210" r="12" fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="1"/>
            <text x="210" y="218" textAnchor="middle" fill="rgba(212,175,55,0.7)" fontSize="20" fontFamily="serif">ॐ</text>
          </svg>
        </div>
        <div className="sri-yantra-fade-top" />
        <div className="sri-yantra-fade-bottom" />
        <div className="sri-yantra-label">
          <span className="sy-full">◈ Sri Yantra Shield · Akashic Field Active · 72,000 Nadis Mapped</span>
          <span className="sy-short">◈ Sri Yantra Shield Active</span>
        </div>
      </section>

      {/* ── TIERS ── */}
      <div className="section-wrap">
        <div className="section-label">◈ Your Ascension Frequency</div>
        <div className="tier-grid">

          <div className={`tier-card${userRank === 0 ? ' active-tier' : ''}`}>
            <div className="tier-header">
              <span className="tier-name">Atma–Seed</span>
              <div className="tier-sub">Sovereign Entry Node</div>
            </div>
            <div className="tier-price">Free</div>
            <ul className="tier-features">
              <li>Free Meditations & Mantras</li>
              <li>Free Healing Audios</li>
              <li>Free Breathing Protocols</li>
              <li>Vayu Scrubber (1km)</li>
              <li>Community Chat & Live</li>
              <li>Basic Ayurveda & Jyotish</li>
            </ul>
            <button
              onClick={() => navigate('/atma-seed')}
              style={{
                display:'block', width:'100%',
                background: userRank === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                color: userRank === 0 ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.25)',
                border: `1px solid ${userRank === 0 ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius:100, padding:'12px 24px',
                fontFamily:'Montserrat,sans-serif',
                fontWeight:800, fontSize:9,
                letterSpacing:'0.4em', textTransform:'uppercase',
                cursor:'pointer', transition:'all 0.2s'
              }}
            >
              {userRank === 0 ? '◈ Current Tier' : '◈ Free Tier'}
            </button>
          </div>

          <div className={`tier-card${userRank === 1 ? ' active-tier' : ''}`}>
            <div className="tier-header">
              <span className="tier-name">Prana–Flow</span>
              <div className="tier-sub">Sonic Vibration</div>
            </div>
            <div className="tier-price">19€ <small>/ mo</small></div>
            <ul className="tier-features">
              <li>Full Vedic Jyotish + Chat</li>
              <li>Full Ayurvedic Scan + Chat</li>
              <li>Vastu Guide for Home</li>
              <li>Access to All Healing Music</li>
              <li>Full Meditation & Mantra Library</li>
            </ul>
            <button
              type="button"
              onClick={() => navigate('/prana-flow')}
              style={{
                display: 'block', width: '100%', maxWidth: 260, margin: '0 auto',
                background: userRank >= 1
                  ? 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.08))'
                  : 'rgba(255,255,255,0.04)',
                color: userRank >= 1 ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                border: userRank >= 1
                  ? '1px solid rgba(212,175,55,0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 100, padding: '13px 20px',
                fontFamily: 'Montserrat,sans-serif', fontWeight: 800,
                fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {userRank >= 1
                ? (userRank === 1 ? '◈ Current Tier' : '◈ Included in Your Plan')
                : '◈ Activate Vibration'}
            </button>
          </div>

          <div className={`tier-card featured siddha-quantum-card${userRank === 2 ? ' active-tier' : ''}`}>
            <div className="sq-aura sq-aura-1" /><div className="sq-aura sq-aura-2" /><div className="sq-aura sq-aura-3" />
            <div style={{position:'relative',zIndex:1}}>
              <div className="tier-badge sq-badge">◈ Universal Path</div>
              <div className="tier-header">
                <span className="tier-name" style={{fontSize:18,textShadow:'0 0 20px rgba(212,175,55,0.6)'}}>Siddha–Quantum</span>
                <div className="tier-sub">Universal Field Node</div>
              </div>
              <div className="tier-price" style={{textShadow:'0 0 30px rgba(212,175,55,0.3)'}}>45€ <small>/ mo</small></div>
              <ul className="tier-features">
                <li>Digital Nadi Scanner (Bio-Sync)</li>
                <li>Practice Scantions (Printed Results)</li>
                <li>Siddha Portal Access</li>
                <li>Full Healing Audios & Transmissions</li>
                <li>Sri Yantra Universal Protection Shield</li>
              </ul>
              <button
                onClick={() => navigate('/siddha-quantum')}
                style={{
                  display:'block', width:'100%',
                  background:'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.08))',
                  color:'#D4AF37', border:'1px solid rgba(212,175,55,0.4)',
                  borderRadius:100, padding:'14px 24px',
                  fontFamily:'Montserrat,sans-serif', fontWeight:800,
                  fontSize:9, letterSpacing:'0.4em', textTransform:'uppercase',
                  cursor:'pointer', transition:'all 0.2s',
                  boxShadow:'0 0 24px rgba(212,175,55,0.2)'
                }}
              >
                {userRank >= 2
                  ? (userRank === 2 ? '◈ Current Tier — Active' : '◈ Included in Your Plan')
                  : '◈ Activate Universal Field'}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{borderColor:'rgba(212,175,55,0.2)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
            <div>
              <div style={{fontWeight:800,fontSize:8,letterSpacing:'0.4em',color:'rgba(212,175,55,0.5)',textTransform:'uppercase',marginBottom:8}}>◈ Eternal Node Activation</div>
              <div style={{fontWeight:800,fontSize:17,letterSpacing:'0.2em',color:'#D4AF37'}}>Akasha–Infinity</div>
              <div style={{fontSize:8,letterSpacing:'0.35em',color:'rgba(255,255,255,0.2)',textTransform:'uppercase',marginTop:4}}>Lifetime Transmission</div>
              {userRank >= 3 && (
                <span style={{
                  display:'inline-block',
                  fontWeight:800, fontSize:6.5, letterSpacing:'0.4em', textTransform:'uppercase',
                  color:'#050505', background:'#D4AF37', borderRadius:100, padding:'3px 9px',
                  marginTop:6
                }}>◈ Active · Eternal</span>
              )}
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontStyle:'italic',fontSize:'2.8rem',color:'white'}}>€1111</div>
          </div>
          <ul className="tier-features" style={{margin:'20px 0',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))'}}>
            <li>Akashic Decoder</li><li>Quantum Apothecary (€888 Value)</li>
            <li>Virtual Pilgrimage (€888 Value)</li><li>Palm Reading Portal</li>
            <li>Sri Yantra Universal Protection Shield</li>
          </ul>
          <button
            type="button"
            onClick={() => navigate('/akasha-infinity')}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 280, margin: '0 auto',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.1))',
              color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.5)',
              borderRadius: 100,
              padding: '15px 24px',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: '0.4em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 32px rgba(212,175,55,0.3), 0 0 64px rgba(212,175,55,0.08)',
            }}
          >
            {userRank >= 3 ? '◈ Field Active — Open Portal ∞' : '◈ Enter the Akashic Field ∞'}
          </button>
        </div>
      </div>

      {/* ── VEDIC SIDDHIS ── */}
      <div className="section-wrap">
        <div className="section-label">◈ Vedic Siddhis</div>
        <div className="siddhis-scroll">
          {badges.map((badge, idx) => {
            const SvgIcon = badge.id === 1 ? (/* Gold Bindu */
              <svg viewBox="0 0 40 40" width={40} height={40} fill="none"><circle cx="20" cy="20" r="18" stroke="#D4AF37" strokeWidth="0.8" opacity="0.4"/><circle cx="20" cy="20" r="13" stroke="#D4AF37" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6"/><circle cx="20" cy="20" r="8" stroke="#D4AF37" strokeWidth="1"/><circle cx="20" cy="20" r="4" stroke="#D4AF37" strokeWidth="0.8" opacity="0.8"/><circle cx="20" cy="20" r="2" fill="#D4AF37"/></svg>
            ) : badge.id === 2 ? (/* Agni-Flame */
              <svg viewBox="0 0 40 40" width={40} height={40} fill="none"><path d="M20 4 C20 4 29 13 29 21 C29 26 25 32 20 36 C15 32 11 26 11 21 C11 13 20 4 20 4Z" stroke="#D4AF37" strokeWidth="1.2" fill="none"/><path d="M20 10 C20 10 25 16 25 21 C25 25 22 29 20 32" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.8"/><circle cx="20" cy="8" r="1.5" fill="#D4AF37"/></svg>
            ) : badge.id === 3 ? (/* Siddha Seal */
              <svg viewBox="0 0 40 40" width={40} height={40} fill="none"><polygon points="20,7 25,16 35,16 27,23 30,33 20,27 10,33 13,23 5,16 15,16" stroke="#D4AF37" strokeWidth="1" fill="rgba(212,175,55,0.08)"/><circle cx="20" cy="20" r="3" stroke="#D4AF37" strokeWidth="0.8" opacity="0.8"/><circle cx="20" cy="20" r="6" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4"/></svg>
            ) : badge.id === 4 ? (/* Solar Crown locked */
              <svg viewBox="0 0 40 40" width={40} height={40} fill="none"><path d="M8 28 L12 18 L20 24 L28 18 L32 28 Z" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none"/><rect x="10" y="26" width="20" height="4" rx="1" stroke="rgba(255,255,255,0.12)" fill="none"/><circle cx="14" cy="20" r="1.5" stroke="rgba(255,255,255,0.12)" fill="none"/><circle cx="20" cy="16" r="1.5" stroke="rgba(255,255,255,0.12)" fill="none"/><circle cx="26" cy="20" r="1.5" stroke="rgba(255,255,255,0.12)" fill="none"/><path d="M18 22 L20 24 L22 22" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none"/></svg>
            ) : badge.id === 5 ? (/* Sovereign locked */
              <svg viewBox="0 0 40 40" width={40} height={40} fill="none"><path d="M20 4 L8 10 L8 22 C8 28 14 34 20 36 C26 34 32 28 32 22 L32 10 Z" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none"/><path d="M14 16 L20 10 L26 16 L26 22 L20 26 L14 22 Z" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" fill="none"/></svg>
            ) : badge.id === 6 ? (/* Moon Keeper locked */
              <svg viewBox="0 0 40 40" width={40} height={40} fill="none"><path d="M25 7 C15 9 8 16 8 24 C8 30 14 34 20 34 C26 34 32 30 32 24 C32 16 25 9 25 7Z" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none"/><circle cx="12" cy="18" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="28" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="28" r="1" fill="rgba(255,255,255,0.1)"/></svg>
            ) : (
              <svg viewBox="0 0 40 40" width={40} height={40} fill="none"><circle cx="20" cy="20" r="18" stroke="#D4AF37" strokeWidth="0.8" opacity="0.4"/><circle cx="20" cy="20" r="13" stroke="#D4AF37" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6"/><circle cx="20" cy="20" r="8" stroke="#D4AF37" strokeWidth="1"/><circle cx="20" cy="20" r="4" stroke="#D4AF37" strokeWidth="0.8" opacity="0.8"/><circle cx="20" cy="20" r="2" fill="#D4AF37"/></svg>
            );
            return (
              <div key={badge.id} className={`siddhi-card ${badge.earned ? 'earned' : 'locked'}`}>
                <div className={`siddhi-icon-wrap ${badge.earned ? 'earned' : 'locked'}`}>
                  {SvgIcon}
                </div>
                <span className="siddhi-name">{t(badge.titleKey)}</span>
                <div className="siddhi-bar-bg"><div className="siddhi-bar-fill" style={{width: badge.earned ? '100%' : '10%'}} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SOUL VAULT ── */}
      <div className="section-wrap">
        <div className="section-label">◈ Soul Vault — Deep Field Resonance</div>
        <div className="glass-card">
          {scanPhase === 'idle' && (
            <div className="vault-idle">
              <div className="vault-scan-ring"><span>◈</span></div>
              <p>After each practice, SQI will inscribe a Deep-Field Resonance report into your Soul Vault — a living record of your bio-digital evolution.</p>
              <button type="button" className="gold-btn" style={{maxWidth:260,margin:'0 auto'}} onClick={() => navigate('/soul-scan')}>Initiate Soul Scan →</button>
            </div>
          )}
          {scanPhase !== 'idle' && soulVaultEntries.length > 0 && (
            <div className="space-y-3">
              {soulVaultEntries.slice(0, 4).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-white/90">{entry.activity || 'Deep-Field Resonance'}</p>
                    <span className="text-[10px] text-white/40">{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                  {entry.duration_minutes && <p className="text-[10px] text-cyan-200/80 mb-1">{entry.duration_minutes} min practice window</p>}
                  <p className="text-[11px] leading-relaxed text-white/75 line-clamp-3">{entry.report}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AKASHIC ARCHIVE ── */}
      <div className="section-wrap">
        <div className="section-label">◈ Akashic Archive</div>
        <div className="archive-grid">
          <div className="archive-card" onClick={() => navigate('/akashic-records')}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:13,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:14}}>
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <rect x="5" y="3" width="15" height="20" rx="2" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="1.4"/>
                  <path d="M5 6 C5 4.3 3 4.3 3 6 L3 22 C3 23.7 5 23.7 5 22" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2"/>
                  <line x1="9" y1="9" x2="17" y2="9" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                  <line x1="9" y1="12" x2="17" y2="12" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
                  <line x1="9" y1="15" x2="14" y2="15" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
                  <circle cx="21" cy="5" r="3" fill="rgba(212,175,55,0.15)" stroke="#D4AF37" strokeWidth="1"/>
                  <circle cx="21" cy="5" r="1" fill="#D4AF37"/>
                </svg>
              </div>
              <div>
                <span className="archive-title">Akashic Record</span>
                <span className="archive-sub">12-page Soul Manuscript</span>
              </div>
            </div>
            <span className="archive-cta">View Manuscript →</span>
          </div>
          <div className="archive-card" onClick={() => navigate('/vedic-astrology')}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:13,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:14}}>
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <path d="M3 14 C3 14 8 6 14 6 C20 6 25 14 25 14 C25 14 20 22 14 22 C8 22 3 14 3 14Z" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="1.4" strokeLinejoin="round"/>
                  <circle cx="14" cy="14" r="4" fill="rgba(212,175,55,0.1)" stroke="#D4AF37" strokeWidth="1.4"/>
                  <circle cx="14" cy="14" r="1.5" fill="#D4AF37"/>
                  <line x1="14" y1="2" x2="14" y2="5" stroke="rgba(212,175,55,0.4)" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="20" y1="4" x2="18.5" y2="6.5" stroke="rgba(212,175,55,0.3)" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="8" y1="4" x2="9.5" y2="6.5" stroke="rgba(212,175,55,0.3)" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <span className="archive-title">Life Reading</span>
                <span className="archive-sub">Jyotish · Stars meet the Soul</span>
              </div>
            </div>
            <span className="archive-cta">Enter Reading →</span>
          </div>
          <div className="archive-card" onClick={() => navigate('/digital-nadi')}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:13,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:14}}>
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <path d="M2 14 L5 14 L7 8 L9 20 L11 11 L13 17 L15 14 L17 14" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 14 L19 10 L21 18 L23 14 L26 14" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="14" y1="4" x2="14" y2="24" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 3"/>
                </svg>
              </div>
              <div>
                <span className="archive-title">Digital Nadi Scan</span>
                <span className="archive-sub">72,000 Nadi Bio-Sync</span>
              </div>
            </div>
            <span className="archive-cta">Initiate Scan →</span>
          </div>
          <div className="archive-card" onClick={() => navigate('/life-book')}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:13,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:14}}>
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <path d="M8 12 L7 22 L21 22 L20 12 Z" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M6 12 L22 12" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M11 12 L10 7 L18 7 L17 12" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2" strokeLinejoin="round"/>
                  <line x1="14" y1="15" x2="14" y2="19" stroke="#D4AF37" strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="12" y1="17" x2="16" y2="17" stroke="#D4AF37" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="14" cy="5" r="1.5" fill="rgba(212,175,55,0.3)" stroke="#D4AF37" strokeWidth="1"/>
                </svg>
              </div>
              <div>
                <span className="archive-title">Quantum Apothecary</span>
                <span className="archive-sub">Remedies from the Field · Your SQI Life Book</span>
              </div>
            </div>
            <span className="archive-cta">Open saved chats →</span>
          </div>
        </div>
      </div>

      {/* ── ABUNDANCE & LINEAGE ── */}
      <div className="section-wrap">
        <div className="section-label">◈ Abundance & Lineage</div>
        <div className="abundance-grid">
          <div className="abundance-card" onClick={() => navigate('/income-streams')}>
            <div className="abundance-icon-wrap"><Wallet size={22} color="#D4AF37" /></div>
            <span className="abundance-label">Wallet & Earnings</span>
          </div>
          <div className="abundance-card" onClick={() => navigate('/income-streams/affiliate')}>
            <div className="abundance-icon-wrap"><Megaphone size={22} color="#D4AF37" /></div>
            <span className="abundance-label">Promote & Earn</span>
          </div>
          <div className="abundance-card" onClick={connectWallet}>
            <div className="abundance-icon-wrap"><Moon size={22} color="#D4AF37" /></div>
            <span className="abundance-label">Connect Wallet</span>
          </div>
          {isAdmin && (
            <div className="abundance-card" onClick={() => navigate('/admin')}>
              <div className="abundance-icon-wrap"><Crown size={22} color="#D4AF37" /></div>
              <span className="abundance-label">Admin Panel</span>
            </div>
          )}
        </div>
      </div>

      {/* ── SETTINGS ── */}
      <div className="section-wrap">
        <div className="section-label">◈ Physical Sanctuary</div>
        <div style={{marginBottom:16}}>
          <div onClick={() => setLangOpen((o) => !o)} style={{
            background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(212,175,55,0.12)',
            borderRadius:16, padding:'16px 20px',
            display:'flex', alignItems:'center',
            justifyContent:'space-between', cursor:'pointer',
            transition:'all 0.2s'
          }}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:40,height:40,borderRadius:12,
                background:'rgba(212,175,55,0.06)',
                border:'1px solid rgba(212,175,55,0.15)',
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                </svg>
              </div>
              <div>
                <span style={{fontWeight:800,fontSize:7,letterSpacing:'0.4em',
                  textTransform:'uppercase',color:'rgba(255,255,255,0.2)',
                  display:'block',marginBottom:4}}>Language</span>
                <div style={{display:'flex',alignItems:'center',gap:8,fontSize:14,fontWeight:600,color:'rgba(255,255,255,0.7)'}}>
                  <span style={{fontSize:20}}>{langs[activeLangIdx].flag}</span>
                  <span>{langs[activeLangIdx].label}</span>
                </div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(212,175,55,0.5)" strokeWidth="2" strokeLinecap="round"
              style={{transform: langOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.25s'}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          {langOpen && (
            <div style={{background:'rgba(8,8,8,0.97)',border:'1px solid rgba(212,175,55,0.12)',
              borderRadius:14,overflow:'hidden',marginTop:4}}>
              {langs.map((l, i) => (
                <div key={l.label} onClick={async () => {
                  setLangOpen(false);
                  await i18n.changeLanguage(l.code);
                  if (user) await updatePreferredLanguage(l.code);
                }}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'14px 20px',
                    fontSize:14,fontWeight: i===activeLangIdx ? 700 : 500,
                    color: i===activeLangIdx ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                    cursor:'pointer',
                    borderBottom: i < langs.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: i===activeLangIdx ? 'rgba(212,175,55,0.05)' : 'transparent'}}>
                  <span style={{fontSize:22}}>{l.flag}</span>
                  {l.label}
                  {i===activeLangIdx && <span style={{marginLeft:'auto',color:'#D4AF37',fontSize:12}}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="settings-row" style={{marginTop:20}}>
          <button type="button" className="settings-btn" onClick={() => setNotificationsOpen(true)}>Notifications</button>
          <button type="button" className="settings-btn" onClick={() => setAppearanceOpen(true)}>Appearance</button>
          <button type="button" className="settings-btn" onClick={() => setPrivacyOpen(true)}>Privacy</button>
        </div>
        <div className="settings-row">
          <button type="button" className="settings-btn" onClick={() => setSettingsOpen(true)}>Settings</button>
        </div>
        <button type="button" className="signout-btn" onClick={handleSignOut}>Sign Out</button>
      </div>

      </div>{/* end z-index wrapper */}

      {/* Digital Nadi 2050 Scanner Overlay */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
          <div className="w-full max-w-xl bg-[#030712] rounded-[40px] border border-cyan-500/20 p-10 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
            <div className="text-right mb-4">
              <button type="button" onClick={handleCloseScanner} className="text-white/40 text-xs hover:text-white">Close</button>
            </div>
            {scanPhase === 'scanning' && (
              <HandScanner onComplete={() => setScanPhase('question')} />
            )}
            {scanPhase === 'question' && (
              <>
                <div className="text-center mb-10">
                  <p className="text-cyan-400/60 text-[10px] font-black tracking-[0.4em] uppercase mb-4">2050 Deep-Field Capture</p>
                  <h3 className="text-white text-xl font-bold mb-2">What is your current practice?</h3>
                  <p className="text-white/40 text-[10px]">SQI will tune your report based on the field you just generated.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {practiceProtocols.map((p) => (
                    <button key={p.id} type="button" onClick={() => setSelectedPractice(p.label)}
                      className={`py-4 px-6 rounded-2xl bg-white/[0.03] border text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${selectedPractice === p.label ? 'border-[#D4AF37]/50 text-white' : 'border-white/5 text-white/60 hover:border-[#D4AF37]/40 hover:text-white'}`}>
                      <span>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="mb-8">
                  <label className="text-white/40 text-[8px] uppercase tracking-widest block mb-2 px-2">Approximate duration (minutes)</label>
                  <input type="number" value={practiceDuration} onChange={(e) => setPracticeDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white text-sm focus:border-cyan-500/50 outline-none" />
                </div>
                <button type="button" disabled={!selectedPractice} onClick={handleGenerateSoulReport}
                  className="w-full py-5 rounded-2xl bg-[#D4AF37] text-[#050505] text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_28px_rgba(212,175,55,0.45),0_0_60px_rgba(212,175,55,0.15)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                  Generate Deep-Field Resonance
                </button>
              </>
            )}
            {scanPhase === 'saving' && (
              <div className="space-y-4 pt-6 pb-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200/80">Committing to Soul Vault…</p>
                <p className="text-xs text-muted-foreground">SQI is writing your Deep-Field Resonance Report into your Soul Vault.</p>
              </div>
            )}
            {scanPhase === 'done' && (
              <KoshaReport
                sessionData={{
                  practice: selectedPractice || undefined,
                  duration: practiceDuration ? Number(practiceDuration) : null,
                }}
                onSave={handleCloseScanner}
              />
            )}
          </div>
        </div>
      )}

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
    </>
  );
};

export default Profile;
