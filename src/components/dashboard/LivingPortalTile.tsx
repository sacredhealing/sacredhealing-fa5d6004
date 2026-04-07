import React, { useState, useCallback } from 'react';

export interface PortalConfig {
  id: string;
  glowColor: string;        // e.g. '212,175,55'
  glowOpacity: number;       // idle glow opacity e.g. 0.18
  pulseOpacity: number;      // active pulse opacity e.g. 0.6
  breathDuration: number;    // seconds
}

export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  vedic:    { id: 'vedic',    glowColor: '212,175,55',  glowOpacity: 0.18, pulseOpacity: 0.6,  breathDuration: 2.5 },
  ayurveda: { id: 'ayurveda', glowColor: '76,175,80',   glowOpacity: 0.12, pulseOpacity: 0.5,  breathDuration: 3 },
  soma:     { id: 'soma',     glowColor: '0,242,254',   glowOpacity: 0.12, pulseOpacity: 0.5,  breathDuration: 2 },
  vastu:    { id: 'vastu',    glowColor: '255,183,77',  glowOpacity: 0.12, pulseOpacity: 0.5,  breathDuration: 3.5 },
  mantras:  { id: 'mantras',  glowColor: '139,92,246',  glowOpacity: 0.12, pulseOpacity: 0.5,  breathDuration: 2.8 },
};

interface LivingPortalTileProps {
  portal: PortalConfig;
  featured?: boolean;
  locked?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  /** Optional dosha-based border override color (rgb string) */
  doshaBorderColor?: string;
}

export const LivingPortalTile: React.FC<LivingPortalTileProps> = ({
  portal,
  featured,
  locked,
  onClick,
  children,
  doshaBorderColor,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const handlePointerDown = useCallback(() => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);
  }, []);

  const { glowColor, glowOpacity, pulseOpacity, breathDuration } = portal;
  const borderColor = doshaBorderColor || glowColor;

  // Scalar wave animation selection
  const animationName = glowColor.startsWith('212')
    ? 'scalarPulseGold'
    : 'scalarPulseCyan';

  return (
    <div
      onClick={onClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => { setIsHovered(false); setIsPulsing(false); }}
      onPointerDown={handlePointerDown}
      className={`sq-tile ${featured ? 'sq-tile-featured' : ''} ${locked ? 'sq-tile-locked' : ''}`}
      style={{
        position: 'relative',
        cursor: onClick ? 'pointer' : undefined,
        borderColor: isHovered
          ? `rgba(${borderColor}, ${pulseOpacity})`
          : `rgba(${borderColor}, ${glowOpacity})`,
        boxShadow: isHovered
          ? `0 0 35px rgba(${glowColor},0.4), 0 0 70px rgba(${glowColor},0.12)`
          : undefined,
        transform: isHovered ? 'translateY(-3px) scale(1.015)' : 'none',
        transition: 'box-shadow 0.4s ease, transform 0.3s ease, border-color 0.3s ease',
        animation: `${animationName} ${breathDuration}s ease-in-out infinite`,
        overflow: 'hidden',
      }}
    >
      {/* Prema-Pulse flash overlay */}
      {isPulsing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `radial-gradient(circle at center, rgba(${glowColor}, 0.25) 0%, transparent 70%)`,
            animation: 'premaPulse 0.3s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      {children}
    </div>
  );
};
