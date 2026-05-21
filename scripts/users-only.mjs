import https from 'https';

const BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SVC = process.env.NEW_SERVICE_ROLE;
const PASS = 'SiddhaQuantum2050!';

if (!SVC) { console.error('NO SVC KEY'); process.exit(1); }

function req(url, method, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    r.setTimeout(15000, () => { r.destroy(); resolve({ s: 0, b: 'timeout' }); });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (payload) r.write(payload);
    r.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // List current users
  const listRes = await req(`${BASE}/auth/v1/admin/users`, 'GET');
  const existing = listRes.b?.users || [];
  console.log('Current users:', existing.length);
  existing.forEach(u => console.log(' ', u.email, u.id));

  const EMAILS = ['sacredhealingvibe@gmail.com', 'laila.amrouche@gmail.com'];

  for (const email of EMAILS) {
    const found = existing.find(u => u.email === email);
    if (found) {
      console.log(`\nResetting password: ${email}`);
      const r = await req(`${BASE}/auth/v1/admin/users/${found.id}`, 'PUT',
        { password: PASS, email_confirm: true });
      console.log('  HTTP:', r.s, r.b?.email ? 'OK' : JSON.stringify(r.b).slice(0,100));
    } else {
      console.log(`\nCreating: ${email}`);
      const r = await req(`${BASE}/auth/v1/admin/users`, 'POST',
        { email, password: PASS, email_confirm: true });
      console.log('  HTTP:', r.s, r.b?.id || JSON.stringify(r.b).slice(0,100));
    }
    await sleep(300);
  }

  await sleep(500);
  const final = await req(`${BASE}/auth/v1/admin/users`, 'GET');
  console.log('\nFinal users:', final.b?.users?.length);
  final.b?.users?.forEach(u => console.log(' ', u.email, '| confirmed:', !!u.email_confirmed_at));

  // Test login
  const login = await req(`${BASE}/auth/v1/token?grant_type=password`, 'POST',
    { email: 'sacredhealingvibe@gmail.com', password: PASS });
  console.log('\nLogin HTTP:', login.s);
  console.log(login.b?.access_token ? 'LOGIN SUCCESS ✅' : 'FAILED: ' + JSON.stringify(login.b).slice(0,200));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
