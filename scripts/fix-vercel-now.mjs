import https from 'https';
const TOKEN = process.env.VERCEL_TOKEN;
const URL_ = 'https://ssygukfdbtehvtndandn.supabase.co';
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const PID  = 'ssygukfdbtehvtndandn';

function api(method, path, body) {
  return new Promise(resolve => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.vercel.com', path, method,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.on('error', () => resolve({ s: 0, b: {} }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ s: 0, b: 'timeout' }); });
    if (payload) req.write(payload);
    req.end();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const VARS = { VITE_SUPABASE_URL: URL_, SUPABASE_URL: URL_, VITE_SUPABASE_PUBLISHABLE_KEY: KEY, SUPABASE_PUBLISHABLE_KEY: KEY, VITE_SUPABASE_ANON_KEY: KEY, VITE_SUPABASE_PROJECT_ID: PID };

async function main() {
  const { b } = await api('GET', '/v9/projects?limit=20', null);
  const projects = b?.projects || [];
  console.log(`${projects.length} projects found`);
  for (const p of projects) {
    console.log(`\n${p.name}`);
    const { b: e } = await api('GET', `/v9/projects/${p.id}/env`, null);
    for (const env of (e?.envs || [])) {
      if (Object.keys(VARS).includes(env.key)) {
        await api('DELETE', `/v9/projects/${p.id}/env/${env.id}`, null);
        await sleep(80);
      }
    }
    const { s } = await api('POST', `/v9/projects/${p.id}/env`, Object.entries(VARS).map(([key,value]) => ({ key, value, type: 'encrypted', target: ['production','preview','development'] })));
    console.log(`  env set (${s})`);
    await api('POST', `/v13/deployments`, { name: p.name, project: p.id, target: 'production', gitSource: { type: 'github', ref: 'main' } });
    console.log(`  redeploy triggered`);
    await sleep(200);
  }
  console.log('\nDone — siddhaquantumnexus.com now uses old Supabase. Login with your original password.');
}
main().catch(e => { console.error(e.message); process.exit(1); });
