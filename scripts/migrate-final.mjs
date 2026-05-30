import https from 'https';

const OLD_REF = 'ssygukfdbtehvtndandn';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const OLD_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const PAT = process.env.PAT;
const NEW_SVC = process.env.NEW_SVC;
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const R2 = 'https://pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function req(url, method, headers, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { ...headers, ...(payload ? {'Content-Length': Buffer.byteLength(payload)} : {}) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({s: res.statusCode, b: JSON.parse(d)}); } catch { resolve({s: res.statusCode, b: d}); } });
    });
    r.on('error', e => resolve({s: 0, b: e.message}));
    if (payload) r.write(payload);
    r.end();
  });
}

// Read from old Supabase via anon key REST API
function readOld(table, offset) {
  return req(`${OLD_URL}/rest/v1/${table}?select=*&limit=500&offset=${offset}`, 'GET',
    {'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}`, 'Range-Unit': 'items'});
}

// Write to new Supabase via service role
function writeNew(table, rows) {
  if (!rows?.length) return Promise.resolve({s: 200});
  const fixed = rows.map(row => {
    const r = {...row};
    for (const [k, v] of Object.entries(r))
      if (typeof v === 'string' && v.includes('ssygukfdbtehvtndandn.supabase.co/storage'))
        r[k] = v.replace('https://ssygukfdbtehvtndandn.supabase.co/storage/v1/object/public/', R2 + '/');
    return r;
  });
  return req(`${NEW_URL}/rest/v1/${table}`, 'POST',
    {'apikey': NEW_SVC, 'Authorization': `Bearer ${NEW_SVC}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal'},
    fixed);
}

// Use PAT only for new DB queries (project we own)
function sqlNew(q) {
  return req(`https://api.supabase.com/v1/projects/${NEW_REF}/database/query`, 'POST',
    {'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json'}, {query: q});
}

const TABLES = [
  'profiles','user_memberships','subscriptions','user_roles',
  'admin_granted_access','creative_soul_entitlements',
  'affiliate_clicks','affiliates','meditation_style_sounds',
  'meditations','music_tracks','healing_audio','divine_transmissions',
  'courses','lessons','creative_tools','creative_tool_access',
  'user_entitlements','user_granted_access','jyotish_charts',
  'jyotish_profiles','jyotish_readings','bhrigu_readings',
  'ayurveda_sessions','shakti_cycle_logs','user_active_transmissions',
  'user_quantum_sync','sqi_sessions','user_chat_sessions',
  'chat_messages','transmission_blocks','user_activity_log',
  'meditation_sessions','pranayama_sessions','practitioner_progress',
  'virtual_pilgrimages','scalar_field_activations','akashic_records',
  'community_posts','community_comments','announcements',
  'email_list','user_coins','user_balances','daily_checkins',
  'achievements','user_achievements','mantras','frequencies',
  'sacred_sites','bot_trades','dosha_profiles','nadi_sessions',
  'quantum_apothecary_sessions','life_book_entries',
];

async function main() {
  console.log('=== Full Migration Old → New Supabase ===');
  console.log('PAT:', PAT ? 'present' : 'MISSING');
  console.log('NEW_SVC:', NEW_SVC ? 'present' : 'MISSING');

  // STEP 1: Auth users via PAT on old project
  console.log('\n--- Step 1: Auth users ---');
  const authRes = await req(`https://api.supabase.com/v1/projects/${OLD_REF}/auth/users?page=1&per_page=1000`, 'GET', {'Authorization': `Bearer ${PAT}`});
  const users = Array.isArray(authRes.b?.users) ? authRes.b.users : [];
  console.log(`Found ${users.length} auth users`);
  let authOk = 0, authSkip = 0;
  for (const u of users) {
    if (!u.email) continue;
    const r = await req(`${NEW_URL}/auth/v1/admin/users`, 'POST',
      {'apikey': NEW_SVC, 'Authorization': `Bearer ${NEW_SVC}`, 'Content-Type': 'application/json'},
      {id: u.id, email: u.email, email_confirm: true, user_metadata: u.user_metadata||{}, app_metadata: u.app_metadata||{}, created_at: u.created_at});
    if (r.s===200||r.s===201) authOk++;
    else authSkip++;
    await sleep(80);
  }
  console.log(`Auth: ${authOk} created, ${authSkip} already exist`);

  // STEP 2: All data tables via anon REST API
  console.log('\n--- Step 2: Data tables ---');
  for (const table of TABLES) {
    let migrated = 0, offset = 0, tableErrors = 0;
    while (true) {
      const r = await readOld(table, offset);
      if (r.s === 404 || r.s === 400) break; // table doesn't exist or no access
      if (r.s !== 200 || !Array.isArray(r.b) || r.b.length === 0) break;
      const w = await writeNew(table, r.b);
      if (w.s >= 200 && w.s < 300) { migrated += r.b.length; }
      else { tableErrors++; if (tableErrors===1) console.log(`  x ${table}: ${w.s} ${JSON.stringify(w.b).slice(0,80)}`); break; }
      if (r.b.length < 500) break;
      offset += 500;
      await sleep(100);
    }
    if (migrated > 0) console.log(`  OK ${table}: ${migrated} rows`);
  }

  // STEP 3: Permissions
  console.log('\n--- Step 3: Permissions ---');
  await sqlNew('GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role');
  await sqlNew('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role');
  console.log('Permissions granted');

  console.log('\n=== MIGRATION COMPLETE ===');
}

main().catch(e => { console.error('FATAL:', e.message, e.stack?.slice(0,200)); process.exit(1); });
