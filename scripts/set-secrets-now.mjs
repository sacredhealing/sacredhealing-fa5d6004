import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

const SECRETS = [
  { name: 'GEMINI_API_KEY', value: 'AIzaSyAceP9hWMpkuhG-8PMbOUZNrHnocVLx7jo' },
  { name: 'RESEND_API_KEY', value: 're_W3iSeEDi_2vHcGx2mNZizdVpZfbrZHjg6' },
  { name: 'STRIPE_WEBHOOK_SECRET', value: 'whsec_JklrGi47cNryFUqHmZMX2IcnclLvasoq' },
  { name: 'SITE_URL', value: 'https://siddhaquantumnexus.com' },
  { name: 'EMAIL_FROM', value: 'Shiva Siddhananda <noreply@siddhaquantumnexus.com>' },
];

console.log(`Setting ${SECRETS.length} secrets in new Supabase...\n`);

const payload = JSON.stringify(SECRETS);
const result = await new Promise((resolve) => {
  const req = https.request({
    hostname: 'api.supabase.com',
    path: `/v1/projects/${NEW_REF}/secrets`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ status: res.statusCode, body: d }));
  });
  req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0 }); });
  req.on('error', () => resolve({ status: 0 }));
  req.write(payload);
  req.end();
});

if (result.status === 200 || result.status === 201) {
  console.log('✅ Secrets set successfully:');
  SECRETS.forEach(s => console.log(`  ✅ ${s.name}`));
} else {
  console.log(`Status: ${result.status}`);
  console.log(result.body.slice(0, 300));
}
