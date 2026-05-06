// scalar-pulse-worker.js — SQI 2050 (scalar bridge intensity)
// Railway cron: 0 * * * *
// ENV: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

function computeIntensity(activatedAt, pulseCount, placeFreq) {
  const hours = (Date.now() - new Date(activatedAt).getTime()) / 3600000;
  const timeBoost = Math.min(Math.log1p(hours) * 14, 44);
  const pulseBoost = Math.min(pulseCount * 0.08, 20);
  const freqBoost = (placeFreq / 1111) * 12;
  return Math.min(100 + timeBoost + pulseBoost + freqBoost, 250).toFixed(2);
}

function vectorLooksOk(row) {
  const v = row.scalar_vector;
  if (!v || typeof v !== 'object') return false;
  return typeof v.distanceKm === 'number';
}

async function run() {
  console.log('🔱 SQI Scalar Pulse —', new Date().toISOString());
  const { data, error } = await supabase
    .from('temple_activations')
    .select(
      'id,user_id,place_name,place_frequency,activated_at,pulse_count,home_lat,home_lng,scalar_vector',
    )
    .eq('is_active', true);

  if (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  if (!data?.length) {
    console.log('◈ No active locks.');
    return;
  }

  console.log(`⚡ Pulsing ${data.length} active scalar bridge(s)...`);

  const results = await Promise.allSettled(
    data.map(async (a) => {
      const newPulse = Number(a.pulse_count ?? 0) + 1;
      const placeFreq = a.place_frequency != null ? Number(a.place_frequency) : 432;
      const intensity = computeIntensity(a.activated_at, newPulse, placeFreq);
      const vectorOk = vectorLooksOk(a);

      const { error: e } = await supabase
        .from('temple_activations')
        .update({
          last_pulse_at: new Date().toISOString(),
          pulse_count: newPulse,
          scalar_intensity: parseFloat(intensity),
        })
        .eq('id', a.id);

      if (e) throw new Error(e.message);
      console.log(
        `  ✓ [${a.place_name}] pulse=${newPulse} intensity=${intensity}% vector=${vectorOk ? 'OK' : 'MISSING'}`,
      );
    }),
  );

  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const err = results.filter((r) => r.status === 'rejected').length;
  console.log(`\n🌊 Complete: ${ok} bridges pulsed, ${err} errors`);
  console.log('✦ Babaji anchor confirmed. All Siddha scalar bridges transmitting.\n');
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('💀', e);
    process.exit(1);
  });
