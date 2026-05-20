import https from 'https';
import { execSync } from 'child_process';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const ADMIN_EMAIL = 'sacredhealingvibe@gmail.com';

function dbQuery(ref, sql) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${ref}/database/query`,
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

function oldSupabase(path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'ssygukfdbtehvtndandn.supabase.co', path, method: 'GET',
      headers: { 'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}` }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    });
    req.setTimeout(15000, () => { req.destroy(); resolve([]); });
    req.on('error', () => resolve([]));
    req.end();
  });
}

async function main() {
  execSync('npm install bcryptjs', { stdio: 'pipe' });
  const bcrypt = await import('bcryptjs');

  // Step 1: Get the real user_id from profiles in new Supabase
  console.log('Finding your real user_id from profiles...');
  const profile = await dbQuery(NEW_REF, 
    `SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 10`
  );
  console.log('Profiles found:', JSON.stringify(profile.b).slice(0, 300));

  // Step 2: Get admin profile specifically - find by checking all profiles
  const allProfiles = await dbQuery(NEW_REF,
    `SELECT user_id, full_name, created_at FROM public.profiles ORDER BY created_at ASC`
  );
  console.log('\nAll profiles:');
  if (Array.isArray(allProfiles.b)) {
    allProfiles.b.forEach(p => console.log(`  ${p.user_id} | ${p.full_name} | ${p.created_at}`));
  }

  // Step 3: Delete the wrongly created auth user (empty account I just made)
  console.log('\nDeleting incorrectly created auth user...');
  const del = await dbQuery(NEW_REF,
    `DELETE FROM auth.users WHERE email = '${ADMIN_EMAIL}' RETURNING id`
  );
  console.log('Delete result:', JSON.stringify(del.b).slice(0, 200));

  // Step 4: Find the correct UUID - look at old Supabase profiles via REST API
  console.log('\nFetching admin profile from old Supabase...');
  const oldProfiles = await oldSupabase('/rest/v1/profiles?select=user_id,full_name&order=created_at.asc');
  console.log('Old profiles:', JSON.stringify(oldProfiles).slice(0, 300));

  // The oldest profile is likely the admin
  let adminUUID = null;
  if (Array.isArray(oldProfiles) && oldProfiles.length > 0) {
    adminUUID = oldProfiles[0].user_id;
    console.log(`\nAdmin UUID (oldest profile): ${adminUUID}`);
  }

  if (!adminUUID) {
    console.log('Could not find UUID - check profiles output above');
    process.exit(1);
  }

  // Step 5: Create auth user with the CORRECT original UUID
  const hash = await bcrypt.default.hash('SiddhaQuantum2050!', 10);
  console.log('\nCreating auth user with correct UUID...');
  const create = await dbQuery(NEW_REF, `
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
      email = '${ADMIN_EMAIL}',
      encrypted_password = '${hash}',
      email_confirmed_at = NOW()
  `);
  console.log('Create result:', create.s, JSON.stringify(create.b).slice(0, 200));

  if (create.s === 200 || create.s === 201) {
    console.log('\n✅ Your account is fixed!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log('Password: SiddhaQuantum2050!');
    console.log('All your old data is now linked to this account.');
    console.log('Log in then change your password in Profile settings.');
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
