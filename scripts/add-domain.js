const https = require('https');

const TOKEN = process.env.VERCEL_TOKEN;
const DOMAIN = 'www.siddhaquantumnexus.com';
const APEX = 'siddhaquantumnexus.com';

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

async function main() {
  // Get all projects - find the main one (mc55 has most vars)
  const { body: projData } = await api('GET', '/v9/projects?limit=20', null);
  const projects = projData.projects || [];
  
  // Pick the most configured project (most env vars = main one)
  const main = projects.find(p => p.name.includes('mc55')) || projects[0];
  console.log(`Adding domain to project: ${main.name} (${main.id})`);

  // Add www domain
  const { status: s1, body: b1 } = await api('POST', `/v9/projects/${main.id}/domains`, { name: DOMAIN });
  console.log(`\nwww.siddhaquantumnexus.com: ${s1 === 200 || s1 === 409 ? '✅' : '⚠️'} (${s1})`);
  if (b1.verification) {
    console.log('DNS verification needed:');
    b1.verification.forEach(v => console.log(`  Type: ${v.type}, Name: ${v.domain}, Value: ${v.value}`));
  }
  if (b1.cnames) console.log(`  CNAME: ${b1.cnames}`);

  // Add apex domain
  const { status: s2, body: b2 } = await api('POST', `/v9/projects/${main.id}/domains`, { name: APEX });
  console.log(`\nsiddhaquantumnexus.com: ${s2 === 200 || s2 === 409 ? '✅' : '⚠️'} (${s2})`);

  // Get DNS config
  const { body: dnsData } = await api('GET', `/v6/domains/${DOMAIN}/config`, null);
  console.log('\n=== DNS RECORDS TO SET ===');
  console.log(JSON.stringify(dnsData, null, 2));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
