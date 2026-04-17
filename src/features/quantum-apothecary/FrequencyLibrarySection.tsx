// ╔══════════════════════════════════════════════════════════════════╗
// ║  FrequencyLibrarySection-SQI2050.tsx                           ║
// ║  → src/features/quantum-apothecary/FrequencyLibrarySection.tsx ║
// ║  RULES: Zero logic changes. UI only.                           ║
// ╚══════════════════════════════════════════════════════════════════╝
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check } from 'lucide-react';
import {
  ALL_ACTIVATIONS,
  BIOENERGETIC_CATEGORIES,
  searchBioLibraryAsActivations,
} from '@/features/quantum-apothecary/constants';
import type { Activation } from '@/features/quantum-apothecary/types';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  selectedActivations: Activation[];
  addActivation: (act: Activation) => void;
  /** Max items in Aetheric Mixer; when reached, further frequencies cannot be added until one is removed. */
  maxSlots?: number;
}

const BASE_CATEGORIES = [
  'All',
  'Sacred Plant',
  'Siddha Soma',
  'Bioenergetic',
  'Essential Oil',
  'Ayurvedic Herb',
  'Mineral',
  'Mushroom',
  'Adaptogen',
  'avataric',
  'plant_deva',
] as const;

const BASE_CAT_SET = new Set<string>([...BASE_CATEGORIES]);
const CATEGORY_TABS: string[] = [...BASE_CATEGORIES, ...BIOENERGETIC_CATEGORIES.filter((c) => !BASE_CAT_SET.has(c))];

const CAT_COLORS: Record<string, string> = {
  'Sacred Plant':   '#4ade80',
  'Siddha Soma':    '#D4AF37',
  'Bioenergetic':   '#60a5fa',
  'Essential Oil':  '#f472b6',
  'Ayurvedic Herb': '#fb923c',
  'Mineral':        '#94a3b8',
  'Mushroom':       '#b45309',
  'Adaptogen':      '#34d399',
  avataric:         '#D4AF37',
  plant_deva:       '#86efac',
};

export default function FrequencyLibrarySection({
  activeCategory,
  setActiveCategory,
  selectedActivations,
  addActivation,
  maxSlots = 10,
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const mixerFull = selectedActivations.length >= maxSlots;

  const displayBenefit = (benefit: string) =>
    benefit.replace(/\bLimbicArc\b/g, '').replace(/\s{2,}/g, ' ').trim();

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (q) {
      const seen = new Set<string>();
      const out: Activation[] = [];
      for (const a of ALL_ACTIVATIONS) {
        const hay =
          `${a.name} ${a.benefit} ${a.vibrationalSignature} ${a.category ?? ''} ${a.sacredName ?? ''}`.toLowerCase();
        if (hay.includes(q) && !seen.has(a.id)) {
          seen.add(a.id);
          out.push(a);
        }
      }
      for (const a of searchBioLibraryAsActivations(search.trim())) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          out.push(a);
        }
      }
      return out;
    }
    return ALL_ACTIVATIONS.filter((act) => {
      if (activeCategory === 'All') return true;
      const cat = activeCategory;
      return (
        act.type === cat ||
        act.category === cat ||
        act.category?.toUpperCase() === cat.toUpperCase()
      );
    });
  }, [q, search, activeCategory]);

  const catLabel = (cat: string) => (cat === 'All' ? t('quantumApothecary.frequencyLibrarySection.catAll') : cat);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 40,
      overflow: 'hidden',
      boxShadow: '0 0 48px rgba(212,175,55,0.05)',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '18px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.05em', color: '#D4AF37', textShadow: '0 0 15px rgba(212,175,55,0.3)' }}>{t('quantumApothecary.frequencyLibrarySection.title')}</h2>
          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', marginTop: 6 }}>
            {t('quantumApothecary.frequencyLibrarySection.essencesCount', { count: filtered.length })}
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
          <Search size={12} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('quantumApothecary.frequencyLibrarySection.searchExtendedPlaceholder')}
            aria-label={t('quantumApothecary.frequencyLibrarySection.searchExtendedPlaceholder')}
            style={{
              width: '100%',
              padding: '10px 16px 10px 36px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ── Category Tabs — horizontal scroll ── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
          {CATEGORY_TABS.map(cat => {
            const active = activeCategory === cat;
            const col = CAT_COLORS[cat] || '#D4AF37';
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 100,
                  border: active ? `1px solid ${col}` : '1px solid rgba(255,255,255,0.08)',
                  background: active ? `${col}18` : 'transparent',
                  color: active ? col : 'rgba(255,255,255,0.4)',
                  fontSize: 9, fontWeight: 800,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  boxShadow: active ? `0 0 12px ${col}25` : 'none',
                }}>
                {catLabel(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ padding: '12px 16px 16px', maxHeight: 420, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <AnimatePresence>
            {filtered.map((act, i) => {
              const isSelected = selectedActivations.some(
                (a) =>
                  a.id === act.id ||
                  (!!a.name &&
                    !!act.name &&
                    a.name.toLowerCase() === act.name.toLowerCase()),
              );
              const cannotAdd = mixerFull && !isSelected;
              return (
                <motion.button
                  key={act.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => addActivation(act)}
                  disabled={isSelected || cannotAdd}
                  style={{
                    position: 'relative',
                    background: isSelected ? `${act.color}10` : 'rgba(255,255,255,0.02)',
                    border: isSelected ? `1px solid ${act.color}40` : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 16,
                    padding: '12px 12px 10px',
                    textAlign: 'left',
                    cursor: isSelected || cannotAdd ? 'default' : 'pointer',
                    opacity: cannotAdd ? 0.42 : 1,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected && !cannotAdd) {
                      (e.currentTarget as HTMLElement).style.borderColor = `${act.color}50`;
                      (e.currentTarget as HTMLElement).style.background = `${act.color}08`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected && !cannotAdd) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                >
                  {/* Color glow */}
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 40, height: 40, background: act.color, borderRadius: '50%', opacity: 0.08, filter: 'blur(12px)', pointerEvents: 'none' }} />

                  {/* Color dot + name row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.color, flexShrink: 0, boxShadow: `0 0 6px ${act.color}80` }} />
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {act.name}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={12} style={{ color: act.color, flexShrink: 0, marginTop: 1 }} />
                    )}
                  </div>

                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {displayBenefit(act.benefit)}
                  </p>

                  {/* Type badge */}
                  <div style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: act.color, opacity: 0.7 }}>
                      {act.category && act.type === 'Bioenergetic' ? act.category : act.type}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: 11 }}>{t('quantumApothecary.frequencyLibrarySection.noResults')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
