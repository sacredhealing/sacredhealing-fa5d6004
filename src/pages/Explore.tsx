import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { GitaCard } from "@/components/dashboard/GitaCard";
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
  const [gitaOpen, setGitaOpen] = useState(false);
  const [akashicOpen, setAkashicOpen] = useState(false);
  const [sacredRevealOpen, setSacredRevealOpen] = useState(false);
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
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2, fontSize: 'clamp(22px, 6vw, 26px)', marginBottom: 11, maxWidth: '65%', background: 'linear-gradient(135deg, #B060FF 0%, #DEB0FF 40%, #B060FF 60%, #7020CC 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'hShimmer 5s linear infinite' }}>EXPLORE<br/>AKASHA</div>
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
        <div onClick={() => navigate('/library/abundance')} style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 70% 40%, rgba(45,26,0,0.98) 0%, rgba(15,8,0,0.99) 60%, #050505 100%)', border: '1px solid rgba(212,175,55,0.45)', borderRadius: 24, cursor: 'pointer', animation: 'rimG 4s ease-in-out infinite' }}>
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
            <button onClick={(e) => { e.stopPropagation(); navigate('/library/abundance'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.42)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}>ENTER →</button>
          </div>
        </div>
      </div>

      {/* ══ SIDDHA HEALER CERTIFICATION BANNER ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div onClick={() => navigate('/certification')} style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 30% 50%, rgba(45,26,0,0.97) 0%, rgba(12,6,0,0.99) 55%, #050505 100%)', border: '1px solid rgba(212,175,55,0.55)', borderRadius: 24, cursor: 'pointer', animation: 'rimG 4s ease-in-out infinite', boxShadow: '0 0 60px rgba(212,175,55,0.1)' }}>
          <div style={{ position: 'absolute', top: -25, right: -25, width: 180, height: 180, pointerEvents: 'none' }}>
            <svg viewBox="0 0 180 180" width="180" height="180">
              <defs><radialGradient id="shcg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(255,220,80,0.35)"/><stop offset="55%" stopColor="rgba(212,175,55,0.08)"/><stop offset="100%" stopColor="rgba(0,0,0,0)"/></radialGradient></defs>
              <ellipse cx="90" cy="90" rx="85" ry="85" fill="url(#shcg)"/>
              <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="1" strokeDasharray="4 9"><animateTransform attributeName="transform" type="rotate" values="0 90 90;360 90 90" dur="40s" repeatCount="indefinite"/></circle>
              <polygon points="90,22 146,114 34,114" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.4"><animateTransform attributeName="transform" type="rotate" values="0 90 90;360 90 90" dur="60s" repeatCount="indefinite"/></polygon>
              <polygon points="90,158 34,66 146,66" fill="rgba(255,210,55,0.04)" stroke="rgba(255,210,60,0.5)" strokeWidth="1.3"><animateTransform attributeName="transform" type="rotate" values="360 90 90;0 90 90" dur="60s" repeatCount="indefinite"/></polygon>
              {[0,1,2].map(i => (<circle key={i} cx="90" cy="90" r="10" fill="none" stroke="rgba(212,175,55,0.7)" strokeWidth="1.2"><animate attributeName="r" values="8;80" dur="4s" begin={`${i*1.33}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="4s" begin={`${i*1.33}s`} repeatCount="indefinite"/></circle>))}
              {[0,60,120,180,240,300].map((angle,i) => { const rad=angle*Math.PI/180; return (<circle key={i} cx={90+Math.cos(rad)*80} cy={90+Math.sin(rad)*80} r="3.5" fill="rgba(255,240,100,0.9)"><animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8+i*0.3}s`} repeatCount="indefinite"/></circle>); })}
              <circle cx="90" cy="90" r="18" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.4"><animate attributeName="r" values="15;22;15" dur="3s" repeatCount="indefinite"/></circle>
              <circle cx="90" cy="90" r="6" fill="rgba(255,248,170,0.97)"><animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.07),transparent)', animation: 'shimmer 5s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 20px' }}>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', marginBottom: 9 }}>SIDDHA LINEAGE · 12-MONTH LIVING TRANSMISSION</p>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2, fontSize: 'clamp(20px,5.5vw,26px)', marginBottom: 11, maxWidth: '65%', background: 'linear-gradient(135deg,#D4AF37 0%,#F5E17A 40%,#D4AF37 60%,#A07C10 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'hShimmer 5s linear infinite' }}>SIDDHA HEALER'S<br/>SOVEREIGN PATH</div>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.68, marginBottom: 14, maxWidth: '75%' }}>12 months of mantras, initiations &amp; healing mastery — from foundation to full certification with Kritagya &amp; Laila</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 15 }}>
              {['Personal Diksha','12 Modules','Certification'].map(l => (<span key={l} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)', color: 'rgba(212,175,55,0.85)' }}>{l}</span>))}
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigate('/certification'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.45)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}>EXPLORE →</button>
          </div>
        </div>
      </div>

      {/* ══ SACRED TOOLS — VIRTUAL PILGRIMAGE ══ */}
      <SL label={t('converge.secSacredTools')} delay="0.18s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.2s ease both' }}>
        <div onClick={() => (isAdmin || tier==='akasha-infinity' || tier==='lifetime') ? navigate('/virtual-pilgrimage') : navigate('/virtual-pilgrimage-landing')} style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.38)', background: 'linear-gradient(160deg,rgba(30,20,5,0.95) 0%,rgba(8,6,0,0.98) 60%,rgba(20,14,0,0.95) 100%)', minHeight: 190 }}>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.12),transparent)', animation: 'shimmer 4s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.75 }}>
            <svg width="280" height="175" viewBox="0 0 280 175">
              {[0,1,2].map(i => (<circle key={i} cx="140" cy="80" r="10" fill="none" stroke="#D4AF37" strokeWidth="1.2"><animate attributeName="r" values={`${10+i*18};80`} dur="3s" begin={`${i*0.7}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3s" begin={`${i*0.7}s`} repeatCount="indefinite"/></circle>))}
              <polygon points="140,10 238,135 42,135" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.9)" strokeWidth="1.8"/>
              <line x1="92" y1="52" x2="188" y2="52" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8"/>
              <line x1="68" y1="86" x2="212" y2="86" stroke="rgba(212,175,55,0.22)" strokeWidth="0.7"/>
              <line x1="140" y1="10" x2="140" y2="135" stroke="rgba(212,175,55,0.35)" strokeWidth="0.9"/>
              <circle cx="140" cy="10" r="5" fill="#FFD700"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/></circle>
              <circle cx="140" cy="78" r="5" fill="rgba(212,175,55,0.9)"><animate attributeName="r" values="4;7;4" dur="3s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 2, padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 88 }}>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)' }}>SQI 2050 · SCALAR CONSCIOUSNESS</span>
              {(isAdmin||tier==='akasha-infinity'||tier==='lifetime') ? <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: 'rgba(212,175,55,0.85)', padding: '2px 8px', borderRadius: 20 }}>ACTIVE</span> : <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: 20 }}>AKASHA ∞</span>}
            </div>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>Virtual Pilgrimage</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.83rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>40 sacred sites · GPS scalar waves · Prema pulses · 40-Day lock</div>
          </div>
        </div>
      </div>

      {/* ══ VEDIC / GITA ══ */}
      <SL label={t('converge.secVedic')} delay="0.26s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.28s ease both' }}>
        <div onClick={() => setGitaOpen(!gitaOpen)} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative' }}>
          <RingIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="14" height="18" rx="2" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><line x1="8" y1="8" x2="16" y2="8" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="11" x2="16" y2="11" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="14" x2="13" y2="14" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/></svg></RingIcon>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>{t('converge.wisdomGita')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.wisdomGitaSub')}</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        {gitaOpen && <div style={{ marginTop: 10 }}><GitaCard /></div>}
      </div>

      {/* ══ CREATIVE SOUL + SHOP ══ */}
      <SL label={t('converge.secAbundance')} delay="0.32s"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'fadeUp 0.4s 0.34s ease both' }}>
        <div onClick={() => navigate('/creative-soul/store')} style={{ background: 'linear-gradient(135deg,rgba(170,55,200,0.08),rgba(0,0,0,0))', border: '1px solid rgba(170,60,210,0.18)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative' }}>
          <RingIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2 C12 2 9 8 4 10 C9 12 12 22 12 22 C12 22 15 12 20 10 C15 8 12 2 12 2Z" stroke="rgba(180,110,255,0.8)" strokeWidth="1.4" fill="rgba(160,60,220,0.1)"/></svg></RingIcon>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>{t('converge.creativeSoulTitle')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.creativeSoulSub')}</div>
        </div>
        <div onClick={() => navigate('/shop')} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative' }}>
          <RingIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 2 L2 8 L6 8 L6 20 C6 20.6 6.4 21 7 21 L17 21 C17.6 21 18 20.6 18 20 L18 8 L22 8 L18 2 L14 5 C13.3 3.8 12.7 3 12 3 C11.3 3 10.7 3.8 10 5 Z" stroke="rgba(212,175,55,0.75)" strokeWidth="1.3" fill="rgba(212,175,55,0.07)"/></svg></RingIcon>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>{t('converge.healingClothesTitle')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.healingClothesSub')}</div>
        </div>
      </div>

      {/* ══ VIDEOS ══ */}
      <SL label={t('converge.secVideos')} delay="0.38s"/>
      <div style={{ margin: '0 16px', animation: 'fadeUp 0.4s 0.4s ease both' }}>
        {exploreVideos[0] && (
          <div onClick={() => navigate('/spiritual-education')} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', marginBottom: 10, border: '1px solid rgba(212,175,55,0.18)' }}>
            <img src={exploreVideos[0].thumbnail} alt={exploreVideos[0].title} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block', background: '#111' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1.5px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.9)"/></svg>
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginBottom: 3, lineHeight: 1.3 }}>{exploreVideos[0].title}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{t('converge.videoWatchEarn')}</div>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {exploreVideos.slice(1,3).map(v => (
            <div key={v.id} onClick={() => navigate('/spiritual-education')} style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative' }}>
                <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: 78, objectFit: 'cover', display: 'block', background: '#111' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(255,255,255,0.7)"/></svg>
                  </div>
                </div>
              </div>
              <div style={{ padding: '7px 9px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, color: 'rgba(255,255,255,0.65)', lineHeight: 1.35 }}>{v.title.length>28?v.title.slice(0,28)+'…':v.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ DEEPEN ══ */}
      <SL label={t('converge.secDeepen')} delay="0.44s"/>
      <div style={{ animation: 'fadeUp 0.4s 0.46s ease both' }}>
        {([
          { k: 'converge.deepenAvataric' as const, sk: 'converge.deepenAvataricSub' as const, h: '/courses' },
          { k: 'converge.deepenMentorship' as const, sk: 'converge.deepenMentorshipSub' as const, h: '/transformation' },
          { k: 'converge.deepenNeural' as const, sk: 'converge.deepenNeuralSub' as const, h: '/private-sessions' },
          { k: 'converge.deepenAetheric' as const, sk: 'converge.deepenAethericSub' as const, h: '/affirmation-soundtrack' },
                  ]).map(({ k, sk, h }) => (
          <div key={k} onClick={() => navigate(h)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(212,175,55,0.4)', flexShrink: 0 }}/>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(k)}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>{t(sk)}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
          </div>
        ))}
      </div>

      {/* ══ CONNECT ══ */}
      <SL label={t('converge.secConnect')} delay="0.5s"/>
      <div style={{ animation: 'fadeUp 0.4s 0.52s ease both' }}>
        {([
          { k: 'converge.connectStargate' as const, sk: 'converge.connectStargateSub' as const, h: '/stargate', b: t('converge.badgeSwedish') },
          { k: 'converge.connectPodcast' as const, sk: 'converge.connectPodcastSub' as const, h: '/podcast', b: undefined },
          { k: 'converge.connectLeaderboard' as const, sk: 'converge.connectLeaderboardSub' as const, h: '/leaderboard', b: t('converge.badge5kShc') },
          { k: 'converge.connectAffiliate' as const, sk: 'converge.connectAffiliateSub' as const, h: '/invite-friends', b: t('converge.badge30pct') },
        ]).map(({ k, sk, h, b }) => (
          <div key={k} onClick={() => navigate(h)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(212,175,55,0.4)', flexShrink: 0 }}/>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(k)}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>{t(sk)}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
              {b && <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 20, padding: '2px 8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', color: 'rgba(212,175,55,0.82)' }}>{b}</span>}
              <span style={{ color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
            </div>
          </div>
        ))}
      </div>

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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { GitaCard } from "@/components/dashboard/GitaCard";
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
  const [gitaOpen, setGitaOpen] = useState(false);
  const [akashicOpen, setAkashicOpen] = useState(false);
  const [sacredRevealOpen, setSacredRevealOpen] = useState(false);
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
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2, fontSize: 'clamp(22px, 6vw, 26px)', marginBottom: 11, maxWidth: '65%', background: 'linear-gradient(135deg, #B060FF 0%, #DEB0FF 40%, #B060FF 60%, #7020CC 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'hShimmer 5s linear infinite' }}>EXPLORE<br/>AKASHA</div>
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
        <div onClick={() => navigate('/library/abundance')} style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 70% 40%, rgba(45,26,0,0.98) 0%, rgba(15,8,0,0.99) 60%, #050505 100%)', border: '1px solid rgba(212,175,55,0.45)', borderRadius: 24, cursor: 'pointer', animation: 'rimG 4s ease-in-out infinite' }}>
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
            <button onClick={(e) => { e.stopPropagation(); navigate('/library/abundance'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.42)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}>ENTER →</button>
          </div>
        </div>
      </div>

      {/* ══ SACRED TOOLS — VIRTUAL PILGRIMAGE ══ */}
      <SL label={t('converge.secSacredTools')} delay="0.18s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.2s ease both' }}>
        <div onClick={() => (isAdmin || tier==='akasha-infinity' || tier==='lifetime') ? navigate('/virtual-pilgrimage') : navigate('/virtual-pilgrimage-landing')} style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.38)', background: 'linear-gradient(160deg,rgba(30,20,5,0.95) 0%,rgba(8,6,0,0.98) 60%,rgba(20,14,0,0.95) 100%)', minHeight: 190 }}>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.12),transparent)', animation: 'shimmer 4s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.75 }}>
            <svg width="280" height="175" viewBox="0 0 280 175">
              {[0,1,2].map(i => (<circle key={i} cx="140" cy="80" r="10" fill="none" stroke="#D4AF37" strokeWidth="1.2"><animate attributeName="r" values={`${10+i*18};80`} dur="3s" begin={`${i*0.7}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3s" begin={`${i*0.7}s`} repeatCount="indefinite"/></circle>))}
              <polygon points="140,10 238,135 42,135" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.9)" strokeWidth="1.8"/>
              <line x1="92" y1="52" x2="188" y2="52" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8"/>
              <line x1="68" y1="86" x2="212" y2="86" stroke="rgba(212,175,55,0.22)" strokeWidth="0.7"/>
              <line x1="140" y1="10" x2="140" y2="135" stroke="rgba(212,175,55,0.35)" strokeWidth="0.9"/>
              <circle cx="140" cy="10" r="5" fill="#FFD700"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/></circle>
              <circle cx="140" cy="78" r="5" fill="rgba(212,175,55,0.9)"><animate attributeName="r" values="4;7;4" dur="3s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 2, padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 88 }}>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)' }}>SQI 2050 · SCALAR CONSCIOUSNESS</span>
              {(isAdmin||tier==='akasha-infinity'||tier==='lifetime') ? <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: 'rgba(212,175,55,0.85)', padding: '2px 8px', borderRadius: 20 }}>ACTIVE</span> : <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: 20 }}>AKASHA ∞</span>}
            </div>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>Virtual Pilgrimage</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.83rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>40 sacred sites · GPS scalar waves · Prema pulses · 40-Day lock</div>
          </div>
        </div>
      </div>

      {/* ══ VEDIC / GITA ══ */}
      <SL label={t('converge.secVedic')} delay="0.26s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.28s ease both' }}>
        <div onClick={() => setGitaOpen(!gitaOpen)} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative' }}>
          <RingIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="14" height="18" rx="2" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><line x1="8" y1="8" x2="16" y2="8" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="11" x2="16" y2="11" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="14" x2="13" y2="14" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/></svg></RingIcon>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>{t('converge.wisdomGita')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.wisdomGitaSub')}</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        {gitaOpen && <div style={{ marginTop: 10 }}><GitaCard /></div>}
      </div>

      {/* ══ CREATIVE SOUL + SHOP ══ */}
      <SL label={t('converge.secAbundance')} delay="0.32s"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'fadeUp 0.4s 0.34s ease both' }}>
        <div onClick={() => navigate('/creative-soul/store')} style={{ background: 'linear-gradient(135deg,rgba(170,55,200,0.08),rgba(0,0,0,0))', border: '1px solid rgba(170,60,210,0.18)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative' }}>
          <RingIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2 C12 2 9 8 4 10 C9 12 12 22 12 22 C12 22 15 12 20 10 C15 8 12 2 12 2Z" stroke="rgba(180,110,255,0.8)" strokeWidth="1.4" fill="rgba(160,60,220,0.1)"/></svg></RingIcon>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>{t('converge.creativeSoulTitle')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.creativeSoulSub')}</div>
        </div>
        <div onClick={() => navigate('/shop')} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative' }}>
          <RingIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 2 L2 8 L6 8 L6 20 C6 20.6 6.4 21 7 21 L17 21 C17.6 21 18 20.6 18 20 L18 8 L22 8 L18 2 L14 5 C13.3 3.8 12.7 3 12 3 C11.3 3 10.7 3.8 10 5 Z" stroke="rgba(212,175,55,0.75)" strokeWidth="1.3" fill="rgba(212,175,55,0.07)"/></svg></RingIcon>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>{t('converge.healingClothesTitle')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.healingClothesSub')}</div>
        </div>
      </div>

      {/* ══ VIDEOS ══ */}
      <SL label={t('converge.secVideos')} delay="0.38s"/>
      <div style={{ margin: '0 16px', animation: 'fadeUp 0.4s 0.4s ease both' }}>
        {exploreVideos[0] && (
          <div onClick={() => navigate('/spiritual-education')} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', marginBottom: 10, border: '1px solid rgba(212,175,55,0.18)' }}>
            <img src={exploreVideos[0].thumbnail} alt={exploreVideos[0].title} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block', background: '#111' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1.5px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.9)"/></svg>
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginBottom: 3, lineHeight: 1.3 }}>{exploreVideos[0].title}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{t('converge.videoWatchEarn')}</div>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {exploreVideos.slice(1,3).map(v => (
            <div key={v.id} onClick={() => navigate('/spiritual-education')} style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative' }}>
                <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: 78, objectFit: 'cover', display: 'block', background: '#111' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(255,255,255,0.7)"/></svg>
                  </div>
                </div>
              </div>
              <div style={{ padding: '7px 9px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, color: 'rgba(255,255,255,0.65)', lineHeight: 1.35 }}>{v.title.length>28?v.title.slice(0,28)+'…':v.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ DEEPEN ══ */}
      <SL label={t('converge.secDeepen')} delay="0.44s"/>
      <div style={{ animation: 'fadeUp 0.4s 0.46s ease both' }}>
        {([
          { k: 'converge.deepenAvataric' as const, sk: 'converge.deepenAvataricSub' as const, h: '/courses' },
          { k: 'converge.deepenMentorship' as const, sk: 'converge.deepenMentorshipSub' as const, h: '/transformation' },
          { k: 'converge.deepenNeural' as const, sk: 'converge.deepenNeuralSub' as const, h: '/private-sessions' },
          { k: 'converge.deepenAetheric' as const, sk: 'converge.deepenAethericSub' as const, h: '/affirmation-soundtrack' },
          { k: 'converge.deepenCert' as const, sk: 'converge.deepenCertSub' as const, h: '/certification' },
        ]).map(({ k, sk, h }) => (
          <div key={k} onClick={() => navigate(h)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(212,175,55,0.4)', flexShrink: 0 }}/>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(k)}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>{t(sk)}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
          </div>
        ))}
      </div>

      {/* ══ CONNECT ══ */}
      <SL label={t('converge.secConnect')} delay="0.5s"/>
      <div style={{ animation: 'fadeUp 0.4s 0.52s ease both' }}>
        {([
          { k: 'converge.connectStargate' as const, sk: 'converge.connectStargateSub' as const, h: '/stargate', b: t('converge.badgeSwedish') },
          { k: 'converge.connectPodcast' as const, sk: 'converge.connectPodcastSub' as const, h: '/podcast', b: undefined },
          { k: 'converge.connectLeaderboard' as const, sk: 'converge.connectLeaderboardSub' as const, h: '/leaderboard', b: t('converge.badge5kShc') },
          { k: 'converge.connectAffiliate' as const, sk: 'converge.connectAffiliateSub' as const, h: '/invite-friends', b: t('converge.badge30pct') },
        ]).map(({ k, sk, h, b }) => (
          <div key={k} onClick={() => navigate(h)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(212,175,55,0.4)', flexShrink: 0 }}/>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(k)}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>{t(sk)}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
              {b && <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 20, padding: '2px 8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', color: 'rgba(212,175,55,0.82)' }}>{b}</span>}
              <span style={{ color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
            </div>
          </div>
        ))}
      </div>

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
