import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { GitaCard } from "@/components/dashboard/GitaCard";
import AkashicSiddhaReading from "@/components/vedic/AkashicSiddhaReading";
import { QuickActionFallback } from "@/features/library/QuickActionFallback";
import { useQuickActionItems } from "@/features/library/useQuickActionItems";
import { resolveQuickActionItem } from "@/features/library/quickActionResolver";
import { usePresenceState } from "@/features/presence/usePresenceState";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useMeditationContentLanguage } from "@/features/meditations/useContentLanguage";
import { useMembership } from "@/hooks/useMembership";
import { getTierRank, FEATURE_TIER, getSalesPageForRank, hasFeatureAccess } from "@/lib/tierAccess";
import { useAuth } from "@/hooks/useAuth";
import { useAkashicAccess } from "@/hooks/useAkashicAccess";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getDayPhase } from "@/utils/postSessionContext";
import SacredRevealGate from "@/components/SacredRevealGate";
import { supabase } from "@/integrations/supabase/client";

interface ExploreVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  channelTitle: string;
}

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dayPhase = getDayPhase();
  const { playUniversalAudio } = useMusicPlayer();
  const { allAudioItems } = useQuickActionItems();
  const { language: meditationLanguage } = useMeditationContentLanguage();
  const { isPremium, tier } = useMembership();
  const { user } = useAuth();
  const { hasAccess: hasAkashicAccess } = useAkashicAccess(user?.id);
  const { isAdmin } = useAdminRole();
  const [showFallback, setShowFallback] = useState(false);
  const [akashicOpen, setAkashicOpen] = useState(false);
  const [gitaOpen, setGitaOpen] = useState(false);
  const [sacredRevealOpen, setSacredRevealOpen] = useState(false);
  const presence = usePresenceState();
  const userHouse = 12;
  const onQuick = (key: "calm" | "heart" | "pause" | "sleep") => {
    if (key === "pause") {
      const item = resolveQuickActionItem(allAudioItems, "pause", meditationLanguage);
      if (item) { setShowFallback(false); playUniversalAudio(item); }
      else navigate("/breathing");
      return;
    }
    const item = resolveQuickActionItem(allAudioItems, key, meditationLanguage);
    if (!item) { setShowFallback(true); return; }
    setShowFallback(false);
    playUniversalAudio(item);
  };

  const [exploreVideos, setExploreVideos] = useState<ExploreVideo[]>([]);
  useEffect(() => {
    supabase.functions.invoke('fetch-youtube-videos').then(({ data }) => {
      if (data?.videos) setExploreVideos(data.videos.slice(0, 4));
    });
  }, []);

  // ── inline style helpers (no className, pure inline for SQI design) ──
  const SL = ({ label, delay = '0s' }: { label: string; delay?: string }) => (
    <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.28)', padding: '28px 20px 11px', animation: `sqFadeUp 0.4s ${delay} ease both` }}>{label}</div>
  );
  const Badge = ({ label, v = 'gold' }: { label: string; v?: 'gold'|'muted'|'red'|'purple' }) => {
    const s: Record<string, React.CSSProperties> = {
      gold:   { background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.24)', color: 'rgba(212,175,55,0.85)' },
      muted:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.42)' },
      red:    { background: 'rgba(255,55,55,0.12)', border: '1px solid rgba(255,55,55,0.25)', color: 'rgba(255,110,110,0.85)' },
      purple: { background: 'rgba(160,80,240,0.14)', border: '1px solid rgba(160,80,240,0.28)', color: 'rgba(190,140,255,0.8)' },
    };
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase' as const, borderRadius: 20, padding: '2px 8px', ...s[v] }}>{label}</span>;
  };
  const TI = ({ children, pulse }: { children: React.ReactNode; pulse?: boolean }) => (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11, flexShrink: 0, animation: pulse ? 'sqDotPulse 4s ease-in-out infinite' : undefined }}>{children}</div>
  );

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 104 }}>

      {/* ══ HEADER ══ */}
      <div style={{ padding: '52px 20px 0', animation: 'sqFadeUp 0.35s ease both' }}>
        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.3)', marginBottom: 6 }}>◈ Sacred Field</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.1, margin: 0 }}>Converge</h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(255,255,255,0.28)', marginTop: 7 }}>Every portal. Every tool. Every dimension.</p>
      </div>

      {/* ══ SIDDHA PORTAL GATE ══ */}
      <SL label="◈ Siddha Portal" delay="0.04s" />
      <div
        onClick={() => navigate(hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) ? '/siddha-portal' : '/siddha-quantum')}
        style={{ margin: '0 16px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(212,175,55,0.11) 0%,rgba(212,175,55,0.04) 60%,rgba(0,0,0,0) 100%)', border: '1px solid rgba(212,175,55,0.28)', borderRadius: 22, padding: '22px 18px', cursor: 'pointer', animation: 'sqFadeUp 0.5s 0.06s ease both' }}
      >
        <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.09),transparent)', animation: 'sqShimmer 4s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><polygon points="12,2.2 21.8,19.5 2.2,19.5" stroke="rgba(212,175,55,0.9)" strokeWidth="1.3" fill="none"/><polygon points="12,21.8 2.2,4.5 21.8,4.5" stroke="rgba(212,175,55,0.72)" strokeWidth="1.1" fill="none"/><circle cx="12" cy="12" r="1.8" fill="rgba(212,175,55,0.95)"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8.5, fontWeight: 800, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.88)', marginBottom: 3 }}>Siddha Portal</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.36)' }}>18 Masters · Nāḍī Oracle · Quantum Field</div>
            </div>
          </div>
          {hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) ? <Badge label="Active" /> : <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.38)' }}>45€/mo</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 16 }}>
          {[
            { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2"/><circle cx="12" cy="12" r="4.5" stroke="rgba(212,175,55,0.5)" strokeWidth="1"/><circle cx="12" cy="12" r="1.5" fill="rgba(212,175,55,0.75)"/></svg>, label: '18\nMasters' },
            { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12 Q8 6 12 12 Q16 18 20 12" stroke="rgba(212,175,55,0.7)" strokeWidth="1.3" fill="none"/><path d="M4 8 Q8 2 12 8 Q16 14 20 8" stroke="rgba(212,175,55,0.35)" strokeWidth="1" fill="none"/></svg>, label: 'Nāḍī\nOracle' },
            { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="12,3 22,21 2,21" stroke="rgba(212,175,55,0.7)" strokeWidth="1.2" fill="none"/><polygon points="12,9 19,21 5,21" stroke="rgba(212,175,55,0.38)" strokeWidth="0.9" fill="none"/><circle cx="12" cy="15" r="1.5" fill="rgba(212,175,55,0.7)"/></svg>, label: 'Yantra\nShield' },
            { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="13,2 4,14 11,14 11,22 20,10 13,10" stroke="rgba(212,175,55,0.8)" strokeWidth="1.3" strokeLinejoin="round" fill="rgba(212,175,55,0.12)"/></svg>, label: 'Quantum\nField' },
          ].map(({ svg, label }, i) => (
            <div key={i} style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 11, padding: '9px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              {svg}
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 5.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.48)', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={(e) => { e.stopPropagation(); navigate(hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) ? '/siddha-portal' : '/siddha-quantum'); }} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) ? 'Enter the Portal →' : 'Unlock Siddha-Quantum to Enter →'}
        </button>
      </div>

      {/* ══ PRĀṆIC BREATHING ══ */}
      <SL label="◈ Prāṇic Breathing" delay="0.1s" />
      <div
        onClick={() => navigate('/breathing')}
        style={{ margin: '0 16px', borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.22)', background: 'linear-gradient(160deg,rgba(10,40,80,0.8) 0%,rgba(5,15,35,0.95) 55%,rgba(212,175,55,0.06) 100%)', animation: 'sqFadeUp 0.45s 0.12s ease both' }}
      >
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ opacity: 0.12 }}>
            <path fill="rgba(212,175,55,0.4)">
              <animate attributeName="d" dur="5s" repeatCount="indefinite" values="M0 30 Q50 10 100 30 Q150 50 200 30 Q250 10 300 30 Q350 50 400 30 L400 60 L0 60 Z;M0 30 Q50 50 100 30 Q150 10 200 30 Q250 50 300 30 Q350 10 400 30 L400 60 L0 60 Z;M0 30 Q50 10 100 30 Q150 50 200 30 Q250 10 300 30 Q350 50 400 30 L400 60 L0 60 Z"/>
            </path>
          </svg>
        </div>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(30,80,160,0.25)', border: '1px solid rgba(100,160,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'sqBreathe 5s ease-in-out infinite' }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M4 14 Q8 6 14 14 Q20 22 24 14" stroke="rgba(120,180,255,0.85)" strokeWidth="1.8" fill="none"/><path d="M4 10 Q9 2 14 10 Q19 18 24 10" stroke="rgba(120,180,255,0.4)" strokeWidth="1.2" fill="none"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8.5, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(140,190,255,0.82)', marginBottom: 3 }}>Prāṇic Breathing</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.32)' }}>Ancient Siddha breath science</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Kumbhaka\nPrāṇāyāma', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="rgba(120,180,255,0.7)" strokeWidth="1.3" fill="none"><animate attributeName="r" values="7;9;7" dur="4s" repeatCount="indefinite"/></circle><circle cx="12" cy="12" r="3" fill="rgba(120,180,255,0.2)" stroke="rgba(120,180,255,0.6)" strokeWidth="1"/></svg> },
              { label: 'Nāḍī\nShodhana',      svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12 Q8 6 12 12 Q16 18 20 12" stroke="rgba(120,180,255,0.75)" strokeWidth="1.4" fill="none"><animate attributeName="d" values="M4 12 Q8 6 12 12 Q16 18 20 12;M4 12 Q8 18 12 12 Q16 6 20 12;M4 12 Q8 6 12 12 Q16 18 20 12" dur="3.5s" repeatCount="indefinite"/></path></svg> },
              { label: 'Agni\nPrāṇa',          svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {/* Neural flame core */}
                  <path d="M12 3 C9 7 8 9.5 8 11.5 C8 14.5 9.8 16.5 12 18 C14.2 16.5 16 14.5 16 11.5 C16 9.5 15 7 12 3 Z" stroke="rgba(212,175,55,0.8)" strokeWidth="1.3" fill="rgba(212,175,55,0.15)">
                    <animate attributeName="d" dur="2.8s" repeatCount="indefinite"
                      values="
                        M12 3 C9 7 8 9.5 8 11.5 C8 14.5 9.8 16.5 12 18 C14.2 16.5 16 14.5 16 11.5 C16 9.5 15 7 12 3 Z;
                        M12 3 C9.2 6.8 8 9.3 8.2 11.6 C8.5 14.4 10 16.4 12 17.8 C14 16.4 15.5 14.4 15.8 11.6 C16 9.3 14.8 6.8 12 3 Z;
                        M12 3 C9 7 8 9.5 8 11.5 C8 14.5 9.8 16.5 12 18 C14.2 16.5 16 14.5 16 11.5 C16 9.5 15 7 12 3 Z" />
                  </path>
                  {/* Electric neural arcs */}
                  <path d="M6 14 C8 13 9 12 10 10.8" stroke="rgba(120,180,255,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="1.6s" repeatCount="indefinite" />
                  </path>
                  <path d="M18 14 C16 13 15 12 14 10.8" stroke="rgba(120,180,255,0.7)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <animate attributeName="stroke-opacity" values="0.8;0.2;0.8" dur="1.6s" repeatCount="indefinite" />
                  </path>
                  {/* Nucleus */}
                  <circle cx="12" cy="12" r="1.6" fill="rgba(180,210,255,0.9)">
                    <animate attributeName="r" values="1.5;2;1.5" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                </svg> },
            ].map(({ svg, label }, i) => (
              <div key={i} style={{ background: 'rgba(30,80,160,0.2)', border: '1px solid rgba(100,160,255,0.15)', borderRadius: 13, padding: '11px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {svg}
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(120,180,255,0.6)', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.62, marginBottom: 13 }}>Activate life-force through Siddha breath science. Kumbhaka retention, Nāḍī purification, Agni awakening.</p>
          <button
            style={{
              fontFamily: "'Montserrat',sans-serif",
              fontSize: 7.5,
              fontWeight: 800,
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              color: 'rgba(140,190,255,0.8)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              animation: 'sqDotPulse 3.4s ease-in-out infinite',
            }}
          >
            Begin Practice →
          </button>
        </div>
      </div>

      {/* ══ EXPLORE AKASHA — WISDOM ARCHIVE ══ */}
      <SL label="◈ Explore Akasha" delay="0.15s" />
      <div
        onClick={() => navigate('/explore-akasha')}
        style={{ margin: '0 16px', borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(160,80,240,0.25)', background: 'linear-gradient(160deg,rgba(50,15,90,0.7) 0%,rgba(20,5,40,0.95) 55%,rgba(212,175,55,0.06) 100%)', animation: 'sqFadeUp 0.45s 0.17s ease both' }}
      >
        <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(160,80,240,0.07),transparent)', animation: 'sqShimmer 5s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(160,80,240,0.15)', border: '1px solid rgba(160,80,240,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="10" stroke="rgba(190,140,255,0.7)" strokeWidth="1.2" fill="none"/>
                <circle cx="14" cy="14" r="5.5" stroke="rgba(190,140,255,0.4)" strokeWidth="1" fill="none"/>
                <circle cx="14" cy="14" r="2" fill="rgba(190,140,255,0.8)"/>
                <line x1="14" y1="4" x2="14" y2="8" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/>
                <line x1="14" y1="20" x2="14" y2="24" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/>
                <line x1="4" y1="14" x2="8" y2="14" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/>
                <line x1="20" y1="14" x2="24" y2="14" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8.5, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(190,140,255,0.85)', marginBottom: 3 }}>Explore Akasha</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.36)' }}>The Wisdom Archive</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Divine\nTransmissions', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2 L12 22" stroke="rgba(190,140,255,0.7)" strokeWidth="1.2"/><path d="M6 8 L12 2 L18 8" stroke="rgba(190,140,255,0.7)" strokeWidth="1.2" fill="none"/><circle cx="12" cy="14" r="3" stroke="rgba(190,140,255,0.5)" strokeWidth="1" fill="rgba(190,140,255,0.1)"/></svg> },
              { label: 'Oracle\nTalks', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="rgba(190,140,255,0.6)" strokeWidth="1.2" fill="none"/><circle cx="12" cy="10" r="2.5" fill="rgba(190,140,255,0.3)" stroke="rgba(190,140,255,0.7)" strokeWidth="1"/><path d="M8 18 Q12 14 16 18" stroke="rgba(190,140,255,0.5)" strokeWidth="1" fill="none"/></svg> },
              { label: 'Sacred\nSeries', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="rgba(190,140,255,0.6)" strokeWidth="1.2" fill="none"/><line x1="8" y1="8" x2="16" y2="8" stroke="rgba(190,140,255,0.4)" strokeWidth="1"/><line x1="8" y1="12" x2="16" y2="12" stroke="rgba(190,140,255,0.4)" strokeWidth="1"/><line x1="8" y1="16" x2="13" y2="16" stroke="rgba(190,140,255,0.4)" strokeWidth="1"/></svg> },
            ].map(({ svg, label }, i) => (
              <div key={i} style={{ background: 'rgba(160,80,240,0.1)', border: '1px solid rgba(160,80,240,0.15)', borderRadius: 13, padding: '11px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {svg}
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(190,140,255,0.6)', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.62, marginBottom: 13 }}>Timeless teachings, deeper spiritual transmissions, and sacred frequency talks. English & Swedish audio.</p>
          <button
            style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(190,140,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Enter the Archive →
          </button>
        </div>
      </div>

      {/* ══ SACRED TOOLS ══ */}
      <SL label="◈ Sacred Tools" delay="0.18s" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'sqFadeUp 0.4s 0.2s ease both' }}>
        <div onClick={() => hasFeatureAccess(isAdmin, tier, FEATURE_TIER.quantumApothecary) ? navigate('/quantum-apothecary') : navigate('/akasha-infinity')} style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.07),transparent)', animation: 'sqShimmer 5.5s 1.2s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="2050" /></div>
          <TI pulse><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><path d="M8 7 L8 4 C8 3.4 8.4 3 9 3 L15 3 C15.6 3 16 3.4 16 4 L16 7" stroke="rgba(212,175,55,0.55)" strokeWidth="1.2"/><circle cx="12" cy="13" r="2.5" stroke="rgba(212,175,55,0.7)" strokeWidth="1.2"/><line x1="12" y1="10.5" x2="12" y2="8.5" stroke="rgba(212,175,55,0.45)" strokeWidth="1"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>Quantum<br/>Apothecary</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Siddha bio-resonance platform</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        <div onClick={() => hasFeatureAccess(isAdmin, tier, FEATURE_TIER.virtualPilgrimage) ? navigate('/temple-home') : navigate('/akasha-infinity')} style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="24/7" v="muted" /></div>
          <TI><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgba(212,175,55,0.7)" strokeWidth="1.3"/><path d="M12 3 C12 3 8 7 8 12 C8 17 12 21 12 21" stroke="rgba(212,175,55,0.45)" strokeWidth="1.1"/><path d="M12 3 C12 3 16 7 16 12 C16 17 12 21 12 21" stroke="rgba(212,175,55,0.45)" strokeWidth="1.1"/><line x1="3.5" y1="9" x2="20.5" y2="9" stroke="rgba(212,175,55,0.3)" strokeWidth="1"/><line x1="3.5" y1="15" x2="20.5" y2="15" stroke="rgba(212,175,55,0.3)" strokeWidth="1"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>Virtual<br/>Pilgrimage</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Sacred site resonance anchor</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        <div
          onClick={() => isAdmin ? navigate('/akashic-reading/full') : hasAkashicAccess ? navigate('/akashic-records') : setSacredRevealOpen(true)}
          style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg,rgba(80,15,140,0.22),rgba(50,8,100,0.15),rgba(0,0,0,0))', border: '1px solid rgba(130,70,220,0.28)', borderRadius: 18, padding: '20px 18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(130,70,220,0.08),transparent)', animation: 'sqShimmer 6s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(130,70,220,0.12)', border: '1px solid rgba(130,70,220,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="3" stroke="rgba(180,120,255,0.8)" strokeWidth="1.4"/><path d="M5 20 C5 15.6 8.1 12 12 12 C15.9 12 19 15.6 19 20" stroke="rgba(180,120,255,0.55)" strokeWidth="1.4" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="rgba(180,120,255,0.45)" strokeWidth="1.3"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.36em', textTransform: 'uppercase', color: 'rgba(175,130,255,0.72)', marginBottom: 3 }}>Akashic Decoder</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)' }}>15-page soul manuscript transmission</div>
              </div>
            </div>
            <Badge label="Secret" v="purple" />
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.33)', lineHeight: 1.6, marginBottom: 11 }}>Unlock your personalized transmission — past lives, dharma contracts, soul purpose decoded through Akashic field access.</p>
          <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.36em', textTransform: 'uppercase', color: 'rgba(175,130,255,0.58)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Request Your Reading →</button>
        </div>
        <div onClick={() => hasFeatureAccess(isAdmin, tier, FEATURE_TIER.vayuProtocol) ? navigate('/vayu-protocol') : navigate('/siddha-quantum')} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="2060" /></div>
          <TI><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="9" ry="5" stroke="rgba(212,175,55,0.65)" strokeWidth="1.2" fill="none"/><ellipse cx="12" cy="12" rx="9" ry="5" stroke="rgba(212,175,55,0.28)" strokeWidth="0.9" fill="none" transform="rotate(60,12,12)"/><circle cx="12" cy="12" r="2.2" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.65)" strokeWidth="1"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>Vayu<br/>Protocol</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Golden Torus · Sapphire Icosahedron</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        <div onClick={() => hasFeatureAccess(isAdmin, tier, FEATURE_TIER.sriYantraShield) ? navigate('/sri-yantra-shield') : navigate('/siddha-quantum')} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="v2.6" /></div>
          <TI><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'sqBreathe 5s ease-in-out infinite' }}><polygon points="12,2.5 21.5,20 2.5,20" stroke="rgba(212,175,55,0.85)" strokeWidth="1.3" fill="none"/><polygon points="12,21.5 2.5,4 21.5,4" stroke="rgba(212,175,55,0.68)" strokeWidth="1.1" fill="none"/><polygon points="12,6.5 19,19 5,19" stroke="rgba(212,175,55,0.48)" strokeWidth="0.9" fill="none"/><circle cx="12" cy="12" r="1.5" fill="rgba(212,175,55,0.92)"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>Sri Yantra<br/>Shield</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Quantum flux · GLOBAL</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        <div onClick={() => hasFeatureAccess(isAdmin, tier, FEATURE_TIER.palmOracle) ? navigate('/hand-analyzer') : navigate('/akasha-infinity')} style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '18px 16px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="Premium" /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TI><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M8 18 L8 8 C8 7.4 8.4 7 9 7 C9.6 7 10 7.4 10 8 L10 13" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><path d="M10 12 C10 11.4 10.4 11 11 11 C11.6 11 12 11.4 12 12 L12 13" stroke="rgba(212,175,55,0.7)" strokeWidth="1.3"/><path d="M12 12.5 C12 11.9 12.4 11.5 13 11.5 C13.6 11.5 14 11.9 14 12.5 L14 14" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2"/><path d="M8 15 C6 14 5 12 5 10" stroke="rgba(212,175,55,0.35)" strokeWidth="1.1"/><path d="M8 18 C8 19 9 20 10 20 L13 20 C15 20 16 18 16 16 L16 13 C16 12.4 15.6 12 15 12 C14.4 12 14 12.4 14 13" stroke="rgba(212,175,55,0.75)" strokeWidth="1.3" fill="none"/></svg></TI>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>Palm & Akashic Oracle</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Hand lines → Akashic verdict</div>
            </div>
          </div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
      </div>

      {/* ══ VEDIC & WISDOM ══ */}
      <SL label="◈ Vedic & Wisdom" delay="0.26s" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'sqFadeUp 0.4s 0.28s ease both' }}>
        <div onClick={() => navigate('/vedic-astrology')} style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 18, padding: '20px 18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.07),transparent)', animation: 'sqShimmer 5s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <TI pulse><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><line x1="12" y1="4" x2="12" y2="20" stroke="rgba(212,175,55,0.85)" strokeWidth="1.5"/><path d="M8 5 C8 5 8 9.5 12 9.5 C16 9.5 16 5 16 5" stroke="rgba(212,175,55,0.85)" strokeWidth="1.5" fill="none"/><line x1="8" y1="5" x2="8" y2="8" stroke="rgba(212,175,55,0.58)" strokeWidth="1.3"/><line x1="16" y1="5" x2="16" y2="8" stroke="rgba(212,175,55,0.58)" strokeWidth="1.3"/></svg></TI>
              <div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>Vedic Oracle</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)' }}>Jyotish · Dasha · Hora · Akashic Records</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.24)', color: 'rgba(212,175,55,0.85)', borderRadius: 20, padding: '2px 8px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'sqLiveFlash 1.8s ease-in-out infinite', display: 'inline-block' }} />Live
            </div>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.9rem', color: 'rgba(255,255,255,0.44)', lineHeight: 1.62, marginBottom: 12 }}>Mercury Dasha active. Venus Hora — auspicious for creative and relational ventures this week.</p>
          <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Open Full Reading →</button>
        </div>
        {[
          { title: 'Ayurveda',       sub: 'Vata-Pitta · Daily guidance',        href: '/ayurveda',       premium: true,  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2 C12 2 4 8 4 14 C4 18.4 7.6 22 12 22 C16.4 22 20 18.4 20 14 C20 8 12 2 12 2Z" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4" fill="rgba(212,175,55,0.1)"/><path d="M12 8 C12 8 8 12 8 15 C8 17.2 9.8 19 12 19" stroke="rgba(212,175,55,0.38)" strokeWidth="1.1" fill="none"/></svg> },
          { title: 'Vastu',          sub: 'Abundance Architect',                href: '/vastu',          premium: true,  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="10" rx="1" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><path d="M2 11 L12 3 L22 11" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><rect x="9" y="15" width="6" height="6" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/></svg> },
          { title: 'Mantras',        sub: 'Sacred sound library',               href: '/mantras',        premium: false, svg: <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><text x="3" y="17" fontSize="16" fill="rgba(212,175,55,0.85)" fontFamily="serif">ॐ</text></svg> },
          { title: 'Bhagavad Gita',  sub: 'Daily verse · Planetary transit',    href: null,              premium: false, svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="14" height="18" rx="2" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><line x1="8" y1="8" x2="16" y2="8" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="11" x2="16" y2="11" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="14" x2="13" y2="14" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/></svg> },
        ].map(({ title, sub, href, premium, svg }) => (
          <div key={title} onClick={() => {
            if (!href) { setGitaOpen(!gitaOpen); return; }
            if (premium && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.ayurveda)) { navigate('/prana-flow'); return; }
            navigate(href);
          }} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            {premium && <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="Premium" /></div>}
            <TI>{svg}</TI>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>{title}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{sub}</div>
            <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
          </div>
        ))}
        {gitaOpen && <div style={{ gridColumn: 'span 2' }}><GitaCard /></div>}
      </div>

      {/* ══ ABUNDANCE & CREATION ══ */}
      <SL label="◈ Abundance & Creation" delay="0.32s" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'sqFadeUp 0.4s 0.34s ease both' }}>
        <div onClick={() => navigate('/library/abundance')} style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 18, padding: '20px 18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><polygon points="12,2 13.8,8 20,8 14.9,11.9 16.7,18 12,14.1 7.3,18 9.1,11.9 4,8 10.2,8" stroke="rgba(212,175,55,0.85)" strokeWidth="1.3" fill="rgba(212,175,55,0.1)"/><circle cx="12" cy="12" r="2.5" fill="rgba(212,175,55,0.18)" stroke="rgba(212,175,55,0.55)" strokeWidth="0.9"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 3 }}>Abundance</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.28)' }}>Inner wealth & life support system</div>
            </div>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.37)', lineHeight: 1.6, marginBottom: 11 }}>Wealth consciousness, prosperity activation, financial clearing — aligned with your Vedic chart and dharma path.</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {['Prosperity Codes', 'Money Blocks', 'Lakshmi Sadhana'].map((label, i) => <Badge key={label} label={label} v={i === 0 ? 'gold' : 'muted'} />)}
          </div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        <div onClick={() => navigate('/creative-soul/store')} style={{ background: 'linear-gradient(135deg,rgba(170,55,200,0.08),rgba(0,0,0,0))', border: '1px solid rgba(170,60,210,0.18)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <TI><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2 C12 2 9 8 4 10 C9 12 12 22 12 22 C12 22 15 12 20 10 C15 8 12 2 12 2Z" stroke="rgba(180,110,255,0.8)" strokeWidth="1.4" fill="rgba(160,60,220,0.1)"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.36em', textTransform: 'uppercase', color: 'rgba(175,120,255,0.62)', marginBottom: 5 }}>Creative Soul</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Create with AI · Sacred art</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(175,120,255,0.2)', fontSize: 11 }}>→</span>
        </div>
        <div onClick={() => navigate('/shop')} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <TI><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 2 L2 8 L6 8 L6 20 C6 20.6 6.4 21 7 21 L17 21 C17.6 21 18 20.6 18 20 L18 8 L22 8 L18 2 L14 5 C13.3 3.8 12.7 3 12 3 C11.3 3 10.7 3.8 10 5 Z" stroke="rgba(212,175,55,0.75)" strokeWidth="1.3" fill="rgba(212,175,55,0.07)"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>Healing<br/>Clothes</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Laila's sacred collection</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
      </div>

      {/* ══ VIDEOS — YOUTUBE CHANNEL LIVE ══ */}
      <SL label="◈ Videos · Sacred Channel" delay="0.38s" />
      <div style={{ margin: '0 16px', animation: 'sqFadeUp 0.4s 0.4s ease both' }}>
        {exploreVideos[0] && (
          <div onClick={() => navigate('/spiritual-education')} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', marginBottom: 10, border: '1px solid rgba(212,175,55,0.18)' }}>
            <div style={{ position: 'relative' }}>
              <img src={exploreVideos[0].thumbnail} alt={exploreVideos[0].title} style={{ width: '100%', height: 155, objectFit: 'cover', display: 'block', background: '#111' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1.5px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.9)"/></svg>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.9)"/></svg>
                </div>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)' }}>{exploreVideos[0].channelTitle}</span>
              </div>
            </div>
            <div style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginBottom: 4, lineHeight: 1.3 }}>{exploreVideos[0].title}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)' }}>Watch & earn 100 SHC</div>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
          {exploreVideos.slice(1, 3).map(video => (
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
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', lineHeight: 1.35, marginBottom: 3 }}>{video.title.length > 28 ? video.title.slice(0, 28) + '…' : video.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" fill="rgba(212,175,55,0.5)"/></svg>
                  <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 5.5, fontWeight: 800, color: 'rgba(212,175,55,0.5)' }}>+100 SHC</span>
                </div>
              </div>
            </div>
          ))}
          <div onClick={() => navigate('/spiritual-education')} style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.18)', background: 'linear-gradient(135deg,rgba(212,175,55,0.08),rgba(0,0,0,0))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, padding: '14px 10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.7)"/><circle cx="12" cy="12" r="10" stroke="rgba(212,175,55,0.35)" strokeWidth="1.2" fill="none"/></svg>
            <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', textAlign: 'center' }}>All Videos →</span>
          </div>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(255,255,255,0.22)', textAlign: 'center', marginTop: 4 }}>Watch & earn 100 SHC per video</p>
      </div>

      {/* ══ DEEPEN YOUR PRACTICE ══ */}
      <SL label="◈ Deepen Your Practice" delay="0.44s" />
      <div style={{ animation: 'sqFadeUp 0.4s 0.46s ease both' }}>
        {([
          { title: 'Avataric Initiation Paths',  sub: 'Deepen your practice',           href: '/courses',                 iBg: 'linear-gradient(135deg,rgba(180,60,40,.2),rgba(120,30,10,.15))',  iBd: 'rgba(200,80,50,.2)',  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(212,175,55,.75)" strokeWidth="1.4"/><line x1="7" y1="8" x2="17" y2="8" stroke="rgba(212,175,55,.45)" strokeWidth="1.1"/><line x1="7" y1="12" x2="17" y2="12" stroke="rgba(212,175,55,.45)" strokeWidth="1.1"/><line x1="7" y1="16" x2="13" y2="16" stroke="rgba(212,175,55,.45)" strokeWidth="1.1"/></svg> },
          { title: 'Siddha-Quantum Mentorship',  sub: '6-Month Program',                href: '/transformation',          iBg: 'linear-gradient(135deg,rgba(160,40,40,.2),rgba(100,20,10,.15))',  iBd: 'rgba(180,60,40,.2)',  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 21 C12 21 4 16 4 9.5 C4 6.4 6.7 4 10 4 C11 4 12 4.5 12 4.5 C12 4.5 13 4 14.5 4 C17.5 4 20 6.4 20 9.5 C20 16 12 21 12 21Z" stroke="rgba(212,175,55,.75)" strokeWidth="1.4" fill="rgba(212,175,55,.07)"/></svg> },
          { title: '1-on-1 Neural-Sync',         sub: '1-on-1 with Adam or Laila',      href: '/private-sessions',        iBg: 'linear-gradient(135deg,rgba(40,100,40,.2),rgba(10,60,20,.15))',   iBd: 'rgba(60,130,60,.2)',  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.5" stroke="rgba(212,175,55,.75)" strokeWidth="1.3"/><circle cx="16.5" cy="9" r="2.5" stroke="rgba(212,175,55,.5)" strokeWidth="1.1"/><path d="M2 20 C2 16.7 5.1 14 9 14 C12.9 14 16 16.7 16 20" stroke="rgba(212,175,55,.75)" strokeWidth="1.3" fill="none"/></svg> },
          { title: 'Aetheric Code Harmonics',    sub: 'Personalized for you',           href: '/affirmation-soundtrack',  iBg: 'linear-gradient(135deg,rgba(60,80,30,.2),rgba(30,50,10,.15))',   iBd: 'rgba(80,110,40,.2)',  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 18 L15 18" stroke="rgba(212,175,55,.75)" strokeWidth="1.4" strokeLinecap="round"/><line x1="12" y1="5" x2="12" y2="18" stroke="rgba(212,175,55,.6)" strokeWidth="1.2"/><path d="M7 8 Q12 5 17 8" stroke="rgba(212,175,55,.8)" strokeWidth="1.4" fill="none"/></svg> },
          { title: 'Lineage Guardian Certification', sub: 'Become certified in 12 months',  href: '/certification',           iBg: 'linear-gradient(135deg,rgba(180,140,20,.15),rgba(120,90,10,.12))', iBd: 'rgba(212,175,55,.18)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" stroke="rgba(212,175,55,.78)" strokeWidth="1.3" fill="rgba(212,175,55,.08)"/></svg> },
        ] as const).map(({ title, sub, href, iBg, iBd, svg }) => (
          <div key={title} onClick={() => navigate(href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: '50%', background: iBg, border: `1px solid ${iBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{svg}</div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginBottom: 2 }}>{title}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{sub}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}><span style={{ color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span></div>
          </div>
        ))}
      </div>

      {/* ══ CONNECT ══ */}
      <SL label="◈ Connect" delay="0.5s" />
      <div style={{ animation: 'sqFadeUp 0.4s 0.52s ease both' }}>
        {([
          { title: 'Stargate',            sub: 'Sovereign Access · Weekly live sessions',  href: '/stargate',       badge: 'Swedish',   bv: 'muted' as const, iBg: 'rgba(212,175,55,.08)', iBd: 'rgba(212,175,55,.18)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" stroke="rgba(212,175,55,.8)" strokeWidth="1.3" fill="rgba(212,175,55,.1)"/></svg> },
          { title: 'Divine Sangha Nexus', sub: 'Connect with guides and members',         href: '/community',      badge: undefined,   bv: 'gold' as const,  iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="rgba(212,175,55,.7)" strokeWidth="1.3"/><circle cx="16" cy="7" r="2.5" stroke="rgba(212,175,55,.48)" strokeWidth="1.1"/><path d="M2 19 C2 15.7 5.1 13 9 13 C12.9 13 16 15.7 16 19" stroke="rgba(212,175,55,.7)" strokeWidth="1.3" fill="none"/><path d="M16 13 C18.8 13 21 15 21 18" stroke="rgba(212,175,55,.38)" strokeWidth="1.1" fill="none"/></svg> },
          { title: 'Vedic-Frequency Casts',             sub: 'Streams on Spotify',                href: '/podcast',        badge: undefined,   bv: 'gold' as const,  iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgba(212,175,55,.62)" strokeWidth="1.3"/><circle cx="12" cy="12" r="4" stroke="rgba(212,175,55,.8)" strokeWidth="1.2"/></svg> },
          { title: 'Dharma Ascendence',   sub: 'Top earners win monthly',           href: '/leaderboard',    badge: '5,000 SHC', bv: 'gold' as const,  iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" stroke="rgba(212,175,55,.62)" strokeWidth="1.3"/><circle cx="12" cy="12" r="1.8" fill="rgba(212,175,55,.5)"/></svg> },
          { title: 'Biofield Expansion',  sub: '30% affiliate commission',          href: '/invite-friends', badge: '30%',        bv: 'gold' as const,  iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.5" stroke="rgba(212,175,55,.7)" strokeWidth="1.3"/><path d="M2 20 C2 16.7 5.1 14 9 14 C10.2 14 11.2 14.3 12.1 14.7" stroke="rgba(212,175,55,.7)" strokeWidth="1.3" fill="none"/><line x1="16" y1="15" x2="20" y2="19" stroke="rgba(212,175,55,.48)" strokeWidth="1.3"/><line x1="20" y1="15" x2="16" y2="19" stroke="rgba(212,175,55,.48)" strokeWidth="1.3"/><circle cx="18" cy="17" r="4" stroke="rgba(212,175,55,.3)" strokeWidth="1.1"/></svg> },
        ] as const).map(({ title, sub, href, badge, bv, iBg, iBd, svg }) => (
          <div key={title} onClick={() => navigate(href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: '50%', background: iBg, border: `1px solid ${iBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{svg}</div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginBottom: 2 }}>{title}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{sub}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
              {badge && <Badge label={badge} v={bv} />}
              <span style={{ color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══ WISDOM QUOTE ══ */}
      <div style={{ margin: '22px 16px 0', padding: '20px 16px', borderTop: '1px solid rgba(212,175,55,0.07)', animation: 'sqFadeUp 0.4s 0.56s ease both' }}>
        <ParamahamsaVishwanandaDailyCard />
      </div>

      {/* ══ PRESERVED MODALS — DO NOT REMOVE ══ */}
      <Dialog open={akashicOpen} onOpenChange={setAkashicOpen}>
        <DialogContent className="max-w-3xl bg-[#0a0a0a] border-[#D4AF37]/30 p-0 overflow-hidden">
          <AkashicSiddhaReading userHouse={userHouse} isModal />
        </DialogContent>
      </Dialog>
      <SacredRevealGate open={sacredRevealOpen} onOpenChange={setSacredRevealOpen} />

    </div>
  );
}
