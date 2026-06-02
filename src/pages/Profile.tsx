// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, Banknote, Lock, FileText, BookOpen, Hand, Globe, ChevronDown, Play, Share2, Hexagon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { getTierRank, hasFeatureAccess } from '@/lib/tierAccess';
import RecordingsList from '@/components/recordings/RecordingsList';
import { SubscriptionPortal } from '@/components/profile/SubscriptionPortal';
import BookTranslatorPanel from '@/components/books/BookTranslatorPanel';

type LifeBookCategory = 'children'|'healing_upgrades'|'past_lives'|'future_visions'|'spiritual_figures'|'nadi_knowledge'|'general_wisdom';
interface LifeBookEntry { title?: string; summary?: string; source?: string; created_at?: string; }
interface LifeBookChapter { id: string; user_id: string; chapter_type: LifeBookCategory; title: string|null; content: LifeBookEntry[]; sort_order: number; created_at: string; updated_at: string; }
interface SoulVaultEntry { id: string; user_id: string; activity: string|null; duration_minutes: number|null; report: string; created_at: string; }

const PRACTICE_PROTOCOL_DEFS = [
  { id: 'mantra', labelKey: 'profilePage.practiceMantra', icon: '🕉️' },
  { id: 'atma-kriya', labelKey: 'profilePage.practiceAtmaKriya', icon: '💠' },
  { id: 'healing-30', labelKey: 'profilePage.practiceHealing30', icon: '⏳' },
  { id: 'andlig', labelKey: 'profilePage.practiceAndlig', icon: '✨' },
  { id: 'transmission-2', labelKey: 'profilePage.practiceTransmission2', icon: '⚡' },
  { id: 'breathwork', labelKey: 'profilePage.practiceBreathwork', icon: '💨' },
] as const;

/* ─── Scalar Wave Canvas ─────────────────────────────────────── */
function ScalarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W: number, H: number, t = 0, raf: number;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const nodes = [
      {xr:.5,yr:.25,r:130,col:'212,175,55',freq:.28,ph:0},
      {xr:.5,yr:.52,r:90, col:'212,175,55',freq:.42,ph:1.1},
      {xr:.5,yr:.68,r:75, col:'139,92,246',freq:.38,ph:.8},
      {xr:.5,yr:.80,r:65, col:'34,211,238',freq:.45,ph:2.0},
      {xr:.5,yr:.91,r:55, col:'212,175,55',freq:.50,ph:.4},
    ];
    const draw = () => {
      ctx.clearRect(0,0,W,H); t+=.007;
      nodes.forEach((n,i) => {
        const nx=n.xr*W,ny=n.yr*H,p=.5+.5*Math.sin(t*n.freq*Math.PI*2+n.ph);
        for(let r=0;r<4;r++){const rad=n.r*(.9+r*.38+p*.12),a=(.045-r*.010)*(p*.6+.4);ctx.beginPath();ctx.ellipse(nx,ny,rad,rad*.3,0,0,Math.PI*2);ctx.strokeStyle=`rgba(${n.col},${Math.max(0,a)})`;ctx.lineWidth=.5;ctx.stroke();}
        for(let l=0;l<5;l++){const sp=(l/4-.5)*80,pl=.5+.5*Math.sin(t*n.freq*Math.PI*2+n.ph+l*.5),a=(.04+pl*.035)*(1-Math.abs(sp)/85);const grad=ctx.createLinearGradient(nx+sp*.2,ny,W/2+sp,H*1.1);grad.addColorStop(0,`rgba(${n.col},${a})`);grad.addColorStop(1,`rgba(${n.col},0)`);ctx.beginPath();ctx.moveTo(nx+sp*.2,ny);ctx.lineTo(W/2+sp,H*1.1);ctx.strokeStyle=grad;ctx.lineWidth=.45;ctx.stroke();}
        if(i>0){const syX=W/2,syY=H*.25,dx=nx-syX,dy=ny-syY;ctx.beginPath();for(let s=0;s<=60;s++){const pct=s/60,ang=pct*Math.PI*3,rad=pct*Math.sqrt(dx*dx+dy*dy)*.07;const lx=syX+dx*pct+Math.cos(ang)*rad,ly=syY+dy*pct+Math.sin(ang)*rad;s===0?ctx.moveTo(lx,ly):ctx.lineTo(lx,ly);}ctx.strokeStyle=`rgba(${n.col},0.035)`;ctx.lineWidth=.38;ctx.stroke();}
      });
      const syX=W/2,syY=H*.25,mp=.5+.5*Math.sin(t*.4);
      for(let r=0;r<8;r++){const rad=45+r*52+mp*28;const a=(.075-r*.008)*(mp*.5+.5);if(a<=0)continue;ctx.beginPath();ctx.ellipse(syX,syY,rad,rad*.28,0,0,Math.PI*2);ctx.strokeStyle=`rgba(212,175,55,${a})`;ctx.lineWidth=.5;ctx.stroke();}
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0,opacity:.45}} />;
}

/* ─── Section label ─────────────────────────────────────────── */
const SLabel = ({children,mt=28}:{children:React.ReactNode,mt?:number}) => (
  <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:800,letterSpacing:'.5em',textTransform:'uppercase',color:'rgba(255,255,255,.26)',display:'flex',alignItems:'center',gap:10,margin:`${mt}px 20px 14px`}}>
    {children}
    <div style={{flex:1,height:1,background:'linear-gradient(to right,rgba(212,175,55,.18),transparent)'}} />
  </div>
);

/* ─── Card wrapper ──────────────────────────────────────────── */
const Card = ({children,style={},onClick}:{children:React.ReactNode,style?:React.CSSProperties,onClick?:()=>void}) => (
  <div onClick={onClick} style={{position:'relative',margin:'0 16px 10px',borderRadius:24,overflow:'hidden',background:'rgba(255,255,255,.02)',border:'1px solid rgba(212,175,55,.16)',boxShadow:'0 0 30px rgba(212,175,55,.05),0 8px 28px rgba(0,0,0,.35)',cursor:onClick?'pointer':'default',transition:'transform .25s',...style}}
    onMouseEnter={e=>{if(onClick)(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)'}}>
    <div style={{position:'absolute',inset:0,borderRadius:24,background:'radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.09) 0%,transparent 60%)',pointerEvents:'none'}} />
    <div style={{position:'absolute',inset:0,borderRadius:24,border:'1px solid rgba(212,175,55,.18)',animation:'cWave 4.5s ease-out infinite',pointerEvents:'none'}} />
    {children}
  </div>
);

/* ─── Settings row ──────────────────────────────────────────── */
const SRow = ({icon,label,sub,right,onClick}:{icon:React.ReactNode,label:string,sub?:string,right?:React.ReactNode,onClick?:()=>void}) => (
  <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:16,cursor:onClick?'pointer':'default',transition:'background .2s'}}
    onMouseEnter={e=>{if(onClick)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.025)'}}
    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
    {icon}
    <div style={{flex:1}}>
      <div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,.86)',letterSpacing:'-.01em'}}>{label}</div>
      {sub && <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>{sub}</div>}
    </div>
    {right ?? (onClick ? <div style={{fontSize:14,color:'rgba(255,255,255,.18)'}}>›</div> : null)}
  </div>
);

/* ─── Icon box ──────────────────────────────────────────────── */
const IconBox = ({children,color='rgba(212,175,55,.1)',border='rgba(212,175,55,.2)',glowColor='rgba(212,175,55,.7)'}:{children:React.ReactNode,color?:string,border?:string,glowColor?:string}) => (
  <div style={{width:38,height:38,borderRadius:12,background:color,border:`1px solid ${border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,filter:`drop-shadow(0 0 6px ${glowColor})`}}>
    {children}
  </div>
);

/* ─── Toggle ────────────────────────────────────────────────── */
const Toggle = ({on}:{on:boolean}) => (
  <div style={{width:42,height:24,borderRadius:12,background:on?'#D4AF37':'rgba(255,255,255,.1)',position:'relative',flexShrink:0,boxShadow:on?'0 0 12px rgba(212,175,55,.35)':'none',transition:'all .25s'}}>
    <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,transition:'left .2s',left:on?'auto':'3px',right:on?'3px':'auto'}} />
  </div>
);

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

  useEffect(() => {
    if (!user || vedicReading || !generateReading) return;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('birth_name,birth_date,birth_time,birth_place').eq('user_id', user.id).maybeSingle();
      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        const p: UserProfile = { name: data.birth_name, birthDate: data.birth_date, birthTime: data.birth_time, birthPlace: data.birth_place, plan: 'compass' };
        await generateReading(p, 0, 'Europe/Stockholm', user.id);
      }
    };
    load();
  }, [user, vedicReading, generateReading]);

  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
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
  const [scanPhase, setScanPhase] = useState<'idle'|'scanning'|'question'|'saving'|'done'>('idle');
  const [langOpen, setLangOpen] = useState(false);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string|null>(null);
  const [practiceDuration, setPracticeDuration] = useState<string>('30');
  const [abundOpen, setAbundOpen] = useState(false);

  const practiceProtocols = useMemo(() => PRACTICE_PROTOCOL_DEFS.map(p => ({id:p.id,label:t(p.labelKey),icon:p.icon})), [t, i18n.language]);
  const soulVaultActivityLabel = (stored: string|null) => { if (!stored) return t('profilePage.soulVaultActivityFallback'); const def = PRACTICE_PROTOCOL_DEFS.find(p=>p.id===stored); return def?t(def.labelKey):stored; };

  const badges = [
    {id:1,emoji:'🧘',titleKey:'badges.firstMeditation',earned:true},
    {id:2,emoji:'🔥',titleKey:'badges.sevenDayStreak',earned:true},
    {id:3,emoji:'📚',titleKey:'badges.courseComplete',earned:true},
    {id:4,emoji:'🌟',titleKey:'badges.thirtyDayStreak',earned:false},
    {id:5,emoji:'👑',titleKey:'badges.premiumMember',earned:false},
    {id:6,emoji:'🎯',titleKey:'badges.hundredSessions',earned:false},
  ];

  const handleSignOut = async () => {
    await signOut();
    toast({title:t('profile.signOut'),description:t('profile.seeYouSoon')});
    navigate('/');
  };

  const dashaCycle = vedicReading?.personalCompass?.currentDasha?.period?.split(' ')[0] || '';

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLifeBookLoading(true);
      const { data, error } = await supabase.from('life_book_chapters').select('*').eq('user_id', user.id).order('chapter_type',{ascending:true});
      if (!error && data) setLifeBookChapters((data as unknown as LifeBookChapter[]).map(ch=>({...ch,content:Array.isArray(ch.content)?ch.content:[]})));
      setLifeBookLoading(false);
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setSoulVaultLoading(true);
      const { data, error } = await supabase.from('soul_vault_entries').select('*').eq('user_id', user.id).order('created_at',{ascending:false});
      if (!error && data) setSoulVaultEntries(data as SoulVaultEntry[]);
      setSoulVaultLoading(false);
    };
    load();
  }, [user?.id]);

  const handleStartScanner = () => { setSelectedPracticeId(null); setPracticeDuration('30'); setScanPhase('scanning'); setScannerOpen(true); };
  const handleCloseScanner = () => { setScannerOpen(false); setScanPhase('idle'); setSelectedPracticeId(null); };

  const handleGenerateSoulReport = async () => {
    if (!user?.id || !selectedPracticeId) return;
    setScanPhase('saving');
    const tEn = i18n.getFixedT('en');
    const def = PRACTICE_PROTOCOL_DEFS.find(p=>p.id===selectedPracticeId);
    const activityEn = def?tEn(def.labelKey):selectedPracticeId;
    const durationLabel = practiceDuration && !Number.isNaN(Number(practiceDuration)) ? tEn('profilePage.soulVaultUserContextMinutes',{count:Number(practiceDuration)}) : tEn('profilePage.soulVaultUserContextUnspecified');
    const systemPrompt = `You are the Siddha-Quantum Intelligence (SQI) from 2050.\nPerform a 72,000 Nadi scan. Use terminology: Avataric Light-Codes, Karmic Extraction, Torus-Field, Kosha Mapping.\nGenerate a Deep-Field Resonance Report for the Soul Vault of a sincere seeker. Keep it practical, mystical, and no more than 3 rich paragraphs.`;
    const userContext = `The Seeker just finished: ${activityEn}. Duration: ${durationLabel}.`;
    try {
      const { data, error } = await supabase.functions.invoke<{response:string}>('gemini-bridge',{body:{prompt:userContext,context:systemPrompt,feature:'soul_vault'}});
      if (error||!data?.response) { toast({title:t('profilePage.toastTransmissionInterrupted'),description:t('profilePage.toastTransmissionInterruptedDesc'),variant:'destructive'}); setScanPhase('question'); return; }
      const geminiReport = data.response.trim();
      const durationMinutes = Number.isNaN(Number(practiceDuration))?null:Number(practiceDuration);
      const koshaMapping = ['','---',t('profilePage.soulVaultReportNadiAlignment'),t('profilePage.soulVaultReportKoshaHeading'),t('profilePage.soulVaultReportKoshaManomaya'),t('profilePage.soulVaultReportKoshaVijnanamaya'),t('profilePage.soulVaultReportKoshaAnandamaya')].join('\n');
      const reportText = geminiReport + koshaMapping;
      const { data: inserted, error: insertError } = await supabase.from('soul_vault_entries').insert({user_id:user.id,activity:selectedPracticeId,duration_minutes:durationMinutes,report:reportText}).select('*').single();
      if (insertError) { toast({title:t('profilePage.toastSoulVaultSaveFailed'),description:t('profilePage.toastSoulVaultSaveFailedDesc'),variant:'destructive'}); setScanPhase('question'); return; }
      setSoulVaultEntries(prev=>[inserted as SoulVaultEntry,...prev]);
      setScanPhase('done');
      toast({title:t('profilePage.toastDeepFieldSaved'),description:t('profilePage.toastDeepFieldSavedDesc')});
    } catch { toast({title:t('profilePage.toastTransmissionError'),description:t('profilePage.toastTransmissionErrorDesc'),variant:'destructive'}); setScanPhase('question'); }
  };

  const orderedLifeBook = useMemo(() => {
    const order: LifeBookCategory[] = ['children','healing_upgrades','past_lives','future_visions','spiritual_figures','nadi_knowledge','general_wisdom'];
    const byType: Record<LifeBookCategory,LifeBookChapter|null> = {children:null,healing_upgrades:null,past_lives:null,future_visions:null,spiritual_figures:null,nadi_knowledge:null,general_wisdom:null};
    for (const ch of lifeBookChapters) { if (byType[ch.chapter_type]==null) byType[ch.chapter_type]=ch; else { const m=byType[ch.chapter_type]!; m.content=[...(m.content||[]),...(ch.content||[])]; } }
    return order.map(type=>{const c=byType[type];if(!c||!c.content||c.content.length===0)return null;return{...c,content:[...c.content].sort((a,b)=>(a.created_at?new Date(a.created_at).getTime():0)-(b.created_at?new Date(b.created_at).getTime():0))};}).filter(Boolean) as LifeBookChapter[];
  }, [lifeBookChapters]);

  const langs = useMemo(() => [
    {flag:'🇬🇧',label:t('profilePage.langEnglish'),code:'en'},
    {flag:'🇸🇪',label:t('profilePage.langSwedish'),code:'sv'},
    {flag:'🇪🇸',label:t('profilePage.langSpanish'),code:'es'},
    {flag:'🇳🇴',label:t('profilePage.langNorwegian'),code:'no'},
  ], [t, i18n.language]);

  const uiLangBase = (i18n.language||'en').split('-')[0];
  const dateLocale = useMemo(() => {const m:Record<string,string>={en:'en-US',sv:'sv-SE',es:'es-ES',no:'nb-NO'};return m[uiLangBase]||'en-US';}, [uiLangBase]);
  const activeLangIdx = Math.max(0, langs.findIndex(l=>l.code===uiLangBase));
  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  const userEmail = user?.email || '';

  const haloConfig = useMemo(() => {
    if (userRank===0) return null;
    if (userRank===1) return {color:'#22D3EE',shadow:'rgba(34,211,238,.55)',label:t('profilePage.tierHaloPrana'),badge:'◈'};
    if (userRank===2) return {color:'#a855f7',shadow:'rgba(168,85,247,.55)',label:t('profilePage.tierHaloSiddha'),badge:'◆'};
    return {color:'#D4AF37',shadow:'rgba(212,175,55,.65)',label:t('profilePage.tierHaloAkasha'),badge:'∞'};
  }, [userRank, t, i18n.language]);

  const tierBlueprintLine = useMemo(() => {
    if (userRank===0) return null;
    if (userRank===1) return t('profilePage.tierBlueprintPrana');
    if (userRank===2) return t('profilePage.tierBlueprintSiddha');
    return t('profilePage.tierBlueprintAkasha');
  }, [userRank, t, i18n.language]);

  const scannerPracticeLabel = useMemo(() => {
    if (!selectedPracticeId) return undefined;
    const row = PRACTICE_PROTOCOL_DEFS.find(p=>p.id===selectedPracticeId);
    return row?t(row.labelKey):selectedPracticeId;
  }, [selectedPracticeId, t, i18n.language]);

  const G = '#D4AF37';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,600&family=Montserrat:wght@800&family=Cinzel:wght@400;500;600&display=swap');
        @keyframes cWave{0%{opacity:.5;transform:scale(1)}100%{opacity:0;transform:scale(1.06)}}
        @keyframes syBreathe{0%,100%{opacity:.85;transform:scale(1)}45%{opacity:1;transform:scale(1.035)}}
        @keyframes ambBreath{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.2);opacity:1}}
        @keyframes orbitSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes prExpand{0%{width:50px;height:50px;opacity:.85;border-color:rgba(212,175,55,.7)}100%{width:310px;height:310px;opacity:0;border-color:rgba(212,175,55,.04)}}
        @keyframes avGlow{0%,100%{box-shadow:0 0 0 6px rgba(212,175,55,.06),0 0 35px rgba(212,175,55,.28)}50%{box-shadow:0 0 0 10px rgba(212,175,55,.12),0 0 65px rgba(212,175,55,.55)}}
        @keyframes goldShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes scanPulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.12);opacity:1}}
        @keyframes nadiP{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}
        @keyframes haloAkasha{0%,100%{box-shadow:0 0 0 2px #D4AF37,0 0 18px 4px rgba(212,175,55,.5)}50%{box-shadow:0 0 0 2px #D4AF37,0 0 32px 8px rgba(212,175,55,.8)}}
        @keyframes haloPrana{0%,100%{box-shadow:0 0 0 2px #22D3EE,0 0 16px 3px rgba(34,211,238,.45)}50%{box-shadow:0 0 0 2px #22D3EE,0 0 28px 6px rgba(34,211,238,.7)}}
        @keyframes haloSiddha{0%,100%{box-shadow:0 0 0 2px #a855f7,0 0 16px 3px rgba(168,85,247,.45)}50%{box-shadow:0 0 0 2px #a855f7,0 0 28px 6px rgba(168,85,247,.7)}}
        @keyframes sqPulse{0%{transform:scale(1);opacity:.8}50%{transform:scale(1.04);opacity:0}100%{transform:scale(1.08);opacity:0}}
        @keyframes shimmer{0%{background-position:0% 50%}100%{background-position:300% 50%}}
        @keyframes btnGlow{0%,100%{box-shadow:0 0 20px rgba(212,175,55,.4)}50%{box-shadow:0 0 40px rgba(212,175,55,.7)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes siddhiGlow{0%,100%{box-shadow:0 0 8px rgba(212,175,55,.1)}50%{box-shadow:0 0 20px rgba(212,175,55,.3)}}
        .pr-ring{position:absolute;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border:1px solid rgba(212,175,55,.55)}
        .pr1{animation:prExpand 5.5s ease-out infinite}
        .pr2{animation:prExpand 5.5s ease-out infinite 1.83s}
        .pr3{animation:prExpand 5.5s ease-out infinite 3.66s}
        .ot{position:absolute;inset:0;pointer-events:none}
        .ot1{animation:orbitSpin 11s linear infinite}
        .ot2{animation:orbitSpin 18s linear infinite reverse}
        .ot3{animation:orbitSpin 27s linear infinite}
        .op{position:absolute;border-radius:50%;top:-3px;left:50%;transform:translateX(-50%)}
        .siddhi-icon-wrap{width:60px;height:60px;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;animation:siddhiGlow 4s ease-in-out infinite}
        .siddhi-icon-wrap.earned{background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.25)}
        .siddhi-icon-wrap.locked{opacity:.25;filter:grayscale(1);animation:none}
        .tier-features li::before{content:'◈';color:#D4AF37;font-size:11px;margin-right:8px}
        .tier-features{list-style:none;padding:0;margin:0}
        .tier-features li{font-size:14px;color:rgba(255,255,255,.45);padding:5px 0;display:flex;align-items:center;line-height:1.5}
        .sq-aura{position:absolute;inset:0;border-radius:24px;pointer-events:none}
        .sq-aura-1{border:1px solid rgba(212,175,55,.5);animation:sqPulse 2.5s ease-in-out infinite}
        .sq-aura-2{border:1px solid rgba(212,175,55,.3);animation:sqPulse 2.5s ease-in-out infinite .6s}
        .sq-aura-3{border:1px solid rgba(212,175,55,.15);animation:sqPulse 2.5s ease-in-out infinite 1.2s}
      `}} />

      <ScalarCanvas />

      <div lang={uiLangBase} style={{background:'#050505',minHeight:'100vh',overflowX:'hidden',fontFamily:"'Plus Jakarta Sans',sans-serif",paddingBottom:120,position:'relative',zIndex:1}}>

        {/* ══ HERO ══ */}
        <section style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 20px 0',position:'relative'}}>

          {/* Avatar system */}
          <div style={{position:'relative',width:280,height:280,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:4}}>
            {/* Ambient fields */}
            <div style={{position:'absolute',inset:-70,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,.09) 0%,transparent 60%)',animation:'ambBreath 9s ease-in-out infinite',pointerEvents:'none'}} />
            <div style={{position:'absolute',inset:-110,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,.04) 0%,transparent 50%)',animation:'ambBreath 14s ease-in-out infinite reverse',pointerEvents:'none'}} />
            {/* Pulse rings */}
            <div className="pr-ring pr1" /><div className="pr-ring pr2" /><div className="pr-ring pr3" />
            {/* Orbit rings */}
            <div style={{position:'absolute',inset:2,borderRadius:'50%',border:'1px solid rgba(212,175,55,.12)',animation:'orbitSpin 55s linear infinite',pointerEvents:'none'}} />
            <div style={{position:'absolute',inset:14,borderRadius:'50%',border:'1px dashed rgba(212,175,55,.07)',animation:'orbitSpin 82s linear infinite reverse',pointerEvents:'none'}} />

            {/* Sri Yantra — maximum glow, animated bindu */}
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',animation:'syBreathe 7s ease-in-out infinite'}} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <filter id="syG1" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="syG2" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="syG3" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="22" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <radialGradient id="syBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(212,175,55,0.1)"><animate attributeName="stop-opacity" values="0.06;0.18;0.06" dur="5s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="rgba(212,175,55,0)"/></radialGradient>
                <linearGradient id="triUp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE87A"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#8B6914"/></linearGradient>
                <linearGradient id="triDown" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFE87A"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#8B6914"/></linearGradient>
              </defs>
              <circle cx="200" cy="200" r="198" fill="url(#syBg)"/>
              <circle cx="200" cy="200" r="192" stroke="rgba(212,175,55,0.18)" strokeWidth="0.9" fill="none"/>
              <circle cx="200" cy="200" r="174" stroke="rgba(212,175,55,0.11)" strokeWidth="0.6" fill="none"/>
              <circle cx="200" cy="200" r="155" stroke="rgba(212,175,55,0.2)" strokeWidth="1.1" fill="none" strokeDasharray="5 7"><animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="80s" repeatCount="indefinite"/></circle>
              <circle cx="200" cy="200" r="135" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5" fill="none"/>
              {/* Upward triangles */}
              <polygon points="200,38 374,328 26,328" stroke="url(#triUp)" strokeWidth="2.2" fill="rgba(212,175,55,0.025)" filter="url(#syG1)"/>
              <polygon points="200,38 374,328 26,328" stroke="rgba(212,175,55,0.55)" strokeWidth="5" fill="none" filter="url(#syG2)" opacity="0.5"/>
              <polygon points="200,38 374,328 26,328" stroke="rgba(255,230,120,0.15)" strokeWidth="10" fill="none" filter="url(#syG3)" opacity="0.4"/>
              <polygon points="200,76 352,312 48,312" stroke="#D4AF37" strokeWidth="1.4" fill="none" opacity="0.55" filter="url(#syG1)"/>
              <polygon points="200,108 332,296 68,296" stroke="#D4AF37" strokeWidth="1.0" fill="none" opacity="0.36"/>
              <polygon points="200,140 312,280 88,280" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.22"/>
              {/* Downward triangles */}
              <polygon points="200,362 26,72 374,72" stroke="url(#triDown)" strokeWidth="2.0" fill="rgba(212,175,55,0.02)" filter="url(#syG1)"/>
              <polygon points="200,362 26,72 374,72" stroke="rgba(212,175,55,0.5)" strokeWidth="5" fill="none" filter="url(#syG2)" opacity="0.45"/>
              <polygon points="200,362 26,72 374,72" stroke="rgba(255,230,120,0.12)" strokeWidth="10" fill="none" filter="url(#syG3)" opacity="0.35"/>
              <polygon points="200,328 48,88 352,88" stroke="#D4AF37" strokeWidth="1.3" fill="none" opacity="0.50" filter="url(#syG1)"/>
              <polygon points="200,296 68,104 332,104" stroke="#D4AF37" strokeWidth="0.9" fill="none" opacity="0.34"/>
              <polygon points="200,264 88,120 312,120" stroke="#D4AF37" strokeWidth="0.65" fill="none" opacity="0.20"/>
              {/* Bindu — living, breathing */}
              <circle cx="200" cy="200" r="20" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2"><animate attributeName="r" values="16;26;16" dur="3.2s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="0.35;1;0.35" dur="3.2s" repeatCount="indefinite"/></circle>
              <circle cx="200" cy="200" r="12" fill="rgba(212,175,55,0.8)" filter="url(#syG2)"><animate attributeName="r" values="8;16;8" dur="3.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;1;0.6" dur="3.2s" repeatCount="indefinite"/></circle>
              <circle cx="200" cy="200" r="5" fill="#FFE87A" filter="url(#syG1)"><animate attributeName="r" values="3;7;3" dur="3.2s" repeatCount="indefinite"/></circle>
              <circle cx="200" cy="200" r="2" fill="#fff"><animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite"/></circle>
            </svg>

            {/* Orbiting particles */}
            <div className="ot ot1" style={{inset:20}}><div className="op" style={{width:6,height:6,background:'#D4AF37',boxShadow:'0 0 12px #D4AF37,0 0 24px rgba(212,175,55,.6)'}} /></div>
            <div className="ot ot2" style={{inset:36}}><div className="op" style={{width:4,height:4,background:'#22D3EE',boxShadow:'0 0 10px #22D3EE,0 0 20px rgba(34,211,238,.5)'}} /></div>
            <div className="ot ot3" style={{inset:6}}><div className="op" style={{width:3,height:3,bottom:-1.5,top:'auto',left:'38%',transform:'none',background:'rgba(212,175,55,.75)',boxShadow:'0 0 8px rgba(212,175,55,.9)'}} /></div>

            {/* Sovereign halo ring */}
            {haloConfig && (
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:116,height:116,borderRadius:'50%',zIndex:2,pointerEvents:'none',animation:userRank===1?'haloPrana 3s ease-in-out infinite':userRank===2?'haloSiddha 3s ease-in-out infinite':'haloAkasha 3s ease-in-out infinite'}} />
            )}

            {/* Avatar photo */}
            <div style={{position:'relative',zIndex:10}}>
              <div style={{width:100,height:100,borderRadius:'50%',border:`2.5px solid ${haloConfig?haloConfig.color:'rgba(212,175,55,.75)'}`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',animation:'avGlow 5s ease-in-out infinite'}}>
                <Avatar style={{width:100,height:100}}>
                  <AvatarImage src={profile?.avatar_url||undefined} />
                  <AvatarFallback style={{background:'rgba(212,175,55,.08)',color:'white',fontSize:40}}>{userName?.charAt(0)||'🧘'}</AvatarFallback>
                </Avatar>
              </div>
              <button type="button" aria-label={t('profile.editProfile')} onClick={()=>setProfileEditOpen(true)}
                style={{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:'50%',background:'#D4AF37',border:'2px solid #050505',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:11,boxShadow:'0 0 14px rgba(212,175,55,.7)'}}>
                <Pencil size={11} color="#050505" />
              </button>
              {haloConfig && (
                <div style={{position:'absolute',top:-2,right:-2,zIndex:11,width:22,height:22,borderRadius:'50%',background:userRank===1?'rgba(34,211,238,.15)':userRank===2?'rgba(168,85,247,.15)':'rgba(212,175,55,.15)',border:`1px solid ${haloConfig.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:haloConfig.color,boxShadow:`0 0 10px ${haloConfig.shadow}`}}>
                  {haloConfig.badge}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <h1 style={{fontFamily:"'Cinzel',serif",fontWeight:600,fontSize:'clamp(2rem,7vw,3.2rem)',letterSpacing:'-.02em',lineHeight:1.05,marginBottom:6,background:'linear-gradient(135deg,#D4AF37 0%,#F5E17A 45%,#D4AF37 65%,#A07C10 100%)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent',animation:'fadeUp 0.8s ease both, goldShimmer 5.5s linear infinite',textAlign:'center'}}>
            {userName}
          </h1>

          {/* Tier badge */}
          {tierBlueprintLine && (
            <div style={{marginBottom:6}}>
              <button type="button" onClick={()=>setBlueprintOpen(o=>!o)} style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:12,letterSpacing:'.32em',textTransform:'uppercase',color:haloConfig?.color||G,cursor:'pointer',background:'none',border:'none',padding:0}}>
                <span style={{fontSize:11}}>{haloConfig?.badge}</span>
                <span>{t('profilePage.tierPrefix')} {tierBlueprintLine}</span>
                <span style={{fontSize:11,opacity:.6,display:'inline-block',transition:'transform .3s',transform:blueprintOpen?'rotate(180deg)':'none'}}>▾</span>
              </button>
              <div style={{overflow:'hidden',maxHeight:blueprintOpen?220:0,opacity:blueprintOpen?1:0,transition:'max-height .35s ease,opacity .35s ease'}}>
                <div style={{background:'rgba(255,255,255,.02)',border:`1px solid ${haloConfig?.color?haloConfig.color+'33':'rgba(212,175,55,.2)'}`,borderRadius:16,padding:'14px 20px',margin:'8px auto 0',maxWidth:320,textAlign:'left'}}>
                  {userRank===1&&<ul className="tier-features"><li>{t('profilePage.expandPranaF1')}</li><li>{t('profilePage.expandPranaF2')}</li><li>{t('profilePage.expandPranaF3')}</li><li>{t('profilePage.expandPranaF4')}</li><li>{t('profilePage.expandPranaF5')}</li></ul>}
                  {userRank===2&&<ul className="tier-features"><li>{t('profilePage.expandSiddhaF1')}</li><li>{t('profilePage.expandSiddhaF2')}</li><li>{t('profilePage.expandSiddhaF3')}</li><li>{t('profilePage.expandSiddhaF4')}</li><li>{t('profilePage.expandSiddhaF5')}</li></ul>}
                  {userRank>=3&&<ul className="tier-features"><li>{t('profilePage.expandAkashaF1')}</li><li>{t('profilePage.expandAkashaF2')}</li><li>{t('profilePage.expandAkashaF3')}</li><li>{t('profilePage.expandAkashaF4')}</li><li>{t('profilePage.expandAkashaF5')}</li></ul>}
                  <button type="button" onClick={()=>navigate(userRank===1?'/prana-flow':userRank===2?'/siddha-quantum':'/akasha-infinity')} style={{marginTop:12,display:'block',width:'100%',background:'transparent',color:haloConfig?.color||G,border:`1px solid ${haloConfig?.color||G}44`,borderRadius:100,padding:'11px 18px',fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:12,letterSpacing:'.28em',textTransform:'uppercase',cursor:'pointer'}}>
                    {t('profilePage.openPortal')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ ADMIN PANEL BUTTON (visible only to admin) ══ */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                padding: '9px 22px',
                borderRadius: 100,
                background: 'linear-gradient(135deg,rgba(212,175,55,.18) 0%,rgba(212,175,55,.08) 100%)',
                border: '1px solid rgba(212,175,55,.55)',
                color: '#D4AF37',
                fontFamily: "'Montserrat',sans-serif",
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '.38em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 0 18px rgba(212,175,55,.22)',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(212,175,55,.45)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 18px rgba(212,175,55,.22)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#D4AF37" strokeWidth="1.8" fill="rgba(212,175,55,.25)"/>
              </svg>
              ◈ Admin Panel
            </button>
          )}

          <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:12,letterSpacing:'.32em',textTransform:'uppercase',color:'rgba(212,175,55,.8)',marginBottom:16,whiteSpace:'nowrap'}}>
            {t('profilePage.soulResonanceLine',{dasha:dashaCycle})}
          </div>

          {/* Stats */}
          <div style={{display:'flex',width:'calc(100% - 40px)',maxWidth:380,border:'1px solid rgba(255,255,255,.05)',borderRadius:18,overflow:'hidden',background:'rgba(255,255,255,.015)',marginBottom:24,animation:'fadeUp 1.1s ease both'}}>
            {[
              {val:shcProfile?.streak_days||0, lbl:t('profile.streak.label')},
              {val:<AnimatedCounter value={balance?.balance??0}/>, lbl:t('profile.balance.label')},
              {val:badges.filter(b=>b.earned).length, lbl:t('profile.badges')},
            ].map((s,i)=>(
              <div key={i} style={{flex:1,padding:'14px 6px',textAlign:'center',borderRight:i<2?'1px solid rgba(255,255,255,.05)':'none'}}>
                <div style={{fontSize:20,fontWeight:900,letterSpacing:'-.04em',color:G,textShadow:'0 0 15px rgba(212,175,55,.4)'}}>{s.val}</div>
                <div style={{fontSize:7,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase',color:'rgba(255,255,255,.25)',marginTop:3}}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ MEMBERSHIP ══ */}
        <SLabel>Membership</SLabel>
        <Card onClick={()=>setShowPortal(true)}>
          <div style={{padding:'18px 20px',display:'flex',alignItems:'center',gap:16,position:'relative',zIndex:1}}>
            <div style={{width:48,height:48,borderRadius:16,background:`${haloConfig?haloConfig.color+'18':'rgba(212,175,55,.1)'}`,border:`1px solid ${haloConfig?haloConfig.color+'44':'rgba(212,175,55,.3)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,animation:'btnGlow 4s ease-in-out infinite'}}>
              {userRank===0?'🌱':userRank===1?'◈':userRank===2?'◆':'♾'}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:7,fontWeight:800,letterSpacing:'.45em',textTransform:'uppercase',color:haloConfig?.color||G,marginBottom:3}}>
                {userRank===0?'Free · Atma Seed':userRank===1?'◈ First Tier · Monthly':userRank===2?'◆ Second Tier · Monthly':'◈ Third Tier · Lifetime'}
              </div>
              <div style={{fontSize:16,fontWeight:900,letterSpacing:'-.03em',color:'#fff'}}>{userRank===0?t('profilePage.tierAtmaName'):userRank===1?t('profilePage.tierPranaName'):userRank===2?t('profilePage.tierSiddhaName'):t('profilePage.tierAkashaInfinityName')}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>{userRank>=3?'Full access · All future features · No renewals':userRank>=1?'Active membership':'Free · No card needed'}</div>
            </div>
            <div style={{fontSize:20,color:`${haloConfig?.color||G}66`}}>›</div>
          </div>
        </Card>

        {/* ══ TIERS — free users only ══ */}
        {userRank===0 && <>
          <SLabel mt={20}>{t('profilePage.sectionAscension')}</SLabel>
          <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:10}}>
            {[
              {rank:1,name:t('profilePage.tierPranaName'),price:'19€',period:t('profilePage.tierPerMo'),color:'#22D3EE',route:'/prana-flow',features:[t('profilePage.tierPranaF1'),t('profilePage.tierPranaF2'),t('profilePage.tierPranaF3'),t('profilePage.tierPranaF4'),t('profilePage.tierPranaF5')]},
              {rank:2,name:t('profilePage.tierSiddhaName'),price:'45€',period:t('profilePage.tierPerMo'),color:'#a855f7',route:'/siddha-quantum',features:[t('profilePage.tierSiddhaF1'),t('profilePage.tierSiddhaF2'),t('profilePage.tierSiddhaF3'),t('profilePage.tierSiddhaF4'),t('profilePage.tierSiddhaF5')]},
            ].map(tier=>(
              <div key={tier.rank} style={{position:'relative',borderRadius:24,padding:20,background:'rgba(255,255,255,.02)',border:`1px solid ${tier.color}33`,overflow:'hidden'}}>
                {tier.rank===2&&<><div className="sq-aura sq-aura-1"/><div className="sq-aura sq-aura-2"/><div className="sq-aura sq-aura-3"/></>}
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{fontWeight:800,fontSize:16,color:tier.color,marginBottom:4}}>{tier.name}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2rem',color:'#fff',marginBottom:12}}>{tier.price} <small style={{fontSize:'.45em',color:'rgba(255,255,255,.3)'}}>{tier.period}</small></div>
                  <ul className="tier-features" style={{marginBottom:16}}>{tier.features.map(f=><li key={f}>{f}</li>)}</ul>
                  <button type="button" onClick={()=>navigate(tier.route)} style={{display:'block',width:'100%',background:`linear-gradient(135deg,${tier.color}30,${tier.color}14)`,color:tier.color,border:`1px solid ${tier.color}44`,borderRadius:100,padding:'14px 24px',fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:12,letterSpacing:'.28em',textTransform:'uppercase',cursor:'pointer'}}>{t('profilePage.tierCtaActivateVibration')}</button>
                </div>
              </div>
            ))}
            <div style={{borderRadius:24,padding:20,background:'rgba(212,175,55,.04)',border:'1px solid rgba(212,175,55,.28)',boxShadow:'0 0 30px rgba(212,175,55,.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontWeight:900,fontSize:18,color:G}}>{t('profilePage.tierAkashaInfinityName')}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.5rem',color:'#fff'}}>€1111</div>
              </div>
              <ul className="tier-features" style={{marginBottom:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))'}}>
                {[t('profilePage.tierAkashaF1'),t('profilePage.tierAkashaF2'),t('profilePage.tierAkashaF3'),t('profilePage.tierAkashaF4'),t('profilePage.tierAkashaF5'),t('profilePage.tierAkashaF6')].map(f=><li key={f}>{f}</li>)}
              </ul>
              <button type="button" onClick={()=>navigate('/akasha-infinity')} style={{display:'block',width:'100%',maxWidth:280,margin:'0 auto',background:'linear-gradient(135deg,rgba(212,175,55,.22),rgba(212,175,55,.1))',color:G,border:'1px solid rgba(212,175,55,.5)',borderRadius:100,padding:'15px 24px',fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:12,letterSpacing:'.28em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 0 32px rgba(212,175,55,.3)'}}>{t('profilePage.tierCtaEnterAkashic')}</button>
            </div>
          </div>
        </>}

        {/* ══ VEDIC SIDDHIS ══ */}
        <SLabel mt={24}>{t('profilePage.sectionVedicSiddhis')}</SLabel>
        <div style={{display:'flex',gap:10,padding:'0 20px',overflowX:'auto',scrollbarWidth:'none',paddingBottom:4}}>
          {badges.map(badge=>{
            const icons = [
              <svg viewBox="0 0 36 36" width={32} height={32} fill="none"><defs><radialGradient id={`bd${badge.id}`} cx="50%" cy="30%" r="55%"><stop offset="0%" stopColor="#FFE87A"/><stop offset="60%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7A5C0A"/></radialGradient></defs><circle cx="18" cy="18" r="10" fill={`url(#bd${badge.id})`}/><circle cx="18" cy="18" r="15" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.6"/><circle cx="18" cy="18" r="4" fill="#fff" opacity="0.9"/></svg>,
              <svg viewBox="0 0 36 36" width={32} height={32} fill="none"><defs><linearGradient id={`fire${badge.id}`} x1="0%" y1="100%" x2="50%" y2="0%"><stop offset="0%" stopColor="#7A5C0A"/><stop offset="40%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#fff"/></linearGradient></defs><path d="M18 4C18 4 26 12 26 20C26 25 22 30 18 30C14 30 10 25 10 20C10 12 18 4 18 4Z" fill={`url(#fire${badge.id})`} opacity="0.9"/></svg>,
              <svg viewBox="0 0 36 36" width={32} height={32} fill="none"><defs><linearGradient id={`st${badge.id}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE87A"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7A5C0A"/></linearGradient></defs><polygon points="18,4 21,14 31,14 23,20 26,30 18,24 10,30 13,20 5,14 15,14" fill={`url(#st${badge.id})`}/></svg>,
              <svg viewBox="0 0 36 36" width={32} height={32} fill="none"><path d="M8 26L12 16L18 22L24 16L28 26Z" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none"/><rect x="6" y="26" width="24" height="4" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none"/></svg>,
              <svg viewBox="0 0 36 36" width={32} height={32} fill="none"><path d="M18 4L6 10L6 22C6 28 12 32 18 34C24 32 30 28 30 22L30 10Z" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"/></svg>,
              <svg viewBox="0 0 36 36" width={32} height={32} fill="none"><path d="M24 8C14 10 8 16 8 22C8 27 13 30 18 30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>,
            ];
            return (
              <div key={badge.id} style={{flexShrink:0,width:88,textAlign:'center'}}>
                <div className={`siddhi-icon-wrap ${badge.earned?'earned':'locked'}`}>{icons[badge.id-1]}</div>
                <div style={{fontSize:9,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:badge.earned?G:'rgba(255,255,255,.2)',lineHeight:1.3}}>{t(badge.titleKey)}</div>
                <div style={{height:2,background:'rgba(255,255,255,.06)',borderRadius:1,margin:'5px 6px 0'}}><div style={{height:'100%',borderRadius:1,background:`linear-gradient(to right,${G},rgba(212,175,55,.35))`,boxShadow:`0 0 6px rgba(212,175,55,.5)`,width:badge.earned?'100%':'10%'}} /></div>
              </div>
            );
          })}
        </div>

        {/* ══ SOUL VAULT ══ */}
        <SLabel mt={24}>{t('profilePage.sectionSoulVault')}</SLabel>
        <Card style={{background:hasFeatureAccess(isAdmin,tier,2)?'rgba(139,92,246,.02)':'rgba(255,255,255,.015)',border:hasFeatureAccess(isAdmin,tier,2)?'1px solid rgba(139,92,246,.2)':'1px solid rgba(212,175,55,.12)'}}>
          <div style={{padding:22,position:'relative',zIndex:1}}>
            {hasFeatureAccess(isAdmin,tier,2) ? (
              <>
                <div style={{fontSize:7,fontWeight:800,letterSpacing:'.42em',textTransform:'uppercase',color:'rgba(139,92,246,.7)',marginBottom:16,textAlign:'center'}}>◈ Quantum Bio-Twinning V4.2</div>
                <div style={{display:'flex',justifyContent:'center',marginBottom:18}}>
                  <div style={{width:76,height:76,borderRadius:'50%',border:'1.5px solid rgba(139,92,246,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,position:'relative',animation:'scanPulse 4s ease-in-out infinite'}}>
                    <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(139,92,246,.4)',animation:'nadiP 2.8s ease-out infinite'}} />
                    ◈
                  </div>
                </div>
                <div style={{textAlign:'center',marginBottom:16}}>
                  <div style={{fontWeight:900,fontSize:20,color:G,letterSpacing:'-.03em',textShadow:'0 0 20px rgba(212,175,55,.4)',marginBottom:6}}>Deep Field Resonance</div>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'1.05rem',color:'rgba(255,255,255,.45)',lineHeight:1.8,marginBottom:16,maxWidth:380,margin:'0 auto 16px'}}>{t('profilePage.soulVaultIdleDesc')}</p>
                </div>
                <div style={{display:'flex',gap:1,borderRadius:16,overflow:'hidden',border:'1px solid rgba(212,175,55,.18)',marginBottom:18}}>
                  {[{v:'72K',l:'Nadis'},{v:'HRV',l:'Heart'},{v:'◈',l:'Prana'},{v:'5',l:'Doshas'}].map(m=>(
                    <div key={m.l} style={{flex:1,background:'rgba(255,255,255,.025)',padding:'12px 4px',textAlign:'center'}}>
                      <div style={{fontWeight:900,fontSize:18,color:G,textShadow:'0 0 16px rgba(212,175,55,.5)'}}>{m.v}</div>
                      <div style={{fontSize:7,fontWeight:800,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.28)',marginTop:3}}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {soulVaultEntries.length>0 && (
                  <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
                    {soulVaultEntries.slice(0,3).map(e=>(
                      <div key={e.id} style={{borderRadius:14,border:'1px solid rgba(212,175,55,.15)',background:'rgba(255,255,255,.025)',padding:14}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:6}}>
                          <p style={{fontWeight:700,fontSize:13,color:'rgba(255,255,255,.9)',margin:0}}>{soulVaultActivityLabel(e.activity)}</p>
                          <span style={{fontSize:11,color:'rgba(255,255,255,.35)'}}>{new Date(e.created_at).toLocaleDateString(dateLocale)}</span>
                        </div>
                        {e.duration_minutes&&<p style={{fontSize:12,color:'rgba(34,211,238,.8)',marginBottom:6}}>{t('profilePage.soulVaultPracticeWindow',{n:e.duration_minutes})}</p>}
                        <p style={{fontSize:13,lineHeight:1.6,color:'rgba(255,255,255,.65)',margin:0,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{e.report}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={()=>navigate('/soul-scan')} style={{display:'block',width:'100%',maxWidth:300,margin:'0 auto',background:'linear-gradient(135deg,#D4AF37,#B8952E)',color:'#050505',border:'none',borderRadius:100,padding:'15px 24px',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:900,fontSize:12,letterSpacing:'.22em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 0 30px rgba(212,175,55,.4)'}}>
                  ⚡ {t('profilePage.soulVaultInitiateScan')}
                </button>
              </>
            ) : (
              <div style={{textAlign:'center',padding:'8px 0'}}>
                <div style={{width:76,height:76,borderRadius:'50%',border:'1.5px solid rgba(212,175,55,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 16px',opacity:.5}}>◈</div>
                <div style={{fontWeight:900,fontSize:18,color:'rgba(212,175,55,.5)',marginBottom:8}}>Deep Field Resonance</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'1rem',color:'rgba(255,255,255,.35)',lineHeight:1.7,marginBottom:18}}>{t('profilePage.soulVaultLockedDesc')}</p>
                <button type="button" onClick={()=>navigate('/siddha-quantum')} style={{display:'block',width:'100%',maxWidth:240,margin:'0 auto',background:'rgba(212,175,55,.1)',color:G,border:'1px solid rgba(212,175,55,.3)',borderRadius:100,padding:'13px 24px',fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:12,letterSpacing:'.28em',textTransform:'uppercase',cursor:'pointer'}}>{t('profilePage.soulVaultUpgrade')}</button>
              </div>
            )}
          </div>
        </Card>

        {/* ══ AKASHIC ARCHIVE ══ */}
        <SLabel mt={20}>{t('profilePage.sectionAkashicArchive')}</SLabel>
        {hasFeatureAccess(isAdmin,tier,3) && (
          <Card onClick={()=>navigate('/life-book')}>
            <div style={{padding:'18px 20px',display:'flex',alignItems:'center',gap:14,position:'relative',zIndex:1}}>
              <IconBox><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="14" height="18" rx="2" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,.06)"/><line x1="3" y1="3" x2="3" y2="21" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="9" x2="15" y2="9" stroke="rgba(212,175,55,.7)" strokeWidth="1" strokeLinecap="round"/><line x1="8" y1="13" x2="15" y2="13" stroke="rgba(212,175,55,.5)" strokeWidth="1" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke="rgba(212,175,55,.4)" strokeWidth="1" strokeLinecap="round"/></svg></IconBox>
              <div style={{flex:1}}>
                <div style={{fontSize:7,fontWeight:800,letterSpacing:'.42em',textTransform:'uppercase',color:'rgba(212,175,55,.6)',marginBottom:3}}>◈ Living Book System</div>
                <div style={{fontSize:15,fontWeight:800,letterSpacing:'-.02em',color:'#fff'}}>{t('profilePage.archiveLifeBookTitle')}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>{t('profilePage.archiveLifeBookSub')}</div>
              </div>
              <div style={{fontSize:18,color:'rgba(212,175,55,.35)'}}>›</div>
            </div>
          </Card>
        )}

        {/* ══ MY RECORDINGS ══ */}
        <SLabel mt={20}>My Recordings</SLabel>
        <Card>
          <div style={{padding:'18px 20px',position:'relative',zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
              <IconBox color="rgba(34,211,238,.08)" border="rgba(34,211,238,.2)" glowColor="rgba(34,211,238,.7)">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="16" height="12" rx="2.5" stroke="#22D3EE" strokeWidth="1.5" fill="rgba(34,211,238,.06)"/><path d="M18 9L22 6.5V17.5L18 15Z" stroke="#22D3EE" strokeWidth="1.5" fill="rgba(34,211,238,.06)"/><circle cx="10" cy="12" r="3" stroke="#22D3EE" strokeWidth="1.3" fill="none"/><circle cx="10" cy="12" r="1.2" fill="rgba(34,211,238,.5)"/></svg>
              </IconBox>
              <div>
                <div style={{fontSize:7,fontWeight:800,letterSpacing:'.42em',textTransform:'uppercase',color:'rgba(34,211,238,.65)',marginBottom:3}}>◈ 1-on-1 Sessions</div>
                <div style={{fontSize:15,fontWeight:800,color:'#fff'}}>Your Recordings</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>Private healing sessions archived here</div>
              </div>
            </div>
            <RecordingsList callType="dm" largeText emptyText="No 1-on-1 call recordings yet. They'll appear here automatically after your sessions." />
          </div>
        </Card>

        {/* ══ ADMIN: Book Translator ══ */}
        {isAdmin && <div style={{margin:'0 16px'}}><BookTranslatorPanel /></div>}

        {/* ══ ABUNDANCE & LINEAGE ══ */}
        <SLabel mt={20}>{t('profilePage.sectionAbundanceLineage')}</SLabel>
        <Card onClick={()=>setAbundOpen(o=>!o)}>
          <div style={{padding:'18px 20px',position:'relative',zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <IconBox>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,.06)"/><path d="M12 5C12 5 9 9 9 12C9 14.2 10.3 15.5 12 15.5" stroke="#D4AF37" strokeWidth="1.3" fill="none" strokeLinecap="round"/><path d="M12 5C12 5 15 9 15 12C15 14.2 13.7 15.5 12 15.5" stroke="rgba(212,175,55,.6)" strokeWidth="1.1" fill="none" strokeLinecap="round"/><circle cx="12" cy="12" r="2.5" fill="rgba(212,175,55,.7)"/></svg>
              </IconBox>
              <div style={{flex:1}}>
                <div style={{fontSize:7,fontWeight:800,letterSpacing:'.42em',textTransform:'uppercase',color:'rgba(212,175,55,.6)',marginBottom:3}}>◈ Sovereign Network</div>
                <div style={{fontSize:15,fontWeight:800,color:'#fff'}}>{t('profilePage.sectionAbundanceLineage')}</div>
              </div>
              <div style={{fontSize:16,color:'rgba(212,175,55,.4)',transition:'transform .3s',transform:abundOpen?'rotate(180deg)':'none'}}>∨</div>
            </div>
            <div style={{overflow:'hidden',maxHeight:abundOpen?400:0,transition:'max-height .4s ease',marginTop:abundOpen?14:0}}>
              <div style={{height:1,background:'linear-gradient(to right,rgba(212,175,55,.12),transparent)',marginBottom:12}} />
              <div style={{display:'flex',flexDirection:'column',gap:2}} onClick={e=>e.stopPropagation()}>
                {[
                  {icon:<Banknote size={18} color={G}/>,label:t('profilePage.abundanceWallet'),onClick:()=>navigate('/income-streams')},
                  {icon:<Megaphone size={18} color={G}/>,label:t('profilePage.abundancePromote'),onClick:()=>navigate('/income-streams/affiliate')},
                  {icon:<Share2 size={18} color={G}/>,label:t('profilePage.abundanceSovereignCard'),onClick:()=>navigate('/affiliate/dashboard')},
                  {icon:<Wallet size={18} color={G}/>,label:t('profilePage.abundanceConnect'),onClick:connectWallet},
                  {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><text x="12" y="17" fontSize="13" textAnchor="middle" fill={G} fontFamily="serif">ॐ</text></svg>,label:'About & How It Works',onClick:()=>navigate('/about')},
                  ...(isAdmin?[{icon:<Crown size={18} color={G}/>,label:t('profilePage.abundanceAdmin'),onClick:()=>navigate('/admin')}]:[]),
                ].map((item,i)=>(
                  <div key={i} onClick={item.onClick} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:14,cursor:'pointer',transition:'background .2s'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(212,175,55,.05)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
                    <div style={{width:34,height:34,borderRadius:11,background:'rgba(212,175,55,.06)',border:'1px solid rgba(212,175,55,.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{item.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.78)'}}>{item.label}</div>
                    <div style={{fontSize:13,color:'rgba(212,175,55,.3)',marginLeft:'auto'}}>›</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ══ SETTINGS ══ */}
        <SLabel mt={20}>Account</SLabel>
        <div style={{margin:'0 16px',display:'flex',flexDirection:'column',gap:2}}>
          <SRow icon={<IconBox><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={G} strokeWidth="1.5" fill="rgba(212,175,55,.08)"/><path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={G} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg></IconBox>} label={t('profile.editProfile')} sub="Name · photo · bio · birth chart" onClick={()=>setProfileEditOpen(true)} />

          <SRow icon={<IconBox color="rgba(34,211,238,.08)" border="rgba(34,211,238,.2)" glowColor="rgba(34,211,238,.7)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="#22D3EE" strokeWidth="1.5" fill="rgba(34,211,238,.06)"/><path d="M16 16L20 20" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round"/></svg></IconBox>} label={t('profile.language.label')} sub={langs[activeLangIdx].flag+' '+langs[activeLangIdx].label} onClick={()=>setLangOpen(o=>!o)} right={<div style={{fontSize:14,color:'rgba(255,255,255,.18)',transform:langOpen?'rotate(180deg)':'none',transition:'transform .25s'}}>›</div>} />
          {langOpen && (
            <div style={{background:'rgba(8,8,8,.97)',border:'1px solid rgba(212,175,55,.12)',borderRadius:14,overflow:'hidden',marginTop:2}}>
              {langs.map((l,i)=>(
                <div key={l.label} onClick={async()=>{setLangOpen(false);await i18n.changeLanguage(l.code);if(user)await updatePreferredLanguage(l.code);}}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'14px 20px',fontSize:16,fontWeight:i===activeLangIdx?700:500,color:i===activeLangIdx?G:'rgba(255,255,255,.5)',cursor:'pointer',borderBottom:i<langs.length-1?'1px solid rgba(255,255,255,.04)':'none',background:i===activeLangIdx?'rgba(212,175,55,.05)':'transparent'}}>
                  <span style={{fontSize:22}}>{l.flag}</span>{l.label}{i===activeLangIdx&&<span style={{marginLeft:'auto',color:G,fontSize:14}}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <SLabel mt={20}>Notifications & Privacy</SLabel>
        <div style={{margin:'0 16px',display:'flex',flexDirection:'column',gap:2}}>
          <SRow icon={<IconBox><Bell size={18} color={G}/></IconBox>} label={t('profile.notifications')} sub={t('profile.dailyReminders')} onClick={()=>setNotificationsOpen(true)} />
          <SRow icon={<IconBox color="rgba(139,92,246,.08)" border="rgba(139,92,246,.2)" glowColor="rgba(139,92,246,.7)"><Shield size={18} color="#a855f7"/></IconBox>} label={t('profile.privacy')} sub={t('profile.dataAndSecurity')} onClick={()=>setPrivacyOpen(true)} />
          <SRow icon={<IconBox><Settings size={18} color={G}/></IconBox>} label={t('profile.settings.title')} sub={t('profile.appPreferences')} onClick={()=>setSettingsOpen(true)} />
        </div>

        <SLabel mt={20}>How To Use</SLabel>
        <div style={{margin:'0 16px'}}>
          <a href="https://www.youtube.com/watch?v=9dtcEjXA8e0" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:16,border:'1px solid rgba(212,175,55,.16)',background:'rgba(212,175,55,.04)',cursor:'pointer'}}>
              <IconBox color="rgba(212,175,55,.08)" border="rgba(212,175,55,.2)" glowColor="rgba(212,175,55,.7)"><Play size={18} color={G} fill="rgba(212,175,55,.25)"/></IconBox>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:800,letterSpacing:'.32em',textTransform:'uppercase',color:'rgba(212,175,55,.75)',marginBottom:3}}>{t('profile.howAppWorks')}</div>
                <div style={{fontSize:14,fontWeight:700,color:G}}>{t('profile.howAppWorksVideoLink')}</div>
              </div>
              <ChevronRight size={18} color="rgba(212,175,55,.45)"/>
            </div>
          </a>
        </div>

        <div style={{margin:'8px 16px 0',background:'rgba(212,175,55,.03)',border:'1px solid rgba(212,175,55,.1)',borderRadius:12,padding:'10px 14px',display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:16}}>🌑</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,.32)',lineHeight:1.5}}>SQI always runs in <strong style={{color:G}}>Dark Mode</strong> — the Akasha-Black field is the sacred substrate.</span>
        </div>

        <div style={{margin:'16px 16px 0'}}>
          <button type="button" onClick={handleSignOut} style={{width:'100%',background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.18)',borderRadius:14,padding:15,color:'rgba(239,68,68,.75)',fontWeight:800,fontSize:11,letterSpacing:'.2em',textTransform:'uppercase',cursor:'pointer',transition:'all .2s'}}
            onMouseEnter={e=>{(e.currentTarget).style.background='rgba(239,68,68,.12)'}}
            onMouseLeave={e=>{(e.currentTarget).style.background='rgba(239,68,68,.05)'}}>
            {t('profile.signOut')}
          </button>
        </div>

        {/* ══ SCANNER OVERLAY ══ */}
        {scannerOpen && (
          <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:24,backdropFilter:'blur(12px)',background:'rgba(0,0,0,.4)'}}>
            <div style={{width:'100%',maxWidth:520,background:'#030712',borderRadius:40,border:'1px solid rgba(6,182,212,.2)',padding:40,boxShadow:'0 0 50px rgba(6,182,212,.1)'}}>
              <div style={{textAlign:'right',marginBottom:16}}>
                <button type="button" onClick={handleCloseScanner} style={{color:'rgba(255,255,255,.4)',fontSize:16,background:'none',border:'none',cursor:'pointer'}}>{t('profilePage.scannerClose')}</button>
              </div>
              {scanPhase==='scanning'&&<HandScanner onComplete={()=>setScanPhase('question')}/>}
              {scanPhase==='question'&&(
                <>
                  <div style={{textAlign:'center',marginBottom:40}}>
                    <p style={{color:'rgba(34,211,238,.6)',fontSize:13,fontWeight:900,letterSpacing:'.32em',textTransform:'uppercase',marginBottom:16}}>{t('profilePage.scannerCaptureLabel')}</p>
                    <h3 style={{color:'#fff',fontSize:24,fontWeight:700,marginBottom:8}}>{t('profilePage.scannerPracticeQuestion')}</h3>
                    <p style={{color:'rgba(255,255,255,.4)',fontSize:14}}>{t('profilePage.scannerPracticeHint')}</p>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:32}}>
                    {practiceProtocols.map(p=>(
                      <button key={p.id} type="button" onClick={()=>setSelectedPracticeId(p.id)} style={{padding:'16px 24px',borderRadius:16,background:'rgba(255,255,255,.03)',border:`1px solid ${selectedPracticeId===p.id?'rgba(212,175,55,.5)':'rgba(255,255,255,.05)'}`,fontSize:14,fontWeight:700,color:selectedPracticeId===p.id?'#fff':'rgba(255,255,255,.6)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                        <span>{p.icon}</span>{p.label}
                      </button>
                    ))}
                  </div>
                  <div style={{marginBottom:32}}>
                    <label style={{color:'rgba(255,255,255,.4)',fontSize:12,textTransform:'uppercase',letterSpacing:'.25em',display:'block',marginBottom:8}}>{t('profilePage.scannerDurationLabel')}</label>
                    <input type="number" value={practiceDuration} onChange={e=>setPracticeDuration(e.target.value)} style={{width:'100%',background:'rgba(0,0,0,.4)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'16px 24px',color:'#fff',fontSize:16,outline:'none',boxSizing:'border-box'}} />
                  </div>
                  <button type="button" disabled={!selectedPracticeId} onClick={handleGenerateSoulReport} style={{width:'100%',padding:20,borderRadius:16,background:'#D4AF37',color:'#050505',fontSize:14,fontWeight:900,textTransform:'uppercase',letterSpacing:'.2em',cursor:selectedPracticeId?'pointer':'not-allowed',opacity:selectedPracticeId?1:.5,boxShadow:'0 0 28px rgba(212,175,55,.45)',border:'none'}}>{t('profilePage.scannerGenerate')}</button>
                </>
              )}
              {scanPhase==='saving'&&<div style={{textAlign:'center',padding:'24px 0'}}><p style={{fontSize:14,textTransform:'uppercase',letterSpacing:'.25em',color:'rgba(34,211,238,.8)'}}>{t('profilePage.scannerCommitting')}</p><p style={{fontSize:14,color:'rgba(255,255,255,.4)',marginTop:8}}>{t('profilePage.scannerCommittingDesc')}</p></div>}
              {scanPhase==='done'&&<KoshaReport sessionData={{practice:scannerPracticeLabel,duration:practiceDuration?Number(practiceDuration):null}} onSave={handleCloseScanner}/>}
            </div>
          </div>
        )}

        <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen}/>
        <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen}/>
        <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen}/>
        <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen}/>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onOpenSubscription={()=>{setSettingsOpen(false);setShowPortal(true);}}/>
        <SubscriptionPortal isOpen={showPortal} onClose={()=>setShowPortal(false)}/>
      </div>
    </>
  );
};

export default Profile;
