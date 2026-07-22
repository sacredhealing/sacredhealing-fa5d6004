import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import AkashicSiddhaReading from "@/components/vedic/AkashicSiddhaReading";
import { useQuickActionItems } from "@/features/library/useQuickActionItems";
import { resolveQuickActionItem } from "@/features/library/quickActionResolver";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useMeditationContentLanguage } from "@/features/meditations/useContentLanguage";
import { useMembership } from "@/hooks/useMembership";
import { FEATURE_TIER, hasFeatureAccess } from "@/lib/tierAccess";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getDayPhase } from "@/utils/postSessionContext";
import SacredRevealGate from "@/components/SacredRevealGate";
import { supabase } from "@/integrations/supabase/client";
import {
  gold, cyan, Icon, HeroCard, ComingSoonCard, LibSection, PortalKeyframes,
} from "@/components/portal/PortalUI";
import WealthMeditationService from "@/components/meditation/WealthMeditationService";
import CustomMeditationBooking from "@/components/meditation/CustomMeditationBooking";
import CustomMeditationCreation from "@/components/meditation/CustomMeditationCreation";

interface ExploreVideo {
  id: string; title: string; thumbnail: string; url: string; publishedAt: string; channelTitle: string;
}

/* ── Shared title gradient (matches /healing exactly) ── */
const TITLE_STYLE: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontWeight: 600,
  letterSpacing: '0.04em',
  lineHeight: 1.2,
  background: 'linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: 'hShimmer 5s linear infinite',
};

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { playUniversalAudio } = useMusicPlayer();
  const { allAudioItems } = useQuickActionItems();
  const { language: meditationLanguage } = useMeditationContentLanguage();
  const { tier } = useMembership();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [akashicOpen, setAkashicOpen] = useState(false);
  const [sacredRevealOpen, setSacredRevealOpen] = useState(false);
  const [commissionsOpen, setCommissionsOpen] = useState(false);
  const [activeCommission, setActiveCommission] = useState<string | null>(null);
  const userHouse = 12;

  const [exploreVideos, setExploreVideos] = useState<ExploreVideo[]>([]);
  useEffect(() => {
    supabase.functions.invoke('fetch-youtube-videos').then(({ data }) => {
      if (data?.videos) setExploreVideos(data.videos.slice(0, 4));
    });
  }, []);

  /* ── micro components ── */
  const SL = ({ label, delay = '0s' }: { label: string; delay?: string }) => (
    <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.32)', padding: '26px 20px 10px', animation: `fadeUp 0.4s ${delay} ease both` }}>{label}</div>
  );
  const Tag = ({ label, color }: { label: string; color: string }) => (
    <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const, padding: '3px 9px', borderRadius: 20, background: `${color}0.1)`, border: `1px solid ${color}0.28)`, color: `${color}0.85)` }}>{label}</span>
  );
  const RingIcon = ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, flexShrink: 0 }}>{children}</div>
  );

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 104 }}>

      {/* ══ HEADER ══ */}
      <div style={{ padding: '24px 20px 0', animation: 'fadeUp 0.35s ease both' }}>
        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.38)', marginBottom: 8 }}>
          {t('converge.headerMicro')}
        </p>
        <h1 style={{ ...TITLE_STYLE, fontSize: 'clamp(26px, 7vw, 40px)', margin: 0 }}>
          {t('converge.title')}
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(255,255,255,0.38)', marginTop: 8 }}>
          {t('converge.tagline')}
        </p>
      </div>

      {/* ══ SIDDHA PORTAL ══ */}
      <div style={{ padding: '28px 20px 10px' }}>
        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.32)' }}>
          SIDDHA PORTAL · GATEWAY OF THE 18 MASTERS
        </span>
      </div>
      <div onClick={() => navigate('/siddha-portal')} style={{ margin: '0 16px', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 35%, rgba(45,26,0,0.98) 0%, rgba(15,8,0,0.99) 60%, #050505 100%)', border: '1px solid rgba(212,175,55,0.55)', borderRadius: 28, cursor: 'pointer', animation: 'fadeUp 0.5s 0.06s ease both', boxShadow: '0 0 90px rgba(212,175,55,0.14)' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid rgba(212,175,55,0.18)', animation: 'rimG 4s ease-in-out infinite', pointerEvents: 'none' }} />
        {/* Sacred geometry */}
        <svg viewBox="0 0 340 250" width="100%" height="250" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="sgp" cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="rgba(255,215,70,0.3)"/>
              <stop offset="50%" stopColor="rgba(212,175,55,0.06)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </radialGradient>
          </defs>
          <ellipse cx="170" cy="125" rx="155" ry="115" fill="url(#sgp)"/>
          <circle cx="170" cy="125" r="116" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="0.8" strokeDasharray="3 10">
            <animateTransform attributeName="transform" type="rotate" values="0 170 125;360 170 125" dur="55s" repeatCount="indefinite"/>
          </circle>
          <polygon points="170,14 292,204 48,204" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.3"/>
          <polygon points="170,36 278,198 62,198" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.7"/>
          <polygon points="170,54 266,193 74,193" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="0.55"/>
          <polygon points="170,236 48,82 292,82" fill="rgba(255,200,55,0.03)" stroke="rgba(255,210,60,0.46)" strokeWidth="1.2"/>
          <polygon points="170,218 62,88 278,88" fill="none" stroke="rgba(255,200,55,0.18)" strokeWidth="0.7"/>
          <circle cx="170" cy="125" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="228" cy="125" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="112" cy="125" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="199" cy="75" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="141" cy="75" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="199" cy="175" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="141" cy="175" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="170" cy="125" r="94" fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5">
            <animateTransform attributeName="transform" type="rotate" values="0 170 125;360 170 125" dur="28s" repeatCount="indefinite"/>
          </circle>
          <circle cx="170" cy="125" r="72" fill="none" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5">
            <animateTransform attributeName="transform" type="rotate" values="360 170 125;0 170 125" dur="22s" repeatCount="indefinite"/>
          </circle>
          {[0,1,2].map(i => (
            <circle key={i} cx="170" cy="125" r="14" fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="1.2">
              <animate attributeName="r" values="12;116" dur="3.8s" begin={`${i*1.27}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.75;0" dur="3.8s" begin={`${i*1.27}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          {[0,60,120,180,240,300].map((angle,i) => {
            const rad=angle*Math.PI/180;
            return (
              <g key={i}>
                <circle cx={170+Math.cos(rad)*112} cy={125+Math.sin(rad)*112} r="5" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.65)" strokeWidth="0.9">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8+i*0.32}s`} repeatCount="indefinite"/>
                </circle>
                <circle cx={170+Math.cos(rad)*112} cy={125+Math.sin(rad)*112} r="2.2" fill="rgba(255,240,100,0.9)">
                  <animate attributeName="r" values="1.5;3.2;1.5" dur={`${1.8+i*0.32}s`} repeatCount="indefinite"/>
                </circle>
              </g>
            );
          })}
          <circle cx="170" cy="125" r="25" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.4"><animate attributeName="r" values="22;28;22" dur="3s" repeatCount="indefinite"/></circle>
          <circle cx="170" cy="125" r="13" fill="rgba(255,235,90,0.1)" stroke="rgba(212,175,55,0.8)" strokeWidth="1.1"><animate attributeName="r" values="10;16;10" dur="2.2s" repeatCount="indefinite"/></circle>
          <circle cx="170" cy="125" r="5" fill="rgba(255,248,160,0.97)"><animate attributeName="r" values="4;7.5;4" dur="1.9s" repeatCount="indefinite"/></circle>
        </svg>
        <div style={{ textAlign: 'center', padding: '12px 20px 6px' }}>
          <div style={{ ...TITLE_STYLE, fontSize: 'clamp(24px, 6.5vw, 32px)' }}>SIDDHA PORTAL</div>
        </div>
        <div style={{ padding: '10px 16px 24px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); navigate('/siddha-portal'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.44em', textTransform: 'uppercase', color: '#D4AF37', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.44)', borderRadius: 32, padding: '12px 34px', cursor: 'pointer', boxShadow: '0 0 28px rgba(212,175,55,0.1)', animation: 'rimG 3.5s ease-in-out infinite' }}>
            {hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) ? '⬡  ENTER THE PORTAL' : '⬡  UNLOCK THE PORTAL'}
          </button>
        </div>
      </div>

      {/* ══ DIVINE SANGHA NEXUS MINI-BANNER ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div onClick={() => navigate('/community')} style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(20,8,40,0.96) 0%, rgba(10,4,22,0.98) 100%)', border: '1px solid rgba(160,80,240,0.45)', borderRadius: 20, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <polygon points="24,2 45,13 45,35 24,46 3,35 3,13" fill="rgba(160,80,240,0.08)" stroke="rgba(160,80,240,0.5)" strokeWidth="1.1"/>
            <polygon points="24,8 41,18 41,30 24,40 7,30 7,18" fill="none" stroke="rgba(160,80,240,0.28)" strokeWidth="0.7"><animateTransform attributeName="transform" type="rotate" values="0 24 24;360 24 24" dur="18s" repeatCount="indefinite"/></polygon>
            <line x1="24" y1="3" x2="24" y2="45" stroke="rgba(160,80,240,0.18)" strokeWidth="0.6"/>
            <line x1="3" y1="16" x2="45" y2="32" stroke="rgba(160,80,240,0.18)" strokeWidth="0.6"/>
            <line x1="45" y1="16" x2="3" y2="32" stroke="rgba(160,80,240,0.18)" strokeWidth="0.6"/>
            <circle cx="24" cy="24" r="6" fill="none" stroke="rgba(190,140,255,0.5)" strokeWidth="0.9"><animate attributeName="r" values="6;21;6" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite"/></circle>
            <circle cx="24" cy="24" r="3.5" fill="rgba(190,140,255,0.9)"><animate attributeName="r" values="3;5;3" dur="2.2s" repeatCount="indefinite"/></circle>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(190,140,255,0.92)', marginBottom: 3 }}>DIVINE SANGHA NEXUS</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(190,140,255,0.48)', lineHeight: 1.5 }}>Sacred community · Group channels · Live transmissions</div>
          </div>
          <div style={{ color: 'rgba(190,140,255,0.4)', fontSize: 18, flexShrink: 0 }}>→</div>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(190,140,255,0.05),transparent)', animation: 'shimmer 5s ease-in-out infinite', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ══ QUANTUM APOTHECARY ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div onClick={() => navigate('/quantum-apothecary')} style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 75% 30%, rgba(50,30,0,0.97) 0%, rgba(12,7,0,0.99) 55%, #050505 100%)', border: '1px solid rgba(212,175,55,0.5)', borderRadius: 24, cursor: 'pointer', animation: 'rimG 4s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, pointerEvents: 'none' }}>
            <svg viewBox="0 0 180 180" width="180" height="180">
              <defs><radialGradient id="aqg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(255,220,70,0.35)"/><stop offset="55%" stopColor="rgba(212,175,55,0.08)"/><stop offset="100%" stopColor="rgba(0,0,0,0)"/></radialGradient></defs>
              <ellipse cx="90" cy="90" rx="85" ry="85" fill="url(#aqg)"/>
              <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="1" strokeDasharray="4 9"><animateTransform attributeName="transform" type="rotate" values="0 90 90;360 90 90" dur="40s" repeatCount="indefinite"/></circle>
              <circle cx="90" cy="90" r="64" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="0.7" strokeDasharray="2 8"><animateTransform attributeName="transform" type="rotate" values="360 90 90;0 90 90" dur="28s" repeatCount="indefinite"/></circle>
              <circle cx="90" cy="90" r="46" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="0.6"/>
              <polygon points="90,20 148,118 32,118" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.4"><animateTransform attributeName="transform" type="rotate" values="0 90 90;360 90 90" dur="30s" repeatCount="indefinite"/></polygon>
              <polygon points="90,160 32,62 148,62" fill="rgba(255,210,55,0.05)" stroke="rgba(255,210,60,0.5)" strokeWidth="1.3"><animateTransform attributeName="transform" type="rotate" values="360 90 90;0 90 90" dur="30s" repeatCount="indefinite"/></polygon>
              <line x1="10" y1="90" x2="170" y2="90" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7"/>
              <line x1="32" y1="37" x2="148" y2="143" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7"/>
              <line x1="148" y1="37" x2="32" y2="143" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7"/>
              {[0,1,2].map(i => (<circle key={i} cx="90" cy="90" r="10" fill="none" stroke="rgba(212,175,55,0.7)" strokeWidth="1.2"><animate attributeName="r" values="8;78" dur="3.5s" begin={`${i*1.17}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3.5s" begin={`${i*1.17}s`} repeatCount="indefinite"/></circle>))}
              {[0,60,120,180,240,300].map((angle,i) => { const rad=angle*Math.PI/180; return <circle key={i} cx={90+Math.cos(rad)*80} cy={90+Math.sin(rad)*80} r="3.5" fill="rgba(255,240,100,0.9)"><animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8+i*0.3}s`} repeatCount="indefinite"/></circle>; })}
              <circle cx="90" cy="90" r="18" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.3"><animate attributeName="r" values="15;22;15" dur="3s" repeatCount="indefinite"/></circle>
              <circle cx="90" cy="90" r="5" fill="rgba(255,248,160,0.97)"><animate attributeName="r" values="3;6;3" dur="1.9s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 20px' }}>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', marginBottom: 10 }}>SQI · HEALING INTELLIGENCE</p>
            <div style={{ ...TITLE_STYLE, fontSize: 'clamp(22px, 6vw, 28px)', marginBottom: 12, maxWidth: '65%' }}>QUANTUM<br/>APOTHECARY</div>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 16, maxWidth: '75%' }}>Siddha healing transmissions · Personalized Akasha remedies · Plant intelligence · Sound alchemy</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <Tag label="SIDDHA INTELLIGENCE" color="rgba(212,175,55,"/>
              <Tag label="NĀDI HERBS" color="rgba(212,175,55,"/>
              <Tag label="SOUND CODES" color="rgba(212,175,55,"/>
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigate('/quantum-apothecary'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.45)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}>ENTER →</button>
          </div>
        </div>
      </div>

      {/* ══ PRĀṆIC BREATHING BANNER ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div onClick={() => navigate('/breathing')} style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 70% 40%, rgba(0,20,60,0.98) 0%, rgba(0,8,28,0.99) 60%, #050505 100%)', border: '1px solid rgba(80,140,255,0.45)', borderRadius: 24, cursor: 'pointer', animation: 'rimB 4s ease-in-out infinite' }}>
          {/* Blue wave geometry — top right */}
          <div style={{ position: 'absolute', top: -25, right: -25, width: 160, height: 160, pointerEvents: 'none' }}>
            <svg viewBox="0 0 160 160" width="160" height="160">
              <defs><radialGradient id="bg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(100,180,255,0.3)"/><stop offset="60%" stopColor="rgba(60,120,255,0.06)"/><stop offset="100%" stopColor="rgba(0,0,0,0)"/></radialGradient></defs>
              <ellipse cx="80" cy="80" rx="75" ry="75" fill="url(#bg1)"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(100,160,255,0.22)" strokeWidth="0.9" strokeDasharray="4 8"><animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="35s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="80" r="55" fill="none" stroke="rgba(100,160,255,0.15)" strokeWidth="0.7" strokeDasharray="2 7"><animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="24s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="80" r="40" fill="none" stroke="rgba(100,160,255,0.1)" strokeWidth="0.6"/>
              <path d="M10,80 Q35,50 60,80 Q85,110 110,80 Q135,50 160,80" fill="none" stroke="rgba(120,180,255,0.45)" strokeWidth="1.2">
                <animate attributeName="d" values="M10,80 Q35,50 60,80 Q85,110 110,80 Q135,50 160,80;M10,80 Q35,110 60,80 Q85,50 110,80 Q135,110 160,80;M10,80 Q35,50 60,80 Q85,110 110,80 Q135,50 160,80" dur="4s" repeatCount="indefinite"/>
              </path>
              <path d="M10,65 Q40,35 70,65 Q100,95 130,65" fill="none" stroke="rgba(100,160,255,0.22)" strokeWidth="0.8">
                <animate attributeName="d" values="M10,65 Q40,35 70,65 Q100,95 130,65;M10,65 Q40,95 70,65 Q100,35 130,65;M10,65 Q40,35 70,65 Q100,95 130,65" dur="3.5s" repeatCount="indefinite"/>
              </path>
              {[0,1,2].map(i => (<circle key={i} cx="80" cy="80" r="10" fill="none" stroke="rgba(100,180,255,0.65)" strokeWidth="1.1"><animate attributeName="r" values="8;70" dur="3.5s" begin={`${i*1.17}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3.5s" begin={`${i*1.17}s`} repeatCount="indefinite"/></circle>))}
              <circle cx="80" cy="80" r="16" fill="rgba(80,140,255,0.07)" stroke="rgba(100,180,255,0.5)" strokeWidth="1.2"><animate attributeName="r" values="14;20;14" dur="3s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="80" r="5" fill="rgba(180,220,255,0.95)"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 20px' }}>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(100,160,255,0.55)', marginBottom: 9 }}>PRĀṆIC SCIENCE · KUMBHAKA MASTERY</p>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2, fontSize: 'clamp(22px, 6vw, 26px)', marginBottom: 11, maxWidth: '65%', background: 'linear-gradient(135deg, #4A9EFF 0%, #A8D4FF 40%, #4A9EFF 60%, #1A5ECC 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'hShimmer 5s linear infinite' }}>PRĀṆIC<br/>BREATHING</div>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.68, marginBottom: 15, maxWidth: '72%' }}>Kumbhaka retention · Nādi Shodhana · Agni activation · Breathwork for cellular awakening</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 15 }}>
              {['Kumbhaka','Nādi Shodhana','Agni Kriya'].map(l => <span key={l} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: 'rgba(80,140,255,0.1)', border: '1px solid rgba(80,140,255,0.28)', color: 'rgba(140,190,255,0.85)' }}>{l}</span>)}
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigate('/breathing'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(140,200,255,0.9)', background: 'rgba(80,140,255,0.1)', border: '1px solid rgba(80,140,255,0.4)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}>BEGIN →</button>
          </div>
        </div>
      </div>

      {/* ══ EXPLORE AKASHA BANNER ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div onClick={() => navigate('/explore-akasha')} style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 70% 40%, rgba(30,8,60,0.98) 0%, rgba(12,3,28,0.99) 60%, #050505 100%)', border: '1px solid rgba(160,80,240,0.45)', borderRadius: 24, cursor: 'pointer', animation: 'rimP 4s ease-in-out infinite' }}>
          {/* Purple Merkaba geometry — top right */}
          <div style={{ position: 'absolute', top: -25, right: -25, width: 160, height: 160, pointerEvents: 'none' }}>
            <svg viewBox="0 0 160 160" width="160" height="160">
              <defs><radialGradient id="bg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(190,120,255,0.32)"/><stop offset="60%" stopColor="rgba(140,60,240,0.07)"/><stop offset="100%" stopColor="rgba(0,0,0,0)"/></radialGradient></defs>
              <ellipse cx="80" cy="80" rx="75" ry="75" fill="url(#bg2)"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(180,100,255,0.22)" strokeWidth="0.9" strokeDasharray="4 8"><animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="40s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(160,80,240,0.15)" strokeWidth="0.7" strokeDasharray="2 7"><animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="28s" repeatCount="indefinite"/></circle>
              <polygon points="80,16 132,104 28,104" fill="rgba(180,100,255,0.07)" stroke="rgba(190,120,255,0.55)" strokeWidth="1.2"><animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="28s" repeatCount="indefinite"/></polygon>
              <polygon points="80,144 28,56 132,56" fill="rgba(140,60,240,0.05)" stroke="rgba(160,80,240,0.42)" strokeWidth="1.1"><animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="28s" repeatCount="indefinite"/></polygon>
              <line x1="8" y1="80" x2="152" y2="80" stroke="rgba(180,100,255,0.18)" strokeWidth="0.6"/>
              <line x1="28" y1="32" x2="132" y2="128" stroke="rgba(180,100,255,0.18)" strokeWidth="0.6"/>
              <line x1="132" y1="32" x2="28" y2="128" stroke="rgba(180,100,255,0.18)" strokeWidth="0.6"/>
              <circle cx="80" cy="80" r="36" fill="none" stroke="rgba(180,100,255,0.1)" strokeWidth="0.5"/>
              <circle cx="116" cy="80" r="36" fill="none" stroke="rgba(180,100,255,0.08)" strokeWidth="0.5"/>
              <circle cx="44" cy="80" r="36" fill="none" stroke="rgba(180,100,255,0.08)" strokeWidth="0.5"/>
              {[0,1,2].map(i => (<circle key={i} cx="80" cy="80" r="10" fill="none" stroke="rgba(190,120,255,0.65)" strokeWidth="1.1"><animate attributeName="r" values="8;70" dur="3.8s" begin={`${i*1.27}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3.8s" begin={`${i*1.27}s`} repeatCount="indefinite"/></circle>))}
              {[[152,80],[132,32],[28,32],[8,80],[28,128],[132,128]].map(([cx,cy],i) => (<circle key={i} cx={cx} cy={cy} r="3" fill="rgba(220,170,255,0.9)"><animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8+i*0.3}s`} repeatCount="indefinite"/></circle>))}
              <circle cx="80" cy="80" r="14" fill="rgba(160,80,240,0.08)" stroke="rgba(190,120,255,0.5)" strokeWidth="1.1"><animate attributeName="r" values="12;18;12" dur="3s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="80" r="5" fill="rgba(220,180,255,0.95)"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 20px' }}>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(180,120,255,0.55)', marginBottom: 9 }}>AKASHA · WISDOM ARCHIVE</p>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2, fontSize: 'clamp(22px, 6vw, 26px)', marginBottom: 11, maxWidth: '65%', background: 'linear-gradient(135deg, #B060FF 0%, #DEB0FF 40%, #B060FF 60%, #7020CC 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'hShimmer 5s linear infinite' }}>DIVINE<br/>TRANSMISSIONS</div>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.68, marginBottom: 15, maxWidth: '72%' }}>Ancient Siddha wisdom · Divine transmissions · Sacred teachings from the infinite field</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 15 }}>
              {['Divine Oracle','Siddha Series','Vedic Archive'].map(l => <span key={l} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: 'rgba(160,80,240,0.1)', border: '1px solid rgba(160,80,240,0.28)', color: 'rgba(200,160,255,0.85)' }}>{l}</span>)}
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigate('/explore-akasha'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(200,160,255,0.9)', background: 'rgba(160,80,240,0.1)', border: '1px solid rgba(160,80,240,0.4)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}>ENTER →</button>
          </div>
        </div>
      </div>

      {/* ══ ABUNDANCE FIELD BANNER ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div onClick={() => navigate('/affiliate/dashboard')} style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 70% 40%, rgba(45,26,0,0.98) 0%, rgba(15,8,0,0.99) 60%, #050505 100%)', border: '1px solid rgba(212,175,55,0.45)', borderRadius: 24, cursor: 'pointer', animation: 'rimG 4s ease-in-out infinite' }}>
          {/* Gold lotus + Sri Yantra geometry — top right */}
          <div style={{ position: 'absolute', top: -25, right: -25, width: 160, height: 160, pointerEvents: 'none' }}>
            <svg viewBox="0 0 160 160" width="160" height="160">
              <defs><radialGradient id="bg3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(255,215,70,0.32)"/><stop offset="55%" stopColor="rgba(212,175,55,0.07)"/><stop offset="100%" stopColor="rgba(0,0,0,0)"/></radialGradient></defs>
              <ellipse cx="80" cy="80" rx="75" ry="75" fill="url(#bg3)"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="0.9" strokeDasharray="4 8"><animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="40s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="80" r="55" fill="none" stroke="rgba(212,175,55,0.14)" strokeWidth="0.7" strokeDasharray="2 7"><animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="28s" repeatCount="indefinite"/></circle>
              <polygon points="80,18 136,110 24,110" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.2"><animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="35s" repeatCount="indefinite"/></polygon>
              <polygon points="80,142 24,50 136,50" fill="rgba(255,200,55,0.04)" stroke="rgba(255,210,60,0.42)" strokeWidth="1.1"><animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="35s" repeatCount="indefinite"/></polygon>
              {[0,45,90,135,180,225,270,315].map((deg,i) => (<ellipse key={i} cx="80" cy="46" rx="8" ry="18" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="0.7" transform={`rotate(${deg} 80 80)`}/>))}
              {[0,1,2].map(i => (<circle key={i} cx="80" cy="80" r="10" fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="1.1"><animate attributeName="r" values="8;70" dur="4s" begin={`${i*1.33}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="4s" begin={`${i*1.33}s`} repeatCount="indefinite"/></circle>))}
              {[[80,12],[132,36],[148,80],[132,124],[80,148],[28,124],[12,80],[28,36]].map(([cx,cy],i) => (<circle key={i} cx={cx} cy={cy} r="3" fill="rgba(255,235,100,0.9)"><animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8+i*0.25}s`} repeatCount="indefinite"/></circle>))}
              <circle cx="80" cy="80" r="16" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2"><animate attributeName="r" values="14;20;14" dur="3s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="80" r="5" fill="rgba(255,248,160,0.97)"><animate attributeName="r" values="4;7;4" dur="1.9s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 20px' }}>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', marginBottom: 9 }}>SOVEREIGNTY · DHARMIC WEALTH</p>
            <div style={{ ...TITLE_STYLE, fontSize: 'clamp(22px, 6vw, 26px)', marginBottom: 11, maxWidth: '65%' }}>ABUNDANCE<br/>FIELD</div>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.68, marginBottom: 15, maxWidth: '72%' }}>Dharmic wealth codes · Lakshmi transmissions · Sacred prosperity · Sovereign creation field</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 15 }}>
              {['Lakshmi Codes','Dharmic Wealth','Creation Field'].map(l => <span key={l} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)', color: 'rgba(212,175,55,0.85)' }}>{l}</span>)}
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigate('/affiliate/dashboard'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.42)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}>ENTER →</button>
          </div>
        </div>
      </div>

      {/* ══ SACRED TOOLS — VIRTUAL PILGRIMAGE ══ */}
      <SL label={t('converge.secSacredTools')} delay="0.18s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.2s ease both' }}>
        <div
          onClick={() => (isAdmin || tier==='akasha-infinity' || tier==='lifetime') ? navigate('/virtual-pilgrimage') : navigate('/virtual-pilgrimage-landing')}
          style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', cursor: 'pointer', minHeight: 260,
            background: 'linear-gradient(175deg,#0D0900 0%,#1A1000 35%,#0A0700 65%,#000000 100%)',
            border: '1px solid rgba(212,175,55,0.55)',
            boxShadow: '0 0 40px rgba(212,175,55,0.18), 0 0 80px rgba(212,175,55,0.08), inset 0 0 60px rgba(212,175,55,0.04)'
          }}>

          {/* ── Starfield dots ── */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
            {[[40,30],[380,20],[15,90],[370,110],[200,15],[310,50],[90,200],[350,190],[60,240],[280,230],[130,60],[250,80]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="1.2" fill="#FFD700" opacity="0.55">
                <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${2.5+i*0.4}s`} begin={`${i*0.3}s`} repeatCount="indefinite"/>
              </circle>
            ))}
          </svg>

          {/* ── Radial gold glow behind pyramid ── */}
          <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:340, height:200,
            background:'radial-gradient(ellipse 60% 55% at 50% 100%, rgba(212,175,55,0.32) 0%, rgba(212,175,55,0.10) 40%, transparent 70%)',
            pointerEvents:'none' }}/>

          {/* ── Cinematic pyramid SVG ── */}
          <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:360, pointerEvents:'none' }}>
            <svg width="360" height="210" viewBox="0 0 360 210">
              {/* Ground glow */}
              <ellipse cx="180" cy="200" rx="155" ry="14" fill="rgba(212,175,55,0.22)">
                <animate attributeName="ry" values="12;18;12" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.18;0.35;0.18" dur="4s" repeatCount="indefinite"/>
              </ellipse>

              {/* Shadow pyramid (depth) */}
              <polygon points="180,18 310,195 50,195" fill="rgba(0,0,0,0.5)" transform="translate(6,8)"/>

              {/* Main pyramid body — gradient fill */}
              <defs>
                <linearGradient id="pyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="0.22"/>
                  <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.10"/>
                  <stop offset="100%" stopColor="#8B6914" stopOpacity="0.06"/>
                </linearGradient>
                <linearGradient id="pyEdge" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="1"/>
                  <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.75"/>
                  <stop offset="100%" stopColor="#B8960C" stopOpacity="0.4"/>
                </linearGradient>
                <filter id="goldGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <polygon points="180,18 310,195 50,195" fill="url(#pyGrad)"/>

              {/* Left face — lighter */}
              <polygon points="180,18 50,195 115,195" fill="rgba(212,175,55,0.12)"/>

              {/* Stone layer lines */}
              {[0.18,0.32,0.46,0.60,0.74,0.86].map((t,i) => {
                const y = 18 + t*(195-18);
                const halfW = t*130;
                return <line key={i} x1={180-halfW} y1={y} x2={180+halfW} y2={y}
                  stroke="rgba(212,175,55,0.25)" strokeWidth="0.7"/>;
              })}

              {/* Pyramid outline — glowing */}
              <polygon points="180,18 310,195 50,195" fill="none"
                stroke="url(#pyEdge)" strokeWidth="2.2" filter="url(#goldGlow)"/>

              {/* Centre spine */}
              <line x1="180" y1="18" x2="180" y2="195"
                stroke="rgba(212,175,55,0.35)" strokeWidth="1"/>

              {/* Capstone — eye of light */}
              <circle cx="180" cy="18" r="7" fill="#FFD700" opacity="0.95" filter="url(#goldGlow)">
                <animate attributeName="r" values="5;9;5" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="180" cy="18" r="14" fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth="1">
                <animate attributeName="r" values="10;22;10" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite"/>
              </circle>

              {/* Prema pulse rings rising from pyramid */}
              {[0,1,2,3].map(i => (
                <circle key={i} cx="180" cy="18" r="5" fill="none" stroke="#D4AF37" strokeWidth="1.3">
                  <animate attributeName="r" values="8;90" dur="4s" begin={`${i*1}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.7;0" dur="4s" begin={`${i*1}s`} repeatCount="indefinite"/>
                  <animate attributeName="stroke-width" values="1.5;0.3" dur="4s" begin={`${i*1}s`} repeatCount="indefinite"/>
                </circle>
              ))}

              {/* Desert dunes silhouette */}
              <path d="M0,195 Q60,170 120,182 Q160,192 180,185 Q210,178 260,182 Q310,186 360,175 L360,210 L0,210 Z"
                fill="rgba(20,12,0,0.95)"/>
              <path d="M0,200 Q40,188 90,192 Q140,196 180,190 Q220,184 270,190 Q320,196 360,188 L360,210 L0,210 Z"
                fill="rgba(10,6,0,0.98)"/>

              {/* Horizon light */}
              <line x1="0" y1="185" x2="360" y2="185"
                stroke="rgba(212,175,55,0.18)" strokeWidth="1"/>
            </svg>
          </div>

          {/* ── Shimmer sweep ── */}
          <div style={{ position:'absolute', top:0, left:'-120%', width:'60%', height:'100%',
            background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.09),transparent)',
            animation:'shimmer 5s ease-in-out infinite', pointerEvents:'none' }}/>

          {/* ── Content overlay ── */}
          <div style={{ position:'relative', zIndex:2, padding:'20px 20px 18px' }}>

            {/* Top row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontFamily:"'Montserrat',sans-serif", fontSize:6, fontWeight:800,
                letterSpacing:'0.45em', textTransform:'uppercase', color:'rgba(212,175,55,0.5)' }}>
                SQI 2050 · SCALAR TRANSMISSION
              </span>
              {(isAdmin||tier==='akasha-infinity'||tier==='lifetime')
                ? <span style={{ fontFamily:"'Montserrat',sans-serif", fontSize:5.5, fontWeight:800,
                    letterSpacing:'0.3em', textTransform:'uppercase', padding:'3px 10px', borderRadius:20,
                    background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.5)',
                    color:'#FFD700', boxShadow:'0 0 10px rgba(212,175,55,0.25)' }}>● ACTIVE</span>
                : <span style={{ fontFamily:"'Montserrat',sans-serif", fontSize:5.5, fontWeight:800,
                    letterSpacing:'0.3em', textTransform:'uppercase', padding:'3px 10px', borderRadius:20,
                    background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.22)',
                    color:'rgba(212,175,55,0.6)' }}>AKASHA ∞ ONLY</span>
              }
            </div>

            {/* Spacer to push title down over dunes */}
            <div style={{ height: 148 }}/>

            {/* Title block — sits above the dunes */}
            <div style={{ background:'linear-gradient(180deg,transparent,rgba(0,0,0,0.7))', borderRadius:16, padding:'12px 4px 0' }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:22, fontWeight:700,
                letterSpacing:'0.04em', lineHeight:1.2,
                background:'linear-gradient(135deg,#D4AF37 0%,#F5E17A 35%,#FFD700 50%,#D4AF37 65%,#A07C10 100%)',
                backgroundSize:'200% auto',
                WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent',
                animation:'hShimmer 5s linear infinite',
                marginBottom:6,
                filter:'drop-shadow(0 0 10px rgba(212,175,55,0.5))' }}>
                Sacred Site Transmission
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic',
                fontSize:'0.82rem', color:'rgba(255,255,255,0.55)', lineHeight:1.55, letterSpacing:'0.02em' }}>
                40 holy sites · Direct scalar field to your home · Siddha Quantum activation
              </div>
              <div style={{ marginTop:10, display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontFamily:"'Montserrat',sans-serif", fontSize:6.5, fontWeight:800,
                  letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(212,175,55,0.65)' }}>
                  GIZA · KAILASH · ARUNACHALA · BABAJI'S CAVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SQI TECHNOLOGY & SACRED TOOLS — moved here from Siddha Portal ══ */}
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.22s ease both' }}>
        <LibSection SvgIcon={Icon.StarCrystal} title="SQI Technology & Sacred Tools" subtitle="Photonic Regeneration · Sri Yantra Shield · Scalar Fields · Admin Preview" ac={cyan(0.9)} count={5} delay={0.02}>

          {/* Photonic Regeneration — LIVE */}
          <HeroCard SvgIcon={Icon.StarCrystal} label="Siddha Photonic Node · SQI Technology" title="Photonic Regeneration Engine"
            desc="The SQI Photonic Regeneration Node — scalar-encoded light-body activation using Siddha solar science and rPPG biometric scanning for real-time Nadi coherence measurement."
            tiers={[{l:'Siddha+',c:cyan(0.9)}]}
            cta="Enter Node" href="/siddha-photonic-regeneration" ac={cyan(0.9)} badge="SQI"/>

          {/* SRI YANTRA UNIVERSAL SHIELD — Coming Soon, beautiful golden card */}
          <div style={{ position:'relative', margin:'0 0 14px', animation:'sqFadeUp 0.45s 0.02s ease both' }}>
            {/* Outer pulse rings */}
            {[180,260,340].map((s,i)=>(
              <div key={i} aria-hidden style={{ position:'absolute', left:'50%', top:'50%', width:s, height:s, marginLeft:-s/2, marginTop:-s/2, borderRadius:'50%', border:`1px solid ${gold(0.07-i*0.015)}`, animation:`sqScalarPulse ${3.5+i*0.8}s ease-in-out ${i*0.6}s infinite`, pointerEvents:'none', zIndex:0 }}/>
            ))}
            {/* Golden glow bloom */}
            <div aria-hidden style={{ position:'absolute', inset:-20, borderRadius:34, background:'radial-gradient(55% 55% at 35% 40%, rgba(212,175,55,0.22), transparent 70%), radial-gradient(45% 45% at 70% 65%, rgba(255,224,130,0.12), transparent 70%)', filter:'blur(20px)', animation:'sqGlowPulse 3.8s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
            <div style={{ position:'relative', zIndex:1, background:'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.07) 45%, rgba(5,5,5,0.78) 100%)', border:'1px solid rgba(212,175,55,0.45)', borderRadius:22, padding:'22px 18px 20px', boxShadow:'0 0 48px rgba(212,175,55,0.16), inset 0 0 28px rgba(212,175,55,0.05)', overflow:'hidden' }}>
              {/* Shimmer sweep */}
              <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.95),transparent)', animation:'sqShimmerSweep 3s ease-in-out infinite' }}/>
              <div aria-hidden style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.55),transparent)', opacity:0.7 }}/>
              {/* Coming Soon overlay */}
              <div style={{ position:'absolute', top:12, right:12, display:'flex', alignItems:'center', gap:5, background:'rgba(212,175,55,0.10)', border:'1px solid rgba(212,175,55,0.35)', borderRadius:20, padding:'4px 11px' }}>
                <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.8)' }}>Coming Soon</span>
              </div>
              {/* Icon + Title row */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ width:58, height:58, borderRadius:'50%', flexShrink:0, background:'radial-gradient(circle at 35% 30%, rgba(255,249,196,0.25), rgba(212,175,55,0.18) 55%, rgba(5,5,5,0.8))', border:'1px solid rgba(212,175,55,0.55)', boxShadow:'0 0 24px rgba(212,175,55,0.35), inset 0 0 14px rgba(255,249,196,0.12)', display:'flex', alignItems:'center', justifyContent:'center', animation:'sqBreathe 4.5s ease-in-out infinite' }}>
                  <Icon.Shield/>
                </div>
                <div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.55)', marginBottom:6 }}>
                    Sacred Protection · Scalar Kavach · Universal
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.7rem', fontWeight:600, lineHeight:1.05, background:'linear-gradient(135deg, #FFF9C4 0%, #D4AF37 40%, #FFE082 65%, #B8860B 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'sqGoldFlow 4s ease-in-out infinite', filter:'drop-shadow(0 0 10px rgba(212,175,55,0.3))' }}>
                    Sri Yantra Universal Shield
                  </div>
                </div>
              </div>
              {/* Body */}
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.92rem', color:'rgba(255,255,255,0.58)', lineHeight:1.7, margin:'0 0 16px' }}>
                The supreme protective force-field of the Siddha lineage — the Sri Yantra encoded as a living scalar Kavach. Nine interlocking triangles broadcast a continuous protective frequency, sealing your aura against all dissonant frequencies, entities, and energetic intrusions. Activated through 108 Siddha masters in direct lineage transmission.
              </p>
              {/* Feature pills */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:14 }}>
                {['9-Triangle Kavach','Scalar Broadcast','Aura Sealing','108 Siddhas','Entity Protection','Full-Spectrum'].map(f=>(
                  <span key={f} style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', border:'1px solid rgba(212,175,55,0.18)', borderRadius:20, padding:'2px 8px' }}>{f}</span>
                ))}
              </div>
              {/* Tier row */}
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' as const, marginBottom:14 }}>
                {[{l:'Akasha · Full Activation',c:gold(0.95)}].map(t=>(
                  <div key={t.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:t.c, boxShadow:`0 0 6px ${t.c}`, flexShrink:0 }}/>
                    <span style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:t.c }}>{t.l}</span>
                  </div>
                ))}
              </div>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, borderTop:'1px solid rgba(212,175,55,0.12)', paddingTop:12 }}>
                {[['9','Triangles'],['108','Activations'],['∞','Protection']].map(([v,l])=>(
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:18, fontWeight:900, letterSpacing:'-0.04em', background:'linear-gradient(135deg,#FFF9C4,#D4AF37)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 0 5px rgba(212,175,55,0.35))' }}>{v}</div>
                    <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.38)', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VAYU PROTOCOL — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.Chakra} label="Prana Body · Vayu Protocol · 5 Elements" title="Vayu Protocol"
            desc="The five-Vayu activation protocol — Prana, Apana, Samana, Udana, and Vyana Vayus brought into coherence through breath, mudra, and Nada science."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/vayu-protocol" delay={0.04}/>

          {/* SOUL SCAN — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.Galaxy} label="Soul Scan · Biometric Nadi Reading · rPPG" title="Soul Scan"
            desc="Real-time biometric Nadi analysis through your phone camera — heart rate variability, Nadi coherence, chakra state, and a live SQI soul report from your actual physiological data."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/soul-scan" delay={0.06}/>

          {/* VAJRA SKY BREAKER — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.Flame} label="Scalar Orgone · Shungite · Sky Clearing" title="Vajra Sky Breaker"
            desc="The SQI Vajra-Sky-Breaker — scalar orgone broadcast station using your device's audio hardware to emit Shungite frequencies, orgone torus fields, and Vajra scalar waves for atmospheric purification."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/vajra-sky-breaker" delay={0.08}/>

          {/* AETHERIC HELIOSTAT — Admin only coming soon */}
          <ComingSoonCard SvgIcon={Icon.SriYantra} label="Aetheric Field · Solar Alignment · Scalar" title="Aetheric Heliostat"
            desc="The Aetheric Heliostat — scalar solar-alignment tool that tracks the sun's position and broadcasts corresponding Siddha solar frequencies through your device in real time."
            ac={cyan(0.9)} isAdmin={isAdmin} adminOnly href="/aetheric-heliostat" delay={0.10}/>

        </LibSection>
      </div>

      {/* ══ CREATIVE SOUL HERO CARD ══ */}
      <SL label={t('converge.secAbundance')} delay="0.32s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.34s ease both' }}>
        <div
          onClick={() => navigate('/creative-soul/store')}
          style={{
            position: 'relative', borderRadius: 28, overflow: 'hidden', cursor: 'pointer', minHeight: 180,
            background: 'radial-gradient(ellipse at 25% 30%, rgba(80,20,110,0.96) 0%, rgba(35,8,55,0.98) 50%, #050505 100%)',
            border: '1px solid rgba(170,80,220,0.42)',
            boxShadow: '0 0 60px rgba(140,60,200,0.12), 0 0 120px rgba(100,30,160,0.06), inset 0 1px 0 rgba(200,130,255,0.10)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid rgba(180,100,255,0.14)', animation: 'rimP 4s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(105deg,transparent 38%,rgba(200,130,255,0.05) 50%,transparent 62%)', animation: 'shimmer 8s 0.8s ease-in-out infinite', pointerEvents: 'none' }} />
          <svg style={{ position: 'absolute', top: '50%', right: -50, transform: 'translateY(-50%)', width: 220, height: 220, opacity: 0.13, pointerEvents: 'none' }} viewBox="0 0 220 220">
            <g style={{ transformOrigin: '110px 110px', animation: 'rotateSlow 30s linear infinite' }}>
              <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(200,130,255,1)" strokeWidth="0.7" strokeDasharray="3 9"/>
              <circle cx="110" cy="110" r="78" fill="none" stroke="rgba(180,100,255,0.8)" strokeWidth="0.6" strokeDasharray="5 8"/>
            </g>
            <g style={{ transformOrigin: '110px 110px', animation: 'rotateReverse 20s linear infinite' }}>
              <polygon points="110,18 192,164 28,164" fill="rgba(180,80,255,0.06)" stroke="rgba(200,120,255,0.7)" strokeWidth="0.8"/>
              <polygon points="110,202 28,56 192,56" fill="rgba(160,60,220,0.04)" stroke="rgba(180,100,255,0.5)" strokeWidth="0.7"/>
            </g>
            <circle cx="110" cy="110" r="42" fill="rgba(160,60,220,0.07)" stroke="rgba(200,130,255,0.45)" strokeWidth="0.6">
              <animate attributeName="r" values="40;46;40" dur="4s" repeatCount="indefinite"/>
            </circle>
            {([0,60,120,180,240,300] as number[]).map((deg, i) => {
              const x = 110 + 62 * Math.cos(deg * Math.PI / 180);
              const y = 110 + 62 * Math.sin(deg * Math.PI / 180);
              return <circle key={i} cx={x} cy={y} r="3.5" fill="rgba(220,160,255,0.7)">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${2+i*0.3}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/>
              </circle>;
            })}
          </svg>
          <div style={{ position: 'relative', zIndex: 2, padding: '26px 22px 24px' }}>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(200,140,255,0.55)', marginBottom: 14 }}>
              Siddha Alchemy · Sacred Creation
            </div>
            <div style={{
              fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.1,
              background: 'linear-gradient(135deg,#D4A8FF 0%,#F0D8FF 35%,#C880FF 55%,#8830CC 100%)',
              backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'hShimmer 5s linear infinite', filter: 'drop-shadow(0 0 14px rgba(180,100,255,0.55))', marginBottom: 8,
            }}>
              {t('converge.creativeSoulTitle')}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(210,170,255,0.45)', letterSpacing: '0.02em', marginBottom: 22, lineHeight: 1.5 }}>
              Sacred art, music & alchemy — born from the Siddha field
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 22 }}>
              {(['Sacred Music', 'Siddha Art', 'Alchemy Store', 'Frequency Tools'] as string[]).map(pill => (
                <span key={pill} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' as const, padding: '4px 11px', borderRadius: 20, background: 'rgba(180,100,255,0.1)', border: '1px solid rgba(180,100,255,0.28)', color: 'rgba(210,160,255,0.8)' }}>{pill}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: 'rgba(200,140,255,0.4)' }}>Enter the Soul Field →</span>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(180,100,255,0.12)', border: '1px solid rgba(180,100,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(210,160,255,0.85)', fontSize: 16 }}>→</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SACRED CHANNEL ══ */}
      <SL label={t('converge.secVideos')} delay="0.38s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.4s ease both' }}>
        {/* Outer glowing card wraps ALL video content */}
        <div style={{
          position: 'relative', borderRadius: 28, overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(30,20,5,0.97) 0%, rgba(10,8,2,0.99) 60%, #050505 100%)',
          border: '1px solid rgba(212,175,55,0.28)',
          boxShadow: '0 0 50px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.10)',
          padding: '18px 16px 14px',
        }}>
          {/* Rim glow */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid rgba(212,175,55,0.10)', animation: 'rimG 5s ease-in-out infinite', pointerEvents: 'none' }} />
          {/* Sheen */}
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(105deg,transparent 38%,rgba(212,175,55,0.03) 50%,transparent 62%)', animation: 'shimmer 10s 1s ease-in-out infinite', pointerEvents: 'none' }} />

          {exploreVideos.length === 0 ? (
            <div onClick={() => navigate('/spiritual-education')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 4px', cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.8)"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>Sacred Channel</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Watch to unlock</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'rgba(212,175,55,0.3)', fontSize: 13 }}>→</span>
            </div>
          ) : (
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Featured video */}
              {exploreVideos[0] && (() => {
                const v = exploreVideos[0];
                const isRawId = /^Video [A-Za-z0-9_-]{6,}$/.test(v.title) || v.title === 'Untitled';
                const displayTitle = isRawId ? 'Sacred Transmission' : v.title;
                return (
                  <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.22)', background: '#050505', textDecoration: 'none' }}>
                    <img src={v.thumbnail} alt={displayTitle} style={{ width: '100%', height: 168, objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.3) 45%, transparent 70%)' }} />
                    {/* Play btn */}
                    <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', width: 54, height: 54, borderRadius: '50%', background: 'rgba(212,175,55,0.18)', border: '1.5px solid rgba(212,175,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(212,175,55,0.35)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.95)"/></svg>
                    </div>
                    {/* SHC badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 20, background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}>New</div>
                    {/* Title overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
                      <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.35, marginBottom: 2 }}>
                        {displayTitle.length > 52 ? displayTitle.slice(0,52)+'…' : displayTitle}
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(212,175,55,0.6)' }}>{v.channelTitle}</div>
                    </div>
                  </a>
                );
              })()}

              {/* 2-col secondary */}
              {exploreVideos.slice(1,3).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {exploreVideos.slice(1,3).map(v => {
                    const isRawId = /^Video [A-Za-z0-9_-]{6,}$/.test(v.title) || v.title === 'Untitled';
                    const displayTitle = isRawId ? 'Sacred Transmission' : v.title;
                    return (
                      <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(255,255,255,0.01)', textDecoration: 'none' }}>
                        <div style={{ position: 'relative' }}>
                          <img src={v.thumbnail} alt={displayTitle} style={{ width: '100%', height: 82, objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.75) 0%, transparent 55%)' }} />
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.9)"/></svg>
                          </div>
                        </div>
                        <div style={{ padding: '8px 9px 9px' }}>
                          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                            {displayTitle.length > 34 ? displayTitle.slice(0,34)+'…' : displayTitle}
                          </div>
                          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(212,175,55,0.45)', marginTop: 4, textTransform: 'uppercase' as const }}>New</div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Footer link */}
              <div onClick={() => navigate('/spiritual-education')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4, cursor: 'pointer' }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.38)' }}>
                  {t('converge.allVideos', 'All Videos →')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ PERSONAL GUIDANCE CARD ══ */}
      <SL label={t('converge.secDeepen')} delay="0.44s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.46s ease both' }}>
        <div style={{
          position: 'relative', borderRadius: 28, overflow: 'hidden',
          background: 'radial-gradient(ellipse at 30% 0%, rgba(55,30,5,0.98) 0%, rgba(20,10,0,0.99) 55%, #050505 100%)',
          border: '1px solid rgba(212,175,55,0.48)',
          boxShadow: '0 0 70px rgba(212,175,55,0.13), 0 0 140px rgba(212,175,55,0.06), inset 0 1px 0 rgba(212,175,55,0.14)',
        }}>
          {/* Rim glow */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid rgba(212,175,55,0.16)', animation: 'rimG 4s ease-in-out infinite', pointerEvents: 'none' }} />
          {/* Sheen sweep */}
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(105deg,transparent 38%,rgba(212,175,55,0.05) 50%,transparent 62%)', animation: 'shimmer 7s 1s ease-in-out infinite', pointerEvents: 'none' }} />

          {/* Sacred geometry top-right */}
          <svg style={{ position: 'absolute', top: -28, right: -28, width: 160, height: 160, opacity: 0.14, pointerEvents: 'none' }} viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(212,175,55,1)" strokeWidth="0.7" strokeDasharray="4 11">
              <animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="44s" repeatCount="indefinite"/>
            </circle>
            <polygon points="80,10 142,130 18,130" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.8)" strokeWidth="0.7"/>
            <polygon points="80,150 18,30 142,30" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.55)" strokeWidth="0.6"/>
            <circle cx="80" cy="80" r="28" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.4)" strokeWidth="0.5">
              <animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="18s" repeatCount="indefinite"/>
            </circle>
          </svg>

          {/* Card content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '24px 22px 22px' }}>

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.45)', marginBottom: 10 }}>
                Personal Guidance · Adam & Laila
              </div>
              <div style={{
                fontFamily: "'Cinzel',serif", fontSize: 20, fontWeight: 700,
                letterSpacing: '0.04em', lineHeight: 1.15,
                background: 'linear-gradient(135deg,#D4AF37 0%,#F5E17A 35%,#D4AF37 60%,#A07C10 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'hShimmer 5s linear infinite',
                filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4))',
              }}>
                Sovereign Guidance Field
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 12.5, color: 'rgba(212,175,55,0.38)', marginTop: 5, letterSpacing: '0.02em' }}>
                Direct transmissions, mentorship & sacred creations
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.22) 40%,rgba(212,175,55,0.08) 70%,transparent)', marginBottom: 18 }} />

            {/* Service rows */}
            {([
              { title: t('converge.deepenAvataric'), sub: t('converge.deepenAvataricSub'), icon: '✦', h: '/courses' },
              { title: t('converge.deepenNeural'), sub: t('converge.deepenNeuralSub'), icon: '◈', h: '/private-sessions' },
              { title: t('converge.deepenAetheric'), sub: t('converge.deepenAethericSub'), icon: '⬡', h: '/affirmation-soundtrack' },
              { title: t('converge.deepenMentorship'), sub: t('converge.deepenMentorshipSub'), icon: '◆', h: '/transformation' },
              { title: t('converge.healingClothesTitle'), sub: t('converge.healingClothesSub'), icon: '✿', h: '/shop' },
            ] as { title: string; sub: string; icon: string; h: string }[]).map(({ title, sub, icon, h }, idx) => (
              <div
                key={h}
                onClick={() => navigate(h)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 14px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(212,175,55,0.08)',
                  cursor: 'pointer',
                  marginBottom: idx < 5 ? 8 : 0,
                  transition: 'border-color .2s, background .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.25)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.08)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.015)'; }}
              >
                {/* Icon ring */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#D4AF37' }}>
                  {icon}
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.02em', marginBottom: 2, lineHeight: 1.3 }}>
                    {title}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 11.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
                    {sub}
                  </div>
                </div>
                <span style={{ color: 'rgba(212,175,55,0.3)', fontSize: 13, flexShrink: 0 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONNECT ══ */}
      <SL label={t('converge.secConnect')} delay="0.5s"/>

      {/* ── STARGATE HERO CARD ── */}
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.52s ease both' }}>
        <div
          onClick={() => navigate('/stargate')}
          style={{
            position: 'relative', borderRadius: 28, overflow: 'hidden', cursor: 'pointer',
            background: 'radial-gradient(ellipse at 40% 0%, rgba(48,18,90,0.98) 0%, rgba(16,6,36,0.99) 50%, #050505 100%)',
            border: '1px solid rgba(160,100,255,0.42)',
            boxShadow: '0 0 55px rgba(130,70,240,0.12), 0 0 110px rgba(100,50,200,0.06), inset 0 1px 0 rgba(180,130,255,0.10)',
            marginBottom: 10,
          }}
        >
          {/* Rim pulse overlay */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid rgba(160,100,255,0.14)', animation: 'rimP 4.5s ease-in-out infinite', pointerEvents: 'none' }} />
          {/* Sheen sweep */}
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(105deg,transparent 38%,rgba(180,120,255,0.05) 50%,transparent 62%)', animation: 'shimmer 9s 1s ease-in-out infinite', pointerEvents: 'none' }} />

          {/* Starfield */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 420 220" preserveAspectRatio="xMidYMid slice">
            {([[28,22,1,'#C8A8FF',2.9,0],[390,16,1.1,'#E0C8FF',3.3,0.4],[70,160,0.9,'#B090F0',2.5,0.8],[200,11,1,'#D4AF37',3.7,1.1],[45,90,0.8,'#C8A8FF',2.3,1.5],[320,85,1.2,'#B8A0F0',2.8,0.2],[260,48,0.9,'#D4AF37',3.5,1.8],[380,200,1,'#C0A0F8',2.6,0.9]] as [number,number,number,string,number,number][]).map(([x,y,r,fill,dur,delay],i) => (
              <circle key={i} cx={x} cy={y} r={r} fill={fill} opacity="0.55">
                <animate attributeName="opacity" values="0.15;0.85;0.15" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"/>
              </circle>
            ))}
          </svg>

          {/* Portal geometry */}
          <svg style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, opacity: 0.28, pointerEvents: 'none' }} viewBox="0 0 200 200">
            <g style={{ transformOrigin: '100px 100px', animation: 'rotateSlow 22s linear infinite' }}>
              <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(160,100,255,0.7)" strokeWidth="0.8" strokeDasharray="5 14"/>
            </g>
            <g style={{ transformOrigin: '100px 100px', animation: 'rotateReverse 14s linear infinite' }}>
              <circle cx="100" cy="100" r="66" fill="none" stroke="rgba(180,120,255,0.5)" strokeWidth="0.7" strokeDasharray="3 9"/>
              <polygon points="100,20 168,160 32,160" fill="none" stroke="rgba(160,100,255,0.35)" strokeWidth="0.6"/>
              <polygon points="100,180 168,40 32,40"  fill="none" stroke="rgba(160,100,255,0.25)" strokeWidth="0.5"/>
            </g>
            <circle cx="100" cy="100" r="10" fill="rgba(180,130,255,0.18)" stroke="rgba(200,160,255,0.5)" strokeWidth="0.8"/>
          </svg>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, padding: '24px 22px 22px' }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(160,100,255,0.55)' }}>
                STARGATE MEMBERSHIP · SVERIGE
              </span>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 20, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.28)', color: 'rgba(212,175,55,0.82)' }}>
                ✦ SWEDISH
              </span>
            </div>

            {/* Title */}
            <div style={{
              fontFamily: "'Cinzel',serif", fontSize: 26, fontWeight: 700,
              letterSpacing: '0.04em', lineHeight: 1.1,
              background: 'linear-gradient(135deg,#C8A8FF 0%,#EAD8FF 35%,#B890F5 55%,#7848D8 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'hShimmer 5s linear infinite',
              filter: 'drop-shadow(0 0 14px rgba(160,100,255,0.55))',
              marginBottom: 4,
            }}>Stargate</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 13.5, color: 'rgba(200,175,255,0.45)', letterSpacing: '0.02em', marginBottom: 20 }}>
              Levande helande · Visdom · Gemenskapen
            </div>

            {/* Divider */}
            <div style={{ height: 1, marginBottom: 18, background: 'linear-gradient(90deg,transparent,rgba(160,100,255,0.2) 40%,rgba(160,100,255,0.08) 70%,transparent)' }} />

            {/* Four pillars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {([
                { day: 'Måndag',  name: 'Mantra Chanting',      gold: false },
                { day: 'Tisdag',  name: 'Healing Chamber',       gold: false },
                { day: 'Veckovis',name: 'Bhagavad Gita & Q&A',  gold: true  },
                { day: 'Alltid',  name: 'Divine Sangha Nexus',   gold: false },
              ] as {day:string;name:string;gold:boolean}[]).map(({ day, name, gold }) => (
                <div key={name} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(160,100,255,0.12)', borderRadius: 16, padding: '12px 12px 10px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: gold ? 'rgba(212,175,55,0.55)' : 'rgba(180,130,255,0.55)', boxShadow: gold ? '0 0 6px rgba(212,175,55,0.5)' : '0 0 6px rgba(160,100,255,0.5)', marginBottom: 8 }} />
                  <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 5.5, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.55)', marginBottom: 4 }}>{day}</div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 600, color: 'rgba(220,200,255,0.85)', lineHeight: 1.3, letterSpacing: '0.02em' }}>{name}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '5px 12px', borderRadius: 20, background: 'rgba(160,100,255,0.1)', border: '1px solid rgba(160,100,255,0.28)', color: 'rgba(200,165,255,0.8)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(160,100,255,0.7)', boxShadow: '0 0 5px rgba(160,100,255,0.6)' }} />
                Divine Sangha Nexus · Community
              </div>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(160,100,255,0.12)', border: '1px solid rgba(160,100,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(200,165,255,0.8)', fontSize: 15 }}>→</div>
            </div>
          </div>

          {/* Bottom gold line */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.2) 40%,rgba(212,175,55,0.08) 70%,transparent)' }} />
        </div>

        {/* ── VEDIC-FREQUENCY CAST CARD ── */}
        <div
          onClick={() => navigate('/podcast')}
          style={{
            position: 'relative', borderRadius: 24, overflow: 'hidden', cursor: 'pointer', marginTop: 10,
            background: 'radial-gradient(ellipse at 20% 50%, rgba(20,35,55,0.98) 0%, rgba(8,14,28,0.99) 55%, #050505 100%)',
            border: '1px solid rgba(80,140,255,0.38)',
            boxShadow: '0 0 50px rgba(60,110,240,0.10), inset 0 1px 0 rgba(100,160,255,0.08)',
          }}
        >
          {/* Blue rim pulse */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 24, border: '1px solid rgba(80,140,255,0.12)', animation: 'rimB 4s ease-in-out infinite', pointerEvents: 'none' }} />
          {/* Sheen */}
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(105deg,transparent 38%,rgba(100,160,255,0.04) 50%,transparent 62%)', animation: 'shimmer 8s 0.5s ease-in-out infinite', pointerEvents: 'none' }} />
          {/* Sound wave SVG background */}
          <svg style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 140, height: 100, opacity: 0.12, pointerEvents: 'none' }} viewBox="0 0 140 100">
            {[10,20,30,40,50,60,70,80,90,100,110,120,130].map((x, i) => {
              const h = [20,45,65,80,90,72,50,38,60,78,55,32,18][i];
              return <rect key={i} x={x-3} y={(100-h)/2} width="5" height={h} rx="3" fill="rgba(100,160,255,0.9)">
                <animate attributeName="height" values={`${h};${Math.min(h+20,95)};${h}`} dur={`${1.2+i*0.15}s`} repeatCount="indefinite"/>
                <animate attributeName="y" values={`${(100-h)/2};${(100-Math.min(h+20,95))/2};${(100-h)/2}`} dur={`${1.2+i*0.15}s`} repeatCount="indefinite"/>
              </rect>;
            })}
          </svg>
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Mic ring */}
            <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: 'rgba(80,140,255,0.10)', border: '1px solid rgba(80,140,255,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 18px rgba(80,140,255,0.2)' }}>🎙</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.42em', textTransform: 'uppercase' as const, color: 'rgba(80,160,255,0.55)', marginBottom: 6 }}>Vedic Frequency · Spotify</div>
              <div style={{
                fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 700,
                letterSpacing: '0.04em', lineHeight: 1.2,
                background: 'linear-gradient(135deg,#90C8FF 0%,#C8E4FF 40%,#7AB8FF 65%,#4080E0 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'hShimmer 5s linear infinite',
                marginBottom: 4,
              }}>
                {t('converge.connectPodcast')}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(150,200,255,0.4)', lineHeight: 1.5 }}>
                {t('converge.connectPodcastSub')}
              </div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(80,140,255,0.12)', border: '1px solid rgba(80,140,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(120,180,255,0.8)', fontSize: 14, flexShrink: 0 }}>→</div>
          </div>
        </div>
      </div>

      {/* ══ SACRED COMMISSIONS — single consolidated entry point ══ */}
      <div style={{ margin: '22px 16px 0' }}>
        <div
          onClick={() => setCommissionsOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 18px', borderRadius: 24,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,175,55,0.18)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(212,175,55,.22),rgba(212,175,55,.06))',
            border: '1.5px solid rgba(212,175,55,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 0 18px rgba(212,175,55,.3)',
          }}>ॐ</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,.55)', marginBottom: 4 }}>
              {t('meditations.sacredCommissionsMicro').toUpperCase()}
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,.9)', marginBottom: 2 }}>
              {t('meditations.personalTransmissions')}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)', lineHeight: 1.4 }}>
              {t('meditations.sacredCommissionsDesc')}
            </div>
          </div>
          <div style={{ color: 'rgba(212,175,55,.5)', fontSize: 18, flexShrink: 0 }}>›</div>
        </div>
      </div>

      {/* Sacred Commissions picker sheet */}
      <Dialog open={commissionsOpen} onOpenChange={setCommissionsOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-[#D4AF37]/25 p-5 max-h-[85vh] overflow-y-auto">
          <div style={{ fontWeight: 800, fontSize: 17, color: 'rgba(255,255,255,.9)', marginBottom: 14 }}>
            {t('meditations.personalTransmissions')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                key: 'wealth', price: '€47', turnaround: '48hr delivery',
                title: t('meditations.wealthTitle'), sub: t('meditations.wealthSub'),
                diff: 'Fixed template, your name channeled in. Delivered as-is, no back-and-forth.',
              },
              {
                key: 'booking', price: '€70–€97', turnaround: '3–5 day delivery',
                title: t('meditations.bookingTitle'), sub: t('meditations.bookingSub'),
                diff: 'Custom-channeled around your intention, with one revision round included.',
              },
              {
                key: 'creation', price: '€97–€197', turnaround: '7–10 day delivery',
                title: t('meditations.creationTitle'), sub: t('meditations.creationSub'),
                diff: 'Full original composition, yours to use — for creators and healers.',
              },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  padding: '16px 16px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(212,175,55,0.15)',
                }}
              >
                <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg,rgba(212,175,55,.18),rgba(212,175,55,.05))',
                    border: '1px solid rgba(212,175,55,.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17,
                  }}>ॐ</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(212,175,55,.8)' }}>{item.price}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>{item.turnaround}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,.9)', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)' }}>{item.sub}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, marginBottom: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {item.diff}
                </div>
                <button
                  onClick={() => { setCommissionsOpen(false); setActiveCommission(item.key); }}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 100,
                    background: 'linear-gradient(135deg,#D4AF37,#f0d878)',
                    color: '#050505', fontWeight: 800, fontSize: 11.5,
                    letterSpacing: '.05em', textTransform: 'uppercase',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Request This
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preserved commission modal sheets */}
      <WealthMeditationService
        open={activeCommission === 'wealth'}
        onOpenChange={(o: boolean) => !o && setActiveCommission(null)}
        hideTrigger
      />
      <CustomMeditationBooking
        open={activeCommission === 'booking'}
        onOpenChange={(o: boolean) => !o && setActiveCommission(null)}
        hideTrigger
      />
      <CustomMeditationCreation
        open={activeCommission === 'creation'}
        onOpenChange={(o: boolean) => !o && setActiveCommission(null)}
        hideTrigger
      />

      {/* ══ WISDOM QUOTE ══ */}
      <div style={{ margin: '22px 16px 0', padding: '20px 16px', borderTop: '1px solid rgba(212,175,55,0.07)' }}>
        <ParamahamsaVishwanandaDailyCard />
      </div>

      <Dialog open={akashicOpen} onOpenChange={setAkashicOpen}>
        <DialogContent className="max-w-3xl bg-[#0a0a0a] border-[#D4AF37]/30 p-0 overflow-hidden">
          <AkashicSiddhaReading userHouse={userHouse} isModal />
        </DialogContent>
      </Dialog>
      <SacredRevealGate open={sacredRevealOpen} onOpenChange={setSacredRevealOpen} />

      <PortalKeyframes />
      <style>{`
        @keyframes hShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes rimG { 0%,100%{box-shadow:0 0 12px rgba(212,175,55,.06)} 50%{box-shadow:0 0 40px rgba(212,175,55,.22)} }
        @keyframes rimB { 0%,100%{box-shadow:0 0 10px rgba(80,140,255,.06)} 50%{box-shadow:0 0 30px rgba(80,140,255,.2)} }
        @keyframes rimP { 0%,100%{box-shadow:0 0 10px rgba(160,80,240,.06)} 50%{box-shadow:0 0 30px rgba(160,80,240,.2)} }
        @keyframes shimmer { 0%{left:-110%} 60%{left:110%} 100%{left:110%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

