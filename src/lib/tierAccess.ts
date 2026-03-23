/**
 * Tier Access Utility
 * 
 * Maps raw membership tier strings to a numeric rank for access control.
 * 
 * Tier hierarchy:
 *   0 = Free (Atma-Seed)
 *   1 = Prana-Flow (€19/mo)
 *   2 = Siddha-Quantum (€45/mo)
 *   3 = Akasha-Infinity (€1111 lifetime)
 */

export function getTierRank(tier: string | undefined | null): number {
  const t = (tier || '').toLowerCase();
  if (t.includes('life') || t.includes('akasha')) return 3;
  if (t.includes('siddha')) return 2;
  if (
    t.includes('prana') ||
    t.includes('premium') ||
    t.includes('month') ||
    t.includes('annual') ||
    t.includes('year')
  )
    return 1;
  return 0;
}

/** Minimum tier rank required for each feature */
export const FEATURE_TIER = {
  // Prana-Flow (rank 1)
  ayurveda: 1,
  vastu: 1,
  jyotishFull: 1,
  fullMeditations: 1,
  fullMantras: 1,
  fullHealing: 1,

  /** Siddha Portal hub + SQI tools linked from it: rank ≥ 2 only (Siddha–Quantum, Akasha–Infinity), not Prana–Flow */
  siddhaPortal: 2,
  digitalNadi: 2,
  sriYantraShield: 2,
  soulVault: 2,

  // Free (rank 0) — Vayu Protocol for all users
  vayuProtocol: 0,

  // Akasha-Infinity (rank 3)
  quantumApothecary: 3,
  virtualPilgrimage: 3,
  palmOracle: 3,
  akashicDecoder: 3,
} as const;

/** Returns the correct sales page URL for a required tier rank */
export function getSalesPageForRank(requiredRank: number): string {
  if (requiredRank >= 3) return '/akasha-infinity';
  if (requiredRank >= 2) return '/siddha-quantum';
  return '/prana-flow';
}

/** Check if user has access to a feature, considering admin and tier */
export function hasFeatureAccess(
  isAdmin: boolean,
  tier: string | undefined | null,
  requiredRank: number
): boolean {
  if (isAdmin) return true;
  return getTierRank(tier) >= requiredRank;
}

/**
 * Siddha Portal (`/siddha-portal`) and its satellite SQI routes:
 * admins, or membership tier rank ≥ 2 (Siddha–Quantum, Akasha–Infinity).
 * Prana–Flow (rank 1) and free users are excluded.
 */
export function hasSiddhaPortalHubAccess(
  isAdmin: boolean,
  tier: string | undefined | null
): boolean {
  return hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal);
}
