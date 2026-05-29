import https from 'https';
const TOKEN = process.env.VERCEL_TOKEN;

function api(method, path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.vercel.com', path, method,
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': 0 }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.on('error', e => resolve({ s: 0, b: e.message }));
    req.end();
  });
}

async function main() {
  const { b } = await api('GET', '/v9/projects?limit=20');
  const projects = b?.projects || [];
  console.log(`Total projects: ${projects.length}\n`);

  for (const p of projects) {
    console.log(`PROJECT: ${p.name} (${p.id})`);
    
    // Get domains
    const { b: domData } = await api('GET', `/v9/projects/${p.id}/domains`);
    const domains = domData?.domains || [];
    domains.forEach(d => console.log(`  domain: ${d.name}`));

    // Get env vars
    const { b: envData } = await api('GET', `/v9/projects/${p.id}/env`);
    const envs = envData?.envs || [];
    const supaVars = envs.filter(e => e.key.includes('SUPABASE'));
    supaVars.forEach(e => console.log(`  ${e.key} = ${e.value ? e.value.slice(0,60) : '[encrypted]'}`));
    console.log('');
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
