// @ts-nocheck
// ╔══════════════════════════════════════════════════════════════════╗
// ║  SQI-2050 REDESIGN — FrequencyLibrarySection                   ║
// ║  VISUAL LAYER ONLY — All props, logic, onClick handlers         ║
// ║  and filter logic are 100% UNTOUCHED                            ║
// ╚══════════════════════════════════════════════════════════════════╝

import React from 'react';
import { ACTIVATIONS } from '@/features/quantum-apothecary/constants';
import type { Activation } from '@/features/quantum-apothecary/types';

interface Props {
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  selectedActivations: Activation[];
  addActivation: (act: Activation) => void;
}

export default function FrequencyLibrarySection({
  activeCategory,
  setActiveCategory,
  selectedActivations,
  addActivation,
}: Props) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '40px',
      padding: '24px',
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: '#ffffff',
          marginBottom: '4px',
        }}>
          Frequency Library
        </h2>
        <p style={{
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
        }}>
          Select essences for your transmission
        </p>
      </div>

      {/* ── Category Filter Pills ── LOGIC UNCHANGED ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        {['All', 'Sacred Plant', 'Siddha Soma', 'Bioenergetic', 'Essential Oil', 'Ayurvedic Herb', 'Mineral', 'Mushroom', 'Adaptogen'].map(type => (
          <button
            key={type}
            onClick={() => setActiveCategory(type)}
            style={{
              fontSize: '9px',
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '5px 12px',
              borderRadius: '100px',
              border: activeCategory === type
                ? '1px solid rgba(212,175,55,0.5)'
                : '1px solid rgba(255,255,255,0.06)',
              background: activeCategory === type
                ? 'rgba(212,175,55,0.15)'
                : 'rgba(255,255,255,0.02)',
              color: activeCategory === type
                ? '#D4AF37'
                : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === type
                ? '0 0 12px rgba(212,175,55,0.15)'
                : 'none',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* ── Activation Cards Grid ── LOGIC UNCHANGED ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        maxHeight: '264px',
        overflowY: 'auto',
        // custom scrollbar via className below
      }}
        className="custom-scrollbar"
      >
        {ACTIVATIONS
          .filter(act => activeCategory === 'All' || act.type === activeCategory)
          .map(act => {
            const isSelected = !!selectedActivations.find(a => a.id === act.id);
            return (
              <button
                key={act.id}
                onClick={() => addActivation(act)}
                disabled={isSelected}
                style={{
                  textAlign: 'left',
                  padding: '14px',
                  background: isSelected
                    ? 'rgba(212,175,55,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: isSelected
                    ? '1px solid rgba(212,175,55,0.25)'
                    : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '20px',
                  cursor: isSelected ? 'not-allowed' : 'pointer',
                  opacity: isSelected ? 0.4 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(212,175,55,0.35)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.05)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.05)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
                  }
                }}
              >
                {/* Colour aura blob */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: act.color,
                  opacity: 0.08,
                  filter: 'blur(16px)',
                  pointerEvents: 'none',
                }} />

                {/* Colour dot */}
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: act.color,
                  boxShadow: `0 0 8px ${act.color}`,
                  marginBottom: '8px',
                }} />

                <p style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  marginBottom: '4px',
                  position: 'relative',
                }}>
                  {act.name}
                </p>
                <p style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.35)',
                  lineHeight: '1.4',
                  position: 'relative',
                }}>
                  {act.benefit}
                </p>
              </button>
            );
          })}
      </div>
    </div>
  );
}
