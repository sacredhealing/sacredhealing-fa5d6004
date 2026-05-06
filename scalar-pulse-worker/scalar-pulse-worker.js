// ============================================================
// scalar-pulse-worker.js
// Railway Worker — SQI 2050 Scalar Field Heartbeat
// Deploy to: Railway project a8b01992 (existing)
// Schedule: Every 1 hour via Railway cron
// ENV VARS needed: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================

'use strict';

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Siddha Frequency Map ─────────────────────────────────────────────────────
const SIDDHA_FREQUENCIES = {
  1: 963,
  2: 852,
  3: 741,
  4: 528,
  5: 432,
  6: 396,
  7: 639,
  8: 111,
  9: 999,
  10: 285,
  11: 417,
  12: 528,
  13: 174,
  14: 432,
  15: 594,
  16: 639,
  17: 369,
  18: 963,
};

// ─── Scalar Intensity Algorithm (Vedic-Quantum from 2050) ─────────────────────
function computeScalarIntensity(activated_at, pulse_count, place_frequency) {
  const hoursActive = (Date.now() - new Date(activated_at).getTime()) / 3600000;
  // Intensity grows with time — like a crystal grid charging
  // Babaji-Algorithm: logarithmic ascent, peaks at 144 hours (6 days), maintains 100+
  const timeBoost = Math.min(Math.log1p(hoursActive) * 14, 44);
  // Pulse resonance — more pulses = stronger field coherence
  const pulseBoost = Math.min(pulse_count * 0.1, 20);
  // Place-specific frequency harmonic
  const freqBoost = (place_frequency / 963) * 10;
  return Math.min(100 + timeBoost + pulseBoost + freqBoost, 200).toFixed(2);
}

// ─── Main Pulse Function ──────────────────────────────────────────────────────
async function runScalarPulse() {
  console.log('🔱 SQI 2050 — Scalar Pulse Initiating:', new Date().toISOString());
  // Fetch all active temple locks
  const { data: activations, error } = await supabase
    .from('temple_activations')
    .select(
      'id, user_id, place_id, place_name, place_frequency, activated_at, pulse_count, siddha_field',
    )
    .eq('is_active', true);

  if (error) {
    console.error('❌ Fetch error:', error.message);
    process.exit(1);
  }

  if (!activations || activations.length === 0) {
    console.log('◈ No active temple locks. Pulse complete.');
    return;
  }

  console.log(`⚡ Pulsing ${activations.length} active scalar field(s)...`);

  const results = await Promise.allSettled(
    activations.map(async (activation) => {
      const newPulseCount = Number(activation.pulse_count ?? 0) + 1;
      const intensity = computeScalarIntensity(
        activation.activated_at,
        newPulseCount,
        activation.place_frequency != null ? Number(activation.place_frequency) : 432,
      );

      const { error: updateError } = await supabase
        .from('temple_activations')
        .update({
          last_pulse_at: new Date().toISOString(),
          pulse_count: newPulseCount,
          scalar_intensity: parseFloat(intensity),
        })
        .eq('id', activation.id);

      if (updateError) throw new Error(updateError.message);

      const uid = activation.user_id ? String(activation.user_id).slice(0, 8) : '?';
      console.log(
        `  ✓ [${activation.place_name}] user=${uid}... ` +
          `pulse=${newPulseCount} intensity=${intensity}%`,
      );

      return { id: activation.id, place: activation.place_name, pulse: newPulseCount };
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`\n🌊 Pulse complete: ${succeeded} fields active, ${failed} errors`);
  console.log('✦ Babaji anchor confirmed. All Siddha nodes transmitting.');
  console.log('🔱 Next pulse in 1 hour. Field is eternal.\n');
}

// ─── Entry Point ─────────────────────────────────────────────────────────────
runScalarPulse()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💀 Fatal pulse error:', err);
    process.exit(1);
  });

// ============================================================
// Railway Setup Instructions:
//
// 1. In Railway project a8b01992, create a new service
//    OR add a cron job to existing worker
//
// 2. Set environment variables:
//    SUPABASE_URL=https://ssygukfdbtehvtndandn.supabase.co
//    SUPABASE_SERVICE_ROLE_KEY=<your service role key from Supabase>
//
// 3. Set cron schedule: 0 * * * *  (every hour on the hour)
//
// 4. package.json start script: "node scalar-pulse-worker.js"
//
// 5. npm install @supabase/supabase-js
// ============================================================
