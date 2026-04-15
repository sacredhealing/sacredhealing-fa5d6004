import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import type { Json } from '@/integrations/supabase/types';

interface UseAyurvedaAnalysisResult {
  doshaProfile: DoshaProfile | null;
  userProfile: AyurvedaUserProfile | null;
  dailyGuidance: string;
  isLoading: boolean;
  isLoadingGuidance: boolean;
  isLoadingSaved: boolean;
  error: string | null;
  analyzeDosha: (profile: AyurvedaUserProfile) => Promise<void>;
  getDailyGuidance: (profile: AyurvedaUserProfile) => Promise<void>;
  reset: () => Promise<void>;
}

export function useAyurvedaAnalysis(): UseAyurvedaAnalysisResult {
  const { user } = useAuth();
  const [doshaProfile, setDoshaProfile] = useState<DoshaProfile | null>(null);
  const [userProfile, setUserProfile] = useState<AyurvedaUserProfile | null>(null);
  const [dailyGuidance, setDailyGuidance] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved Prakriti on mount
  useEffect(() => {
    const loadSavedProfile = async () => {
      if (!user) {
        setIsLoadingSaved(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('ayurveda_profiles')
          .select('user_profile, dosha_profile')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error loading saved Prakriti:', fetchError);
        } else if (data) {
          setUserProfile(data.user_profile as unknown as AyurvedaUserProfile);
          setDoshaProfile(data.dosha_profile as unknown as DoshaProfile);
        }
      } catch (err) {
        console.error('Failed to load saved Prakriti:', err);
      } finally {
        setIsLoadingSaved(false);
      }
    };

    loadSavedProfile();
  }, [user]);

  const saveProfile = useCallback(async (userProf: AyurvedaUserProfile, doshaProf: DoshaProfile) => {
    if (!user) return;

    try {
      // Check if profile exists
      const { data: existing } = await supabase
        .from('ayurveda_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Shared payload — includes explicit SQI field columns (added by migration)
      // gracefully ignored by Supabase if columns don't exist yet
      const sharedPayload: Record<string, unknown> = {
        user_profile: userProf as unknown as Json,
        dosha_profile: doshaProf as unknown as Json,
        updated_at: new Date().toISOString(),
        // SQI unified field context columns
        prakriti: doshaProf.primary ?? null,
        vata_percent: Math.round(doshaProf.vata ?? 0),
        pitta_percent: Math.round(doshaProf.pitta ?? 0),
        kapha_percent: Math.round(doshaProf.kapha ?? 0),
        dominant_dosha: doshaProf.primary ?? null,
      };

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('ayurveda_profiles')
          .update(sharedPayload)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating Prakriti:', updateError);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('ayurveda_profiles')
          .insert({ user_id: user.id, ...sharedPayload } as any);

        if (insertError) {
          console.error('Error saving Prakriti:', insertError);
        }
      }
    } catch (err) {
      console.error('Failed to save Prakriti:', err);
    }
  }, [user]);

  const analyzeDosha = useCallback(async (profile: AyurvedaUserProfile) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-dosha', {
        body: { profile, action: 'analyze' },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const doshaData = data as DoshaProfile;
      setDoshaProfile(doshaData);
      setUserProfile(profile);
      
      // Save to database
      await saveProfile(profile, doshaData);
    } catch (err) {
      console.error('Failed to analyze dosha:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze dosha');
    } finally {
      setIsLoading(false);
    }
  }, [saveProfile]);

  const getDailyGuidance = useCallback(async (profile: AyurvedaUserProfile) => {
    setIsLoadingGuidance(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-dosha', {
        body: { profile, action: 'daily-guidance' },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setDailyGuidance(data?.guidance || 'May your path be clear and your heart light.');
    } catch (err) {
      console.error('Failed to get daily guidance:', err);
      setDailyGuidance('May your inner light guide you through this day.');
    } finally {
      setIsLoadingGuidance(false);
    }
  }, []);

  const reset = useCallback(async () => {
    // Delete from database
    if (user) {
      try {
        await supabase
          .from('ayurveda_profiles')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to delete Prakriti:', err);
      }
    }

    setDoshaProfile(null);
    setUserProfile(null);
    setDailyGuidance('');
    setError(null);
  }, [user]);

  return {
    doshaProfile,
    userProfile,
    dailyGuidance,
    isLoading,
    isLoadingGuidance,
    isLoadingSaved,
    error,
    analyzeDosha,
    getDailyGuidance,
    reset,
  };
}
