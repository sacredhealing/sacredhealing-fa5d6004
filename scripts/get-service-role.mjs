import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

const result = await new Promise((resolve) => {
  const req = https.request({
    hostname: 'api.supabase.com',
    path: `/v1/projects/${NEW_REF}/api-keys`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PAT}` }
  }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ s: res.statusCode, b: d }));
  });
  req.setTimeout(15000, () => { req.destroy(); resolve({ s: 0 }); });
  req.on('error', () => resolve({ s: 0 }));
  req.end();
});

console.log('Status:', result.s);
console.log('Keys:', result.b);
