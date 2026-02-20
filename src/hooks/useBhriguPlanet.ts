import { useMemo } from 'react';
import { normalizePlanetName, type Planet } from '@/lib/jyotishMantraLogic';
import type { VedicReading } from '@/lib/vedicTypes';

/**
 * Bhrigu Logic — memoized current Dasha planet from Jyotish reading.
 * Prevents recalculating on every frame; only updates when reading/period changes.
 */
export function useBhriguPlanet(reading: VedicReading | null): Planet | null {
  return useMemo(() => {
    const period = reading?.personalCompass?.currentDasha?.period;
    if (!period) return null;
    const planetName = period.split(' ')[0];
    return normalizePlanetName(planetName);
  }, [reading?.personalCompass?.currentDasha?.period]);
}
