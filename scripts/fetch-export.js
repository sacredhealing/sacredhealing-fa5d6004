const https = require('https');
const fs = require('fs');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const HOST = 'ssygukfdbtehvtndandn.supabase.co';
const FN = '/functions/v1/full-data-export';

function call(body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: HOST, path: FN, method: body ? 'POST' : 'GET',
      headers: { 'Authorization': `Bearer ${KEY}`, 'apikey': KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.setTimeout(60000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Step 1: get table list and counts
  console.log('Step 1: Fetching table list...');
  const listRes = await call(null);
  if (listRes.status !== 200) {
    console.error('Failed to get table list:', listRes.status, listRes.body.slice(0, 200));
    process.exit(1);
  }
  const { tables: tableCounts } = JSON.parse(listRes.body);
  const tableNames = Object.entries(tableCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const emptyTables = Object.entries(tableCounts).filter(([, count]) => count === 0).map(([n]) => n);
  console.log(`Found ${Object.keys(tableCounts).length} tables, ${tableNames.length} with data, ${emptyTables.length} empty\n`);

  // Step 2: fetch each table with pagination
  const allData = {};
  let grandTotal = 0;

  for (const [table, count] of tableNames) {
    process.stdout.write(`  Fetching ${table} (${count} rows)...`);
    const rows = [];
    const LIMIT = 500;

    for (let offset = 0; offset < count; offset += LIMIT) {
      const res = await call({ table, offset, limit: LIMIT });
      if (res.status !== 200) {
        console.log(` ⚠️ error at offset ${offset}`);
        break;
      }
      const parsed = JSON.parse(res.body);
      rows.push(...(parsed.rows || []));
      await sleep(150);
    }

    allData[table] = { count, rows };
    grandTotal += rows.length;
    console.log(` ✅ ${rows.length} fetched`);
  }

  // Add empty tables
  emptyTables.forEach(t => { allData[t] = { count: 0, rows: [] }; });

  // Save
  const output = { exported_at: new Date().toISOString(), tables: allData };
  fs.writeFileSync('/tmp/export.json', JSON.stringify(output));
  console.log(`\n✅ Export complete: ${tableNames.length} tables, ${grandTotal} total rows`);
  console.log(`File size: ${(fs.statSync('/tmp/export.json').size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
