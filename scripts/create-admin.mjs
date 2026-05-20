import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

function api(method, hostname, path, headers, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname, path, method,
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0 }); });
    req.on('error', () => resolve({ s: 0 }));
    if (payload) req.write(payload);
    req.end();
  });
}

// Step 1: Get service role key via Management API
console.log('Getting service role key...');
const keys = await api('GET', 'api.supabase.com', `/v1/projects/${NEW_REF}/api-keys`,
  { 'Authorization': `Bearer ${PAT}` }, null);

console.log('Keys status:', keys.s);
let serviceRoleKey = null;

if (keys.s === 200 && Array.isArray(keys.b)) {
  const srKey = keys.b.find(k => k.name === 'service_role');
  serviceRoleKey = srKey?.api_key;
  console.log('Found service role key:', serviceRoleKey ? '✅' : '❌');
} else {
  console.log('Keys response:', JSON.stringify(keys.b).slice(0, 200));
}

if (!serviceRoleKey) {
  console.log('Cannot get service role key - trying direct SQL insert...');
  
  // Fallback: use database query to create user via SQL
  const r = await api('POST', 'api.supabase.com', `/v1/projects/${NEW_REF}/database/query`,
    { 'Authorization': `Bearer ${PAT}` },
    { query: `SELECT auth.uid()` }
  );
  console.log('SQL test:', r.s, JSON.stringify(r.b).slice(0, 100));
  process.exit(1);
}

// Step 2: Create user via GoTrue admin API
console.log('\nCreating admin user...');
const create = await api('POST', `${NEW_REF}.supabase.co`, '/auth/v1/admin/users',
  { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
  {
    email: 'sacredhealingvibe@gmail.com',
    password: 'SiddhaQuantum2050!',
    email_confirm: true,
    user_metadata: { full_name: 'Kritagya Das' }
  }
);

console.log('Create status:', create.s);
if (create.s === 200 || create.s === 201) {
  console.log('✅ Admin account created!');
  console.log('Email: sacredhealingvibe@gmail.com');
  console.log('Password: SiddhaQuantum2050!');
} else {
  console.log(JSON.stringify(create.b).slice(0, 300));
}
