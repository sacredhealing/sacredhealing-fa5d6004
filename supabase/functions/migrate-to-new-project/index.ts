import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-new-service-role',
}

const NEW_SUPABASE_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co'

const TABLES = [
  'profiles','user_memberships','subscriptions','affiliate_clicks',
  'shakti_cycle_logs','virtual_pilgrimages','scalar_field_activations',
  'bot_trades','akashic_records','meditation_sessions','mantra_logs',
  'quantum_apothecary_sessions','bhrigu_readings','ayurveda_sessions',
  'practitioner_progress','jyotish_sessions','pranayama_sessions',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const newServiceRole = req.headers.get('x-new-service-role')
  if (!newServiceRole) return new Response(JSON.stringify({ error: 'Missing x-new-service-role' }), { status: 401, headers: corsHeaders })

  const OLD_URL = Deno.env.get('SUPABASE_URL')!
  const OLD_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const oldDb = createClient(OLD_URL, OLD_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const newDb = createClient(NEW_SUPABASE_URL, newServiceRole, { auth: { autoRefreshToken: false, persistSession: false } })
  const report: Record<string, any> = { started_at: new Date().toISOString() }

  // STEP 1: Migrate auth.users preserving UUIDs
  try {
    const res = await fetch(`${OLD_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: { Authorization: `Bearer ${OLD_KEY}`, apikey: OLD_KEY }
    })
    const json = await res.json()
    const users = json.users || []
    report.auth_users_found = users.length
    let created = 0, skipped = 0, failed = 0
    for (const u of users) {
      const r = await fetch(`${NEW_SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${newServiceRole}`, apikey: newServiceRole, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, email: u.email, email_confirm: true, user_metadata: u.user_metadata || {}, app_metadata: u.app_metadata || {}, created_at: u.created_at })
      })
      const b = await r.json()
      if (r.status === 422 || b?.code === 'email_exists') skipped++
      else if (r.ok) created++
      else failed++
    }
    report.auth = { created, skipped, failed }
  } catch(e: any) { report.auth_error = e.message }

  // STEP 2: Migrate data tables
  for (const table of TABLES) {
    try {
      const { data, error } = await oldDb.from(table).select('*')
      if (error) { report[table] = { skipped: true, reason: error.message }; continue }
      if (!data || data.length === 0) { report[table] = { count: 0 }; continue }
      let migrated = 0
      for (let i = 0; i < data.length; i += 100) {
        const { error: e } = await newDb.from(table).upsert(data.slice(i, i+100), { onConflict: 'id' })
        if (e) { report[table] = { found: data.length, migrated, error: e.message }; break }
        migrated += data.slice(i, i+100).length
      }
      if (!report[table]) report[table] = { found: data.length, migrated }
    } catch(e: any) { report[table] = { error: e.message } }
  }

  report.completed_at = new Date().toISOString()
  return new Response(JSON.stringify({ success: true, report }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
