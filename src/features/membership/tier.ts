export type MembershipTier = "free" | "monthly" | "annual" | "lifetime";

export const tierRank: Record<MembershipTier, number> = {
  free: 0,
  monthly: 1,
  annual: 2,
  lifetime: 3,
};

export function hasTierAccess(user: MembershipTier, required: MembershipTier) {
  return tierRank[user] >= tierRank[required];
}
