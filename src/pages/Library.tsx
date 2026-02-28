import React from 'react';
import { GlobalResonanceProvider, SanctuaryHub } from '@/components/resonance/GlobalResonanceHub';

/**
 * Library Page — Sacred Healing Sanctuary Dashboard
 * Route: /library
 */
export default function Library() {
  return (
    <GlobalResonanceProvider userEmail="sacredhealingvibe@gmail.com">
      <SanctuaryHub />
    </GlobalResonanceProvider>
  );
}
