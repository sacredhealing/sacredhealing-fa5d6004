import https from 'https';

const BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SVC = process.env.NEW_SERVICE_ROLE;
const PASS = 'SiddhaQuantum2050!';
const EMAILS = ['sacredhealingvibe@gmail.com', 'laila.amrouche@gmail.com'];

if (!SVC) { console.error('NO SERVICE ROLE KEY'); process.exit(1); }

function req(url, method, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: {
        'apikey': SVC, 'Authorization': `Bearer ${SVC}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
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
  // First list existing users
  const listRes = await req(`${BASE}/auth/v1/admin/users`, 'GET');
  const existingUsers = listRes.b?.users || [];
  console.log(`Existing users: ${existingUsers.length}`);
  existingUsers.forEach(u => console.log(`  ${u.email} | ${u.id}`));

  for (const email of EMAILS) {
    // Check if exists
    const existing = existingUsers.find(u => u.email === email);
    
    if (existing) {
      // Reset password
      console.log(`\nResetting password for ${email} (${existing.id})`);
      const r = await req(`${BASE}/auth/v1/admin/users/${existing.id}`, 'PUT', {
        password: PASS, email_confirm: true
      });
      console.log(`  Result: ${r.s}`, r.b?.email || JSON.stringify(r.b).slice(0, 100));
    } else {
      // Create
      console.log(`\nCreating ${email}`);
      const r = await req(`${BASE}/auth/v1/admin/users`, 'POST', {
        email, password: PASS, email_confirm: true
      });
      console.log(`  Result: ${r.s}`, r.b?.id || JSON.stringify(r.b).slice(0, 100));
    }
    await sleep(500);
  }

  // Verify
  await sleep(1000);
  const verify = await req(`${BASE}/auth/v1/admin/users`, 'GET');
  const users = verify.b?.users || [];
  console.log(`\nFinal count: ${users.length} users`);
  users.forEach(u => console.log(`  ${u.email} | confirmed:${!!u.email_confirmed_at}`));

  // Test login
  const loginRes = await req(`${BASE}/auth/v1/token?grant_type=password`, 'POST', {
    email: EMAILS[0], password: PASS
  });
  console.log(`\nLogin test HTTP: ${loginRes.s}`);
  if (loginRes.b?.access_token) {
    console.log('LOGIN SUCCESS ✅');
  } else {
    console.log('LOGIN FAILED:', JSON.stringify(loginRes.b).slice(0, 200));
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
