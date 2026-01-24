import React from "react";
import { BackButton } from "@/components/layout/BackButton";
import { AyurvedaTool } from "@/components/ayurveda/AyurvedaTool";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useMembership } from "@/hooks/useMembership";
import type { AyurvedaMembershipLevel } from "@/lib/ayurvedaTypes";

const Ayurveda = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isPremium, tier } = useMembership();

  // Map membership tiers to Ayurveda levels - Admins get LIFETIME access
  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return "LIFETIME" as AyurvedaMembershipLevel;
    if (tier === "lifetime") return "LIFETIME" as AyurvedaMembershipLevel;
    if (isPremium || tier?.includes("premium")) return "PREMIUM" as AyurvedaMembershipLevel;
    return "FREE" as AyurvedaMembershipLevel;
  };

  return (
    <div className="min-h-screen bg-[#050505] w-full overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-4 py-6 md:px-8">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="w-full">
          <AyurvedaTool membershipLevel={getAyurvedaLevel()} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
};

export default Ayurveda;
