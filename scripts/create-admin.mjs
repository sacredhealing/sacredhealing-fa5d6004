import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

function api(method, path, body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.supabase.com', path, method,
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0 }); });
    req.on('error', () => resolve({ s: 0 }));
    req.write(payload); req.end();
  });
}

const r = await api('POST', `/v1/projects/${NEW_REF}/auth/users`, {
  email: 'sacredhealingvibe@gmail.com',
  password: 'SiddhaQuantum2050!',
  email_confirm: true,
  user_metadata: { full_name: 'Kritagya Das', role: 'admin' }
});

console.log('Status:', r.s);
if (r.s === 200 || r.s === 201) {
  console.log('✅ Admin created! Login with:');
  console.log('Email: sacredhealingvibe@gmail.com');
  console.log('Password: SiddhaQuantum2050!');
} else {
  console.log(JSON.stringify(r.b).slice(0, 300));
}
