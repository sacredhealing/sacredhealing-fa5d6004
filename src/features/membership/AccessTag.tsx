import type { MembershipTier } from "./tier";
import { hasTierAccess } from "./tier";

export function AccessTag({
  userTier,
  requiredTier,
}: {
  userTier: MembershipTier;
  requiredTier: MembershipTier;
}) {
  const ok = hasTierAccess(userTier, requiredTier);

  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      {ok ? "Included" : "Locked"}
    </span>
  );
}
