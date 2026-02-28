import React from 'react';
import {
  GlobalResonanceProvider,
  SanctuaryDashboard,
  SiteEffectOverlay,
} from '@/components/resonance/GlobalResonanceHub';

/**
 * Library Page — Sacred Healing Sanctuary Dashboard
 * Route: /library
 */
export default function Library() {
  return (
    <GlobalResonanceProvider userEmail="sacredhealingvibe@gmail.com">
      <SiteEffectOverlay />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #060010 0%, #000000 100%)',
          paddingBottom: 100,
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>
          <SanctuaryDashboard />
        </div>
      </div>
    </GlobalResonanceProvider>
  );
}
