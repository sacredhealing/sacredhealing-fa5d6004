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
import { SQIApothecaryBanner } from '@/components/banners/SQIApothecaryBanner';

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
  const { isPremium, tier, settled } = useMembership();
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

  const SL = ({ label, delay = '0s' }: { label: string; delay?: string }) => (
    <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.28)', padding: '28px 20px 11px', animation: `sqFadeUp 0.4s ${delay} ease both` }}>{label}</div>
  );
  const Badge = ({ label, v = 'gold' }: { label: string; v?: 'gold'|'muted'|'red'|'purple' }) => {
    const s: Record<string, React.CSSProperties> = {
      gold: { background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.24)', color: 'rgba(212,175,55,0.85)' },
      muted: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.42)' },
      red: { background: 'rgba(255,55,55,0.12)', border: '1px solid rgba(255,55,55,0.25)', color: 'rgba(255,110,110,0.85)' },
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
      <div style={{ padding: '24px 20px 0', animation: 'sqFadeUp 0.35s ease both' }}>
        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.3)', marginBottom: 6 }}>{t('converge.headerMicro')}</p>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(26px, 7vw, 38px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0, background: 'linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', animation: 'goldShimmer 5s linear infinite' }}>
          {t('converge.title')}
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(255,255,255,0.28)', marginTop: 7 }}>{t('converge.tagline')}</p>
      </div>

      {/* ══ SIDDHA PORTAL — SACRED GEOMETRY HOLOGRAM ══ */}
      <div style={{ padding: '28px 20px 11px' }}>
        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.28)' }}>SIDDHA PORTAL · GATEWAY OF THE 18 MASTERS</span>
      </div>

      <div
        onClick={() => navigate('/siddha-portal')}
        style={{
          margin: '0 16px',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 35%, rgba(45,26,0,0.98) 0%, rgba(15,8,0,0.99) 55%, rgba(5,5,5,1) 100%)',
          border: '1px solid rgba(212,175,55,0.55)',
          borderRadius: 28,
          cursor: 'pointer',
          animation: 'sqFadeUp 0.5s 0.06s ease both',
          boxShadow: '0 0 80px rgba(212,175,55,0.14), 0 0 200px rgba(212,175,55,0.04), inset 0 0 100px rgba(212,175,55,0.03)',
        }}
      >
        {/* Pulsing rim */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid rgba(212,175,55,0.2)', animation: 'portalRim 4s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* ── SACRED GEOMETRY HOLOGRAM SVG ── */}
        <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
          <svg viewBox="0 0 360 320" width="100%" height="320" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <defs>
              <radialGradient id="portalCore" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="rgba(255,220,80,0.3)"/>
                <stop offset="45%" stopColor="rgba(212,175,55,0.07)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>
              <radialGradient id="babajiAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,240,130,0.55)"/>
                <stop offset="55%" stopColor="rgba(212,175,55,0.18)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>
              <radialGradient id="bogarAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,210,70,0.5)"/>
                <stop offset="55%" stopColor="rgba(180,130,20,0.15)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>
              <filter id="gblur2"><feGaussianBlur stdDeviation="2.5"/></filter>
              <filter id="gblur6"><feGaussianBlur stdDeviation="6"/></filter>
              <linearGradient id="sweepG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(212,175,55,0)"/>
                <stop offset="50%" stopColor="rgba(212,175,55,0.06)"/>
                <stop offset="100%" stopColor="rgba(212,175,55,0)"/>
              </linearGradient>
            </defs>

            {/* Background glow */}
            <ellipse cx="180" cy="150" rx="170" ry="140" fill="url(#portalCore)"/>

            {/* ── OUTER METATRON RINGS ── */}
            <circle cx="180" cy="150" r="132" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="0.8" strokeDasharray="3 9">
              <animateTransform attributeName="transform" type="rotate" values="0 180 150;360 180 150" dur="50s" repeatCount="indefinite"/>
            </circle>
            <circle cx="180" cy="150" r="132" fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="6">
              <animateTransform attributeName="transform" type="rotate" values="0 180 150;-360 180 150" dur="35s" repeatCount="indefinite"/>
            </circle>

            {/* ── SRI YANTRA — Upward triangles (Shiva/Masculine) ── */}
            <polygon points="180,28 298,208 62,208" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.3"/>
            <polygon points="180,52 284,202 76,202" fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="0.8"/>
            <polygon points="180,70 272,197 88,197" fill="none" stroke="rgba(212,175,55,0.14)" strokeWidth="0.6"/>

            {/* ── SRI YANTRA — Downward triangles (Shakti/Feminine) ── */}
            <polygon points="180,272 62,92 298,92" fill="rgba(255,200,60,0.03)" stroke="rgba(255,200,60,0.5)" strokeWidth="1.2"/>
            <polygon points="180,252 76,98 284,98" fill="none" stroke="rgba(255,200,60,0.22)" strokeWidth="0.8"/>
            <polygon points="180,232 90,104 270,104" fill="none" stroke="rgba(255,200,60,0.11)" strokeWidth="0.6"/>

            {/* ── FLOWER OF LIFE ── */}
            {[0,60,120,180,240,300].map((a, i) => {
              const r2 = a * Math.PI / 180;
              return <circle key={i} cx={180 + Math.cos(r2)*68} cy={150 + Math.sin(r2)*68} r="68" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"/>;
            })}

            {/* ── CHAKRA RINGS ── */}
            {[110,88,68,50,34].map((r, i) => (
              <circle key={i} cx="180" cy="150" r={r} fill="none" stroke="rgba(212,175,55,0.09)" strokeWidth="0.5">
                <animateTransform attributeName="transform" type="rotate" values={`${i%2===0?0:360} 180 150;${i%2===0?360:0} 180 150`} dur={`${22+i*7}s`} repeatCount="indefinite"/>
              </circle>
            ))}

            {/* ── PREMA PULSE RINGS ── */}
            {[0,1,2,3].map(i => (
              <circle key={i} cx="180" cy="150" r="20" fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="1.2">
                <animate attributeName="r" values="18;134" dur="3.8s" begin={`${i*0.95}s`} repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.75;0" dur="3.8s" begin={`${i*0.95}s`} repeatCount="indefinite"/>
              </circle>
            ))}

            {/* ── 18 SIDDHAS DOTS (6 triads) ── */}
            {[0,60,120,180,240,300].map((angle, i) => {
              const rad = angle * Math.PI / 180;
              const x = 180 + Math.cos(rad) * 112;
              const y = 150 + Math.sin(rad) * 112;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="5" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.65)" strokeWidth="0.9">
                    <animate attributeName="opacity" values="0.35;1;0.35" dur={`${1.8+i*0.35}s`} repeatCount="indefinite"/>
                  </circle>
                  <circle cx={x} cy={y} r="2.2" fill="rgba(255,240,100,0.85)">
                    <animate attributeName="r" values="1.5;3.2;1.5" dur={`${1.8+i*0.35}s`} repeatCount="indefinite"/>
                  </circle>
                </g>
              );
            })}

            {/* ══ BABAJI — Left luminous form ══ */}
            <ellipse cx="78" cy="158" rx="55" ry="64" fill="url(#babajiAura)"/>
            <ellipse cx="78" cy="158" rx="40" ry="50" fill="rgba(255,235,110,0.07)" filter="url(#gblur6)"/>
            <g transform="translate(78,158)">
              {/* Crown chakra glow */}
              <circle cx="0" cy="-60" r="8" fill="rgba(255,245,150,0.45)" filter="url(#gblur2)">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3.2s" repeatCount="indefinite"/>
                <animate attributeName="r" values="7;11;7" dur="3.2s" repeatCount="indefinite"/>
              </circle>
              {/* Long hair flows */}
              <path d="M-8,-54 Q-22,-72 -18,-86 Q-6,-96 2,-86 Q8,-76 6,-56" fill="rgba(212,175,55,0.18)" stroke="rgba(212,175,55,0.5)" strokeWidth="0.9"/>
              <path d="M8,-54 Q22,-72 18,-86" fill="none" stroke="rgba(212,175,55,0.38)" strokeWidth="0.9"/>
              <path d="M-6,-54 Q-30,-62 -28,-76" fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth="0.7"/>
              {/* Head */}
              <circle cx="0" cy="-42" r="16" fill="rgba(255,225,90,0.14)" stroke="rgba(212,175,55,0.72)" strokeWidth="1.1"/>
              {/* Third eye */}
              <ellipse cx="0" cy="-44" rx="3" ry="2" fill="rgba(255,245,130,0.95)">
                <animate attributeName="rx" values="2.5;4;2.5" dur="2.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite"/>
              </ellipse>
              {/* Neck */}
              <rect x="-5" y="-26" width="10" height="9" rx="3" fill="rgba(255,215,80,0.14)" stroke="rgba(212,175,55,0.55)" strokeWidth="0.8"/>
              {/* Torso — bare chest, seated */}
              <path d="M-20,-17 Q-25,0 -22,16 Q-10,25 0,25 Q10,25 22,16 Q25,0 20,-17 Q10,-24 0,-24 Q-10,-24 -20,-17Z" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.58)" strokeWidth="1"/>
              {/* Dhoti cloth indication */}
              <path d="M-22,16 Q-26,24 -22,34 Q-10,40 0,38 Q10,40 22,34 Q26,24 22,16" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.38)" strokeWidth="0.8"/>
              {/* Lotus hands in lap — Dhyan mudra */}
              <path d="M-12,6 Q-20,12 -18,20 Q-10,26 -4,20 Q-2,12 -6,6Z" fill="rgba(255,225,80,0.2)" stroke="rgba(212,175,55,0.65)" strokeWidth="0.8"/>
              <path d="M12,6 Q20,12 18,20 Q10,26 4,20 Q2,12 6,6Z" fill="rgba(255,225,80,0.2)" stroke="rgba(212,175,55,0.65)" strokeWidth="0.8"/>
              {/* Energy lines */}
              <line x1="-25" y1="0" x2="-40" y2="-14" stroke="rgba(212,175,55,0.22)" strokeWidth="0.7" strokeDasharray="3 4">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.5s" repeatCount="indefinite"/>
              </line>
              <line x1="25" y1="0" x2="40" y2="-14" stroke="rgba(212,175,55,0.22)" strokeWidth="0.7" strokeDasharray="3 4">
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite"/>
              </line>
            </g>
            {/* BABAJI label */}
            <text x="78" y="230" textAnchor="middle" fontFamily="'Cinzel',serif" fontSize="8.5" fontWeight="700" letterSpacing="2.5" fill="rgba(212,175,55,0.8)">BABAJI</text>
            <text x="78" y="241" textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize="6.5" fontStyle="italic" fill="rgba(212,175,55,0.42)">Immortal Himalayan Master</text>

            {/* ══ BOGAR — Right luminous form ══ */}
            <ellipse cx="282" cy="158" rx="55" ry="64" fill="url(#bogarAura)"/>
            <ellipse cx="282" cy="158" rx="40" ry="50" fill="rgba(255,200,60,0.06)" filter="url(#gblur6)"/>
            <g transform="translate(282,158)">
              {/* Crown glow */}
              <circle cx="0" cy="-60" r="8" fill="rgba(255,220,80,0.4)" filter="url(#gblur2)">
                <animate attributeName="opacity" values="0.3;0.85;0.3" dur="2.8s" repeatCount="indefinite"/>
                <animate attributeName="r" values="7;12;7" dur="2.8s" repeatCount="indefinite"/>
              </circle>
              {/* Turban / crown */}
              <path d="M-15,-54 Q-10,-68 0,-72 Q10,-68 15,-54 Q8,-48 0,-46 Q-8,-48 -15,-54Z" fill="rgba(212,155,30,0.22)" stroke="rgba(212,155,30,0.55)" strokeWidth="0.9"/>
              <path d="M-8,-72 Q0,-80 8,-72" fill="none" stroke="rgba(255,220,80,0.4)" strokeWidth="0.8"/>
              {/* Head */}
              <circle cx="0" cy="-40" r="16" fill="rgba(255,205,65,0.14)" stroke="rgba(212,155,30,0.72)" strokeWidth="1.1"/>
              {/* Beard */}
              <path d="M-10,-30 Q-15,-14 -12,0 Q0,7 12,0 Q15,-14 10,-30" fill="rgba(200,145,25,0.18)" stroke="rgba(212,155,30,0.42)" strokeWidth="0.7"/>
              {/* Third eye — Bogar Siddha mark */}
              <ellipse cx="0" cy="-42" rx="3" ry="2" fill="rgba(255,220,80,0.95)">
                <animate attributeName="rx" values="2.5;4;2.5" dur="2.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.65;1;0.65" dur="2.6s" repeatCount="indefinite"/>
              </ellipse>
              {/* Neck */}
              <rect x="-5" y="-24" width="10" height="8" rx="3" fill="rgba(255,205,65,0.14)" stroke="rgba(212,155,30,0.5)" strokeWidth="0.8"/>
              {/* Torso with sacred thread (janeu) */}
              <path d="M-20,-16 Q-24,0 -21,15 Q-10,24 0,24 Q10,24 21,15 Q24,0 20,-16 Q10,-22 0,-22 Q-10,-22 -20,-16Z" fill="rgba(212,155,30,0.07)" stroke="rgba(212,155,30,0.58)" strokeWidth="1"/>
              {/* Sacred thread */}
              <path d="M-13,-19 Q6,2 -5,22" fill="none" stroke="rgba(255,235,80,0.65)" strokeWidth="0.9"/>
              {/* Raised blessing hand (abhaya mudra) */}
              <path d="M16,-12 Q26,-22 24,-34 Q18,-40 12,-32 Q9,-22 16,-12Z" fill="rgba(255,215,70,0.2)" stroke="rgba(212,155,30,0.62)" strokeWidth="0.8"/>
              {/* Fingers extended */}
              <line x1="18" y1="-14" x2="22" y2="-32" stroke="rgba(212,155,30,0.4)" strokeWidth="0.6"/>
              <line x1="21" y1="-13" x2="26" y2="-30" stroke="rgba(212,155,30,0.35)" strokeWidth="0.5"/>
              {/* Lap hand */}
              <path d="M-12,5 Q-19,10 -17,18 Q-10,23 -4,18 Q-2,10 -6,5Z" fill="rgba(255,205,65,0.2)" stroke="rgba(212,155,30,0.6)" strokeWidth="0.8"/>
              {/* Alchemy vessel (Bogar was the greatest alchemist of 18 Siddhas) */}
              <ellipse cx="-22" cy="8" rx="6" ry="8" fill="rgba(212,155,30,0.1)" stroke="rgba(212,155,30,0.38)" strokeWidth="0.7">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/>
              </ellipse>
              <line x1="-22" y1="0" x2="-22" y2="-6" stroke="rgba(255,220,80,0.4)" strokeWidth="0.8">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite"/>
              </line>
              {/* Energy lines */}
              <line x1="25" y1="0" x2="42" y2="-12" stroke="rgba(212,155,30,0.22)" strokeWidth="0.7" strokeDasharray="3 4">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.7s" repeatCount="indefinite"/>
              </line>
            </g>
            {/* BOGAR label */}
            <text x="282" y="230" textAnchor="middle" fontFamily="'Cinzel',serif" fontSize="8.5" fontWeight="700" letterSpacing="2.5" fill="rgba(212,175,55,0.8)">BOGAR</text>
            <text x="282" y="241" textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize="6.5" fontStyle="italic" fill="rgba(212,175,55,0.42)">Siddha Alchemist · Navagraha</text>

            {/* ── CENTRAL BINDU / OM CORE ── */}
            <circle cx="180" cy="150" r="26" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.4">
              <animate attributeName="r" values="23;28;23" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="180" cy="150" r="14" fill="rgba(255,235,90,0.1)" stroke="rgba(212,175,55,0.75)" strokeWidth="1.2">
              <animate attributeName="r" values="12;17;12" dur="2.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="180" cy="150" r="5.5" fill="rgba(255,248,160,0.95)">
              <animate attributeName="r" values="4.5;7.5;4.5" dur="1.9s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.85;1;0.85" dur="1.9s" repeatCount="indefinite"/>
            </circle>

            {/* ── LIGHT RAYS from center to masters ── */}
            <line x1="154" y1="150" x2="116" y2="150" stroke="rgba(212,175,55,0.35)" strokeWidth="1.2" strokeDasharray="5 7">
              <animate attributeName="stroke-dashoffset" values="0;-24" dur="0.9s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.1s" repeatCount="indefinite"/>
            </line>
            <line x1="206" y1="150" x2="244" y2="150" stroke="rgba(212,175,55,0.35)" strokeWidth="1.2" strokeDasharray="5 7">
              <animate attributeName="stroke-dashoffset" values="0;24" dur="0.9s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.1s" repeatCount="indefinite"/>
            </line>

            {/* ── Sweep shimmer ── */}
            <rect x="-400" y="0" width="220" height="320" fill="url(#sweepG)">
              <animate attributeName="x" values="-400;800" dur="4.5s" repeatCount="indefinite"/>
            </rect>
          </svg>
        </div>

        {/* ── PORTAL TITLE BLOCK ── */}
        <div style={{ textAlign: 'center', padding: '2px 20px 0', position: 'relative', zIndex: 2 }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(24px, 6.5vw, 32px)',
            fontWeight: 700,
            letterSpacing: '0.14em',
            background: 'linear-gradient(135deg, #8A6500 0%, #C9960A 20%, #D4AF37 40%, #F5E17A 55%, #D4AF37 70%, #C9960A 85%, #8A6500 100%)',
            backgroundSize: '300% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'goldShimmer 3.5s linear infinite',
            marginBottom: 8,
          }}>
            SIDDHA PORTAL
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: '0.8rem',
            color: 'rgba(212,175,55,0.58)',
            lineHeight: 1.75,
            letterSpacing: '0.02em',
            marginBottom: 16,
          }}>
            18 Siddha Masters · Nādi Akasha Oracle · Quantum Field Activations<br/>
            Avataric Consciousness Blueprints · Sacred Mantra Transmissions<br/>
            Jyotish Light-Codes · Bhakti-Algorithms · Prema-Pulse Healing Field
          </div>

          {/* Access badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            {hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)
              ? <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.45)', color: '#D4AF37', padding: '5px 18px', borderRadius: 24, animation: 'portalRim 3s ease-in-out infinite' }}>⬡ PORTAL ACTIVE</span>
              : <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.22)', color: 'rgba(212,175,55,0.5)', padding: '5px 18px', borderRadius: 24 }}>SIDDHA-QUANTUM · €45/mo</span>
            }
          </div>
        </div>

        {/* ── 6 FEATURE TILES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '0 16px', marginBottom: 22 }}>
          {[
            { icon: '⬡', label: '18 Siddha\nMasters', sub: 'Agastya · Babaji · Bogar\nKonganar · Thirumoolar' },
            { icon: '◈', label: 'Nādi Akasha\nOracle', sub: 'Personal transmissions\ndirectly from Akasha' },
            { icon: '⚡', label: 'Quantum\nActivations', sub: 'Scalar wave codes\nJyotish Light-Fields' },
            { icon: '✦', label: 'Mantra\nTransmissions', sub: 'Sacred sound codes\nfor each Master' },
            { icon: '◉', label: 'Bhakti\nAlgorithms', sub: 'Prema-Pulse healing\nAvataric consciousness' },
            { icon: '❋', label: 'Avataric\nBlueprints', sub: 'Vishwananda · Babaji\nMahavatar maps' },
          ].map(({ icon, label, sub }, i) => (
            <div key={i} style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.16)', borderRadius: 15, padding: '11px 6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 17, color: 'rgba(212,175,55,0.78)', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.72)', textAlign: 'center', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{label}</span>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sub}</span>
            </div>
          ))}
        </div>

        {/* ── ENTER BUTTON ── */}
        <div style={{ padding: '0 16px 26px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/siddha-portal'); }}
            style={{
              fontFamily: "'Montserrat',sans-serif",
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.44em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.42)',
              borderRadius: 32,
              padding: '12px 32px',
              cursor: 'pointer',
              animation: 'portalRim 3.5s ease-in-out infinite',
              boxShadow: '0 0 30px rgba(212,175,55,0.08)',
            }}
          >
            {hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) ? '⬡  ENTER THE PORTAL' : '⬡  UNLOCK THE PORTAL'}
          </button>
        </div>
      </div>

      {/* ══ SQI APOTHECARY BANNER — full width under Siddha Portal ══ */}
      <div style={{ margin: '16px 0 0' }}>
        <SQIApothecaryBanner />
      </div>

      {/* ══ PRĀṆIC BREATHING ══ */}
      <SL label={t('converge.secPranic')} delay="0.1s" />
      <div onClick={() => navigate('/breathing')} style={{ margin: '0 16px', borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.22)', background: 'linear-gradient(160deg,rgba(10,40,80,0.8) 0%,rgba(5,15,35,0.95) 55%,rgba(212,175,55,0.06) 100%)', animation: 'sqFadeUp 0.45s 0.12s ease both' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ opacity: 0.12 }}>
            <path fill="rgba(212,175,55,0.4)"><animate attributeName="d" dur="5s" repeatCount="indefinite" values="M0 30 Q50 10 100 30 Q150 50 200 30 Q250 10 300 30 Q350 50 400 30 L400 60 L0 60 Z;M0 30 Q50 50 100 30 Q150 10 200 30 Q250 50 300 30 Q350 10 400 30 L400 60 L0 60 Z;M0 30 Q50 10 100 30 Q150 50 200 30 Q250 10 300 30 Q350 50 400 30 L400 60 L0 60 Z"/></path>
          </svg>
        </div>
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(30,80,160,0.25)', border: '1px solid rgba(100,160,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'sqBreathe 5s ease-in-out infinite' }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M4 14 Q8 6 14 14 Q20 22 24 14" stroke="rgba(120,180,255,0.85)" strokeWidth="1.8" fill="none"/><path d="M4 10 Q9 2 14 10 Q19 18 24 10" stroke="rgba(120,180,255,0.4)" strokeWidth="1.2" fill="none"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 3 }}>{t('converge.pranicTitle')}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.32)' }}>{t('converge.pranicSub')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { labelKey: 'converge.pranicTileKumbhaka' as const, svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="rgba(120,180,255,0.7)" strokeWidth="1.3" fill="none"><animate attributeName="r" values="7;9;7" dur="4s" repeatCount="indefinite"/></circle><circle cx="12" cy="12" r="3" fill="rgba(120,180,255,0.2)" stroke="rgba(120,180,255,0.6)" strokeWidth="1"/></svg> },
              { labelKey: 'converge.pranicTileNadi' as const, svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12 Q8 6 12 12 Q16 18 20 12" stroke="rgba(120,180,255,0.75)" strokeWidth="1.4" fill="none"><animate attributeName="d" values="M4 12 Q8 6 12 12 Q16 18 20 12;M4 12 Q8 18 12 12 Q16 6 20 12;M4 12 Q8 6 12 12 Q16 18 20 12" dur="3.5s" repeatCount="indefinite"/></path></svg> },
              { labelKey: 'converge.pranicTileAgni' as const, svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3 C9 7 8 9.5 8 11.5 C8 14.5 9.8 16.5 12 18 C14.2 16.5 16 14.5 16 11.5 C16 9.5 15 7 12 3 Z" stroke="rgba(212,175,55,0.8)" strokeWidth="1.3" fill="rgba(212,175,55,0.15)"><animate attributeName="d" dur="2.8s" repeatCount="indefinite" values="M12 3 C9 7 8 9.5 8 11.5 C8 14.5 9.8 16.5 12 18 C14.2 16.5 16 14.5 16 11.5 C16 9.5 15 7 12 3 Z;M12 3 C9.2 6.8 8 9.3 8.2 11.6 C8.5 14.4 10 16.4 12 17.8 C14 16.4 15.5 14.4 15.8 11.6 C16 9.3 14.8 6.8 12 3 Z;M12 3 C9 7 8 9.5 8 11.5 C8 14.5 9.8 16.5 12 18 C14.2 16.5 16 14.5 16 11.5 C16 9.5 15 7 12 3 Z"/></path><circle cx="12" cy="12" r="1.6" fill="rgba(180,210,255,0.9)"><animate attributeName="r" values="1.5;2;1.5" dur="2.2s" repeatCount="indefinite"/></circle></svg> },
            ].map(({ svg, labelKey }, i) => (
              <div key={i} style={{ background: 'rgba(30,80,160,0.2)', border: '1px solid rgba(100,160,255,0.15)', borderRadius: 13, padding: '11px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {svg}
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(120,180,255,0.6)', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{t(labelKey)}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.62, marginBottom: 13 }}>{t('converge.pranicBody')}</p>
          <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(140,190,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, animation: 'sqDotPulse 3.4s ease-in-out infinite' }}>{t('converge.beginPractice')}</button>
        </div>
      </div>

      {/* ══ EXPLORE AKASHA ══ */}
      <SL label={t('converge.secExploreAkasha')} delay="0.15s" />
      <div onClick={() => navigate('/explore-akasha')} style={{ margin: '0 16px', borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(160,80,240,0.25)', background: 'linear-gradient(160deg,rgba(50,15,90,0.7) 0%,rgba(20,5,40,0.95) 55%,rgba(212,175,55,0.06) 100%)', animation: 'sqFadeUp 0.45s 0.17s ease both' }}>
        <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(160,80,240,0.07),transparent)', animation: 'sqShimmer 5s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(160,80,240,0.15)', border: '1px solid rgba(160,80,240,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="10" stroke="rgba(190,140,255,0.7)" strokeWidth="1.2" fill="none"/><circle cx="14" cy="14" r="5.5" stroke="rgba(190,140,255,0.4)" strokeWidth="1" fill="none"/><circle cx="14" cy="14" r="2" fill="rgba(190,140,255,0.8)"/><line x1="14" y1="4" x2="14" y2="8" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/><line x1="14" y1="20" x2="14" y2="24" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/><line x1="4" y1="14" x2="8" y2="14" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/><line x1="20" y1="14" x2="24" y2="14" stroke="rgba(190,140,255,0.5)" strokeWidth="0.8"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 3 }}>{t('converge.akashaCardTitle')}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.36)' }}>{t('converge.akashaCardSub')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { labelKey: 'converge.akashaTileDivine' as const, svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2 L12 22" stroke="rgba(190,140,255,0.7)" strokeWidth="1.2"/><path d="M6 8 L12 2 L18 8" stroke="rgba(190,140,255,0.7)" strokeWidth="1.2" fill="none"/><circle cx="12" cy="14" r="3" stroke="rgba(190,140,255,0.5)" strokeWidth="1" fill="rgba(190,140,255,0.1)"/></svg> },
              { labelKey: 'converge.akashaTileOracle' as const, svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="rgba(190,140,255,0.6)" strokeWidth="1.2" fill="none"/><circle cx="12" cy="10" r="2.5" fill="rgba(190,140,255,0.3)" stroke="rgba(190,140,255,0.7)" strokeWidth="1"/><path d="M8 18 Q12 14 16 18" stroke="rgba(190,140,255,0.5)" strokeWidth="1" fill="none"/></svg> },
              { labelKey: 'converge.akashaTileSeries' as const, svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="rgba(190,140,255,0.6)" strokeWidth="1.2" fill="none"/><line x1="8" y1="8" x2="16" y2="8" stroke="rgba(190,140,255,0.4)" strokeWidth="1"/><line x1="8" y1="12" x2="16" y2="12" stroke="rgba(190,140,255,0.4)" strokeWidth="1"/><line x1="8" y1="16" x2="13" y2="16" stroke="rgba(190,140,255,0.4)" strokeWidth="1"/></svg> },
            ].map(({ svg, labelKey }, i) => (
              <div key={i} style={{ background: 'rgba(160,80,240,0.1)', border: '1px solid rgba(160,80,240,0.15)', borderRadius: 13, padding: '11px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {svg}
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(190,140,255,0.6)', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{t(labelKey)}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.62, marginBottom: 13 }}>{t('converge.akashaBody')}</p>
          <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(190,140,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t('converge.enterArchive')}</button>
        </div>
      </div>

      {/* ══ SACRED TOOLS ══ */}
      <SL label={t('converge.secSacredTools')} delay="0.18s" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'sqFadeUp 0.4s 0.2s ease both' }}>
        <div onClick={() => (isAdmin || tier === 'akasha-infinity' || tier === 'lifetime') ? navigate('/virtual-pilgrimage') : navigate('/virtual-pilgrimage-landing')} style={{ gridColumn: 'span 2', position: 'relative', borderRadius: 22, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.38)', background: 'linear-gradient(160deg,rgba(30,20,5,0.95) 0%,rgba(8,6,0,0.98) 60%,rgba(20,14,0,0.95) 100%)', minHeight: 210 }}>
          <div style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.12),transparent)', animation: 'sqShimmer 4s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.85 }}>
            <svg width="320" height="200" viewBox="0 0 320 200" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
              {[0,1,2,3,4].map(i => (<circle key={i} cx="160" cy="90" r="10" fill="none" stroke="#D4AF37" strokeWidth="1.2"><animate attributeName="r" values={`${10+i*18};90`} dur="3s" begin={`${i*0.6}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3s" begin={`${i*0.6}s`} repeatCount="indefinite"/></circle>))}
              <polygon points="160,14 262,148 58,148" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.9)" strokeWidth="1.8"/>
              <line x1="108" y1="60" x2="212" y2="60" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8"/>
              <line x1="82" y1="95" x2="238" y2="95" stroke="rgba(212,175,55,0.25)" strokeWidth="0.7"/>
              <line x1="160" y1="14" x2="160" y2="148" stroke="rgba(212,175,55,0.35)" strokeWidth="0.9"/>
              <circle cx="160" cy="14" r="5" fill="#FFD700" opacity="0.9"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/></circle>
              <circle cx="160" cy="90" r="5" fill="rgba(212,175,55,0.9)"><animate attributeName="r" values="4;7;4" dur="3s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 2, padding: '20px 18px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 110 }}>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)' }}>SQI 2050 · SCALAR CONSCIOUSNESS</span>
              {(isAdmin || tier === 'akasha-infinity' || tier === 'lifetime') ? <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: 'rgba(212,175,55,0.85)', padding: '2px 8px', borderRadius: 20 }}>ACTIVE</span> : <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: 20 }}>AKASHA ∞</span>}
            </div>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 5 }}>Virtual Pilgrimage</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>40 sacred sites · Real GPS scalar waves · Prema pulses radiating to your field</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['40 Sites', 'GPS Scalar', 'Sacred Geometry', '40-Day Lock'].map(tag => (<span key={tag} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', color: 'rgba(212,175,55,0.6)', padding: '3px 9px', borderRadius: 20 }}>{tag}</span>))}
            </div>
          </div>
        </div>
      </div>

      <SL label={t('converge.secVedic')} delay="0.26s" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'sqFadeUp 0.4s 0.28s ease both' }}>
        {[{ titleKey: 'converge.wisdomGita' as const, subKey: 'converge.wisdomGitaSub' as const, href: null, premium: false, svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="14" height="18" rx="2" stroke="rgba(212,175,55,0.8)" strokeWidth="1.4"/><line x1="8" y1="8" x2="16" y2="8" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="11" x2="16" y2="11" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/><line x1="8" y1="14" x2="13" y2="14" stroke="rgba(212,175,55,0.42)" strokeWidth="1.1"/></svg> }].map(({ titleKey, subKey, href, premium, svg }) => (
          <div key={titleKey} onClick={() => { if (!href) { setGitaOpen(!gitaOpen); return; } navigate(href); }} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <TI>{svg}</TI>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 5 }}>{t(titleKey)}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t(subKey)}</div>
            <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
          </div>
        ))}
        {gitaOpen && <div style={{ gridColumn: 'span 2' }}><GitaCard /></div>}
      </div>

      {/* ══ ABUNDANCE ══ */}
      <SL label={t('converge.secAbundance')} delay="0.32s" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px', animation: 'sqFadeUp 0.4s 0.34s ease both' }}>
        <div onClick={() => navigate('/library/abundance')} style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 18, padding: '20px 18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><polygon points="12,2 13.8,8 20,8 14.9,11.9 16.7,18 12,14.1 7.3,18 9.1,11.9 4,8 10.2,8" stroke="rgba(212,175,55,0.85)" strokeWidth="1.3" fill="rgba(212,175,55,0.1)"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 3 }}>{t('converge.abundanceTitle')}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.28)' }}>{t('converge.abundanceSub')}</div>
            </div>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.87rem', color: 'rgba(255,255,255,0.37)', lineHeight: 1.6, marginBottom: 11 }}>{t('converge.abundanceBody')}</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{(['converge.abundanceBadge1', 'converge.abundanceBadge2', 'converge.abundanceBadge3'] as const).map((k, i) => <Badge key={k} label={t(k)} v={i === 0 ? 'gold' : 'muted'} />)}</div>
          <span style={{ position: 'absolute', bottom: 12, right: 13, color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
        </div>
        <div onClick={() => navigate('/creative-soul/store')} style={{ background: 'linear-gradient(135deg,rgba(170,55,200,0.08),rgba(0,0,0,0))', border: '1px solid rgba(170,60,210,0.18)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative' }}>
          <TI><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2 C12 2 9 8 4 10 C9 12 12 22 12 22 C12 22 15 12 20 10 C15 8 12 2 12 2Z" stroke="rgba(180,110,255,0.8)" strokeWidth="1.4" fill="rgba(160,60,220,0.1)"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 5 }}>{t('converge.creativeSoulTitle')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.creativeSoulSub')}</div>
        </div>
        <div onClick={() => navigate('/shop')} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '18px 15px', cursor: 'pointer', position: 'relative' }}>
          <TI><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 2 L2 8 L6 8 L6 20 C6 20.6 6.4 21 7 21 L17 21 C17.6 21 18 20.6 18 20 L18 8 L22 8 L18 2 L14 5 C13.3 3.8 12.7 3 12 3 C11.3 3 10.7 3.8 10 5 Z" stroke="rgba(212,175,55,0.75)" strokeWidth="1.3" fill="rgba(212,175,55,0.07)"/></svg></TI>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 5 }}>{t('converge.healingClothesTitle')}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{t('converge.healingClothesSub')}</div>
        </div>
      </div>

      {/* ══ VIDEOS ══ */}
      <SL label={t('converge.secVideos')} delay="0.38s" />
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
            </div>
            <div style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.82)', marginBottom: 4, lineHeight: 1.3 }}>{exploreVideos[0].title}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)' }}>{t('converge.videoWatchEarn')}</div>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
          {exploreVideos.slice(1,3).map(video => (
            <div key={video.id} onClick={() => navigate('/spiritual-education')} style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative' }}><img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block', background: '#111' }} /><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}><div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(255,255,255,0.7)"/></svg></div></div></div>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', lineHeight: 1.35 }}>{video.title.length > 28 ? video.title.slice(0,28)+'…' : video.title}</div></div>
            </div>
          ))}
          <div onClick={() => navigate('/spiritual-education')} style={{ borderRadius: 16, cursor: 'pointer', border: '1px solid rgba(212,175,55,0.18)', background: 'linear-gradient(135deg,rgba(212,175,55,0.08),rgba(0,0,0,0))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, padding: '14px 10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="8,5 19,12 8,19" fill="rgba(212,175,55,0.7)"/><circle cx="12" cy="12" r="10" stroke="rgba(212,175,55,0.35)" strokeWidth="1.2" fill="none"/></svg>
            <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', textAlign: 'center' }}>{t('converge.allVideos')}</span>
          </div>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(255,255,255,0.22)', textAlign: 'center', marginTop: 4 }}>{t('converge.videoFooter')}</p>
      </div>

      {/* ══ DEEPEN ══ */}
      <SL label={t('converge.secDeepen')} delay="0.44s" />
      <div style={{ animation: 'sqFadeUp 0.4s 0.46s ease both' }}>
        {([
          { titleKey: 'converge.deepenAvataric' as const, subKey: 'converge.deepenAvataricSub' as const, href: '/courses', iBg: 'linear-gradient(135deg,rgba(180,60,40,.2),rgba(120,30,10,.15))', iBd: 'rgba(200,80,50,.2)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(212,175,55,.75)" strokeWidth="1.4"/><line x1="7" y1="8" x2="17" y2="8" stroke="rgba(212,175,55,.45)" strokeWidth="1.1"/><line x1="7" y1="12" x2="17" y2="12" stroke="rgba(212,175,55,.45)" strokeWidth="1.1"/><line x1="7" y1="16" x2="13" y2="16" stroke="rgba(212,175,55,.45)" strokeWidth="1.1"/></svg> },
          { titleKey: 'converge.deepenMentorship' as const, subKey: 'converge.deepenMentorshipSub' as const, href: '/transformation', iBg: 'linear-gradient(135deg,rgba(160,40,40,.2),rgba(100,20,10,.15))', iBd: 'rgba(180,60,40,.2)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 21 C12 21 4 16 4 9.5 C4 6.4 6.7 4 10 4 C11 4 12 4.5 12 4.5 C12 4.5 13 4 14.5 4 C17.5 4 20 6.4 20 9.5 C20 16 12 21 12 21Z" stroke="rgba(212,175,55,.75)" strokeWidth="1.4" fill="rgba(212,175,55,.07)"/></svg> },
          { titleKey: 'converge.deepenNeural' as const, subKey: 'converge.deepenNeuralSub' as const, href: '/private-sessions', iBg: 'linear-gradient(135deg,rgba(40,100,40,.2),rgba(10,60,20,.15))', iBd: 'rgba(60,130,60,.2)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.5" stroke="rgba(212,175,55,.75)" strokeWidth="1.3"/><path d="M2 20 C2 16.7 5.1 14 9 14 C12.9 14 16 16.7 16 20" stroke="rgba(212,175,55,.75)" strokeWidth="1.3" fill="none"/></svg> },
          { titleKey: 'converge.deepenAetheric' as const, subKey: 'converge.deepenAethericSub' as const, href: '/affirmation-soundtrack', iBg: 'linear-gradient(135deg,rgba(60,80,30,.2),rgba(30,50,10,.15))', iBd: 'rgba(80,110,40,.2)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 18 L15 18" stroke="rgba(212,175,55,.75)" strokeWidth="1.4" strokeLinecap="round"/><line x1="12" y1="5" x2="12" y2="18" stroke="rgba(212,175,55,.6)" strokeWidth="1.2"/><path d="M7 8 Q12 5 17 8" stroke="rgba(212,175,55,.8)" strokeWidth="1.4" fill="none"/></svg> },
          { titleKey: 'converge.deepenCert' as const, subKey: 'converge.deepenCertSub' as const, href: '/certification', iBg: 'linear-gradient(135deg,rgba(180,140,20,.15),rgba(120,90,10,.12))', iBd: 'rgba(212,175,55,.18)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" stroke="rgba(212,175,55,.78)" strokeWidth="1.3" fill="rgba(212,175,55,.08)"/></svg> },
        ] as const).map(({ titleKey, subKey, href, iBg, iBd, svg }) => (
          <div key={titleKey} onClick={() => navigate(href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: '50%', background: iBg, border: `1px solid ${iBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{svg}</div>
            <div><div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12.5, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(titleKey)}</div><div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{t(subKey)}</div></div>
            <div style={{ marginLeft: 'auto' }}><span style={{ color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span></div>
          </div>
        ))}
      </div>

      {/* ══ CONNECT ══ */}
      <SL label={t('converge.secConnect')} delay="0.5s" />
      <div style={{ animation: 'sqFadeUp 0.4s 0.52s ease both' }}>
        {([
          { titleKey: 'converge.connectStargate' as const, subKey: 'converge.connectStargateSub' as const, href: '/stargate', badgeKey: 'converge.badgeSwedish' as const, bv: 'muted' as const, iBg: 'rgba(212,175,55,.08)', iBd: 'rgba(212,175,55,.18)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" stroke="rgba(212,175,55,.8)" strokeWidth="1.3" fill="rgba(212,175,55,.1)"/></svg> },
          { titleKey: 'converge.connectSangha' as const, subKey: 'converge.connectSanghaSub' as const, href: '/community', badgeKey: undefined, bv: 'gold' as const, iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="rgba(212,175,55,.7)" strokeWidth="1.3"/><path d="M2 19 C2 15.7 5.1 13 9 13 C12.9 13 16 15.7 16 19" stroke="rgba(212,175,55,.7)" strokeWidth="1.3" fill="none"/></svg> },
          { titleKey: 'converge.connectPodcast' as const, subKey: 'converge.connectPodcastSub' as const, href: '/podcast', badgeKey: undefined, bv: 'gold' as const, iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgba(212,175,55,.62)" strokeWidth="1.3"/><circle cx="12" cy="12" r="4" stroke="rgba(212,175,55,.8)" strokeWidth="1.2"/></svg> },
          { titleKey: 'converge.connectLeaderboard' as const, subKey: 'converge.connectLeaderboardSub' as const, href: '/leaderboard', badgeKey: 'converge.badge5kShc' as const, bv: 'gold' as const, iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" stroke="rgba(212,175,55,.62)" strokeWidth="1.3"/></svg> },
          { titleKey: 'converge.connectAffiliate' as const, subKey: 'converge.connectAffiliateSub' as const, href: '/invite-friends', badgeKey: 'converge.badge30pct' as const, bv: 'gold' as const, iBg: 'rgba(212,175,55,.07)', iBd: 'rgba(212,175,55,.12)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.5" stroke="rgba(212,175,55,.7)" strokeWidth="1.3"/><circle cx="18" cy="17" r="4" stroke="rgba(212,175,55,.3)" strokeWidth="1.1"/></svg> },
        ] as const).map(({ titleKey, subKey, href, badgeKey, bv, iBg, iBd, svg }) => (
          <div key={titleKey} onClick={() => navigate(href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: '50%', background: iBg, border: `1px solid ${iBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{svg}</div>
            <div><div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12.5, fontWeight: 800, color: '#D4AF37', marginBottom: 2 }}>{t(titleKey)}</div><div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{t(subKey)}</div></div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
              {badgeKey && <Badge label={t(badgeKey)} v={bv} />}
              <span style={{ color: 'rgba(212,175,55,0.18)', fontSize: 11 }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══ WISDOM QUOTE ══ */}
      <div style={{ margin: '22px 16px 0', padding: '20px 16px', borderTop: '1px solid rgba(212,175,55,0.07)', animation: 'sqFadeUp 0.4s 0.56s ease both' }}>
        <ParamahamsaVishwanandaDailyCard />
      </div>

      <Dialog open={akashicOpen} onOpenChange={setAkashicOpen}>
        <DialogContent className="max-w-3xl bg-[#0a0a0a] border-[#D4AF37]/30 p-0 overflow-hidden">
          <AkashicSiddhaReading userHouse={userHouse} isModal />
        </DialogContent>
      </Dialog>
      <SacredRevealGate open={sacredRevealOpen} onOpenChange={setSacredRevealOpen} />

      <style>{`
        @keyframes goldShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes portalRim { 0%,100%{opacity:0.6;box-shadow:0 0 20px rgba(212,175,55,0.06)} 50%{opacity:1;box-shadow:0 0 50px rgba(212,175,55,0.22)} }
        @keyframes sqShimmer { 0%{left:-110%} 60%{left:110%} 100%{left:110%} }
        @keyframes sqFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sqBreathe { 0%,100%{transform:scale(1);opacity:0.85} 50%{transform:scale(1.07);opacity:1} }
        @keyframes sqDotPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
