import https from 'https';

const OLD_REF = 'ssygukfdbtehvtndandn';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const PAT = process.env.PAT;
const NEW_SVC = process.env.NEW_SVC;
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

const sqlOld = q => req(`https://api.supabase.com/v1/projects/${OLD_REF}/database/query`, 'POST', {'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json'}, {query: q});
const sqlNew = q => req(`https://api.supabase.com/v1/projects/${NEW_REF}/database/query`, 'POST', {'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json'}, {query: q});

function fixUrls(rows) {
  return rows.map(row => {
    const r = {...row};
    for (const [k, v] of Object.entries(r)) {
      if (typeof v === 'string' && v.includes('ssygukfdbtehvtndandn.supabase.co/storage'))
        r[k] = v.replace('https://ssygukfdbtehvtndandn.supabase.co/storage/v1/object/public/', R2 + '/');
    }
    return r;
  });
}

async function upsertNew(table, rows) {
  if (!rows?.length) return {s: 200};
  return req(`${NEW_URL}/rest/v1/${table}`, 'POST',
    {'apikey': NEW_SVC, 'Authorization': `Bearer ${NEW_SVC}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal'},
    fixUrls(rows));
}

async function main() {
  // Get all tables
  const tablesRes = await sqlOld(`SELECT tablename, COALESCE(n_live_tup,0) as rows FROM pg_catalog.pg_tables t LEFT JOIN pg_stat_user_tables s ON s.relname=t.tablename WHERE schemaname='public' ORDER BY COALESCE(n_live_tup,0) DESC NULLS LAST`);
  if (!Array.isArray(tablesRes.b)) { console.error('Cannot read tables:', JSON.stringify(tablesRes.b).slice(0,200)); process.exit(1); }

  console.log(`Scanning ${tablesRes.b.length} tables in old Supabase:`);
  tablesRes.b.forEach(t => console.log(`  ${t.tablename}: ${t.rows} rows`));

  // Auth users
  console.log('\n--- Auth users ---');
  const authRes = await req(`https://api.supabase.com/v1/projects/${OLD_REF}/auth/users?page=1&per_page=1000`, 'GET', {'Authorization': `Bearer ${PAT}`});
  const users = authRes.b?.users || [];
  console.log(`Found ${users.length} users`);
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
  console.log(`Auth: ${authOk} created, ${authSkip} skipped`);

  // All tables
  console.log('\n--- Tables ---');
  for (const table of tablesRes.b) {
    const name = table.tablename;
    let migrated = 0, offset = 0;
    while (true) {
      const r = await sqlOld(`SELECT * FROM public."${name}" LIMIT 500 OFFSET ${offset}`);
      if (r.s !== 200 || !Array.isArray(r.b) || r.b.length === 0) break;
      const w = await upsertNew(name, r.b);
      if (w.s >= 200 && w.s < 300) migrated += r.b.length;
      else { console.log(`  x ${name}@${offset}: ${w.s} ${JSON.stringify(w.b).slice(0,80)}`); break; }
      if (r.b.length < 500) break;
      offset += 500;
      await sleep(100);
    }
    if (migrated > 0) console.log(`  OK ${name}: ${migrated}`);
  }

  // Fix permissions
  await sqlNew(`GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role`);
  await sqlNew(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role`);
  console.log('\nDONE');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
