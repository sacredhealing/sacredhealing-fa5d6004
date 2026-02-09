import { useMemo } from "react";
import { useMembership } from "@/hooks/useMembership";

export type MembershipTier = "free" | "monthly" | "annual" | "lifetime";

export function useMembershipTier(): MembershipTier {
  const { tier: rawTier, loading } = useMembership();

  return useMemo(() => {
    if (loading) return "free";

    const v = (rawTier ?? "").toString().toLowerCase();
    if (v.includes("life")) return "lifetime";
    if (v.includes("annual") || v.includes("year") || v === "premium-annual") return "annual";
    if (v.includes("month") || v === "premium-monthly") return "monthly";
    return "free";
  }, [rawTier, loading]);
}
