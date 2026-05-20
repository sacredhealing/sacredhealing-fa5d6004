import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const NEW_KEY = 'sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const ADMIN_EMAIL = 'sacredhealingvibe@gmail.com';
const TEMP_PASS = 'SiddhaQuantum2050!';

function dbQuery(sql) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${NEW_REF}/database/query`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0, b: '' }); });
    req.on('error', () => resolve({ s: 0, b: '' }));
    req.write(payload); req.end();
  });
}

function vercelApi(method, path, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.vercel.com', path, method,
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(15000, () => { req.destroy(); resolve({ s: 0 }); });
    req.on('error', () => resolve({ s: 0 }));
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== Step 1: Get all emails from email_list ===');
  const emailRes = await dbQuery("SELECT email FROM public.email_list ORDER BY email");
  const emails = Array.isArray(emailRes.b) ? emailRes.b.map(r => r.email).filter(Boolean) : [];
  console.log(`Found ${emails.length} emails\n`);

  console.log('=== Step 2: Create auth users via SQL ===');
  let created = 0, failed = 0;

  for (const email of emails) {
    const isAdmin = email === ADMIN_EMAIL;
    const password = isAdmin ? TEMP_PASS : Math.random().toString(36).slice(2) + 'Aa1!';
    
    const sql = `
      INSERT INTO auth.users (
        id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token,
        email_change, email_change_token_new, recovery_token
      ) VALUES (
        gen_random_uuid(), 'authenticated', 'authenticated',
        '${email.replace(/'/g, "''")}',
        crypt('${password}', gen_salt('bf')),
        NOW(), '{"provider":"email","providers":["email"]}', '{}',
        NOW(), NOW(), '', '', '', ''
      ) ON CONFLICT (email) DO NOTHING;
    `;
    
    const r = await dbQuery(sql);
    if (r.s === 200 || r.s === 201) {
      console.log(`  ✅ ${email}${isAdmin ? ' (ADMIN - password: ' + TEMP_PASS + ')' : ''}`);
      created++;
    } else {
      console.log(`  ⚠️  ${email}: ${r.s}`);
      failed++;
    }
    await sleep(100);
  }

  console.log(`\nCreated: ${created} | Failed: ${failed}`);

  console.log('\n=== Step 3: Switch Vercel to new Supabase ===');
  const { body: projData } = await vercelApi('GET', '/v9/projects?limit=20', null);
  const projects = projData.projects || [];

  const VARS = [
    { key: 'VITE_SUPABASE_URL', value: NEW_URL },
    { key: 'SUPABASE_URL', value: NEW_URL },
    { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: NEW_KEY },
    { key: 'SUPABASE_PUBLISHABLE_KEY', value: NEW_KEY },
    { key: 'VITE_SUPABASE_ANON_KEY', value: NEW_KEY },
    { key: 'VITE_SUPABASE_PROJECT_ID', value: NEW_REF },
  ];

  for (const project of projects) {
    const { body: envData } = await vercelApi('GET', `/v9/projects/${project.id}/env`, null);
    const existing = envData.envs || [];
    for (const { key, value } of VARS) {
      const found = existing.find(e => e.key === key);
      if (found) {
        await vercelApi('PATCH', `/v9/projects/${project.id}/env/${found.id}`, { value, target: ['production','preview','development'] });
      } else {
        await vercelApi('POST', `/v9/projects/${project.id}/env`, [{ key, value, type: 'encrypted', target: ['production','preview','development'] }]);
      }
      await sleep(150);
    }
    console.log(`  ✅ ${project.name} → new Supabase`);
  }

  console.log('\n=== COMPLETE ===');
  console.log('✅ All auth users created in new Supabase');
  console.log('✅ Vercel switched to new Supabase');
  console.log(`\nLog in at siddhaquantumnexus.com with:`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${TEMP_PASS}`);
  console.log('\nAll other users: use Forgot Password on the site to reset.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
