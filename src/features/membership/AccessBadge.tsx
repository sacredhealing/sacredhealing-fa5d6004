import type { MembershipTier } from "./useMembershipTier";

const rank: Record<MembershipTier, number> = {
  free: 0,
  monthly: 1,
  annual: 2,
  lifetime: 3,
};

export function AccessBadge({
  userTier,
  requiredTier,
}: {
  userTier: MembershipTier;
  requiredTier: MembershipTier;
}) {
  const hasAccess = rank[userTier] >= rank[requiredTier];

  return (
    <div className="mt-2">
      {hasAccess ? (
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border border-white/10">
          Included in your membership
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border border-white/10">
          Unlock with Membership
        </span>
      )}
    </div>
  );
}
