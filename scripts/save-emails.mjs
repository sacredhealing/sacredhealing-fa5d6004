import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

function get(hostname, path, headers) {
  return new Promise((resolve) => {
    const req = https.request({ hostname, path, method: 'GET', headers }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0, b: '' }); });
    req.on('error', () => resolve({ s: 0, b: '' }));
    req.end();
  });
}

function post(hostname, path, headers, body) {
  return new Promise((resolve) => {
    const p = JSON.stringify(body);
    const req = https.request({ hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(p) } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0, b: '' }); });
    req.on('error', () => resolve({ s: 0, b: '' }));
    req.write(p); req.end();
  });
}

function isEmail(s) { return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

async function main() {
  // Get emails from old Supabase edge function
  console.log('Fetching email_subscribers from old Supabase...');
  const res = await post('ssygukfdbtehvtndandn.supabase.co', '/functions/v1/full-data-export',
    { 'Authorization': `Bearer ${OLD_KEY}`, 'apikey': OLD_KEY, 'Content-Type': 'application/json' },
    { table: 'email_subscribers', offset: 0, limit: 1000 }
  );

  const emails = new Set();
  if (res.s === 200 && res.b.rows) {
    res.b.rows.forEach(row => Object.values(row).forEach(v => { if (isEmail(v)) emails.add(v.toLowerCase()); }));
  }
  console.log(`Found ${emails.size} emails`);

  // Create table in new Supabase
  console.log('Creating email_list table in new Supabase...');
  const create = await post('api.supabase.com', `/v1/projects/${NEW_REF}/database/query`,
    { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    { query: `CREATE TABLE IF NOT EXISTS public.email_list (id BIGSERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, source TEXT DEFAULT 'migration', subscribed BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW())` }
  );
  console.log(`Table create status: ${create.s}`);

  // Insert all emails
  const vals = [...emails].map(e => `('${e}', 'migration')`).join(', ');
  const insert = await post('api.supabase.com', `/v1/projects/${NEW_REF}/database/query`,
    { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    { query: `INSERT INTO public.email_list (email, source) VALUES ${vals} ON CONFLICT (email) DO NOTHING` }
  );
  console.log(`Insert status: ${insert.s}`);
  console.log(`Insert response: ${JSON.stringify(insert.b).slice(0, 200)}`);

  // Verify
  const check = await post('api.supabase.com', `/v1/projects/${NEW_REF}/database/query`,
    { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    { query: `SELECT COUNT(*) as total FROM public.email_list` }
  );
  console.log(`\n✅ email_list table now has: ${check.b[0]?.total || 0} emails`);
  console.log([...emails].join('\n'));
}

main().catch(e => { console.error(e.message); process.exit(1); });
