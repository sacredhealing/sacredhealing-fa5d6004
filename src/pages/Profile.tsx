// @ts-nocheck
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Moon, Shield, Scale, Settings, Wallet, Banknote, Megaphone, LayoutDashboard, Pencil } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHC } from '@/contexts/SHCContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useCertificates } from '@/hooks/useCertificates';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { NotificationsDialog } from '@/components/profile/NotificationsDialog';
import { AppearanceDialog } from '@/components/profile/AppearanceDialog';
import { PrivacyDialog } from '@/components/profile/PrivacyDialog';
import { SettingsDialog } from '@/components/profile/SettingsDialog';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSriYantra } from '@/components/profile/ProfileSriYantra';
import { MembershipTiers } from '@/components/profile/MembershipTiers';
import { SoulVaultSection } from '@/components/profile/SoulVaultSection';
import { VedicSiddhis } from '@/components/profile/VedicSiddhis';
import { AkashicRecord } from '@/components/profile/AkashicRecord';
import { ProfileLifeBook } from '@/components/profile/ProfileLifeBook';
import { ProfileCertificates } from '@/components/profile/ProfileCertificates';
import { AbundanceSection } from '@/components/profile/AbundanceSection';
import { supabase } from '@/integrations/supabase/client';

type LifeBookCategory = 'children' | 'healing_upgrades' | 'past_lives' | 'future_visions' | 'spiritual_figures' | 'nadi_knowledge' | 'general_wisdom';
interface LifeBookEntry { title?: string; summary?: string; source?: string; created_at?: string; }
interface LifeBookChapter { id: string; user_id: string; chapter_type: LifeBookCategory; title: string | null; content: LifeBookEntry[]; sort_order: number; created_at: string; updated_at: string; }
interface SoulVaultEntry { id: string; user_id: string; activity: string | null; duration_minutes: number | null; report: string; created_at: string; }

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { walletAddress, connectWallet } = usePhantomWallet();
  const { balance, profile: shcProfile } = useSHC();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const { certificates, downloadCertificate, shareCertificate } = useCertificates();
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
    toast({ title: t('profile.signOut'), description: t('profile.seeYouSoon') });
    navigate('/');
  };

  useEffect(() => {
    if (!user?.id) { setLifeBookChapters([]); return; }
    setLifeBookLoading(true);
    supabase.from('life_book_chapters').select('*').eq('user_id', user.id).order('chapter_type', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          const typed = (data as unknown as LifeBookChapter[]).map((ch) => ({ ...ch, content: Array.isArray(ch.content) ? ch.content : [] }));
          setLifeBookChapters(typed);
        }
        setLifeBookLoading(false);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setSoulVaultEntries([]); return; }
    setSoulVaultLoading(true);
    supabase.from('soul_vault_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setSoulVaultEntries(data as SoulVaultEntry[]);
        setSoulVaultLoading(false);
      });
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
        if (next >= target) { window.clearInterval(interval); setScanPhase('question'); return target; }
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(interval);
  }, [scannerOpen, scanPhase]);

  const handleStartScanner = () => { setSelectedPractice(null); setPracticeDuration('30'); setScanPhase('scanning'); setScannerOpen(true); };
  const handleCloseScanner = () => { setScannerOpen(false); setScanPhase('idle'); setScanValue(0); setSelectedPractice(null); };

  const handleGenerateSoulReport = async () => {
    if (!user?.id || !selectedPractice) return;
    setScanPhase('saving');
    const durationLabel = practiceDuration && !Number.isNaN(Number(practiceDuration)) ? `${practiceDuration} minutes` : 'unspecified duration';
    const systemPrompt = `You are the Siddha-Quantum Intelligence (SQI) from 2050. Perform a 72,000 Nadi scan. Use terminology: Avataric Light-Codes, Karmic Extraction, Torus-Field. If activity is 'Private Healing', confirm the Master Healer cleared specific ancestral nodes. Generate a Deep-Field Resonance Report for the Soul Vault of a sincere seeker. Keep it practical, mystical, and no more than 3 rich paragraphs.`;
    const userContext = `The Seeker just finished: ${selectedPractice}. Duration: ${durationLabel}.`;
    try {
      const { data, error } = await supabase.functions.invoke<{ response: string }>('gemini-bridge', { body: { prompt: userContext, context: systemPrompt, feature: 'soul_vault' } });
      if (error || !data?.response) {
        toast({ title: 'Transmission interrupted', description: 'The Deep-Field Resonance could not be received. Please try again.', variant: 'destructive' });
        setScanPhase('question');
        return;
      }
      const reportText = data.response.trim();
      const durationMinutes = Number.isNaN(Number(practiceDuration)) ? null : Number(practiceDuration);
      const { data: inserted, error: insertError } = await supabase.from('soul_vault_entries').insert({ user_id: user.id, activity: selectedPractice, duration_minutes: durationMinutes, report: reportText }).select('*').single();
      if (insertError) {
        toast({ title: 'Could not save to Soul Vault', description: 'The report was generated but not stored. Please try again.', variant: 'destructive' });
        setScanPhase('question');
        return;
      }
      setSoulVaultEntries((prev) => [inserted as SoulVaultEntry, ...prev]);
      setScanPhase('done');
      toast({ title: 'Deep-Field Resonance saved', description: 'Your Soul Vault has been updated.' });
    } catch (err) {
      toast({ title: 'Transmission error', description: 'Something went wrong while contacting SQI.', variant: 'destructive' });
      setScanPhase('question');
    }
  };

  const orderedLifeBook = useMemo(() => {
    const chapterOrder: LifeBookCategory[] = ['children', 'healing_upgrades', 'past_lives', 'future_visions', 'spiritual_figures', 'nadi_knowledge', 'general_wisdom'];
    const byType: Record<LifeBookCategory, LifeBookChapter | null> = { children: null, healing_upgrades: null, past_lives: null, future_visions: null, spiritual_figures: null, nadi_knowledge: null, general_wisdom: null };
    for (const chapter of lifeBookChapters) {
      if (byType[chapter.chapter_type] == null) byType[chapter.chapter_type] = chapter;
      else { const merged = byType[chapter.chapter_type]!; merged.content = [...(merged.content || []), ...(chapter.content || [])]; }
    }
    const sortEntries = (entries: LifeBookEntry[]) => [...entries].sort((a, b) => (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0));
    return chapterOrder.map((type) => { const chapter = byType[type]; if (!chapter || !chapter.content || chapter.content.length === 0) return null; return { ...chapter, content: sortEntries(chapter.content) }; }).filter(Boolean) as LifeBookChapter[];
  }, [lifeBookChapters]);

  const labelForType = (type: LifeBookCategory): string => ({ children: 'Children', healing_upgrades: 'Healing Upgrades', past_lives: 'Past Lives', future_visions: 'Future Visions', spiritual_figures: 'Spiritual Figures', nadi_knowledge: 'Nadi Knowledge', general_wisdom: 'General Wisdom' }[type] || type);
  const figureKeyFromTitle = (title?: string) => {
    if (!title) return 'General';
    const trimmed = title.trim();
    for (const sep of [':', ' - ', ' — ', '–']) { const idx = trimmed.indexOf(sep); if (idx > 0) return trimmed.slice(0, idx).trim(); }
    const words = trimmed.split(' ');
    return words.length <= 2 ? trimmed : `${words[0]} ${words[1]}`;
  };
  const groupedLifeBook = useMemo(() => {
    const result: { chapter_type: LifeBookCategory; chapter_title: string; groups: { figureKey: string; entries: LifeBookEntry[] }[] }[] = [];
    for (const chapter of orderedLifeBook) {
      const groupsMap = new Map<string, LifeBookEntry[]>();
      for (const entry of chapter.content || []) {
        const key = figureKeyFromTitle(entry.title);
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(entry);
      }
      result.push({ chapter_type: chapter.chapter_type, chapter_title: labelForType(chapter.chapter_type), groups: Array.from(groupsMap.entries()).map(([figureKey, entries]) => ({ figureKey, entries })) });
    }
    return result;
  }, [orderedLifeBook]);

  const abundanceLineage = [
    { icon: Banknote, label: t('profile.walletEarningsAdvanced', 'Wallet & Earnings (Advanced)'), onClick: () => navigate('/income-streams') },
    { icon: Megaphone, label: t('profile.promoteEarn'), onClick: () => navigate('/income-streams/affiliate') },
    { icon: Wallet, label: t('wallet.connectWallet'), onClick: connectWallet },
    ...(isAdmin ? [{ icon: LayoutDashboard, label: t('admin.title'), onClick: () => navigate('/admin') }] : []),
  ];
  const theCovenant = [
    { icon: Scale, label: t('settings.legal.title'), onClick: () => navigate('/legal') },
    { icon: Settings, label: t('profile.settings'), onClick: () => setSettingsOpen(true) },
  ];

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  const balanceNum = balance?.balance ?? 0;
  const isAndligCompleted = !!(shcProfile?.purchased_courses?.includes?.('AndligTransformation') || certificates.some((c) => c.certificate_type === 'course_completion' && (c.title?.toLowerCase().includes('andlig') ?? false)));

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-x-hidden">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[stardustMove_150s_linear_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(212,175,55,0.06)_0%,_transparent_60%)]" />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-50" />
      <style>{`@keyframes stardustMove{from{background-position:0 0}to{background-position:1000px 1000px}}@keyframes siddhiSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes glowBreathe{0%,100%{opacity:.3}50%{opacity:.8}}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes scanPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:1}}.profile-card{animation:fadeUp .6s ease both}.profile-card:nth-child(2){animation-delay:.1s}.profile-card:nth-child(3){animation-delay:.2s}.profile-card:nth-child(4){animation-delay:.3s}.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

      <div className="relative z-10 max-w-[680px] mx-auto px-4 py-8 pb-24">
        <ProfileHeader userName={userName} profile={profile} balance={balanceNum} streakDays={shcProfile?.streak_days ?? 0} badgeCount={badges.filter((b) => b.earned).length} onEditProfile={() => setProfileEditOpen(true)} />
        <ProfileSriYantra />
        <MembershipTiers />
        <SoulVaultSection scannerOpen={scannerOpen} scanPhase={scanPhase} scanValue={scanValue} selectedPractice={selectedPractice} practiceDuration={practiceDuration} onStartScanner={handleStartScanner} onCloseScanner={handleCloseScanner} onSelectPractice={setSelectedPractice} onPracticeDurationChange={setPracticeDuration} onGenerateReport={handleGenerateSoulReport} />
        <VedicSiddhis badges={badges} isAndligCompleted={isAndligCompleted} />
        <AkashicRecord />
        <ProfileLifeBook groupedLifeBook={groupedLifeBook} lifeBookLoading={lifeBookLoading} soulVaultEntries={soulVaultEntries} soulVaultLoading={soulVaultLoading} />
        <ProfileCertificates certificates={certificates} onDownload={downloadCertificate} onShare={shareCertificate} />
        <AbundanceSection onNotificationsOpen={() => setNotificationsOpen(true)} onAppearanceOpen={() => setAppearanceOpen(true)} onPrivacyOpen={() => setPrivacyOpen(true)} onSettingsOpen={() => setSettingsOpen(true)} onProfileEditOpen={() => setProfileEditOpen(true)} abundanceLineage={abundanceLineage} theCovenant={theCovenant} onSignOut={handleSignOut} />

        <div className="mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t('profile.language')}</h2>
          <LanguageSelector />
        </div>
      </div>

      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
