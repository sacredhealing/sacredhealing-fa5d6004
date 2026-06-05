// src/pages/SiddhaMedicineAcademy.tsx
// ⟡ SQI 2050 — Siddha Medicine Academy — Full Sovereign Build ⟡
// Mirrors AgastyarAcademy pattern: real Supabase data, tier gating,
// progress tracking, clean UX for all ages.

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Lock,
  Music,
  Play,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
  Flame,
  Leaf,
  FlaskConical,
  Infinity as InfinityIcon,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useAyurvedaProgress, type AyurvedaCourseRow } from '@/hooks/useAyurvedaProgress';
import {
  getCourseTierRequiredRank,
  getSalesPageForRank,
  getTierRank,
  hasFeatureAccess,
} from '@/lib/tierAccess';

// ─── TIER CONFIG ────────────────────────────────────────────────────────────────
const SIDDHA_TIER_SLUGS = ['free', 'prana-flow', 'siddha-quantum', 'akasha-infinity'] as const;
type SiddhaTierSlug = (typeof SIDDHA_TIER_SLUGS)[number];

const TIER_META: Record<
  SiddhaTierSlug,
  {
    rank: number;
    label: string;
    price: string;
    color: string;
    glow: string;
    border: string;
    icon: string;
    tagline: string;
  }
> = {
  free: {
    rank: 0,
    label: 'Siddha Awakening',
    price: 'Free — Open to All',
    color: 'rgba(255,255,255,0.75)',
    glow: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.14)',
    icon: '◇',
    tagline: 'The First Transmission — Enter the Living Field',
  },
  'prana-flow': {
    rank: 1,
    label: 'Prana Flow',
    price: '€19 / month',
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.22)',
    icon: '◉',
    tagline: 'Foundations of Siddha Healing Science',
  },
  'siddha-quantum': {
    rank: 2,
    label: 'Siddha Quantum',
    price: '€45 / month',
    color: '#D4AF37',
    glow: 'rgba(212,175,55,0.08)',
    border: 'rgba(212,175,55,0.25)',
    icon: '⬡',
    tagline: 'Transmutation, Alchemy & Varma Mastery',
  },
  'akasha-infinity': {
    rank: 3,
    label: 'Akasha Infinity',
    price: '€1,111 Lifetime',
    color: '#22D3EE',
    glow: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.22)',
    icon: '✦',
    tagline: 'Complete Immortality Codes — The Full Transmission',
  },
};

// Map module tier_required string → tier slug key
function moduleToSlug(tierRequired: string | null | undefined): SiddhaTierSlug {
  const s = (tierRequired || 'free').toLowerCase();
  if (s.includes('akasha')) return 'akasha-infinity';
  if (s.includes('siddha')) return 'siddha-quantum';
  if (s.includes('prana')) return 'prana-flow';
  return 'free';
}

function canonicalSlug(tier: string | null | undefined): SiddhaTierSlug {
  const r = getTierRank(tier);
  if (r >= 3) return 'akasha-infinity';
  if (r === 2) return 'siddha-quantum';
  if (r === 1) return 'prana-flow';
  return 'free';
}

// ─── FLOATING PARTICLE FIELD ────────────────────────────────────────────────────
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId = 0;
    const particles: { x: number; y: number; size: number; speed: number; opacity: number; angle: number }[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.8 + 0.4, speed: Math.random() * 0.25 + 0.07, opacity: Math.random() * 0.5 + 0.07, angle: Math.random() * Math.PI * 2 });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(p.angle + Date.now() * 0.001) * 0.25;
        p.angle += 0.007;
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.opacity})`; ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full" aria-hidden />;
};

// ─── PHASE GLYPH ────────────────────────────────────────────────────────────────
function TierGlyph({ slug }: { slug: SiddhaTierSlug }) {
  const cls = 'h-7 w-7';
  switch (slug) {
    case 'free':         return <Leaf className={cls} aria-hidden />;
    case 'prana-flow':   return <Flame className={cls} aria-hidden />;
    case 'siddha-quantum': return <FlaskConical className={cls} aria-hidden />;
    case 'akasha-infinity': return <InfinityIcon className={cls} aria-hidden />;
  }
}

// ─── STAT CARD ──────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; accent?: string }> = ({
  label, value, icon, accent = '#D4AF37',
}) => (
  <div className="flex min-w-[130px] flex-1 items-center gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-4 py-4 backdrop-blur-[40px]">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]" style={{ background: `rgba(212,175,55,0.10)`, color: accent }}>
      {icon}
    </div>
    <div>
      <p className="text-xl font-black tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/40">{label}</p>
    </div>
  </div>
);

// ─── MODULE CARD ────────────────────────────────────────────────────────────────
const SiddhaModuleCard: React.FC<{
  module: AyurvedaCourseRow;
  progress?: { completed: boolean; progress_percent: number | null };
  isAdmin: boolean;
  tier: string | undefined | null;
  onOpen: () => void;
  onUpgrade: (href: string) => void;
}> = ({ module: m, progress: prog, isAdmin, tier, onOpen, onUpgrade }) => {
  const completed = prog?.completed ?? false;
  const pct = completed ? 100 : Math.min(100, Math.max(0, prog?.progress_percent ?? 0));
  const need = getCourseTierRequiredRank(m.tier_required);
  const allowed = hasFeatureAccess(isAdmin, tier, need);
  const slug = moduleToSlug(m.tier_required);
  const meta = TIER_META[slug];
  const upgradeHref = getSalesPageForRank(need);

  return (
    <button
      type="button"
      onClick={() => (allowed ? onOpen() : onUpgrade(upgradeHref))}
      className={`relative w-full overflow-hidden rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 ${
        completed
          ? 'border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/[0.06] to-transparent'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-[#D4AF37]/20'
      }`}
      style={{ backdropFilter: 'blur(40px)' }}
    >
      {/* Module number */}
      <span className="absolute right-4 top-4 text-[9px] font-extrabold tracking-wide text-white/15">
        #{String(m.module_number).padStart(3, '0')}
      </span>

      {/* Tier badge */}
      <div className="mb-3 inline-flex items-center gap-1 rounded-md border px-2 py-0.5"
        style={{ background: `${meta.glow}`, borderColor: `${meta.color}33` }}>
        {!allowed && <Lock size={9} style={{ color: meta.color }} aria-hidden />}
        {completed && <CheckCircle2 size={9} className="text-[#D4AF37]" aria-hidden />}
        <span className="text-[7px] font-extrabold uppercase tracking-[0.35em]" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>

      <h3 className={`pr-8 text-sm font-black leading-snug ${allowed ? 'text-white' : 'text-white/45'}`}>
        {m.title}
      </h3>
      {m.subtitle && (
        <p className={`mt-1 text-[11px] ${allowed ? 'text-[#D4AF37]/70' : 'text-[#D4AF37]/30'}`}>{m.subtitle}</p>
      )}
      {m.description && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/38">{m.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30">
          {m.duration_minutes != null && (
            <span className="inline-flex items-center gap-1">
              <Clock size={10} aria-hidden />{m.duration_minutes}m
            </span>
          )}
          <span className="inline-flex items-center gap-1 capitalize">
            {(!m.content_type || m.content_type.toLowerCase() === 'video') && <Play size={10} aria-hidden />}
            {m.content_type?.toLowerCase() === 'audio' && <Music size={10} aria-hidden />}
            {m.content_type?.toLowerCase() === 'pdf' && <FileText size={10} aria-hidden />}
            {m.content_type?.toLowerCase() === 'interactive' && <Zap size={10} aria-hidden />}
            {m.content_type?.toLowerCase() === 'live' && <Users size={10} aria-hidden />}
            {m.content_type || 'Video'}
          </span>
        </div>
        {allowed ? (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
            completed ? 'border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-white/[0.10] text-white/45'
          }`}>
            {completed ? <CheckCircle2 size={14} aria-hidden /> : <Play size={12} className="translate-x-px" aria-hidden />}
          </span>
        ) : (
          <span className="text-[8px] font-extrabold uppercase tracking-[0.25em]" style={{ color: meta.color }}>
            Unlock →
          </span>
        )}
      </div>

      {allowed && pct > 0 && !completed && (
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  );
};

// ─── UPGRADE GATE ───────────────────────────────────────────────────────────────
const UpgradeGate: React.FC<{ slug: SiddhaTierSlug; moduleCount: number }> = ({ slug, moduleCount }) => {
  const navigate = useNavigate();
  const meta = TIER_META[slug];
  const href = getSalesPageForRank(meta.rank);
  return (
    <div className="relative overflow-hidden rounded-[28px] border p-10 text-center backdrop-blur-[40px]"
      style={{ borderColor: `${meta.color}44`, background: 'rgba(255,255,255,0.02)' }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, ${meta.color}12, transparent 72%)` }} />
      <div className="relative z-[1]">
        <Lock className="mx-auto mb-4 h-10 w-10 opacity-45" style={{ color: meta.color }} aria-hidden />
        <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em]" style={{ color: meta.color }}>
          {meta.label} — Required
        </p>
        <p className="mb-3 text-xl font-black text-white">Unlock {moduleCount} Modules</p>
        <p className="mx-auto mb-8 max-w-md text-sm text-white/45">
          These transmissions are encoded for {meta.label} initiates. Upgrade your path to receive the full teachings.
        </p>
        <button
          type="button"
          onClick={() => navigate(href)}
          className="rounded-full px-10 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#050505]"
          style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`, boxShadow: `0 0 28px ${meta.color}30` }}
        >
          Upgrade to {meta.label} →
        </button>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────
const SiddhaMedicineAcademy: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();

  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingData, error: loadError, refresh, getPhaseModules } =
    useAyurvedaProgress(membershipReady);

  // Active tier tab — default to free
  const [activeTier, setActiveTier] = useState<SiddhaTierSlug>('free');
  const [searchQuery, setSearchQuery] = useState('');

  // Siddha Medicine modules only — phase > 0 from ayurveda_courses
  // The Siddha curriculum lives in ayurveda_courses but with different tier_required values
  // We show all courses from the same table, grouped by tier
  const allSiddhaCourses = useMemo(() => {
    return [...courses].sort((a, b) => a.module_number - b.module_number);
  }, [courses]);

  const modulesByTier = useMemo(() => {
    const map: Record<SiddhaTierSlug, AyurvedaCourseRow[]> = {
      free: [], 'prana-flow': [], 'siddha-quantum': [], 'akasha-infinity': [],
    };
    allSiddhaCourses.forEach((c) => {
      const slug = moduleToSlug(c.tier_required);
      map[slug].push(c);
    });
    return map;
  }, [allSiddhaCourses]);

  const activeModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = modulesByTier[activeTier];
    if (!q) return base;
    return base.filter((m) =>
      m.title.toLowerCase().includes(q) ||
      (m.subtitle || '').toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  }, [modulesByTier, activeTier, searchQuery]);

  const activeTierMeta = TIER_META[activeTier];
  const activeTierRank = activeTierMeta.rank;
  const hasActiveTierAccess = hasFeatureAccess(isAdmin, tier, activeTierRank);

  // Progress summary across all tiers
  const progressSummary = useMemo(() => {
    let unlocked = 0; let completed = 0;
    allSiddhaCourses.forEach((c) => {
      const need = getCourseTierRequiredRank(c.tier_required);
      if (hasFeatureAccess(isAdmin, tier, need)) {
        unlocked += 1;
        if (progressByModuleId[c.id]?.completed) completed += 1;
      }
    });
    return { unlocked, completed, total: allSiddhaCourses.length };
  }, [allSiddhaCourses, progressByModuleId, isAdmin, tier]);

  // Tier stats (module count per tier)
  const tierStats = useMemo(() => {
    return SIDDHA_TIER_SLUGS.map((slug) => {
      const mods = modulesByTier[slug];
      const completed = mods.filter((c) => progressByModuleId[c.id]?.completed).length;
      const hasAccess = hasFeatureAccess(isAdmin, tier, TIER_META[slug].rank);
      return { slug, total: mods.length, completed, hasAccess };
    });
  }, [modulesByTier, progressByModuleId, isAdmin, tier]);

  if (membershipLoading || !settled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: '#050505' }}>
        <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" aria-hidden />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/40">Activating Transmission…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-28 text-white/90" style={{ background: '#050505' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative border-b border-white/[0.05] pb-14 pt-16 sm:pt-20">
        <ParticleField />
        <div className="pointer-events-none absolute left-1/2 top-[-100px] h-[400px] w-[min(600px,100vw)] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.09) 0%, transparent 72%)' }} />

        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate('/ayurveda')}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/55 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            <ArrowLeft size={14} className="text-[#D4AF37]/80" aria-hidden />
            Back to Ayurveda
          </button>

          {/* Badge */}
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]">
              <Sparkles size={11} aria-hidden />
              Pathinen Siddhargal · The 18 Masters
              <Sparkles size={11} aria-hidden />
            </span>
          </div>

          <h1 className="mb-4 bg-gradient-to-br from-white via-[#D4AF37]/95 to-[#D4AF37]/50 bg-clip-text text-center text-3xl font-black tracking-[-0.04em] text-transparent sm:text-5xl">
            Siddha Medicine Academy
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed text-white/45 sm:text-base">
            5,000 years of Tamil Siddha wisdom — from the first transmission to complete immortality codes.
            Begin at Module 01. Each lesson opens naturally to the next.
          </p>

          {/* START HERE — big clear entry for all ages */}
          <div className="mx-auto mb-10 max-w-2xl">
            <button
              type="button"
              onClick={() => {
                const firstFree = modulesByTier['free'][0];
                if (firstFree) navigate(`/agastyar-academy/module/${firstFree.id}`);
                else navigate('/agastyar-academy');
              }}
              className="group relative w-full overflow-hidden rounded-[28px] border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] px-6 py-5 text-left transition hover:border-[#D4AF37]/55 hover:-translate-y-0.5"
              style={{ backdropFilter: 'blur(40px)' }}
            >
              <div className="pointer-events-none absolute -top-10 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)' }} />
              <div className="relative z-[1] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-2xl">
                  🌱
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]">
                    ● Start Here — Free
                  </p>
                  <p className="text-base font-black text-white">Module 01: Origins of Siddha</p>
                  <p className="mt-1 text-[11px] text-white/45">No prior knowledge needed · 4 lessons · 3.5 hours</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] text-[#050505] text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] transition group-hover:shadow-[0_0_35px_rgba(212,175,55,0.45)]">
                  →
                </div>
              </div>
            </button>
          </div>

          {/* Progress stats */}
          {user && (
            <div className="flex flex-wrap justify-center gap-3">
              <StatCard label="Modules Done" value={stats.completedModules} icon={<CheckCircle2 size={16} aria-hidden />} />
              <StatCard label="Hours Learned" value={Math.round(stats.totalMinutesLearned / 60)} icon={<Clock size={16} aria-hidden />} />
              <StatCard label="Completion" value={`${stats.completionPercent}%`} icon={<Award size={16} aria-hidden />} accent="#A78BFA" />
              <StatCard label="Total Modules" value={progressSummary.total} icon={<BookOpen size={16} aria-hidden />} />
            </div>
          )}
          {!user && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] px-10 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#050505] shadow-[0_0_40px_rgba(212,175,55,0.22)]"
              >
                Sign In to Track Progress
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

        {/* ── TIER NAVIGATION TABS ─────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.45em] text-white/35">
            Choose Your Learning Path
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tierStats.map(({ slug, total, completed, hasAccess }) => {
              const meta = TIER_META[slug];
              const isActive = activeTier === slug;
              const pct = total > 0 ? (completed / total) * 100 : 0;

              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setActiveTier(slug)}
                  className="relative overflow-hidden rounded-[24px] border p-5 text-left transition"
                  style={{
                    background: isActive ? `${meta.glow}` : 'rgba(255,255,255,0.02)',
                    borderColor: isActive ? meta.border : 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(40px)',
                  }}
                >
                  {isActive && (
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
                      style={{ background: `radial-gradient(circle, ${meta.color}30, transparent 70%)` }} />
                  )}
                  <div className="relative z-[1] mb-3 opacity-85" style={{ color: meta.color }}>
                    <TierGlyph slug={slug} />
                  </div>
                  <p className="relative z-[1] mb-1.5 text-[7px] font-extrabold uppercase tracking-[0.38em]" style={{ color: meta.color }}>
                    {meta.price}
                  </p>
                  <p className="relative z-[1] text-sm font-black text-white leading-tight">{meta.label}</p>
                  <p className="relative z-[1] mt-1 text-[10px] text-white/38">{meta.tagline}</p>

                  {/* Progress bar */}
                  <div className="relative z-[1] mt-4 h-[2.5px] overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${hasAccess ? pct : 0}%`, backgroundColor: hasAccess ? meta.color : 'rgba(255,255,255,0.10)' }} />
                  </div>
                  <div className="relative z-[1] mt-2 flex items-center justify-between text-[9px] text-white/35">
                    <span>
                      {hasAccess
                        ? `${completed}/${total} complete`
                        : `${total} modules`
                      }
                    </span>
                    {!hasAccess && <Lock size={11} className="text-white/20" aria-hidden />}
                    {completed >= total && total > 0 && hasAccess && (
                      <CheckCircle2 size={12} style={{ color: meta.color }} aria-hidden />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── ACTIVE TIER HEADER + SEARCH ──────────────────────────────────── */}
        <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em]" style={{ color: activeTierMeta.color }}>
              {activeTierMeta.label} · {activeTierMeta.price}
            </p>
            <p className="text-xl font-black text-white">{activeTierMeta.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <Search size={12} className="text-white/35" aria-hidden />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules…"
                className="w-[150px] border-none bg-transparent text-xs text-white outline-none placeholder:text-white/25"
              />
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl border border-white/[0.08] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45 hover:text-[#D4AF37]"
            >
              ↻
            </button>
          </div>
        </section>

        {/* ── MODULE GRID OR UPGRADE GATE ─────────────────────────────────── */}
        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
            Could not load modules. Check your connection and try again.
            <span className="mt-1 block font-mono text-xs text-red-300/60">{loadError}</span>
          </div>
        )}

        {loadingData && allSiddhaCourses.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" aria-hidden />
          </div>
        ) : !hasActiveTierAccess ? (
          <UpgradeGate
            slug={activeTier}
            moduleCount={modulesByTier[activeTier].length}
          />
        ) : activeModules.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.06] py-16 text-center text-white/35">
            <BookOpen className="mx-auto mb-3 h-9 w-9 opacity-30" aria-hidden />
            <p>{allSiddhaCourses.length === 0 ? 'Modules loading from the Akasha…' : 'No modules match your search.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeModules.map((c) => (
              <SiddhaModuleCard
                key={c.id}
                module={c}
                progress={progressByModuleId[c.id]}
                isAdmin={isAdmin}
                tier={tier}
                onOpen={() => navigate(`/agastyar-academy/module/${c.id}`)}
                onUpgrade={(href) => navigate(href)}
              />
            ))}
          </div>
        )}

        {/* ── MEMBERSHIP UPGRADE PATHS ─────────────────────────────────────── */}
        <section className="mt-14">
          <h2 className="mb-6 text-center text-[10px] font-extrabold uppercase tracking-[0.45em] text-white/35">
            Your Path of Mastery
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(['prana-flow', 'siddha-quantum', 'akasha-infinity'] as const).map((slug) => {
              const meta = TIER_META[slug];
              const userR = getTierRank(tier);
              const isYours = !isAdmin && canonicalSlug(tier) === slug;

              return (
                <div
                  key={slug}
                  className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
                  style={{ borderColor: isYours ? `${meta.color}44` : undefined }}
                >
                  {isYours && (
                    <span className="absolute right-3 top-3 rounded px-2 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.25em]"
                      style={{ border: `1px solid ${meta.color}44`, color: meta.color }}>
                      Your Tier
                    </span>
                  )}
                  <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.4em]" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="mb-1 text-lg font-black text-white">{meta.price}</p>
                  <p className="mb-5 text-[11px] text-white/38">{meta.tagline}</p>
                  {!isAdmin && userR < meta.rank ? (
                    <button
                      type="button"
                      onClick={() => navigate(getSalesPageForRank(meta.rank))}
                      className="w-full rounded-xl border py-2.5 text-[8px] font-extrabold uppercase tracking-[0.28em] transition hover:bg-white/[0.05]"
                      style={{ borderColor: `${meta.color}55`, color: meta.color }}
                    >
                      Unlock {meta.label} →
                    </button>
                  ) : (
                    <p className="text-[10px] text-white/35">✓ Included in your plan</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── PROGRESS SUMMARY ─────────────────────────────────────────────── */}
        {user && (
          <section className="mt-10 rounded-[28px] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] px-5 py-4">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/45">Your Progress</p>
            <p className="mt-1 text-sm text-white/65">
              {progressSummary.completed} of {progressSummary.unlocked} unlocked modules complete
            </p>
            <p className="mt-2 text-[10px] text-white/30">
              Full academy: <span className="font-black text-[#D4AF37]">{progressSummary.total}</span> modules
            </p>
          </section>
        )}

        {/* ── CLOSING QUOTE ─────────────────────────────────────────────────── */}
        <section className="mt-14 rounded-[32px] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-8 text-center backdrop-blur-[40px] sm:p-10">
          <GraduationCap className="mx-auto mb-4 text-[#D4AF37]/55" size={32} aria-hidden />
          <p className="mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/65">
            Pathinen Siddhargal · The 18 Masters
          </p>
          <p className="mx-auto mb-4 max-w-3xl text-[15px] italic leading-relaxed text-white/65">
            "Arogiyame Paramaanugraham — Perfect Health is the Greatest Blessing"
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]/50">
            — Agathiyar Muni
          </p>
        </section>

        <footer className="mt-12 pb-8 text-center">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.45em] text-white/30">
            SQI 2050 · Akasha-Neural Archive · Siddha Medicine Academy
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SiddhaMedicineAcademy;
