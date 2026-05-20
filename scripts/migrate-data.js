const https = require('https');

const OLD_REF = 'ssygukfdbtehvtndandn';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

if (!PAT) { console.error('Missing SUPABASE_ACCESS_TOKEN'); process.exit(1); }

function apiCall(projectRef, sql) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

function escapeVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== SQI Data Migration: Old Supabase → New Supabase ===\n');

  // Verify connection to both DBs
  console.log('Verifying connections...');
  const oldTest = await apiCall(OLD_REF, 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'');
  const newTest = await apiCall(NEW_REF, 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'');
  
  if (oldTest.status !== 200) { console.error('❌ Cannot connect to OLD Supabase:', oldTest.status); process.exit(1); }
  if (newTest.status !== 200) { console.error('❌ Cannot connect to NEW Supabase:', newTest.status); process.exit(1); }
  
  console.log('✅ Old Supabase connected');
  console.log('✅ New Supabase connected\n');

  // Get all tables from old DB
  const tablesRes = await apiCall(OLD_REF, `
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  if (tablesRes.status !== 200 || !Array.isArray(tablesRes.body)) {
    console.error('Failed to get tables:', tablesRes.status, JSON.stringify(tablesRes.body).slice(0, 300));
    process.exit(1);
  }

  const tables = tablesRes.body.map(r => r.table_name);
  console.log(`Found ${tables.length} tables to migrate\n`);

  // Disable FK constraints on new DB for clean insert
  await apiCall(NEW_REF, 'SET session_replication_role = replica;');

  let totalRows = 0;
  const errors = [];
  const BATCH = 500;

  for (const table of tables) {
    process.stdout.write(`--- ${table}: `);

    const countRes = await apiCall(OLD_REF, `SELECT COUNT(*)::int as cnt FROM public."${table}"`);
    if (countRes.status !== 200 || !Array.isArray(countRes.body)) {
      console.log(`⚠️  count failed (${countRes.status})`);
      errors.push(table);
      continue;
    }

    const count = parseInt(countRes.body[0]?.cnt || 0);
    if (count === 0) { console.log('empty'); continue; }

    process.stdout.write(`${count} rows → `);
    let migrated = 0;
    let offset = 0;

    while (offset < count) {
      const rowsRes = await apiCall(OLD_REF, `SELECT * FROM public."${table}" LIMIT ${BATCH} OFFSET ${offset}`);
      if (rowsRes.status !== 200 || !Array.isArray(rowsRes.body) || rowsRes.body.length === 0) break;

      const rows = rowsRes.body;
      const cols = Object.keys(rows[0]);
      const colsStr = cols.map(c => `"${c}"`).join(', ');
      const values = rows.map(row => `(${cols.map(c => escapeVal(row[c])).join(', ')})`).join(',\n');
      const insertSql = `INSERT INTO public."${table}" (${colsStr}) VALUES ${values} ON CONFLICT DO NOTHING`;

      const insertRes = await apiCall(NEW_REF, insertSql);
      if (insertRes.status !== 200) {
        errors.push(`${table}@${offset}`);
      } else {
        migrated += rows.length;
      }

      offset += BATCH;
      await sleep(150);
    }

    console.log(`✅ ${migrated}`);
    totalRows += migrated;
  }

  await apiCall(NEW_REF, 'SET session_replication_role = DEFAULT;');

  console.log('\n' + '='.repeat(50));
  console.log(`✅ MIGRATION COMPLETE — ${totalRows} total rows migrated`);
  if (errors.length > 0) console.log(`⚠️  Issues: ${errors.join(', ')}`);
  console.log('='.repeat(50));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
