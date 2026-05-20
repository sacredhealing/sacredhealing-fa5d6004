import https from 'https';

const KEY = process.env.SUPABASE_TOKEN;
const HOST = 'fjdzhrdpioxdeyyfogep.supabase.co';
const PATH = '/functions/v1/migration-email';

if (!KEY) { console.error('Missing SUPABASE_TOKEN'); process.exit(1); }

const result = await new Promise((resolve) => {
  const body = '{}';
  const req = https.request({
    hostname: HOST, path: PATH, method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'apikey': KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  req.setTimeout(120000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
  req.on('error', e => resolve({ status: 0, body: e.message }));
  req.write(body);
  req.end();
});

console.log('Status:', result.status);
console.log('Response:', result.body);
