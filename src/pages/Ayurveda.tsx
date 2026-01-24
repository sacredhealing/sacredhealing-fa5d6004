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

  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return "LIFETIME" as AyurvedaMembershipLevel;
    if (tier === "lifetime") return "LIFETIME" as AyurvedaMembershipLevel;
    if (isPremium || tier?.includes("premium")) return "PREMIUM" as AyurvedaMembershipLevel;
    return "FREE" as AyurvedaMembershipLevel;
  };

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* make sure absolutely-positioned children in AyurvedaTool don’t escape */}
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        {/* keep back button from getting “pushed” by wide children */}
        <div className="relative z-50">
          <BackButton />
        </div>

        <div className="mt-6 w-full min-w-0">
          <AyurvedaTool membershipLevel={getAyurvedaLevel()} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
};

export default Ayurveda;
