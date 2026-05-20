import https from 'https';

const TOKEN = process.env.VERCEL_TOKEN;
const OLD_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';

function api(method, path, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.vercel.com', path, method,
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.on('error', () => resolve({ s: 0, b: {} }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ s: 0, b: {} }); });
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const KEYS = ['VITE_SUPABASE_URL','SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_PUBLISHABLE_KEY','VITE_SUPABASE_ANON_KEY','VITE_SUPABASE_PROJECT_ID'];
const VALUES = {
  'VITE_SUPABASE_URL': OLD_URL,
  'SUPABASE_URL': OLD_URL,
  'VITE_SUPABASE_PUBLISHABLE_KEY': OLD_KEY,
  'SUPABASE_PUBLISHABLE_KEY': OLD_KEY,
  'VITE_SUPABASE_ANON_KEY': OLD_KEY,
  'VITE_SUPABASE_PROJECT_ID': 'ssygukfdbtehvtndandn'
};

async function main() {
  const { b: projData } = await api('GET', '/v9/projects?limit=20', null);
  const projects = projData?.projects || [];
  console.log(`Found ${projects.length} projects`);

  for (const project of projects) {
    console.log(`\n=== ${project.name} ===`);
    const { b: envData } = await api('GET', `/v9/projects/${project.id}/env`, null);
    const existing = envData?.envs || [];

    // Delete all Supabase-related env vars first
    for (const env of existing) {
      if (KEYS.includes(env.key)) {
        const { s } = await api('DELETE', `/v9/projects/${project.id}/env/${env.id}`, null);
        console.log(`  Deleted ${env.key} (${s})`);
        await sleep(100);
      }
    }

    // Create fresh with correct old Supabase values
    const newVars = KEYS.map(key => ({
      key, value: VALUES[key], type: 'encrypted',
      target: ['production', 'preview', 'development']
    }));

    const { s } = await api('POST', `/v9/projects/${project.id}/env`, newVars);
    console.log(`  Created all vars (${s}) ✅`);
    await sleep(200);

    // Trigger redeploy
    await api('POST', `/v13/deployments`, {
      name: project.name,
      project: project.id,
      target: 'production',
      gitSource: { type: 'github', repoId: project.link?.repoId, ref: 'main' }
    });
    console.log(`  Redeploying...`);
  }

  console.log('\n✅ Done. siddhaquantumnexus.com will work with your old password in ~2 minutes.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
