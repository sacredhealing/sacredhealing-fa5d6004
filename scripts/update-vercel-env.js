const https = require('https');

const TOKEN = process.env.VERCEL_TOKEN;
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const NEW_KEY = 'sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F';
const NEW_ID = 'fjdzhrdpioxdeyyfogep';

if (!TOKEN) { console.error('Missing VERCEL_TOKEN'); process.exit(1); }

function api(method, path, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.vercel.com', path, method,
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Get all projects
  const { body: projData } = await api('GET', '/v9/projects?limit=20', null);
  const projects = projData.projects || [];
  console.log(`Found ${projects.length} Vercel projects\n`);

  const VARS = [
    { key: 'VITE_SUPABASE_URL', value: NEW_URL },
    { key: 'SUPABASE_URL', value: NEW_URL },
    { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: NEW_KEY },
    { key: 'SUPABASE_PUBLISHABLE_KEY', value: NEW_KEY },
    { key: 'VITE_SUPABASE_ANON_KEY', value: NEW_KEY },
    { key: 'VITE_SUPABASE_PROJECT_ID', value: NEW_ID },
  ];

  for (const project of projects) {
    console.log(`=== ${project.name} (${project.id}) ===`);

    // Get existing env vars
    const { body: envData } = await api('GET', `/v9/projects/${project.id}/env`, null);
    const existing = envData.envs || [];

    for (const { key, value } of VARS) {
      const found = existing.find(e => e.key === key);
      if (found) {
        const { status } = await api('PATCH', `/v9/projects/${project.id}/env/${found.id}`, {
          value, target: ['production', 'preview', 'development']
        });
        console.log(`  ${status === 200 ? '✅' : '⚠️'} Updated ${key} (${status})`);
      } else {
        const { status } = await api('POST', `/v9/projects/${project.id}/env`, [{
          key, value, type: 'encrypted', target: ['production', 'preview', 'development']
        }]);
        console.log(`  ${status === 200 || status === 201 ? '✅' : '⚠️'} Created ${key} (${status})`);
      }
      await sleep(200);
    }

    // Trigger redeploy via create deployment from latest commit
    const { body: deployData } = await api('POST', `/v13/deployments?forceNew=1`, {
      name: project.name,
      project: project.id,
      target: 'production',
    });
    console.log(`  🚀 Redeploy: ${deployData.url || deployData.error || 'triggered'}\n`);
    await sleep(500);
  }

  console.log('✅ All Vercel projects updated to new Supabase');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
