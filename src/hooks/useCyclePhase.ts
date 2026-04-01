import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import {
  ALL_PHASES,
  MENSTRUAL_PHASE,
  FOLLICULAR_PHASE,
  OVULATORY_PHASE,
  LUTEAL_PHASE,
  type CyclePhaseData,
} from '@/lib/cycle-phases';

export interface CycleSettings {
  lastPeriodDate: string | null;   // ISO date string
  cycleLength: number;
  bleedDays: number;
}

interface CycleResult {
  phase: CyclePhaseData;
  cycleDay: number;
  daysUntilNextPhase: number;
  isConfigured: boolean;
}

/**
 * Pure calculation — given cycle settings and today, return current phase + day.
 */
export function calculateCycle(
  lastPeriodDate: string,
  cycleLength: number,
  bleedDays: number,
  today: Date = new Date()
): { phase: CyclePhaseData; cycleDay: number; daysUntilNextPhase: number } {
  const start = new Date(lastPeriodDate);
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const cycleDay = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1; // 1-based

  // Phase boundaries
  const follicularStart = bleedDays + 1;
  const ovulatoryStart = Math.round(cycleLength / 2) - 1; // ~day 13
  const ovulatoryEnd = ovulatoryStart + 3;                 // ~day 16
  const lutealStart = ovulatoryEnd + 1;

  let phase: CyclePhaseData;
  let daysUntilNextPhase: number;

  if (cycleDay <= bleedDays) {
    phase = MENSTRUAL_PHASE;
    daysUntilNextPhase = bleedDays - cycleDay + 1;
  } else if (cycleDay < ovulatoryStart) {
    phase = FOLLICULAR_PHASE;
    daysUntilNextPhase = ovulatoryStart - cycleDay;
  } else if (cycleDay <= ovulatoryEnd) {
    phase = OVULATORY_PHASE;
    daysUntilNextPhase = ovulatoryEnd - cycleDay + 1;
  } else {
    phase = LUTEAL_PHASE;
    daysUntilNextPhase = cycleLength - cycleDay + 1;
  }

  return { phase, cycleDay, daysUntilNextPhase };
}

/**
 * Hook: reads cycle settings from the user's profile,
 * computes the current phase, and provides an update function.
 */
export function useCyclePhase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['cycle-settings', user?.id],
    queryFn: async (): Promise<CycleSettings> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('last_period_date, cycle_length, bleed_days')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return {
        lastPeriodDate: data.last_period_date,
        cycleLength: data.cycle_length ?? 28,
        bleedDays: data.bleed_days ?? 5,
      };
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const cycle: CycleResult = useMemo(() => {
    if (!settings?.lastPeriodDate) {
      return {
        phase: MENSTRUAL_PHASE,
        cycleDay: 1,
        daysUntilNextPhase: 5,
        isConfigured: false,
      };
    }
    const calc = calculateCycle(settings.lastPeriodDate, settings.cycleLength, settings.bleedDays);
    return { ...calc, isConfigured: true };
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<{ last_period_date: string; cycle_length: number; bleed_days: number }>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycle-settings'] });
      toast({ title: 'Cycle settings saved ✨' });
    },
    onError: () => {
      toast({ title: 'Could not save cycle settings', variant: 'destructive' });
    },
  });

  const updateCycleSettings = useCallback(
    (lastPeriodDate: string, cycleLength?: number, bleedDays?: number) => {
      const updates: Record<string, unknown> = { last_period_date: lastPeriodDate };
      if (cycleLength !== undefined) updates.cycle_length = cycleLength;
      if (bleedDays !== undefined) updates.bleed_days = bleedDays;
      updateMutation.mutate(updates as any);
    },
    [updateMutation]
  );

  return {
    ...cycle,
    settings,
    isLoading,
    allPhases: ALL_PHASES,
    updateCycleSettings,
    isSaving: updateMutation.isPending,
  };
}
