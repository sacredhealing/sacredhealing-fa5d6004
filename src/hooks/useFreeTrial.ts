import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FreeTrial {
  id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  trial_tier: string;
  converted: boolean;
  conversion_date: string | null;
}

export const useFreeTrial = () => {
  const { user } = useAuth();
  const [trial, setTrial] = useState<FreeTrial | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const fetchTrial = useCallback(async () => {
    if (!user) {
      setTrial(null);
      setIsTrialActive(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("free_trials")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching trial:", error);
      }

      if (data) {
        setTrial(data);
        
        const endsAt = new Date(data.ends_at);
        const now = new Date();
        const active = endsAt > now && !data.converted;
        
        setIsTrialActive(active);
        
        if (active) {
          const diffTime = endsAt.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays);
        } else {
          setDaysRemaining(0);
        }
      }
    } catch (error) {
      console.error("Error fetching trial:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startTrial = useCallback(async () => {
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      const { data, error } = await supabase.functions.invoke("start-free-trial");
      
      if (error) throw error;

      if (data.success) {
        await fetchTrial();
        return { success: true, trial: data.trial };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error("Error starting trial:", error);
      return { success: false, error: error.message };
    }
  }, [user, fetchTrial]);

  const hasUsedTrial = trial !== null;
  const canStartTrial = user && !hasUsedTrial;

  useEffect(() => {
    fetchTrial();
  }, [fetchTrial]);

  return {
    trial,
    loading,
    isTrialActive,
    daysRemaining,
    hasUsedTrial,
    canStartTrial,
    startTrial,
    refetch: fetchTrial,
  };
};
