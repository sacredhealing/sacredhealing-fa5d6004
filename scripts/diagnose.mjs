import https from 'https';

const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const SVC = process.env.NEW_SERVICE_ROLE;
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const PUB_KEY = 'sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F';
const GH_TOKEN = process.env.GITHUB_TOKEN;

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

async function writeResultToRepo(content) {
  // Get current SHA of file if exists
  const existingRes = await req(
    'https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/docs/diagnosis-result.txt',
    'GET', { 'Authorization': `Bearer ${GH_TOKEN}`, 'User-Agent': 'node' }
  );
  const sha = existingRes.b?.sha;
  const encoded = Buffer.from(content).toString('base64');
  const body = { message: 'diagnose: write result', content: encoded };
  if (sha) body.sha = sha;
  await req(
    'https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/docs/diagnosis-result.txt',
    'PUT', { 'Authorization': `Bearer ${GH_TOKEN}`, 'User-Agent': 'node', 'Content-Type': 'application/json' },
    body
  );
  console.log('Result written to repo: docs/diagnosis-result.txt');
}

async function main() {
  const lines = [];
  const log = (...args) => { const msg = args.join(' '); console.log(msg); lines.push(msg); };

  log('=== 1. Test publishable key ===');
  const conn = await req(`${NEW_URL}/rest/v1/`, 'GET', { 'apikey': PUB_KEY, 'Authorization': `Bearer ${PUB_KEY}` });
  log(`HTTP: ${conn.s} | ${JSON.stringify(conn.b).slice(0, 150)}`);

  log('\n=== 2. Fetch actual API keys ===');
  const keys = await req(`https://api.supabase.com/v1/projects/${NEW_REF}/api-keys`, 'GET', { 'Authorization': `Bearer ${PAT}` });
  log(`HTTP: ${keys.s}`);
  if (Array.isArray(keys.b)) {
    keys.b.forEach(k => log(`  ${k.name}: ${k.api_key}`));
  } else {
    log('Keys response:', JSON.stringify(keys.b).slice(0, 300));
  }

  log('\n=== 3. Auth users list ===');
  const users = await req(`${NEW_URL}/auth/v1/admin/users`, 'GET', { 'apikey': SVC, 'Authorization': `Bearer ${SVC}` });
  log(`HTTP: ${users.s}`);
  if (users.b?.users) {
    log(`Total users: ${users.b.users.length}`);
    users.b.users.forEach(u => log(`  ${u.email} | ${u.id} | confirmed:${!!u.email_confirmed_at}`));
  } else {
    log('Response:', JSON.stringify(users.b).slice(0, 300));
  }

  log('\n=== 4. Login test with SVC key ===');
  const login = await req(`${NEW_URL}/auth/v1/token?grant_type=password`, 'POST',
    { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' },
    { email: 'sacredhealingvibe@gmail.com', password: 'SiddhaQuantum2050!' });
  log(`HTTP: ${login.s}`);
  if (login.b?.access_token) { log('LOGIN WITH SVC: SUCCESS'); }
  else { log('LOGIN FAILED:', JSON.stringify(login.b).slice(0, 200)); }

  log('\n=== 5. Login test with publishable key ===');
  const login2 = await req(`${NEW_URL}/auth/v1/token?grant_type=password`, 'POST',
    { 'apikey': PUB_KEY, 'Authorization': `Bearer ${PUB_KEY}`, 'Content-Type': 'application/json' },
    { email: 'sacredhealingvibe@gmail.com', password: 'SiddhaQuantum2050!' });
  log(`HTTP: ${login2.s}`);
  if (login2.b?.access_token) { log('LOGIN WITH PUB KEY: SUCCESS'); }
  else { log('PUB KEY LOGIN FAILED:', JSON.stringify(login2.b).slice(0, 200)); }

  await writeResultToRepo(lines.join('\n'));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
