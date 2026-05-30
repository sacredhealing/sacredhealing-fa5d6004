
import https from 'https';

const PAT = process.env.PAT;
const NEW_SVC = process.env.NEW_SVC;

console.log('PAT present:', !!PAT, PAT ? PAT.slice(0,10)+'...' : 'MISSING');
console.log('NEW_SVC present:', !!NEW_SVC, NEW_SVC ? NEW_SVC.slice(0,10)+'...' : 'MISSING');

// Test connection to Supabase Management API
function req(url, method, headers, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { ...headers, ...(payload ? {'Content-Length': Buffer.byteLength(payload)} : {}) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({s: res.statusCode, b: JSON.parse(d)}); } catch { resolve({s: res.statusCode, b: d}); } });
    });
    r.on('error', e => resolve({s: 0, b: e.message}));
    if (payload) r.write(payload);
    r.end();
  });
}

async function main() {
  console.log('Testing Supabase Management API...');
  const r = await req('https://api.supabase.com/v1/projects/ssygukfdbtehvtndandn/database/query', 'POST',
    {'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json'},
    {query: 'SELECT 1 as test'});
  console.log('API status:', r.s);
  console.log('API response:', JSON.stringify(r.b).slice(0, 200));
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
