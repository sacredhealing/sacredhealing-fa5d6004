import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const REF = 'fjdzhrdpioxdeyyfogep';

function api(method, hostname, path, headers, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname, path, method,
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(15000, () => { req.destroy(); resolve({ s: 0, b: 'timeout' }); });
    req.on('error', e => resolve({ s: 0, b: e.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

// 1. Disable spend cap
console.log('Disabling spend cap...');
const sc1 = await api('PATCH', 'api.supabase.com', `/v1/projects/${REF}/config`,
  {}, { spend_cap_enabled: false });
console.log('Config patch:', sc1.s, JSON.stringify(sc1.b).slice(0,100));

const sc2 = await api('POST', 'api.supabase.com', `/v1/projects/${REF}/billing/addons`,
  {}, { addon_type: 'spend_cap', addon_variant: 'disabled' });
console.log('Billing addons:', sc2.s, JSON.stringify(sc2.b).slice(0,100));

// 2. List all deployed functions
console.log('\nListing deployed functions...');
const list = await api('GET', 'api.supabase.com', `/v1/projects/${REF}/functions`, {}, null);
console.log('List status:', list.s);

if (list.s === 200 && Array.isArray(list.b)) {
  console.log(`Found ${list.b.length} functions:`, list.b.map(f => f.slug));

  // 3. Delete ALL of them
  for (const fn of list.b) {
    const del = await api('DELETE', 'api.supabase.com', `/v1/projects/${REF}/functions/${fn.slug}`, {}, null);
    console.log(`Deleted ${fn.slug}:`, del.s);
  }
  console.log('\nAll functions cleared ✅');
} else {
  console.log('Could not list functions:', JSON.stringify(list.b).slice(0,200));
}
