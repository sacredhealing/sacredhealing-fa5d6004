import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

const SECRETS = [
  { name: 'GEMINI_API_KEY', value: process.env.S_GEMINI },
  { name: 'RESEND_API_KEY', value: process.env.S_RESEND },
  { name: 'STRIPE_WEBHOOK_SECRET', value: process.env.S_STRIPE_WEBHOOK },
  { name: 'STRIPE_SECRET_KEY', value: process.env.S_STRIPE_SECRET },
  { name: 'SITE_URL', value: 'https://siddhaquantumnexus.com' },
  { name: 'EMAIL_FROM', value: 'Shiva Siddhananda <noreply@siddhaquantumnexus.com>' },
].filter(s => s.value);

console.log(`Setting ${SECRETS.length} secrets...\n`);
const payload = JSON.stringify(SECRETS);
const result = await new Promise((resolve) => {
  const req = https.request({
    hostname: 'api.supabase.com',
    path: `/v1/projects/${NEW_REF}/secrets`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ status: res.statusCode, body: d }));
  });
  req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0 }); });
  req.on('error', () => resolve({ status: 0 }));
  req.write(payload); req.end();
});

if (result.status === 200 || result.status === 201) {
  SECRETS.forEach(s => console.log(`  ✅ ${s.name}`));
  console.log('\n✅ All secrets set in new Supabase');
} else {
  console.log(`Status: ${result.status} — ${result.body.slice(0, 200)}`);
}
