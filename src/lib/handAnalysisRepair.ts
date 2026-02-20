/**
 * REPAIR: Hand Analysis & Akashic Records Logic
 * Ensures unique transmissions for each soul/user.
 * Uses Supabase; prevents data bleeding when admin selects different members.
 */

import { supabase } from '@/integrations/supabase/client';

export interface SiddhaAnalysisResult {
  user_house: number;
  archetype?: string;
  akashic_origin?: string;
  lastPurification: string;
  status: string;
}

/**
 * Derives user house (1–12) for Akashic/Jyotish alignment from birth date.
 * Falls back to 12 if birth data is missing.
 */
function deriveUserHouseFromBirth(birthDate?: string | null, rahuCycle?: string | null): number {
  if (!birthDate) return 12;
  try {
    const d = new Date(birthDate);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    // Simple derivation: day + month mod 12, 1-indexed
    const raw = ((day + month) % 12) || 12;
    return Math.min(12, Math.max(1, raw));
  } catch {
    return 12;
  }
}

/**
 * Generates Siddha analysis from member data.
 * Used when hand scan / palm data is available or inferred from birth.
 */
async function generateSiddhaAnalysis(params: {
  handScanUrl?: string | null;
  birthDate?: string | null;
  rahuCycle?: string | null;
}): Promise<SiddhaAnalysisResult> {
  const user_house = deriveUserHouseFromBirth(params.birthDate, params.rahuCycle);
  return {
    user_house,
    lastPurification: new Date().toISOString(),
    status: 'Transmitted',
  };
}

/**
 * Fetches unique transmission for a specific user.
 * Validates targetUserId to prevent data bleeding (admin session vs. selected member).
 */
export async function getUniqueTransmission(targetUserId: string): Promise<SiddhaAnalysisResult | { error: string }> {
  try {
    if (!targetUserId) {
      throw new Error('No soul identified for analysis.');
    }

    const { data: memberData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, birth_date, birth_time, birth_place')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (profileError) {
      console.error('Hand Analysis Purification: profile fetch error', profileError);
      return { error: 'Transmission not found for this path.' };
    }

    if (!memberData) {
      return { error: 'Transmission not found for this path.' };
    }

    const birthDate = memberData.birth_date
      ? `${memberData.birth_date}${memberData.birth_time ? `T${memberData.birth_time}` : ''}`
      : null;

    const analysisResult = await generateSiddhaAnalysis({
      birthDate,
      rahuCycle: null,
    });

    const { error: upsertError } = await supabase
      .from('akashic_readings')
      .upsert(
        {
          user_id: targetUserId,
          user_house: analysisResult.user_house,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.warn('Hand Analysis Purification: could not update akashic record', upsertError);
    }

    return analysisResult;
  } catch (error) {
    console.error('Bug in Hand Analyzer Purification:', error);
    return { error: 'Transmission failed.' };
  }
}

/** Callback type for resetting hand analysis state */
export type HandAnalysisResetCallbacks = {
  setHandAnalysisData: (data: unknown) => void;
  setAkashicRecords: (records: unknown) => void;
  fetchMemberEnergy: (memberId: string) => void;
};

/**
 * UI CONTROLLER: Resets state when switching users.
 * Call with your state setters to prevent showing previous user's info.
 */
export function selectMemberForAnalysis(
  newMemberId: string,
  callbacks: HandAnalysisResetCallbacks
): void {
  const { setHandAnalysisData, setAkashicRecords, fetchMemberEnergy } = callbacks;
  setHandAnalysisData(null);
  setAkashicRecords(null);
  fetchMemberEnergy(newMemberId);
}
