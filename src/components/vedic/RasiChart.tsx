import React from 'react';

// ── South Indian (fixed-sign) Rasi chart ─────────────────────────
// Every graha placement here comes from real sidereal longitudes computed
// by the jyotish-ephemeris edge function (Lahiri ayanamsa, geocoded birth
// location, DST-aware UTC offset) — nothing here is guessed or invented.

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

// Fixed South Indian grid position for each sign, as (row, col) in a 4x4 grid.
// This is the standard convention: signs never move, only planets do.
const SIGN_GRID_POS: Record<string, [number, number]> = {
  Pisces: [0, 0], Aries: [0, 1], Taurus: [0, 2], Gemini: [0, 3],
  Aquarius: [1, 0],                                Cancer: [1, 3],
  Capricorn: [2, 0],                               Leo: [2, 3],
  Sagittarius: [3, 0], Scorpio: [3, 1], Libra: [3, 2], Virgo: [3, 3],
};

const PLANET_ABBR: Record<string, string> = {
  sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me',
  jupiter: 'Ju', venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke',
};

const PLANET_COLOR: Record<string, string> = {
  sun: '#F5A623', moon: '#7DD3FC', mars: '#FB7185', mercury: '#34D399',
  jupiter: '#D4AF37', venus: '#F0ABFC', saturn: '#818CF8', rahu: '#4ADE80', ketu: '#94A3B8',
};

function signFromLongitude(lon: number): string {
  const idx = Math.floor((((lon % 360) + 360) % 360) / 30);
  return SIGNS[idx];
}

// Small gold corner-bracket flourish, echoing the ornamental frame of a
// traditional printed chart without copying any particular one's palette.
const CornerBracket: React.FC<{ corner: 'tl' | 'tr' | 'bl' | 'br' }> = ({ corner }) => {
  const rotations: Record<string, number> = { tl: 0, tr: 90, br: 180, bl: 270 };
  const pos: Record<string, React.CSSProperties> = {
    tl: { top: -1, left: -1 },
    tr: { top: -1, right: -1 },
    br: { bottom: -1, right: -1 },
    bl: { bottom: -1, left: -1 },
  };
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{
      position: 'absolute', ...pos[corner],
      transform: `rotate(${rotations[corner]}deg)`, pointerEvents: 'none',
    }}>
      <path d="M1 21 V7 Q1 1 7 1 H21" fill="none" stroke="#D4AF37" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export interface RasiChartProps {
  ascendantSign?: string | null;
  moonNakshatra?: string | null;
  /** Raw sidereal longitudes (0-360°) from jyotish-ephemeris, e.g. { sun: 123.4, moon: 45.6, ... } */
  planetLongitudes?: Record<string, number> | null;
  loading?: boolean;
}

export const RasiChart: React.FC<RasiChartProps> = ({
  ascendantSign, moonNakshatra, planetLongitudes, loading,
}) => {
  const W = 'rgba(255,255,255,';

  if (loading) {
    return (
      <div style={{
        aspectRatio: '1', maxWidth: 360, margin: '0 auto',
        borderRadius: 24, background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${W}0.06)`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 11, color: `${W}0.35)`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Calculating chart…
        </span>
      </div>
    );
  }

  if (!ascendantSign && !planetLongitudes) {
    return (
      <div style={{
        aspectRatio: '1', maxWidth: 360, margin: '0 auto',
        borderRadius: 24, background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${W}0.06)`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center',
      }}>
        <span style={{ fontSize: 11, color: `${W}0.35)`, lineHeight: 1.6 }}>
          Add your birth details to reveal your Rasi chart.
        </span>
      </div>
    );
  }

  // Bucket planets by sign, using real computed longitudes only.
  const bySign: Record<string, string[]> = {};
  for (const sign of SIGNS) bySign[sign] = [];
  if (planetLongitudes) {
    for (const [key, lon] of Object.entries(planetLongitudes)) {
      if (typeof lon !== 'number' || Number.isNaN(lon)) continue;
      const sign = signFromLongitude(lon);
      const abbr = PLANET_ABBR[key];
      if (abbr) bySign[sign].push(abbr);
    }
  }

  const cells: { sign: string; isLagna: boolean; planets: string[] }[][] =
    Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ({ sign: '', isLagna: false, planets: [] })));

  for (const sign of SIGNS) {
    const [r, c] = SIGN_GRID_POS[sign];
    cells[r][c] = {
      sign,
      isLagna: !!ascendantSign && sign.toLowerCase() === ascendantSign.toLowerCase(),
      planets: bySign[sign],
    };
  }

  return (
    <div style={{
      maxWidth: 360, margin: '0 auto', padding: 14,
      borderRadius: 26, background: 'linear-gradient(160deg, rgba(212,175,55,0.05), rgba(255,255,255,0.015))',
      border: `1px solid ${W}0.07)`, position: 'relative',
    }}>
      <CornerBracket corner="tl" /><CornerBracket corner="tr" />
      <CornerBracket corner="bl" /><CornerBracket corner="br" />

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)',
        gap: 2, aspectRatio: '1', borderRadius: 14, overflow: 'hidden',
        border: `1px solid rgba(212,175,55,0.22)`, background: 'rgba(212,175,55,0.14)',
      }}>
        {cells.map((row, r) => row.map((cell, c) => {
          const isCenter = r >= 1 && r <= 2 && c >= 1 && c <= 2;
          if (isCenter) {
            if (r === 1 && c === 1) {
              return (
                <div key="center" style={{
                  gridRow: '2 / span 2', gridColumn: '2 / span 2',
                  background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.09), #0a0a0a 72%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 10, textAlign: 'center', position: 'relative',
                }}>
                  <span style={{
                    fontSize: 7, fontWeight: 800, letterSpacing: '0.3em',
                    textTransform: 'uppercase', color: `${W}0.32)`, marginBottom: 6,
                  }}>
                    Rasi Chart
                  </span>
                  {moonNakshatra && (
                    <span style={{
                      fontSize: 17, fontWeight: 900, color: '#D4AF37', lineHeight: 1.25,
                      textShadow: '0 0 18px rgba(212,175,55,0.35)',
                    }}>
                      {moonNakshatra}
                    </span>
                  )}
                </div>
              );
            }
            return null;
          }
          return (
            <div key={`${r}-${c}`} style={{
              background: cell.isLagna ? 'rgba(212,175,55,0.1)' : '#0a0a0a',
              boxShadow: cell.isLagna ? 'inset 0 0 0 1.5px rgba(212,175,55,0.55)' : 'none',
              padding: 8, display: 'flex', flexDirection: 'column', gap: 5, position: 'relative',
            }}>
              {cell.isLagna && (
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: '0.12em',
                  color: '#D4AF37', textShadow: '0 0 10px rgba(212,175,55,0.5)',
                }}>
                  LAG
                </span>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cell.planets.map((p, i) => {
                  const key = Object.keys(PLANET_ABBR).find(k => PLANET_ABBR[k] === p) || '';
                  const color = PLANET_COLOR[key] || `${W}0.7)`;
                  return (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 800, color,
                      padding: '1.5px 5px', borderRadius: 6,
                      background: `${color}1a`, border: `1px solid ${color}40`,
                      lineHeight: 1.5,
                    }}>
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        }))}
      </div>

      {ascendantSign && (
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11.5, color: `${W}0.42)`, letterSpacing: '0.01em' }}>
          <strong style={{ color: '#D4AF37', fontWeight: 800 }}>{ascendantSign}</strong> Lagna
          {moonNakshatra ? <> &nbsp;·&nbsp; Moon Nakshatra <strong style={{ color: '#D4AF37', fontWeight: 800 }}>{moonNakshatra}</strong></> : null}
        </div>
      )}
    </div>
  );
};
