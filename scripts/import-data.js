const https = require('https');
const fs = require('fs');

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

if (!PAT) { console.error('Missing SUPABASE_ACCESS_TOKEN'); process.exit(1); }
console.log(`PAT length: ${PAT.length}`);

function apiCall(sql) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${NEW_REF}/database/query`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const export_data = JSON.parse(fs.readFileSync('/tmp/export.json', 'utf8'));
  const tables = export_data.tables || {};
  console.log(`\nImporting ${Object.keys(tables).length} tables into new Supabase...\n`);

  await apiCall('SET session_replication_role = replica;');

  let total = 0;
  const errors = [];

  for (const [table, info] of Object.entries(tables)) {
    const rows = info.rows || [];
    if (rows.length === 0) { console.log(`  ○ ${table}: empty`); continue; }

    const cols = Object.keys(rows[0]);
    const colsStr = cols.map(c => `"${c}"`).join(', ');
    let migrated = 0;

    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      const vals = batch.map(r => `(${cols.map(c => esc(r[c])).join(', ')})`).join(',\n');
      const { status, body } = await apiCall(`INSERT INTO public."${table}" (${colsStr}) VALUES ${vals} ON CONFLICT DO NOTHING`);
      if (status === 200) migrated += batch.length;
      else errors.push(`${table}: ${body.slice(0, 100)}`);
      await sleep(100);
    }

    console.log(`  ✅ ${table}: ${migrated} rows`);
    total += migrated;
  }

  await apiCall('SET session_replication_role = DEFAULT;');
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ DONE: ${total} total rows migrated`);
  if (errors.length) console.log(`⚠️  Errors (${errors.length}):`, errors.slice(0, 3));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
