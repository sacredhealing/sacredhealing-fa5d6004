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

// Get service role key
console.log('Getting service role key...');
const keys = await api('GET', 'api.supabase.com', `/v1/projects/${NEW_REF}/api-keys`,
  { 'Authorization': `Bearer ${PAT}` }, null);
console.log('Keys status:', keys.s);

let serviceRoleKey = null;
if (keys.s === 200 && Array.isArray(keys.b)) {
  serviceRoleKey = keys.b.find(k => k.name === 'service_role')?.api_key;
}
if (!serviceRoleKey) { console.log('Failed:', JSON.stringify(keys.b)); process.exit(1); }
console.log('Got service role key ✅');

// Set Site URL
console.log('\nSetting Site URL...');
const siteUrl = await api('PATCH', 'api.supabase.com', `/v1/projects/${NEW_REF}/config/auth`,
  { 'Authorization': `Bearer ${PAT}` },
  { site_url: 'https://siddhaquantumnexus.com', uri_allow_list: 'https://siddhaquantumnexus.com/**,https://*.vercel.app/**' }
);
console.log('Site URL set:', siteUrl.s === 200 ? '✅' : siteUrl.s);

// Create both users
const users = [
  { email: 'sacredhealingvibe@gmail.com', name: 'Kritagya Das', password: 'SiddhaQuantum2050!' },
  { email: 'laila.amrouche@gmail.com',    name: 'Laila Amrouche', password: 'SiddhaQuantum2050!' },
];

for (const user of users) {
  console.log(`\nCreating: ${user.email}`);
  const r = await api('POST', `${NEW_REF}.supabase.co`, '/auth/v1/admin/users',
    { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
    { email: user.email, password: user.password, email_confirm: true, user_metadata: { full_name: user.name } }
  );
  if (r.s === 200 || r.s === 201) {
    console.log(`✅ Created ${user.email}`);
  } else if (JSON.stringify(r.b).includes('already')) {
    console.log(`⚠️ ${user.email} already exists — skipping`);
  } else {
    console.log(`❌ Error:`, JSON.stringify(r.b).slice(0, 200));
  }
}

console.log('\n✅ DONE. Login with password: SiddhaQuantum2050!');
