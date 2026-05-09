// scalar-pulse-worker.js — Railway hourly cron
// Keeps all active Virtual Pilgrimage fields registered in Supabase
// even when the user's phone/computer is completely off.
// Deploy: scalar-pulse-worker/ folder in repo root
// Cron: 0 * * * * (every hour)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function db(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${err}`);
  }
  return method === 'GET' ? res.json() : null;
}

async function run() {
  console.log(`[${new Date().toISOString()}] Scalar pulse worker starting...`);

  // 1. Fetch all active pilgrimages
  const pilgrimages = await db(
    'virtual_pilgrimage_activations?is_active=eq.true&select=id,user_id,site_id,days_active,activated_at'
  );
  console.log(`Found ${pilgrimages.length} active pilgrimage(s)`);

  if (pilgrimages.length === 0) {
    console.log('No active pilgrimages. Worker complete.');
    return;
  }

  const now = new Date().toISOString();

  for (const p of pilgrimages) {
    // Calculate days since activation
    const activatedAt = new Date(p.activated_at);
    const daysSince = Math.floor((Date.now() - activatedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Check if 40 days have passed — auto-complete
    const autoComplete = daysSince >= 40;

    await db(
      `virtual_pilgrimage_activations?id=eq.${p.id}`,
      'PATCH',
      {
        last_pulse_at: now,
        pulse_count: (p.pulse_count || 0) + 1,
        days_active: daysSince,
        is_active: !autoComplete,
        completed_at: autoComplete ? now : null,
      }
    );

    console.log(
      `Pulsed: ${p.site_id} | user ${p.user_id.slice(0, 8)}... | day ${daysSince}/40${autoComplete ? ' → AUTO-COMPLETED' : ''}`
    );
  }

  // 2. Also pulse legacy scalar activations (original TempleHome)
  try {
    const legacy = await db(
      'scalar_activations?is_active=eq.true&select=id'
    );
    if (legacy.length > 0) {
      for (const s of legacy) {
        await db(`scalar_activations?id=eq.${s.id}`, 'PATCH', {
          last_pulse_at: now,
          pulse_count: (s.pulse_count || 0) + 1,
        });
      }
      console.log(`Pulsed ${legacy.length} legacy scalar activation(s)`);
    }
  } catch (e) {
    console.log('No legacy scalar_activations table (OK)');
  }

  console.log(`[${new Date().toISOString()}] Pulse complete. All fields maintained.`);
}

run().catch(err => {
  console.error('Worker error:', err);
  process.exit(1);
});
