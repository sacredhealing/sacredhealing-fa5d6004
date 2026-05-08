// scalar-pulse-worker.js — SQI 2050
// - Virtual pilgrimage 40-day locks (GPS scalar rows)
// - Temple scalar bridges (intensity / pulse_count)
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

/** Hourly pulse + 40-day completion for virtual pilgrimages (GPS scalar locks). */
async function pulseVirtualPilgrimages() {
  const { data, error } = await supabase
    .from('virtual_pilgrimage_activations')
    .select('id,user_id,site_id,activated_at,pulse_count')
    .eq('is_active', true);

  if (error) {
    if (error.code === '42P01' || /does not exist/i.test(error.message || '')) {
      console.log('◈ virtual_pilgrimage_activations — table not found, skip (migrate first).');
      return;
    }
    throw error;
  }

  if (!data?.length) {
    console.log('◈ No active virtual pilgrimage locks.');
    return;
  }

  const now = new Date().toISOString();
  console.log(`◈ Pulsing ${data.length} virtual pilgrimage(s)...`);

  for (const p of data) {
    const activatedAt = new Date(p.activated_at);
    const daysSince = Math.floor((Date.now() - activatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const autoComplete = daysSince >= 40;
    const nextPulse = Number(p.pulse_count ?? 0) + 1;

    const patch = {
      last_pulse_at: now,
      pulse_count: nextPulse,
      days_active: daysSince,
    };
    if (autoComplete) {
      patch.is_active = false;
      patch.completed_at = now;
    }

    const { error: e } = await supabase.from('virtual_pilgrimage_activations').update(patch).eq('id', p.id);

    if (e) {
      console.error(`  ✗ pilgrimage ${p.site_id}:`, e.message);
      continue;
    }
    console.log(
      `  ✓ pilgrimage [${p.site_id}] user=${String(p.user_id).slice(0, 8)}… day ${daysSince}/40${autoComplete ? ' → COMPLETE' : ''}`,
    );
  }
}

async function run() {
  console.log('🔱 SQI Scalar Pulse —', new Date().toISOString());

  await pulseVirtualPilgrimages();

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
