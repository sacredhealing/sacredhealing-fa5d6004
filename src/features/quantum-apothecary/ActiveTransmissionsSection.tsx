// @ts-nocheck
// ╔══════════════════════════════════════════════════════════════════╗
// ║  SQI-2050 REDESIGN — ActiveTransmissionsSection                 ║
// ║  VISUAL LAYER ONLY — All props, state setters, onClick handlers ║
// ║  are 100% UNTOUCHED                                             ║
// ╚══════════════════════════════════════════════════════════════════╝

import React from 'react';
import { Zap, ShieldCheck, X } from 'lucide-react';
import type { Activation } from '@/features/quantum-apothecary/types';

interface Props {
  activeTransmissions: Activation[];
  setActiveTransmissions: React.Dispatch<React.SetStateAction<Activation[]>>;
}

export default function ActiveTransmissionsSection({
  activeTransmissions,
  setActiveTransmissions,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap
            size={14}
            style={{ color: '#D4AF37', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' }}
          />
          <h2 style={{
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#ffffff',
          }}>
            Active Transmissions
          </h2>
        </div>

        {/* 24/7 Live badge */}
        <span style={{
          fontSize: '9px',
          fontWeight: 900,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          padding: '4px 12px',
          borderRadius: '100px',
          background: 'rgba(52,211,153,0.08)',
          color: '#34d399',
          border: '1px solid rgba(52,211,153,0.2)',
          animation: 'pulse 2s infinite',
        }}>
          24/7 Live
        </span>
      </div>

      {/* ── Transmissions List ── LOGIC UNCHANGED ── */}
      <div
        className="custom-scrollbar"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '192px', overflowY: 'auto' }}
      >
        {activeTransmissions.length === 0 ? (

          /* ── Empty State ── */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <ShieldCheck
              size={22}
              style={{ color: 'rgba(255,255,255,0.12)', margin: '0 auto 8px', display: 'block' }}
            />
            <p style={{
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)',
            }}>
              No Active Frequencies
            </p>
          </div>

        ) : (

          /* ── Active Transmission Rows ── LOGIC UNCHANGED ── */
          activeTransmissions.map(act => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                {/* Pulsing colour dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: act.color,
                    boxShadow: `0 0 8px ${act.color}`,
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: act.color,
                    opacity: 0.3,
                    animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                  }} />
                </div>

                <div>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: '#ffffff',
                    marginBottom: '2px',
                  }}>
                    {act.name}
                  </p>
                  <p style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)',
                  }}>
                    Resonating...
                  </p>
                </div>
              </div>

              {/* Dissolve button — LOGIC UNCHANGED */}
              <button
                onClick={() => setActiveTransmissions(t => t.filter(x => x.id !== act.id))}
                title="Dissolve"
                style={{
                  padding: '6px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
