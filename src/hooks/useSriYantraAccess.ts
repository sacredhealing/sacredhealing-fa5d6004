import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useMembership } from "@/hooks/useMembership";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";

/**
 * True if user can access Sri Yantra Shield tool:
 * - Admin (always free access)
 * - Has Siddha-Quantum or higher tier
 * - Has sri_yantra_access.has_access (purchased €49 once)
 */
export function useSriYantraAccess() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier } = useMembership();
  const [hasPurchasedAccess, setHasPurchasedAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user) {
      setHasPurchasedAccess(false);
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase
      .from("sri_yantra_access" as any)
      .select("has_access")
      .eq("user_id", user.id)
      .eq("has_access", true)
      .maybeSingle() as any);

    if (!error && data?.has_access) {
      setHasPurchasedAccess(true);
    } else {
      setHasPurchasedAccess(false);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    check();
  }, [check]);

  const hasAccess = isAdmin || hasPurchasedAccess || hasFeatureAccess(false, tier, FEATURE_TIER.sriYantraShield);

  return { hasAccess, loading, refetch: check };
}
