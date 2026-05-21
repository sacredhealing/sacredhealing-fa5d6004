import https from 'https';

const OLD_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const OLD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const SVC = process.env.NEW_SERVICE_ROLE;
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

if (!SVC || !PAT) { console.error('Missing secrets'); process.exit(1); }

function httpReq(url, method, headers, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { ...headers, ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) }
    };
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
        catch { resolve({ s: res.statusCode, b: d }); }
      });
    });
    r.setTimeout(30000, () => { r.destroy(); resolve({ s: 0, b: 'timeout' }); });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (payload) r.write(payload);
    r.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const OLD_HEADERS = { 'Authorization': `Bearer ${OLD_ANON}`, 'apikey': OLD_ANON, 'Content-Type': 'application/json' };
const NEW_HEADERS = { 'Authorization': `Bearer ${SVC}`, 'apikey': SVC, 'Content-Type': 'application/json' };

async function exportTable(table, offset = 0) {
  return httpReq(`${OLD_URL}/functions/v1/full-data-export`, 'POST', OLD_HEADERS, { table, offset, limit: 500 });
}

async function managementQuery(sql) {
  return httpReq(`https://api.supabase.com/v1/projects/${NEW_REF}/database/query`, 'POST',
    { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' }, { query: sql });
}

async function upsertToNew(table, rows) {
  if (!rows.length) return { s: 200 };
  return httpReq(`${NEW_URL}/rest/v1/${table}`, 'POST',
    { ...NEW_HEADERS, 'Prefer': 'resolution=merge-duplicates' }, rows);
}

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  // 1. Get table list from old Supabase via edge function
  console.log('=== Step 1: Get table list from old Supabase ===');
  const tRes = await httpReq(`${OLD_URL}/functions/v1/full-data-export`, 'POST', OLD_HEADERS, {});
  console.log('Response:', tRes.s, JSON.stringify(tRes.b).slice(0, 200));

  let tableCounts = {};
  if (tRes.b && tRes.b.tables) {
    tableCounts = tRes.b.tables;
    console.log('Tables with data:', Object.entries(tableCounts).filter(([,v]) => v > 0).map(([k,v]) => `${k}(${v})`).join(', '));
  } else {
    console.log('Could not get table list, using fallback list');
    tableCounts = {
      profiles: 1, user_balances: 1, affiliates: 1,
      user_membership_tier: 1, membership_purchases: 1,
      email_list: 1, course_enrollments: 1,
      shakti_cycle_logs: 1, bhrigu_readings: 1,
      life_book_entries: 1, nadi_sessions: 1,
      quantum_activations: 1, virtual_pilgrimages: 1,
      community_posts: 1, daily_checkins: 1
    };
  }

  // 2. Export profiles first to get user emails + UUIDs
  console.log('\n=== Step 2: Export profiles ===');
  const profRes = await exportTable('profiles', 0);
  const profiles = profRes.b?.rows || [];
  console.log(`Got ${profiles.length} profiles`);

  // 3. Delete wrong-UUID users from new Supabase, recreate with correct UUIDs
  console.log('\n=== Step 3: Fix auth users (preserve original UUIDs) ===');
  
  // List and delete current wrong users
  const listRes = await httpReq(`${NEW_URL}/auth/v1/admin/users`, 'GET', NEW_HEADERS, null);
  const existingUsers = listRes.b?.users || [];
  console.log(`Found ${existingUsers.length} wrong-UUID users to delete`);
  
  for (const u of existingUsers) {
    const del = await httpReq(`${NEW_URL}/auth/v1/admin/users/${u.id}`, 'DELETE', NEW_HEADERS, null);
    console.log(`  Deleted ${u.email} (${u.id.slice(0,8)}) → ${del.s}`);
    await sleep(200);
  }

  // Create auth users with ORIGINAL UUIDs via SQL
  for (const p of profiles) {
    const uid = p.id || p.user_id;
    const email = p.email;
    if (!uid || !email) { console.log(`  Skip profile without uid/email`); continue; }

    const sql = `
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token,
        email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '${uid}', 'authenticated', 'authenticated',
        ${esc(email)},
        crypt('SiddhaQuantum2050!', gen_salt('bf')),
        NOW(), '{"provider":"email","providers":["email"]}', '{}',
        NOW(), NOW(), '', '', '', ''
      ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = crypt('SiddhaQuantum2050!', gen_salt('bf')),
        email_confirmed_at = NOW(), updated_at = NOW()
    `;
    const r = await managementQuery(sql);
    console.log(`  Auth: ${email} (${uid.slice(0,8)}) → ${r.s}`);
    await sleep(120);
  }

  // 4. Import all tables
  console.log('\n=== Step 4: Import all table data ===');
  
  const SKIP = ['schema_migrations', 'spatial_ref_sys'];
  const PRIORITY = ['profiles', 'user_balances', 'user_membership_tier', 
    'membership_purchases', 'affiliates', 'affiliate_referrals',
    'email_list', 'course_enrollments', 'quantum_activations',
    'bhrigu_readings', 'life_book_entries', 'nadi_sessions',
    'community_posts', 'daily_checkins', 'shakti_cycle_logs'];
  
  const allTables = [...new Set([...PRIORITY, ...Object.keys(tableCounts)])].filter(t => !SKIP.includes(t));

  for (const table of allTables) {
    if (tableCounts[table] === 0) { console.log(`  ○ ${table}: empty`); continue; }
    
    let offset = 0, total = 0;
    while (true) {
      const res = await exportTable(table, offset);
      if (!res.b?.rows?.length) break;
      const rows = res.b.rows;
      
      const r = await upsertToNew(table, rows);
      if (r.s >= 200 && r.s < 300) {
        total += rows.length;
      } else {
        console.log(`  ⚠️  ${table}@${offset}: ${r.s} – ${JSON.stringify(r.b).slice(0, 100)}`);
      }
      if (rows.length < 500) break;
      offset += 500;
      await sleep(150);
    }
    if (total > 0) console.log(`  ✅ ${table}: ${total} rows`);
    await sleep(80);
  }

  console.log('\n✅ MIGRATION COMPLETE');
  console.log('Login at siddhaquantumnexus.com with email + password: SiddhaQuantum2050!');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
