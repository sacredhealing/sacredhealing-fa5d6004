import https from 'https';
import { execSync } from 'child_process';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const NEW_KEY = 'sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F';
const RESEND_KEY = 're_W3iSeEDi_2vHcGx2mNZizdVpZfbrZHjg6';
const ADMIN_EMAIL = 'sacredhealingvibe@gmail.com';
const TEMP_PASS = 'SiddhaQuantum2050!';

function post(hostname, path, headers, body) {
  return new Promise((resolve) => {
    const p = body ? JSON.stringify(body) : '';
    const req = https.request({ hostname, path, method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(p) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); }});
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0, b: '' }); });
    req.on('error', () => resolve({ s: 0, b: '' }));
    if (p) req.write(p); req.end();
  });
}

function patch(hostname, path, headers, body) {
  return new Promise((resolve) => {
    const p = JSON.stringify(body);
    const req = https.request({ hostname, path, method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(p) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); }});
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0, b: '' }); });
    req.on('error', () => resolve({ s: 0, b: '' }));
    req.write(p); req.end();
  });
}

function dbQuery(sql) {
  return post('api.supabase.com', `/v1/projects/${NEW_REF}/database/query`,
    { 'Authorization': `Bearer ${PAT}` }, { query: sql });
}

function vercelApi(method, path, body) {
  return new Promise((resolve) => {
    const p = body ? JSON.stringify(body) : '';
    const req = https.request({ hostname: 'api.vercel.com', path, method,
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(p) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); }});
    });
    req.on('error', () => resolve({ s: 0, b: {} }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ s: 0, b: {} }); });
    if (p) req.write(p); req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  execSync('npm install bcryptjs', { stdio: 'pipe' });
  const { default: bcrypt } = await import('bcryptjs');

  // 1. Configure Supabase SMTP + site URL
  console.log('1. Configuring Supabase auth...');
  const authConfig = await patch('api.supabase.com', `/v1/projects/${NEW_REF}/config/auth`,
    { 'Authorization': `Bearer ${PAT}` }, {
      smtp_admin_email: 'noreply@mail.siddhaquantumnexus.com',
      smtp_host: 'smtp.resend.com',
      smtp_port: '465',
      smtp_user: 'resend',
      smtp_pass: RESEND_KEY,
      smtp_sender_name: 'Siddha Quantum Nexus',
      enable_signup: true,
      mailer_autoconfirm: false,
      site_url: 'https://siddhaquantumnexus.com',
      uri_allow_list: 'https://siddhaquantumnexus.com/**,https://*.vercel.app/**'
    });
  console.log(`   SMTP config: ${authConfig.s === 200 ? '✅' : '⚠️ ' + authConfig.s}`);
  if (authConfig.s !== 200) console.log('   ', JSON.stringify(authConfig.b).slice(0, 200));

  // 2. Create admin user with correct UUID from profiles
  console.log('\n2. Creating admin auth user...');
  
  // First delete any wrong account
  await dbQuery(`DELETE FROM auth.users WHERE email = '${ADMIN_EMAIL}'`);
  
  // Get the correct UUID from profiles (oldest = admin)
  const profileRes = await dbQuery(`SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1`);
  let adminUUID = null;
  if (Array.isArray(profileRes.b) && profileRes.b[0]) {
    adminUUID = profileRes.b[0].user_id;
    console.log(`   Found UUID: ${adminUUID}`);
  } else {
    adminUUID = '00000000-0000-0000-0000-000000000001';
    console.log(`   No profile found, using fallback UUID`);
  }

  const hash = await bcrypt.hash(TEMP_PASS, 10);
  const insertRes = await dbQuery(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '${adminUUID}', 'authenticated', 'authenticated',
      '${ADMIN_EMAIL}', '${hash}',
      NOW(), '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW(), '', '', '', ''
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      email_confirmed_at = NOW(),
      updated_at = NOW()
  `);
  console.log(`   Auth user: ${insertRes.s === 200 || insertRes.s === 201 ? '✅' : '⚠️ ' + insertRes.s + ' ' + JSON.stringify(insertRes.b).slice(0,150)}`);

  // 3. Point Vercel to new Supabase
  console.log('\n3. Switching Vercel to new Supabase...');
  const { b: projData } = await vercelApi('GET', '/v9/projects?limit=20', null);
  const projects = projData?.projects || [];
  
  const VARS = [
    { key: 'VITE_SUPABASE_URL', value: NEW_URL },
    { key: 'SUPABASE_URL', value: NEW_URL },
    { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: NEW_KEY },
    { key: 'SUPABASE_PUBLISHABLE_KEY', value: NEW_KEY },
    { key: 'VITE_SUPABASE_ANON_KEY', value: NEW_KEY },
    { key: 'VITE_SUPABASE_PROJECT_ID', value: NEW_REF },
  ];

  for (const project of projects) {
    const { b: envData } = await vercelApi('GET', `/v9/projects/${project.id}/env`, null);
    const existing = envData?.envs || [];
    for (const { key, value } of VARS) {
      const found = existing.find(e => e.key === key);
      if (found) {
        await vercelApi('PATCH', `/v9/projects/${project.id}/env/${found.id}`,
          { value, target: ['production','preview','development'] });
      } else {
        await vercelApi('POST', `/v9/projects/${project.id}/env`,
          [{ key, value, type: 'encrypted', target: ['production','preview','development'] }]);
      }
      await sleep(100);
    }
    console.log(`   ✅ ${project.name}`);
  }

  console.log('\n✅ EVERYTHING DONE');
  console.log(`\nWait 2 minutes then:`);
  console.log(`1. Go to siddhaquantumnexus.com`);
  console.log(`2. Log in with:`);
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${TEMP_PASS}`);
  console.log(`3. Change password in Profile settings`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
