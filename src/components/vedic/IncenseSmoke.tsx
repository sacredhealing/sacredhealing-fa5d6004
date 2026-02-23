import React from 'react';

/**
 * Subtle ambient CSS smoke animation — wisps of incense drifting upward.
 * Rendered behind page content; pointer-events: none.
 */
export const IncenseSmoke: React.FC = () => (
  <div className="incense-smoke" aria-hidden>
    <div className="smoke-wisp" />
    <div className="smoke-wisp" />
    <div className="smoke-wisp" />
    <div className="smoke-wisp" />
  </div>
);
