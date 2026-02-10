import type { MembershipTier } from "./tier";
import { hasTierAccess } from "./tier";

export function AccessBadge({
  userTier,
  requiredTier,
}: {
  userTier: MembershipTier;
  requiredTier: MembershipTier;
}) {
  const hasAccess = hasTierAccess(userTier, requiredTier);

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
