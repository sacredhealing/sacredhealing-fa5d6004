import { useNavigate } from "react-router-dom";
import { Crown, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MembershipTier } from "./useMembershipTier";

const tierLabels: Record<MembershipTier, string> = {
  free: "Free",
  monthly: "Premium Monthly",
  annual: "Premium Annual",
  lifetime: "Lifetime",
};

interface YourMembershipSummaryProps {
  tier: MembershipTier;
  onManage: () => void;
  managing: boolean;
}

export function YourMembershipSummary({
  tier,
  onManage,
  managing,
}: YourMembershipSummaryProps) {
  const navigate = useNavigate();

  return (
    <div className="px-3 sm:px-4 py-6 sm:py-8 text-center space-y-4">
      <Crown className="w-12 h-12 sm:w-14 sm:h-14 text-amber-500 mx-auto" />
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">
        Your Membership
      </h2>
      <p className="text-muted-foreground">Your space is open.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button
          onClick={() => navigate("/")}
          size="lg"
          className="w-full sm:w-auto"
        >
          Continue
        </Button>
        <Button
          onClick={onManage}
          variant="outline"
          size="sm"
          disabled={managing}
          className="w-full sm:w-auto"
        >
          {managing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          Manage subscription
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{tierLabels[tier]}</p>
    </div>
  );
}
