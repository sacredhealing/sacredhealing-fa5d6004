import https from 'https';
import fs from 'fs';
const TOKEN = process.env.VERCEL_TOKEN;

function api(method, path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.vercel.com', path, method,
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': 0 }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', e => resolve(null));
    req.end();
  });
}

async function main() {
  const proj = await api('GET', '/v9/projects?limit=20');
  const projects = proj?.projects || [];
  const results = [];

  for (const p of projects) {
    const domData = await api('GET', `/v9/projects/${p.id}/domains`);
    const domains = (domData?.domains || []).map(d => d.name);
    const envData = await api('GET', `/v9/projects/${p.id}/env`);
    const envs = (envData?.envs || [])
      .filter(e => e.key.includes('SUPABASE'))
      .map(e => ({ key: e.key, val: e.value ? e.value.slice(0,80) : '[encrypted-no-value]' }));
    results.push({ name: p.name, id: p.id, domains, envs });
  }
  
  // Write to file so GitHub Actions can commit it
  fs.writeFileSync('/tmp/vercel-diag.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
main().catch(e => { console.error(e.message); process.exit(1); });
