import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { GitaCard } from "@/components/dashboard/GitaCard";
import AkashicSiddhaReading from "@/components/vedic/AkashicSiddhaReading";
import { useQuickActionItems } from "@/features/library/useQuickActionItems";
import { resolveQuickActionItem } from "@/features/library/quickActionResolver";
import { usePresenceState } from "@/features/presence/usePresenceState";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useMeditationContentLanguage } from "@/features/meditations/useContentLanguage";
import { useMembership } from "@/hooks/useMembership";
import { FEATURE_TIER, hasFeatureAccess } from "@/lib/tierAccess";
import { useAuth } from "@/hooks/useAuth";
import { useAkashicAccess } from "@/hooks/useAkashicAccess";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getDayPhase } from "@/utils/postSessionContext";
import SacredRevealGate from "@/components/SacredRevealGate";
import { supabase } from "@/integrations/supabase/client";

interface ExploreVideo {
  id: string; title: string; thumbnail: string; url: string; publishedAt: string; channelTitle: string;
}

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

  const SL = ({ label, delay = '0s' }: { label: string; delay?: string }) => (
    <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.32)', padding: '26px 20px 10px', animation: `fadeUp 0.4s ${delay} ease both` }}>{label}</div>
  );

  const Chip = ({ label }: { label: string }) => (
    <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' as const, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)', color: 'rgba(212,175,55,0.85)', padding: '4px 10px', borderRadius: 20 }}>{label}</span>
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
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(28px, 8vw, 42px)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          margin: 0,
          color: '#D4AF37',
          animation: 'titleGlow 4s ease-in-out infinite',
        }}>
          {t('converge.title')}
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(255,255,255,0.38)', marginTop: 8 }}>
          {t('converge.tagline')}
        </p>
      </div>

      {/* ══ SIDDHA PORTAL LABEL ══ */}
      <div style={{ padding: '28px 20px 10px' }}>
        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.32)' }}>
          SIDDHA PORTAL · GATEWAY OF THE 18 MASTERS
        </span>
      </div>

      {/* ══ SIDDHA PORTAL CARD ══ */}
      <div
        onClick={() => navigate('/siddha-portal')}
        style={{
          margin: '0 16px',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 35%, rgba(45,26,0,0.98) 0%, rgba(15,8,0,0.99) 60%, #050505 100%)',
          border: '1px solid rgba(212,175,55,0.55)',
          borderRadius: 28,
          cursor: 'pointer',
          animation: 'fadeUp 0.5s 0.06s ease both',
          boxShadow: '0 0 90px rgba(212,175,55,0.14)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid rgba(212,175,55,0.18)', animation: 'rimPulse 4s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* Sacred Geometry — Sri Yantra + Flower of Life */}
        <svg viewBox="0 0 340 250" width="100%" height="250" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="sgp" cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="rgba(255,215,70,0.3)"/>
              <stop offset="50%" stopColor="rgba(212,175,55,0.06)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </radialGradient>
          </defs>
          <ellipse cx="170" cy="125" rx="155" ry="115" fill="url(#sgp)"/>
          {/* Outer rotating ring */}
          <circle cx="170" cy="125" r="116" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="0.8" strokeDasharray="3 10">
            <animateTransform attributeName="transform" type="rotate" values="0 170 125;360 170 125" dur="55s" repeatCount="indefinite"/>
          </circle>
          {/* Sri Yantra — upward */}
          <polygon points="170,14 292,204 48,204" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.3"/>
          <polygon points="170,36 278,198 62,198" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.7"/>
          <polygon points="170,54 266,193 74,193" fill="none" stroke="rgba(212,175,55,0.11)" strokeWidth="0.55"/>
          {/* Sri Yantra — downward */}
          <polygon points="170,236 48,82 292,82" fill="rgba(255,200,55,0.03)" stroke="rgba(255,210,60,0.46)" strokeWidth="1.2"/>
          <polygon points="170,218 62,88 278,88" fill="none" stroke="rgba(255,200,55,0.18)" strokeWidth="0.7"/>
          {/* Flower of Life */}
          <circle cx="170" cy="125" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="228" cy="125" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="112" cy="125" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="199" cy="75" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="141" cy="75" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="199" cy="175" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          <circle cx="141" cy="175" r="58" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>
          {/* Chakra rings */}
          <circle cx="170" cy="125" r="94" fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="0.5">
            <animateTransform attributeName="transform" type="rotate" values="0 170 125;360 170 125" dur="28s" repeatCount="indefinite"/>
          </circle>
          <circle cx="170" cy="125" r="72" fill="none" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5">
            <animateTransform attributeName="transform" type="rotate" values="360 170 125;0 170 125" dur="22s" repeatCount="indefinite"/>
          </circle>
          {/* Prema pulse rings */}
          {[0, 1, 2].map(i => (
            <circle key={i} cx="170" cy="125" r="14" fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="1.2">
              <animate attributeName="r" values="12;116" dur="3.8s" begin={`${i * 1.27}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.75;0" dur="3.8s" begin={`${i * 1.27}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          {/* 18 Siddha dots */}
          {[0,60,120,180,240,300].map((angle, i) => {
            const rad = angle * Math.PI / 180;
            const x = 170 + Math.cos(rad) * 112;
            const y = 125 + Math.sin(rad) * 112;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.65)" strokeWidth="0.9">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8 + i * 0.32}s`} repeatCount="indefinite"/>
                </circle>
                <circle cx={x} cy={y} r="2.2" fill="rgba(255,240,100,0.9)">
                  <animate attributeName="r" values="1.5;3.2;1.5" dur={`${1.8 + i * 0.32}s`} repeatCount="indefinite"/>
                </circle>
              </g>
            );
          })}
          {/* Central Bindu */}
          <circle cx="170" cy="125" r="25" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.4">
            <animate attributeName="r" values="22;28;22" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="170" cy="125" r="13" fill="rgba(255,235,90,0.1)" stroke="rgba(212,175,55,0.8)" strokeWidth="1.1">
            <animate attributeName="r" values="10;16;10" dur="2.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="170" cy="125" r="5" fill="rgba(255,248,160,0.97)">
            <animate attributeName="r" values="4;7.5;4" dur="1.9s" repeatCount="indefinite"/>
          </circle>
        </svg>

        {/* SIDDHA PORTAL title — BELOW the star */}
        <div style={{ textAlign: 'center', padding: '12px 20px 6px' }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(24px, 6.5vw, 32px)',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: '#D4AF37',
            animation: 'titleGlow 3.5s ease-in-out infinite',
          }}>
            SIDDHA PORTAL
          </div>
        </div>

        {/* Enter button */}
        <div style={{ padding: '10px 16px 24px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/siddha-portal'); }}
            style={{
              fontFamily: "'Montserrat',sans-serif",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.44em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.44)',
              borderRadius: 32,
              padding: '12px 34px',
              cursor: 'pointer',
              boxShadow: '0 0 28px rgba(212,175,55,0.1)',
              animation: 'rimPulse 3.5s ease-in-out infinite',
            }}
          >
            {hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) ? '⬡  ENTER THE PORTAL' : '⬡  UNLOCK THE PORTAL'}
          </button>
        </div>
      </div>

      {/* ══ DIVINE SANGHA NEXUS MINI-BANNER ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div
          onClick={() => navigate('/community')}
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(20,8,40,0.96) 0%, rgba(10,4,22,0.98) 100%)',
            border: '1px solid rgba(160,80,240,0.45)',
            borderRadius: 20,
            padding: '14px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Hex sacred geometry icon */}
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <polygon points="24,2 45,13 45,35 24,46 3,35 3,13" fill="rgba(160,80,240,0.08)" stroke="rgba(160,80,240,0.5)" strokeWidth="1.1"/>
            <polygon points="24,8 41,18 41,30 24,40 7,30 7,18" fill="none" stroke="rgba(160,80,240,0.28)" strokeWidth="0.7">
              <animateTransform attributeName="transform" type="rotate" values="0 24 24;360 24 24" dur="18s" repeatCount="indefinite"/>
            </polygon>
            <line x1="24" y1="3" x2="24" y2="45" stroke="rgba(160,80,240,0.18)" strokeWidth="0.6"/>
            <line x1="3" y1="16" x2="45" y2="32" stroke="rgba(160,80,240,0.18)" strokeWidth="0.6"/>
            <line x1="45" y1="16" x2="3" y2="32" stroke="rgba(160,80,240,0.18)" strokeWidth="0.6"/>
            <circle cx="24" cy="24" r="6" fill="none" stroke="rgba(190,140,255,0.5)" strokeWidth="0.9">
              <animate attributeName="r" values="6;21;6" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="24" cy="24" r="3.5" fill="rgba(190,140,255,0.9)">
              <animate attributeName="r" values="3;5;3" dur="2.2s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(190,140,255,0.92)', marginBottom: 3 }}>
              DIVINE SANGHA NEXUS
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(190,140,255,0.48)', lineHeight: 1.5 }}>
              Sacred community · Group channels · Live transmissions
            </div>
          </div>
          <div style={{ color: 'rgba(190,140,255,0.4)', fontSize: 18, flexShrink: 0 }}>→</div>
          {/* Shimmer */}
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(190,140,255,0.05),transparent)', animation: 'shimmer 5s ease-in-out infinite', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ══ QUANTUM APOTHECARY BANNER ══ */}
      <div style={{ margin: '13px 16px 0' }}>
        <div
          onClick={() => navigate('/quantum-apothecary')}
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'radial-gradient(ellipse at 75% 30%, rgba(50,30,0,0.97) 0%, rgba(12,7,0,0.99) 55%, #050505 100%)',
            border: '1px solid rgba(212,175,55,0.5)',
            borderRadius: 24,
            cursor: 'pointer',
            animation: 'rimPulse 4s ease-in-out infinite',
          }}
        >
          {/* Star of David geometry — absolute top-right corner */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, pointerEvents: 'none' }}>
            <svg viewBox="0 0 180 180" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="aqg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,220,70,0.35)"/>
                  <stop offset="55%" stopColor="rgba(212,175,55,0.08)"/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                </radialGradient>
              </defs>
              <ellipse cx="90" cy="90" rx="85" ry="85" fill="url(#aqg)"/>
              {/* Outer rings */}
              <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="1" strokeDasharray="4 9">
                <animateTransform attributeName="transform" type="rotate" values="0 90 90;360 90 90" dur="40s" repeatCount="indefinite"/>
              </circle>
              <circle cx="90" cy="90" r="64" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="0.7" strokeDasharray="2 8">
                <animateTransform attributeName="transform" type="rotate" values="360 90 90;0 90 90" dur="28s" repeatCount="indefinite"/>
              </circle>
              <circle cx="90" cy="90" r="46" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="0.6"/>
              {/* Star of David triangles */}
              <polygon points="90,20 148,118 32,118" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.4">
                <animateTransform attributeName="transform" type="rotate" values="0 90 90;360 90 90" dur="30s" repeatCount="indefinite"/>
              </polygon>
              <polygon points="90,160 32,62 148,62" fill="rgba(255,210,55,0.05)" stroke="rgba(255,210,60,0.5)" strokeWidth="1.3">
                <animateTransform attributeName="transform" type="rotate" values="360 90 90;0 90 90" dur="30s" repeatCount="indefinite"/>
              </polygon>
              {/* Cross lines */}
              <line x1="10" y1="90" x2="170" y2="90" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7"/>
              <line x1="32" y1="37" x2="148" y2="143" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7"/>
              <line x1="148" y1="37" x2="32" y2="143" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7"/>
              {/* Prema pulses */}
              {[0, 1, 2].map(i => (
                <circle key={i} cx="90" cy="90" r="10" fill="none" stroke="rgba(212,175,55,0.7)" strokeWidth="1.2">
                  <animate attributeName="r" values="8;78" dur="3.5s" begin={`${i * 1.17}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.7;0" dur="3.5s" begin={`${i * 1.17}s`} repeatCount="indefinite"/>
                </circle>
              ))}
              {/* 6 outer dots */}
              {[0,60,120,180,240,300].map((angle, i) => {
                const rad = angle * Math.PI / 180;
                const x = 90 + Math.cos(rad) * 80;
                const y = 90 + Math.sin(rad) * 80;
                return <circle key={i} cx={x} cy={y} r="3.5" fill="rgba(255,240,100,0.9)"><animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8+i*0.3}s`} repeatCount="indefinite"/></circle>;
              })}
              {/* Bindu */}
              <circle cx="90" cy="90" r="18" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.3">
                <animate attributeName="r" values="15;22;15" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="90" cy="90" r="9" fill="rgba(255,235,90,0.12)" stroke="rgba(212,175,55,0.78)" strokeWidth="1">
                <animate attributeName="r" values="7;13;7" dur="2.2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="90" cy="90" r="4" fill="rgba(255,248,160,0.97)">
                <animate attributeName="r" values="3;6;3" dur="1.9s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>

          {/* Text content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 20px' }}>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', marginBottom: 10 }}>
              SQI · HEALING INTELLIGENCE
            </p>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(22px, 6vw, 28px)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#D4AF37',
              textShadow: '0 0 20px rgba(212,175,55,0.4)',
              marginBottom: 12,
              lineHeight: 1.2,
              animation: 'titleGlow 3.5s ease-in-out infinite',
              maxWidth: '65%',
            }}>
              QUANTUM<br/>APOTHECARY
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 16, maxWidth: '75%' }}>
              Siddha healing transmissions · Personalized Akasha remedies · Plant intelligence · Sound alchemy
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <Chip label="SIDDHA INTELLIGENCE"/>
              <Chip label="NĀDI HERBS"/>
              <Chip label="SOUND CODES"/>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/quantum-apothecary'); }}
              style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.45)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}
            >
              ENTER →
            </button>
          </div>
        </div>
      </div>

      {/* ══ PRĀṆIC BREATHING ══ */}
      <SL label={t('converge.secPranic')} delay="0.1s"/>
      <div onClick={() => navigate('/breathing')} style={{ margin: '0 16px', borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.22)', background: 'linear-gradient(160deg,rgba(10,40,80,0.8) 0%,rgba(5,15,35,0.95) 55%,rgba(212,175,55,0.06) 100%)', animation: 'fadeUp 0.45s 0.12s ease both' }}>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(30,80,160,0.25)', border: '1px solid rgba(100,160,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'breathe 5s ease-in-out infinite' }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M4 14 Q8 6 14 14 Q20 22 24 14" stroke="rgba(120,180,255,0.85)" strokeWidth="1.8" fill="none"/><path d="M4 10 Q9 2 14 10 Q19 18 24 10" stroke="rgba(120,180,255,0.4)" strokeWidth="1.2" fill="none"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 3 }}>{t('converge.pranicTitle')}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>{t('converge.pranicSub')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[t('converge.pranicTileKumbhaka'), t('converge.pranicTileNadi'), t('converge.pranicTileAgni')].map((label, i) => (
              <div key={i} style={{ background: 'rgba(30,80,160,0.2)', border: '1px solid rgba(100,160,255,0.15)', borderRadius: 13, padding: '10px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(120,180,255,0.65)', textAlign: 'center', lineHeight: 1.45 }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.62, marginBottom: 12 }}>{t('converge.pranicBody')}</p>
          <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(140,190,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t('converge.beginPractice')}</button>
        </div>
      </div>

      {/* ══ EXPLORE AKASHA ══ */}
      <SL label={t('converge.secExploreAkasha')} delay="0.15s"/>
      <div onClick={() => navigate('/explore-akasha')} style={{ margin: '0 16px', borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(160,80,240,0.25)', background: 'linear-gradient(160deg,rgba(50,15,90,0.7) 0%,rgba(20,5,40,0.95) 55%,rgba(212,175,55,0.06) 100%)', animation: 'fadeUp 0.45s 0.17s ease both' }}>
        <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(160,80,240,0.07),transparent)', animation: 'shimmer 5s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(160,80,240,0.15)', border: '1px solid rgba(160,80,240,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="10" stroke="rgba(190,140,255,0.7)" strokeWidth="1.2" fill="none"/><circle cx="14" cy="14" r="5.5" stroke="rgba(190,140,255,0.4)" strokeWidth="1" fill="none"/><circle cx="14" cy="14" r="2" fill="rgba(190,140,255,0.8)"/><line x1="14" y1="4" x2="14" y2="8" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/><line x1="14" y1="20" x2="14" y2="24" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/><line x1="4" y1="14" x2="8" y2="14" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/><line x1="20" y1="14" x2="24" y2="14" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 3 }}>{t('converge.akashaCardTitle')}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.36)' }}>{t('converge.akashaCardSub')}</div>
            </div>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.62, marginBottom: 13 }}>{t('converge.akashaBody')}</p>
          <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(190,140,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t('converge.enterArchive')}</button>
        </div>
      </div>

      {/* ══ SACRED TOOLS — VIRTUAL PILGRIMAGE ══ */}
      <SL label={t('converge.secSacredTools')} delay="0.18s"/>
      <div style={{ padding: '0 16px', animation: 'fadeUp 0.4s 0.2s ease both' }}>
        <div onClick={() => (isAdmin || tier === 'akasha-infinity' || tier === 'lifetime') ? navigate('/virtual-pilgrimage') : navigate('/virtual-pilgrimage-landing')} style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.38)', background: 'linear-gradient(160deg,rgba(30,20,5,0.95) 0%,rgba(8,6,0,0.98) 60%,rgba(20,14,0,0.95) 100%)', minHeight: 200 }}>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.12),transparent)', animation: 'shimmer 4s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
            <svg width="300" height="190" viewBox="0 0 300 190">
              {[0,1,2,3,4].map(i => (<circle key={i} cx="150" cy="85" r="10" fill="none" stroke="#D4AF37" strokeWidth="1.2"><animate attributeName="r" values={`${10+i*16};85`} dur="3s" begin={`${i*0.6}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3s" begin={`${i*0.6}s`} repeatCount="indefinite"/></circle>))}
              <polygon points="150,12 252,142 48,142" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.9)" strokeWidth="1.8"/>
              <line x1="100" y1="56" x2="200" y2="56" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8"/>
              <line x1="75" y1="90" x2="225" y2="90" stroke="rgba(212,175,55,0.22)" strokeWidth="0.7"/>
              <line x1="150" y1="12" x2="150" y2="142" stroke="rgba(212,175,55,0.35)" strokeWidth="0.9"/>
              <circle cx="150" cy="12" r="5" fill="#FFD700"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/></circle>
              <circle cx="150" cy="85" r="5" fill="rgba(212,175,55,0.9)"><animate attributeName="r" values="4;7;4" dur="3s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 2, padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 95 }}>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)' }}>SQI 2050 · SCALAR CONSCIOUSNESS</span>
              {(isAdmin || tier === 'akasha-infinity' || tier === 'lifetime') ? <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: 'rgba(212,175,55,0.85)', padding: '2px 8px', borderRadius: 20 }}>ACTIVE</span> : <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: 20 }}>AKASHA ∞</span>}
            </div>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>Virtual Pilgrimage</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>40 sacred sites · GPS scalar waves · Prema pulses · 40-Day lock</div>
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

      {/* ══ ABUNDANCE ══ */}
      <SL label={t('converge.secAbundance')} delay="0.32s"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'fadeUp 0.4s 0.34s ease both' }}>
        <div onClick={() => navigate('/library/abundance')} style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 18, padding: '20px 18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><polygon points="12,2 13.8,8 20,8 14.9,11.9 16.7,18 12,14.1 7.3,18 9.1,11.9 4,8 10.2,8" stroke="rgba(212,175,55,0.85)" strokeWidth="1.3" fill="rgba(212,175,55,0.1)"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 3 }}>{t('converge.abundanceTitle')}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.28)' }}>{t('converge.abundanceSub')}</div>
            </div>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.37)', lineHeight: 1.6, marginBottom: 10 }}>{t('converge.abundanceBody')}</p>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
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
            <div style={{ position: 'relative' }}>
              <img src={exploreVideos[0].thumbnail} alt={exploreVideos[0].title} style={{ width: '100%', height: 155, objectFit: 'cover', display: 'block', background: '#111' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1.5px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.9)"/></svg>
                </div>
              </div>
            </div>
            <div style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginBottom: 4, lineHeight: 1.3 }}>{exploreVideos[0].title}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)' }}>{t('converge.videoWatchEarn')}</div>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {exploreVideos.slice(1,3).map(video => (
            <div key={video.id} onClick={() => navigate('/spiritual-education')} style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative' }}>
                <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block', background: '#111' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(255,255,255,0.7)"/></svg>
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', lineHeight: 1.35 }}>{video.title.length > 28 ? video.title.slice(0,28)+'…' : video.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ DEEPEN ══ */}
      <SL label={t('converge.secDeepen')} delay="0.44s"/>
      <div style={{ animation: 'fadeUp 0.4s 0.46s ease both' }}>
        {([
          { titleKey: 'converge.deepenAvataric' as const, subKey: 'converge.deepenAvataricSub' as const, href: '/courses' },
          { titleKey: 'converge.deepenMentorship' as const, subKey: 'converge.deepenMentorshipSub' as const, href: '/transformation' },
          { titleKey: 'converge.deepenNeural' as const, subKey: 'converge.deepenNeuralSub' as const, href: '/private-sessions' },
          { titleKey: 'converge.deepenAetheric' as const, subKey: 'converge.deepenAethericSub' as const, href: '/affirmation-soundtrack' },
          { titleKey: 'converge.deepenCert' as const, subKey: 'converge.deepenCertSub' as const, href: '/certification' },
        ] as const).map(({ titleKey, subKey, href }) => (
          <div key={titleKey} onClick={() => navigate(href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(212,175,55,0.4)', flexShrink: 0 }}/>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12.5, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(titleKey)}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{t(subKey)}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}><span style={{ color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span></div>
          </div>
        ))}
      </div>

      {/* ══ CONNECT — Sangha removed (it's its own banner above) ══ */}
      <SL label={t('converge.secConnect')} delay="0.5s"/>
      <div style={{ animation: 'fadeUp 0.4s 0.52s ease both' }}>
        {([
          { titleKey: 'converge.connectStargate' as const, subKey: 'converge.connectStargateSub' as const, href: '/stargate', badgeLabel: t('converge.badgeSwedish') },
          { titleKey: 'converge.connectPodcast' as const, subKey: 'converge.connectPodcastSub' as const, href: '/podcast', badgeLabel: undefined },
          { titleKey: 'converge.connectLeaderboard' as const, subKey: 'converge.connectLeaderboardSub' as const, href: '/leaderboard', badgeLabel: t('converge.badge5kShc') },
          { titleKey: 'converge.connectAffiliate' as const, subKey: 'converge.connectAffiliateSub' as const, href: '/invite-friends', badgeLabel: t('converge.badge30pct') },
        ] as const).map(({ titleKey, subKey, href, badgeLabel }) => (
          <div key={titleKey} onClick={() => navigate(href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(212,175,55,0.4)', flexShrink: 0 }}/>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12.5, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(titleKey)}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{t(subKey)}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
              {badgeLabel && <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 20, padding: '2px 8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', color: 'rgba(212,175,55,0.82)' }}>{badgeLabel}</span>}
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
        @keyframes titleGlow {
          0%,100% { text-shadow: 0 0 20px rgba(212,175,55,0.3), 0 0 40px rgba(212,175,55,0.1); }
          50% { text-shadow: 0 0 50px rgba(212,175,55,0.8), 0 0 90px rgba(212,175,55,0.3); }
        }
        @keyframes rimPulse {
          0%,100% { box-shadow: 0 0 12px rgba(212,175,55,0.06); }
          50% { box-shadow: 0 0 40px rgba(212,175,55,0.22); }
        }
        @keyframes shimmer {
          0% { left: -110%; }
          60% { left: 110%; }
          100% { left: 110%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%,100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.07); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
