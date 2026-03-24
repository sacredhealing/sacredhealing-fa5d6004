import React, { useState } from 'react';
import { ACTIVATIONS } from '@/features/quantum-apothecary/constants';
import type { Activation } from '@/features/quantum-apothecary/types';

interface Props {
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  selectedActivations: Activation[];
  addActivation: (act: Activation) => void;
}

// ── ONE LINE CHANGE vs live version:
// Added 'Bioenergetic' to this array — this is the ONLY diff needed
const CATEGORIES = [
  'All',
  'Sacred Plant',
  'Siddha Soma',
  'Bioenergetic',      // ← THIS WAS MISSING — exposes all 1,259 LimbicArc entries
  'Essential Oil',
  'Ayurvedic Herb',
  'Mineral',
  'Mushroom',
  'Adaptogen',
];

const CAT_COLOR: Record<string, string> = {
  'All':            '#D4AF37',
  'Sacred Plant':   '#4ade80',
  'Siddha Soma':    '#D4AF37',
  'Bioenergetic':   '#60a5fa',
  'Essential Oil':  '#f472b6',
  'Ayurvedic Herb': '#fb923c',
  'Mineral':        '#94a3b8',
  'Mushroom':       '#b45309',
  'Adaptogen':      '#34d399',
};

export default function FrequencyLibrarySection({
  activeCategory,
  setActiveCategory,
  selectedActivations,
  addActivation,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = ACTIVATIONS.filter(act => {
    const matchCat  = activeCategory === 'All' || act.type === activeCategory;
    const matchSearch = !search ||
      act.name.toLowerCase().includes(search.toLowerCase()) ||
      act.benefit.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div
      className="rounded-3xl backdrop-blur-2xl p-5"
      style={{
        background: 'rgba(5,5,5,0.6)',
        border: '1px solid rgba(212,175,55,0.12)',
      }}
    >
      {/* ── Header + Search ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-black tracking-[-0.03em]">Frequency Library</h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mt-0.5">
            {filtered.length} essences available
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl py-1.5 px-3 text-[11px] text-white/70 outline-none w-28 focus:border-[#D4AF37]/30 transition"
        />
      </div>

      {/* ── Category pills ── */}
      <div
        className="flex gap-1.5 mb-3 pb-1"
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat;
          const col    = CAT_COLOR[cat] ?? '#D4AF37';
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 text-[8px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border transition-all"
              style={{
                background:   active ? `${col}18` : 'transparent',
                borderColor:  active ? col        : 'rgba(255,255,255,0.08)',
                color:        active ? col        : 'rgba(255,255,255,0.4)',
                boxShadow:    active ? `0 0 10px ${col}30` : 'none',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      <div
        className="grid grid-cols-2 gap-2"
        style={{ maxHeight: 280, overflowY: 'auto', scrollbarWidth: 'thin' }}
      >
        {filtered.map(act => {
          const selected = !!selectedActivations.find(a => a.id === act.id);
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => addActivation(act)}
              disabled={selected}
              className="text-left p-3 rounded-2xl border relative overflow-hidden transition-all disabled:opacity-30"
              style={{
                background:   selected ? `${act.color}10` : 'rgba(255,255,255,0.02)',
                borderColor:  selected ? `${act.color}40` : 'rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = `${act.color}50`;
                  (e.currentTarget as HTMLElement).style.background  = `${act.color}08`;
                }
              }}
              onMouseLeave={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.background  = 'rgba(255,255,255,0.02)';
                }
              }}
            >
              {/* colour glow */}
              <div
                className="absolute top-0 right-0 w-10 h-10 rounded-full"
                style={{ background: act.color, opacity: 0.08, filter: 'blur(12px)' }}
              />
              {/* dot + name */}
              <div className="flex items-start gap-2 mb-1 relative">
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                  style={{ background: act.color, boxShadow: `0 0 5px ${act.color}80` }}
                />
                <p className="text-[11px] font-black text-white leading-tight line-clamp-2">
                  {act.name}
                </p>
              </div>
              {/* benefit */}
              <p className="text-[9px] text-white/38 leading-snug line-clamp-2 relative">
                {act.benefit}
              </p>
              {/* type badge */}
              <p
                className="text-[7px] font-black uppercase tracking-[0.15em] mt-1.5 relative"
                style={{ color: act.color, opacity: 0.7 }}
              >
                {act.type}
              </p>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-8 text-white/20 text-[11px]">
            No essences found
          </div>
        )}
      </div>
    </div>
  );
}
