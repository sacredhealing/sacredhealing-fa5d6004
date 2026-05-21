import https from 'https';

const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const SVC = process.env.NEW_SERVICE_ROLE;
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const PUB_KEY = 'sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F';

function req(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { ...headers, ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) }
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

async function main() {
  console.log('=== 1. Test publishable key connection ===');
  const conn = await req(`${NEW_URL}/rest/v1/`, 'GET', {
    'apikey': PUB_KEY, 'Authorization': `Bearer ${PUB_KEY}`
  });
  console.log('HTTP:', conn.s, '| Body:', JSON.stringify(conn.b).slice(0, 200));

  console.log('\n=== 2. Fetch actual API keys from Management API ===');
  const keys = await req(`https://api.supabase.com/v1/projects/${NEW_REF}/api-keys`, 'GET', {
    'Authorization': `Bearer ${PAT}`
  });
  console.log('HTTP:', keys.s);
  if (Array.isArray(keys.b)) {
    keys.b.forEach(k => console.log(`  ${k.name}: ${k.api_key}`));
  } else {
    console.log('Response:', JSON.stringify(keys.b).slice(0, 300));
  }

  console.log('\n=== 3. List auth users (using SVC key) ===');
  const users = await req(`${NEW_URL}/auth/v1/admin/users`, 'GET', {
    'apikey': SVC, 'Authorization': `Bearer ${SVC}`
  });
  console.log('HTTP:', users.s);
  if (users.b?.users) {
    console.log(`Total: ${users.b.users.length} users`);
    users.b.users.forEach(u => console.log(`  ${u.email} | ${u.id.slice(0,8)} | confirmed:${!!u.email_confirmed_at}`));
  } else {
    console.log('Response:', JSON.stringify(users.b).slice(0, 300));
  }

  console.log('\n=== 4. Test login via password grant ===');
  const login = await req(`${NEW_URL}/auth/v1/token?grant_type=password`, 'POST', {
    'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json'
  }, { email: 'sacredhealingvibe@gmail.com', password: 'SiddhaQuantum2050!' });
  console.log('HTTP:', login.s);
  if (login.b?.access_token) {
    console.log('LOGIN SUCCESS - got access token');
  } else {
    console.log('LOGIN FAILED:', login.b?.error, login.b?.error_description, login.b?.msg);
  }

  console.log('\n=== 5. Test login with publishable key (what the app uses) ===');
  const login2 = await req(`${NEW_URL}/auth/v1/token?grant_type=password`, 'POST', {
    'apikey': PUB_KEY, 'Authorization': `Bearer ${PUB_KEY}`, 'Content-Type': 'application/json'
  }, { email: 'sacredhealingvibe@gmail.com', password: 'SiddhaQuantum2050!' });
  console.log('HTTP:', login2.s);
  if (login2.b?.access_token) {
    console.log('PUBLISHABLE KEY LOGIN: SUCCESS');
  } else {
    console.log('PUBLISHABLE KEY LOGIN FAILED:', login2.b?.error, login2.b?.error_description, login2.b?.msg, login2.b?.message);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
