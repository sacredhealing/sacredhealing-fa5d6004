/**
 * Sacred Healing — Scalar pulse worker (Railway)
 *
 * Deploy on Railway (e.g. project/service dashboard ref a8b01992 — set root to scalar-pulse-worker/).
 * Environment:
 *   SUPABASE_URL=https://ssygukfdbtehvtndandn.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<Supabase Settings → API → service_role>
 *
 * Scheduling (pick one):
 *   A) Railway Cron Job / Scheduled Task: run this service every hour — use default one-shot mode
 *      (process starts, pulses once, exits 0). Cron expression: 0 * * * *
 *   B) Always-on service: set SCALAR_PULSE_USE_INTERNAL_CRON=true — runs 0 * * * * UTC inside Node.
 *
 * Pulses:
 *   - temple_activations (is_active = true): last_pulse_at, pulse_count++
 *   - temple_home_sessions.siddha_activation JSON (is_active): same fields inside blob
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USE_INTERNAL_CRON = process.env.SCALAR_PULSE_USE_INTERNAL_CRON === 'true';

async function pulseTempleActivations(supabase) {
  const { data: rows, error } = await supabase
    .from('temple_activations')
    .select('id, pulse_count')
    .eq('is_active', true);

  if (error) {
    const msg = error.message || '';
    if (msg.includes('does not exist') || error.code === '42P01') {
      console.warn('[scalar-pulse] temple_activations: table not found — skip');
      return { table: 'temple_activations', updated: 0, skipped: true };
    }
    throw error;
  }

  const now = new Date().toISOString();
  let updated = 0;
  for (const r of rows || []) {
    const { error: uerr } = await supabase
      .from('temple_activations')
      .update({
        last_pulse_at: now,
        pulse_count: Number(r.pulse_count ?? 0) + 1,
      })
      .eq('id', r.id);
    if (!uerr) updated += 1;
    else console.error('[scalar-pulse] update failed', r.id, uerr.message);
  }
  return { table: 'temple_activations', updated };
}

async function pulseSiddhaHomeSessions(supabase) {
  const { data: rows, error } = await supabase
    .from('temple_home_sessions')
    .select('user_id, siddha_activation')
    .not('siddha_activation', 'is', null);

  if (error) {
    const msg = error.message || '';
    if (msg.includes('does not exist') || msg.includes('siddha_activation') || error.code === '42703') {
      console.warn('[scalar-pulse] temple_home_sessions.siddha_activation: column missing — skip');
      return { table: 'temple_home_sessions', updated: 0, skipped: true };
    }
    throw error;
  }

  const now = new Date().toISOString();
  let updated = 0;

  for (const row of rows || []) {
    const sa = row.siddha_activation;
    if (!sa || typeof sa !== 'object' || sa.is_active !== true) continue;

    const next = {
      ...sa,
      last_pulse_at: now,
      pulse_count: (typeof sa.pulse_count === 'number' ? sa.pulse_count : 0) + 1,
    };

    const { error: uerr } = await supabase
      .from('temple_home_sessions')
      .update({ siddha_activation: next })
      .eq('user_id', row.user_id);

    if (!uerr) updated += 1;
    else console.error('[scalar-pulse] siddha_activation update failed', row.user_id, uerr.message);
  }

  return { table: 'temple_home_sessions', updated };
}

async function runPulse() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[scalar-pulse] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const t0 = Date.now();
  console.log('[scalar-pulse]', new Date().toISOString(), 'pulse start');

  try {
    const a = await pulseTempleActivations(supabase);
    const b = await pulseSiddhaHomeSessions(supabase);
    console.log('[scalar-pulse] done', { ms: Date.now() - t0, a, b });
  } catch (e) {
    console.error('[scalar-pulse] error', e);
    process.exitCode = 1;
  }
}

async function main() {
  if (USE_INTERNAL_CRON) {
    const cron = require('node-cron');
    console.log('[scalar-pulse] internal cron ON — 0 * * * * UTC');
    cron.schedule(
      '0 * * * *',
      () => {
        runPulse().catch((err) => console.error('[scalar-pulse] cron run failed', err));
      },
      { timezone: 'UTC' },
    );
    await runPulse();
    await new Promise(() => {});
    return;
  }

  await runPulse();
  process.exit(process.exitCode ?? 0);
}

main().catch((e) => {
  console.error('[scalar-pulse] fatal', e);
  process.exit(1);
});
