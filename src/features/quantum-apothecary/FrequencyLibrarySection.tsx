// ╔══════════════════════════════════════════════════════════════════╗
// ║  FrequencyLibrarySection — SQI Apothecary (Transmission Library)    ║
// ║  Six canonical tabs + vegetarian filter + expandable geometry    ║
// ╚══════════════════════════════════════════════════════════════════╝
import React, { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Plus } from 'lucide-react';
import { ALL_ACTIVATIONS, searchBioLibraryAsActivations } from '@/features/quantum-apothecary/constants';
import type { Activation } from '@/features/quantum-apothecary/types';
import { useTranslation } from '@/hooks/useTranslation';
import { isVegetarianActivation } from '@/features/quantum-apothecary/apothecarySqiUi';

export type SqiLibraryTab =
  | 'Wellness'
  | 'Siddha Soma'
  | 'Sacred Plants'
  | 'Bioenergetic'
  | 'Ayurveda'
  | 'Avataric';

interface Props {
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  selectedActivations: Activation[];
  addActivation: (act: Activation) => void;
  maxSlots?: number;
  /** Keys already active in field (id + normalized name) */
  activeTransmissionKeys?: Set<string>;
}

const SQI_TABS: SqiLibraryTab[] = [
  'Wellness',
  'Siddha Soma',
  'Sacred Plants',
  'Bioenergetic',
  'Ayurveda',
  'Avataric',
];

const TAB_COLORS: Record<SqiLibraryTab, string> = {
  Wellness: '#22d3ee',
  'Siddha Soma': '#D4AF37',
  'Sacred Plants': '#4ade80',
  Bioenergetic: '#60a5fa',
  Ayurveda: '#fb923c',
  Avataric: '#D4AF37',
};

type GeoKind = 'torus' | 'sri' | 'flower' | 'metatron' | 'sriGold';

function geoKindForTab(tab: string): GeoKind {
  switch (tab) {
    case 'Wellness':
      return 'torus';
    case 'Siddha Soma':
      return 'sri';
    case 'Sacred Plants':
      return 'flower';
    case 'Bioenergetic':
      return 'metatron';
    case 'Ayurveda':
      return 'flower';
    case 'Avataric':
      return 'sriGold';
    default:
      return 'torus';
  }
}

function matchesSqiTab(act: Activation, tab: string): boolean {
  switch (tab) {
    case 'Wellness':
      return act.type === 'Wellness';
    case 'Siddha Soma':
      return act.type === 'Siddha Soma';
    case 'Sacred Plants':
      return act.type === 'Sacred Plant';
    case 'Bioenergetic':
      return act.type === 'Bioenergetic';
    case 'Ayurveda':
      return act.type === 'Ayurvedic Herb';
    case 'Avataric':
      return act.type === 'avataric' || act.type === 'plant_deva';
    default:
      return true;
  }
}

function parseBenefitSections(benefit: string): {
  description: string;
  siddhaEquivalent: string | null;
} {
  const siddhaMatch = benefit.match(/Siddha equivalent:\s*(.+)/i);
  const siddhaEquivalent = siddhaMatch ? siddhaMatch[1].trim() : null;
  const description = benefit
    .replace(/\s*Siddha equivalent:\s*.+$/is, '')
    .replace(/\bLimbicArc\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { description, siddhaEquivalent };
}

function drawSacredGeometry(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  kind: GeoKind,
  t: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  const stroke =
    kind === 'sriGold'
      ? '#D4AF37'
      : kind === 'torus' || kind === 'flower'
        ? '#22D3EE'
        : 'rgba(212,175,55,0.85)';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;

  if (kind === 'torus') {
    const r = Math.min(w, h) * 0.22;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + t * 0.35;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * r * 0.45, cy + Math.sin(ang) * r * 0.45, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212,175,55,0.5)';
    ctx.stroke();
    return;
  }

  if (kind === 'sri' || kind === 'sriGold') {
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (i / 5) * Math.min(w, h) * 0.42, 0, Math.PI * 2);
      ctx.strokeStyle = kind === 'sriGold' ? `rgba(212,175,55,${0.25 + i * 0.12})` : stroke;
      ctx.stroke();
    }
    const rays = 12;
    const R = Math.min(w, h) * 0.44;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + t * 0.08;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = kind === 'sriGold' ? '#D4AF37' : 'rgba(34,211,238,0.65)';
      ctx.stroke();
    }
    return;
  }

  if (kind === 'flower') {
    const rings = 7;
    const step = (Math.min(w, h) * 0.18) / rings;
    for (let k = 1; k <= rings; k++) {
      const rad = step * k;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + t * 0.12;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * rad * 0.35, cy + Math.sin(ang) * rad * 0.35, rad, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,211,238,${0.2 + (k / rings) * 0.5})`;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.08, 0, Math.PI * 2);
    ctx.strokeStyle = '#D4AF37';
    ctx.stroke();
    return;
  }

  /* metatron — hexagram */
  const R = Math.min(w, h) * 0.38;
  ctx.strokeStyle = '#60a5fa';
  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI * 2 + t * 0.06;
    const a2 = ((i + 2) / 6) * Math.PI * 2 + t * 0.06;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
    ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212,175,55,0.35)';
  ctx.stroke();
}

const SacredGeoCanvas = memo(function SacredGeoCanvas({
  kind,
  size = 128,
}: {
  kind: GeoKind;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const loop = () => {
      drawSacredGeometry(ctx, size, size, kind, performance.now() / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [kind, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block', margin: '0 auto' }}
      aria-hidden
    />
  );
});

export default function FrequencyLibrarySection({
  activeCategory,
  setActiveCategory,
  selectedActivations,
  addActivation,
  maxSlots = 10,
  activeTransmissionKeys = new Set(),
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [libPage, setLibPage] = useState(0);
  const LIB_PAGE_SIZE = 24;
  const mixerFull = selectedActivations.length >= maxSlots;

  const tab = (SQI_TABS.includes(activeCategory as SqiLibraryTab) ? activeCategory : 'Wellness') as SqiLibraryTab;

  useEffect(() => {
    setLibPage(0);
  }, [tab, search]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const vegPool = ALL_ACTIVATIONS.filter(isVegetarianActivation);
    const base = q
      ? (() => {
          const seen = new Set<string>();
          const out: Activation[] = [];
          for (const a of vegPool) {
            const hay =
              `${a.name} ${a.benefit} ${a.vibrationalSignature} ${a.category ?? ''} ${a.sacredName ?? ''}`.toLowerCase();
            if (hay.includes(q) && !seen.has(a.id)) {
              seen.add(a.id);
              out.push(a);
            }
          }
          for (const a of searchBioLibraryAsActivations(search.trim())) {
            if (!isVegetarianActivation(a)) continue;
            if (!seen.has(a.id)) {
              seen.add(a.id);
              out.push(a);
            }
          }
          return out;
        })()
      : vegPool.filter((act) => matchesSqiTab(act, tab));

    return base;
  }, [q, search, tab]);

  const paginated = useMemo(
    () => filtered.slice(0, (libPage + 1) * LIB_PAGE_SIZE),
    [filtered, libPage],
  );
  const remaining = filtered.length - paginated.length;

  const isInMixer = useCallback(
    (act: Activation) =>
      selectedActivations.some(
        (a) =>
          a.id === act.id ||
          (!!a.name && !!act.name && a.name.toLowerCase() === act.name.toLowerCase()),
      ),
    [selectedActivations],
  );

  const isAlreadyTransmitting = useCallback(
    (act: Activation) =>
      activeTransmissionKeys.has(act.id) ||
      (!!act.name && activeTransmissionKeys.has(act.name.toLowerCase())),
    [activeTransmissionKeys],
  );

  const geoKind = geoKindForTab(tab);

  return (
    <div
      className="rounded-[28px]"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        boxShadow: '0 0 48px rgba(212,175,55,0.05)',
      }}
    >
      <div style={{ padding: '18px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ marginBottom: 12 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '-0.05em',
              color: '#D4AF37',
              textShadow: '0 0 15px rgba(212,175,55,0.3)',
            }}
          >
            {t('quantumApothecary.frequencyLibrarySection.title')}
          </h2>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(212,175,55,0.45)',
              marginTop: 6,
            }}
          >
            {t('quantumApothecary.frequencyLibrarySection.essencesCount', { count: filtered.length })}
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.25)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('quantumApothecary.frequencyLibrarySection.searchExtendedPlaceholder')}
            aria-label={t('quantumApothecary.frequencyLibrarySection.searchExtendedPlaceholder')}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
          {SQI_TABS.map((cat) => {
            const active = tab === cat;
            const col = TAB_COLORS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 100,
                  border: active ? `1px solid ${col}` : '1px solid rgba(255,255,255,0.08)',
                  background: active ? `${col}18` : 'transparent',
                  color: active ? col : 'rgba(255,255,255,0.42)',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  boxShadow: active ? `0 0 12px ${col}25` : 'none',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '12px 16px 16px', maxHeight: 520, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {paginated.map((act, i) => {
              const expanded = expandedId === act.id;
              const inMixer = isInMixer(act);
              const txActive = isAlreadyTransmitting(act);
              const cannotAdd = mixerFull && !inMixer;
              const { description, siddhaEquivalent } = parseBenefitSections(act.benefit || '');
              const displayCat =
                act.category && act.type === 'Bioenergetic' ? act.category : act.type;

              return (
                <motion.div
                  key={act.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.25) }}
                  style={{
                    borderRadius: 20,
                    border: expanded ? `1px solid ${act.color}55` : '1px solid rgba(255,255,255,0.06)',
                    background: expanded ? `${act.color}10` : 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : act.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '14px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: act.color,
                        marginTop: 4,
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${act.color}`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#fff',
                          lineHeight: 1.35,
                          margin: 0,
                        }}
                      >
                        {act.name}
                      </p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', margin: '6px 0 0' }}>
                        {displayCat}
                      </p>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 14px 14px' }}>
                          <div
                            style={{
                              borderRadius: 16,
                              background: 'rgba(5,5,5,0.35)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              padding: 12,
                              marginBottom: 12,
                            }}
                          >
                            <SacredGeoCanvas kind={geoKind} size={128} />
                          </div>
                          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.78)', margin: '0 0 10px' }}>
                            {description || act.benefit}
                          </p>
                          {siddhaEquivalent && (
                            <div style={{ marginBottom: 10 }}>
                              <p style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', margin: '0 0 4px' }}>
                                Siddha equivalent
                              </p>
                              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.62)', margin: 0 }}>
                                {siddhaEquivalent}
                              </p>
                            </div>
                          )}
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#22D3EE', margin: '0 0 4px' }}>
                              How it feels
                            </p>
                            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.62)', margin: 0 }}>
                              {act.vibrationalSignature || act.sacredName || 'Subtle informational resonance in the torus-field.'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {txActive ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: '#22D3EE',
                                }}
                              >
                                <Check size={16} strokeWidth={3} /> Active in field
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={inMixer || cannotAdd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addActivation(act);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '10px 18px',
                                  borderRadius: 999,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  cursor: inMixer || cannotAdd ? 'default' : 'pointer',
                                  opacity: cannotAdd ? 0.35 : 1,
                                  background: 'rgba(34,211,238,0.1)',
                                  border: '1px solid rgba(34,211,238,0.35)',
                                  color: '#22D3EE',
                                  fontFamily: 'inherit',
                                }}
                              >
                                <Plus size={15} /> Add to Aetheric Mixer
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'rgba(255,255,255,0.28)', fontSize: 13 }}>
              {t('quantumApothecary.frequencyLibrarySection.noResults')}
            </div>
          )}
        </div>

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setLibPage((p) => p + 1)}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: 10,
              borderRadius: 16,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.06)',
              color: 'rgba(255,255,255,.45)',
              fontFamily: 'inherit',
            }}
          >
            Load more ({remaining} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
