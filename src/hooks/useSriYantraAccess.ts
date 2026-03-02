import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";

/**
 * True if user can access Sri Yantra Shield tool:
 * - Admin (always free access)
 * - Has sri_yantra_access.has_access (purchased €49 once)
 */
export function useSriYantraAccess() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [hasPurchasedAccess, setHasPurchasedAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user) {
      setHasPurchasedAccess(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("sri_yantra_access")
      .select("has_access")
      .eq("user_id", user.id)
      .eq("has_access", true)
      .maybeSingle();

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

  const hasAccess = isAdmin || hasPurchasedAccess;

  return { hasAccess, loading, refetch: check };
}
