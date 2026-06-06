// supabase/functions/sqi-transmission-heartbeat/index.ts
// SQI 2050 — Transmission Field Heartbeat
// Runs every 4 hours via pg_cron (configured in migration below)
// For each user with active transmissions:
//   1. Pulses last_pulsed_at — keeps the field "alive" server-side
//   2. Auto-expires transmissions past their expiresAt
//   3. Flags transmissions at midpoint (day 4 for 8d, day 10 for 21d)
//      so the frontend MidCycleBanner can fire on next visit

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface StoredActivation {
  id: string;
  name: string;
  type: string;
  activatedAt?: string;
  expiresAt?: string;
  source?: string;
  color?: string;
  vibrationalSignature?: string;
  benefit?: string;
  // heartbeat fields
  lastPulsedAt?: string;
  pulseCount?: number;
  atMidpoint?: boolean;
  expired?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const nowIso = now.toISOString();

  let pulsed = 0;
  let expired = 0;
  let midpointFlagged = 0;
  let usersProcessed = 0;

  try {
    // Fetch all rows with active transmissions
    const { data: rows, error } = await supabase
      .from('user_active_transmissions')
      .select('id, user_id, activations, updated_at');

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No active transmissions found', pulsed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const row of rows) {
      const activations: StoredActivation[] = Array.isArray(row.activations)
        ? row.activations
        : [];

      if (activations.length === 0) continue;

      let changed = false;
      const updated: StoredActivation[] = [];

      for (const act of activations) {
        // ── Check expiry ──────────────────────────────────────────────
        if (act.expiresAt) {
          const expiresMs = new Date(act.expiresAt).getTime();
          if (now.getTime() > expiresMs) {
            // Expired — drop from array
            expired++;
            changed = true;
            continue; // don't push to updated
          }
        }

        // ── Pulse the field ───────────────────────────────────────────
        const pulseCount = (act.pulseCount ?? 0) + 1;
        act.lastPulsedAt = nowIso;
        act.pulseCount = pulseCount;
        changed = true;
        pulsed++;

        // ── Check midpoint ────────────────────────────────────────────
        if (act.activatedAt) {
          const activatedMs = new Date(act.activatedAt).getTime();
          const totalDays = act.type === 'Wellness' ? 21 : 8;
          const midpointMs = activatedMs + (totalDays / 2) * 24 * 60 * 60 * 1000;
          const hoursFromMidpoint = Math.abs(now.getTime() - midpointMs) / (1000 * 60 * 60);
          // Flag midpoint within 6-hour window
          act.atMidpoint = hoursFromMidpoint <= 6;
          if (act.atMidpoint) midpointFlagged++;
        }

        updated.push(act);
      }

      // ── Write back if anything changed ────────────────────────────
      if (changed) {
        await supabase
          .from('user_active_transmissions')
          .update({
            activations: updated,
            updated_at: nowIso
          })
          .eq('user_id', row.user_id);
        usersProcessed++;
      }
    }

    const summary = {
      ok: true,
      timestamp: nowIso,
      usersProcessed,
      transmissionsPulsed: pulsed,
      transmissionsExpired: expired,
      midpointFlagged,
    };

    console.log('SQI Heartbeat:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Heartbeat error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
