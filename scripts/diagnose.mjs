import https from 'https';

const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNDAwMywiZXhwIjoyMDkzNjgwMDAzfQ.HZ_VKpZpV5WrcTwfp5oQY9h4TRZLIzLGMysQoGBVkEw';
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const GH_TOKEN = process.env.GITHUB_TOKEN;

function req(url, method, headers, body) {
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

const SVC_HEADERS = { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' };

async function createUser(email, password = 'SiddhaQuantum2050!') {
  console.log(`Creating: ${email}`);
  const r = await req(`${NEW_URL}/auth/v1/admin/users`, 'POST', SVC_HEADERS,
    { email, password, email_confirm: true });
  if (r.b?.id) {
    console.log(`  SUCCESS: ${r.b.id}`);
    return r.b.id;
  } else if (r.b?.message?.includes('already')) {
    console.log(`  EXISTS`);
    // Update password
    const users = await req(`${NEW_URL}/auth/v1/admin/users`, 'GET', SVC_HEADERS);
    const u = users.b?.users?.find(u => u.email === email);
    if (u) {
      await req(`${NEW_URL}/auth/v1/admin/users/${u.id}`, 'PUT', SVC_HEADERS,
        { password, email_confirm: true });
      console.log(`  Password reset for ${u.id}`);
      return u.id;
    }
  } else {
    console.log(`  FAILED:`, JSON.stringify(r.b).slice(0, 200));
  }
  return null;
}

async function writeResult(content) {
  const ex = await req('https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/docs/diagnosis-result.txt',
    'GET', { 'Authorization': `Bearer ${GH_TOKEN}`, 'User-Agent': 'node' });
  const sha = ex.b?.sha;
  const body = { message: 'fix: create users result', content: Buffer.from(content).toString('base64') };
  if (sha) body.sha = sha;
  await req('https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/docs/diagnosis-result.txt',
    'PUT', { 'Authorization': `Bearer ${GH_TOKEN}`, 'User-Agent': 'node', 'Content-Type': 'application/json' }, body);
}

async function main() {
  const lines = [];
  const log = (...a) => { const m = a.join(' '); console.log(m); lines.push(m); };

  log('=== Create admin users ===');
  const id1 = await createUser('sacredhealingvibe@gmail.com');
  log('Admin ID:', id1);
  await sleep(500);
  const id2 = await createUser('laila.amrouche@gmail.com');
  log('Laila ID:', id2);
  await sleep(500);

  log('\n=== Verify user count ===');
  const list = await req(`${NEW_URL}/auth/v1/admin/users`, 'GET', SVC_HEADERS);
  log('Users:', list.s, 'Count:', list.b?.users?.length);
  list.b?.users?.forEach(u => log(` ${u.email} | ${u.id}`));

  log('\n=== Test login ===');
  const login = await req(`${NEW_URL}/auth/v1/token?grant_type=password`, 'POST', SVC_HEADERS,
    { email: 'sacredhealingvibe@gmail.com', password: 'SiddhaQuantum2050!' });
  log('Login HTTP:', login.s);
  log(login.b?.access_token ? 'LOGIN SUCCESS' : 'FAILED: ' + JSON.stringify(login.b).slice(0, 200));

  await writeResult(lines.join('\n'));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
