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
  sun: '#F59E0B', moon: '#93C5FD', mars: '#EF4444', mercury: '#22D3EE',
  jupiter: '#D4AF37', venus: '#F472B6', saturn: '#818CF8', rahu: '#4ADE80', ketu: '#4ADE80',
};

function signFromLongitude(lon: number): string {
  const idx = Math.floor((((lon % 360) + 360) % 360) / 30);
  return SIGNS[idx];
}

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
        aspectRatio: '1', maxWidth: 340, margin: '0 auto',
        borderRadius: 24, background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${W}0.05)`, display: 'flex',
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
        aspectRatio: '1', maxWidth: 340, margin: '0 auto',
        borderRadius: 24, background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${W}0.05)`, display: 'flex',
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

  // Build the 4x4 grid; center 2x2 is the label area.
  const cells: { sign: string | null; label: React.ReactNode }[][] =
    Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ({ sign: null, label: null })));

  for (const sign of SIGNS) {
    const [r, c] = SIGN_GRID_POS[sign];
    const isLagna = ascendantSign && sign.toLowerCase() === ascendantSign.toLowerCase();
    const planets = bySign[sign];
    cells[r][c] = {
      sign,
      label: (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 6 }}>
          {isLagna && (
            <span style={{
              fontSize: 8, fontWeight: 800, letterSpacing: '0.1em',
              color: '#D4AF37', marginBottom: 2,
            }}>
              LAG
            </span>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {planets.map((p, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 700,
                color: PLANET_COLOR[Object.keys(PLANET_ABBR).find(k => PLANET_ABBR[k] === p) || ''] || `${W}0.7)`,
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      ),
    };
  }

  return (
    <div style={{
      maxWidth: 340, margin: '0 auto', padding: 12,
      borderRadius: 24, background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${W}0.05)`,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)',
        gap: 1, aspectRatio: '1', background: `${W}0.06)`, borderRadius: 12, overflow: 'hidden',
      }}>
        {cells.map((row, r) => row.map((cell, c) => {
          const isCenter = r >= 1 && r <= 2 && c >= 1 && c <= 2;
          if (isCenter) {
            // Render the merged 2x2 center only once, from its top-left slot.
            if (r === 1 && c === 1) {
              return (
                <div key="center" style={{
                  gridRow: '2 / span 2', gridColumn: '2 / span 2',
                  background: 'rgba(5,5,5,0.6)', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 8, textAlign: 'center',
                }}>
                  <span style={{
                    fontSize: 7, fontWeight: 800, letterSpacing: '0.25em',
                    textTransform: 'uppercase', color: `${W}0.3)`, marginBottom: 4,
                  }}>
                    Rasi Chart
                  </span>
                  {moonNakshatra && (
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#D4AF37' }}>
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
              background: 'rgba(255,255,255,0.015)',
            }}>
              {cell.label}
            </div>
          );
        }))}
      </div>
      {ascendantSign && (
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: `${W}0.4)` }}>
          <strong style={{ color: '#D4AF37' }}>{ascendantSign}</strong> Lagna
          {moonNakshatra ? <> · Moon Nakshatra <strong style={{ color: '#D4AF37' }}>{moonNakshatra}</strong></> : null}
        </div>
      )}
    </div>
  );
};
