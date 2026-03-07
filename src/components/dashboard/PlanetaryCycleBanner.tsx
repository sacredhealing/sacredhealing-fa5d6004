/**
 * SQI 2050: Real-time Planetary Cycle Banner
 * Displays the user's current Vimshottari Mahadasha from their Jyotish/Vedic reading.
 */

import React from 'react';
import type { VedicReading } from '@/lib/vedicTypes';
import { getActiveCycle } from '@/lib/planetaryCycleEngine';

interface PlanetaryCycleBannerProps {
  userJyotishData: VedicReading | null | undefined;
}

export const PlanetaryCycleBanner: React.FC<PlanetaryCycleBannerProps> = ({ userJyotishData }) => {
  const cycle = getActiveCycle(userJyotishData);

  return (
    <div
      className="glass-card p-4 border flex items-center justify-between"
      style={{
        borderColor: `${cycle.color}33`,
        background: 'rgba(5,5,5,0.6)',
        borderRadius: 18,
        margin: '0 16px',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center border animate-pulse flex-shrink-0"
          style={{
            borderColor: cycle.color,
            boxShadow: `0 0 15px ${cycle.color}33`,
          }}
        >
          <span className="text-xl" aria-hidden>🪐</span>
        </div>
        <div>
          <h4
            className="font-black uppercase text-white/40"
            style={{ fontSize: 8, letterSpacing: '0.4em' }}
          >
            Current Planetary Cycle
          </h4>
          <p
            className="text-sm font-black italic tracking-tight"
            style={{ color: cycle.color }}
          >
            {cycle.theme} Protocol Active
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span
          className="block uppercase tracking-widest font-mono text-white/20"
          style={{ fontSize: 7 }}
        >
          Vimshottari Phase
        </span>
        <span className="text-white font-bold" style={{ fontSize: 10 }}>
          Safe Passage
        </span>
      </div>
    </div>
  );
};
