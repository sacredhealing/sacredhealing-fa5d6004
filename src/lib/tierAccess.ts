/**
 * Tier Access Utility
 *
 * Canonical slugs (Stripe + admin grant + edge function):
 *   free, prana-flow, siddha-quantum, akasha-infinity
 *
 * Tier hierarchy:
 *   0 = Free (Atma-Seed)
 *   1 = Prana-Flow (€19/mo)
 *   2 = Siddha-Quantum (€45/mo)
 *   3 = Akasha-Infinity (€1111 lifetime)
 *
 * Legacy aliases (premium-monthly, premium-annual, lifetime, prana-monthly,
 * siddha-quantum-monthly) are still recognized for backwards-compat parsing.
 */

/** Maps `ayurveda_courses.tier_required` slug to membership rank (0–3). */
export function getCourseTierRequiredRank(tierRequired: string | null | undefined): number {
  const raw = (tierRequired || 'free').toLowerCase().replace(/_/g, '-');
  if (!raw || raw === 'free') return 0;
  if (raw.includes('akasha') || raw.includes('infinity')) return 3;
  if (raw.includes('siddha')) return 2;
  if (raw.includes('prana')) return 1;
  return 0;
}

export function getTierRank(tier: string | undefined | null): number {
  const t = (tier || '').toLowerCase();
  // Rank 3 — Akasha-Infinity, lifetime, Temple Home / virtual pilgrimage equivalents
  if (t.includes('life') || t.includes('akasha')) return 3;
  if (t.includes('temple_home') || t.includes('temple-home') || t.includes('templehome')) return 3;
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

/**
 * Maps `music_tracks.auto_analysis_data.access_tier` (admin Portal tier) to the same
 * numeric ranks as membership (`getUserMusicAccessRank`).
 */
export function getMusicTrackAccessTierRankFromStoredValue(v: string | undefined | null): number | null {
  if (v == null || v === '') return null;
  const n = v.toLowerCase();
  if (n === 'free') return 0;
  if (n === 'prana_flow' || n === 'prana-flow') return 1;
  if (n === 'siddha_quantum' || n === 'siddha-quantum') return 2;
  if (n === 'akashainfinity' || n === 'akasha_infinity' || n === 'akasha-infinity') return 3;
  return null;
}

/**
 * Required membership rank to stream the full track (Sacred Sound Portal + global player).
 * Uses admin `access_tier` when set; otherwise legacy: `price_usd === 0` → free, else Prana+.
 */
export function getMusicTrackRequiredRank(track: {
  price_usd?: number;
  auto_analysis_data?: { access_tier?: string } | null;
}): number {
  const stored = getMusicTrackAccessTierRankFromStoredValue(
    track.auto_analysis_data?.access_tier as string | undefined
  );
  if (stored !== null) return stored;
  const p = track.price_usd ?? 0;
  return p === 0 ? 0 : 1;
}

/** User rank for music track gating (aligned with `Music.tsx` / membership). */
export function getUserMusicAccessRank(params: {
  user: { id: string } | null | undefined;
  isAdmin?: boolean;
  adminGranted?: boolean;
  isPremium?: boolean;
  membershipTier: string | undefined | null;
}): number {
  if (!params.user) return 0;
  if (params.isAdmin || params.adminGranted) return 3;
  const tier = (params.membershipTier || '').toLowerCase();
  if (tier.includes('akasha') || tier.includes('infinity') || tier.includes('lifetime')) return 3;
  if (tier.includes('siddha') || tier.includes('quantum')) return 2;
  if (tier.includes('prana') || params.isPremium) return 1;
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

  // Siddha-Quantum (rank 2)
  siddhaPortal: 2,
  digitalNadi: 2,
  sriYantraShield: 2,
  soulVault: 2,

  // Free (rank 0) — Vayu Protocol for all users
  vayuProtocol: 0,

  // Akasha-Infinity (rank 3)
  quantumApothecary: 3,
  /** Virtual Pilgrimage + Temple Home — same tier gate */
  virtualPilgrimage: 3,
  templeHome: 3,
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
 * Akasha-Infinity–level entitlements (Temple Home, virtual pilgrimage, etc.).
 * Belt-and-suspenders with getTierRank for slug variants from Stripe / profiles.
 */
export function isAkashaInfinityTier(tier: string | undefined | null): boolean {
  const t = (tier || '').toLowerCase();
  if (!t) return false;
  if (getTierRank(tier) >= 3) return true;
  return (
    t.includes('akasha') ||
    t.includes('lifetime') ||
    t.includes('temple_home') ||
    t.includes('temple-home') ||
    t.includes('templehome')
  );
}
