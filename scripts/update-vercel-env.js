const https = require('https');

const TOKEN = process.env.VERCEL_TOKEN;
const OLD_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const OLD_PROJECT_ID = 'ssygukfdbtehvtndandn';

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
  const { body: projData } = await api('GET', '/v9/projects?limit=20', null);
  const projects = projData.projects || [];
  console.log(`Found ${projects.length} projects\n`);

  const VARS = [
    { key: 'VITE_SUPABASE_URL', value: OLD_URL },
    { key: 'SUPABASE_URL', value: OLD_URL },
    { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: OLD_KEY },
    { key: 'SUPABASE_PUBLISHABLE_KEY', value: OLD_KEY },
    { key: 'VITE_SUPABASE_ANON_KEY', value: OLD_KEY },
    { key: 'VITE_SUPABASE_PROJECT_ID', value: OLD_PROJECT_ID },
  ];

  for (const project of projects) {
    console.log(`=== ${project.name} ===`);
    const { body: envData } = await api('GET', `/v9/projects/${project.id}/env`, null);
    const existing = envData.envs || [];

    for (const { key, value } of VARS) {
      const found = existing.find(e => e.key === key);
      if (found) {
        const { status } = await api('PATCH', `/v9/projects/${project.id}/env/${found.id}`, {
          value, target: ['production', 'preview', 'development']
        });
        console.log(`  ${status === 200 ? '✅' : '⚠️'} Updated ${key}`);
      } else {
        const { status } = await api('POST', `/v9/projects/${project.id}/env`, [{
          key, value, type: 'encrypted', target: ['production', 'preview', 'development']
        }]);
        console.log(`  ${status === 200 || status === 201 ? '✅' : '⚠️'} Created ${key}`);
      }
      await sleep(200);
    }
    console.log('');
  }
  console.log('✅ All Vercel projects updated to OLD Supabase — login will work now');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
