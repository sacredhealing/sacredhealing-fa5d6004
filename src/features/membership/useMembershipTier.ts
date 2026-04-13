import { useMemo } from "react";
import { useMembership } from "@/hooks/useMembership";
import type { MembershipTier } from "./tier";

export type { MembershipTier } from "./tier";

export function useMembershipTier(): MembershipTier {
  const { tier: rawTier, loading } = useMembership();

  return useMemo(() => {
    if (loading) return "free";

    const v = (rawTier ?? "").toString().toLowerCase().replace(/[\s_-]+/g, '');
    // Akasha-Infinity / lifetime
    if (v.includes("akasha") || v.includes("life")) return "lifetime";
    // Siddha-Quantum
    if (v.includes("siddha")) return "annual"; // siddha-quantum maps to rank 2
    // Prana-Flow / premium
    if (v.includes("prana") || v.includes("premium") || v.includes("annual") || v.includes("year") || v.includes("month")) return "monthly";
    return "free";
  }, [rawTier, loading]);
}
