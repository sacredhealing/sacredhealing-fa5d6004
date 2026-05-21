import https from 'https';

// Try all available PATs
const PATS = [
  process.env.SUPABASE_ACCESS_TOKEN,
  process.env.SUPABASE_PAT,
  process.env.SUPABASE_TOKEN,
].filter(Boolean);

const OLD_REF = 'ssygukfdbtehvtndandn';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

const SECRETS = [
  { name: 'GEMINI_API_KEY', value: process.env.S_GEMINI },
  { name: 'RESEND_API_KEY', value: process.env.S_RESEND },
  { name: 'STRIPE_WEBHOOK_SECRET', value: process.env.S_STRIPE_WEBHOOK },
  { name: 'STRIPE_SECRET_KEY', value: process.env.S_STRIPE_SECRET },
  { name: 'SITE_URL', value: 'https://siddhaquantumnexus.com' },
  { name: 'EMAIL_FROM', value: 'Shiva Siddhananda <noreply@siddhaquantumnexus.com>' },
].filter(s => s.value);

console.log(`Setting ${SECRETS.length} secrets to BOTH Supabase projects...\n`);

async function setSecrets(ref, pat) {
  const payload = JSON.stringify(SECRETS);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${ref}/secrets`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 200) }));
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0 }); });
    req.on('error', () => resolve({ status: 0 }));
    req.write(payload); req.end();
  });
}

for (const ref of [OLD_REF, NEW_REF]) {
  console.log(`\n=== Project: ${ref} ===`);
  let success = false;
  for (const pat of PATS) {
    const result = await setSecrets(ref, pat);
    console.log(`  PAT[${pat.slice(0,8)}...] → HTTP ${result.status}`);
    if (result.status === 200 || result.status === 201) {
      SECRETS.forEach(s => console.log(`  ✅ ${s.name}`));
      success = true;
      break;
    } else {
      console.log(`  ⚠️  ${result.body}`);
    }
  }
  if (!success) console.log(`  ❌ Could not set secrets for ${ref}`);
}
console.log('\n✅ Done');
