import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

// All secrets to configure in new Supabase
const SECRETS = [
  { name: 'GEMINI_API_KEY', value: process.env.S_GEMINI },
  { name: 'RESEND_API_KEY', value: process.env.S_RESEND },
  { name: 'STRIPE_SECRET_KEY', value: process.env.S_STRIPE_SECRET },
  { name: 'STRIPE_WEBHOOK_SECRET', value: process.env.S_STRIPE_WEBHOOK },
  { name: 'SITE_URL', value: 'https://siddhaquantumnexus.com' },
  { name: 'DAILY_API_KEY', value: process.env.S_DAILY },
  { name: 'TELEGRAM_BOT_TOKEN', value: process.env.S_TELEGRAM_BOT },
  { name: 'TELEGRAM_STARGATE_GROUP_ID', value: process.env.S_TELEGRAM_GROUP },
  { name: 'OPENAI_API_KEY', value: process.env.S_OPENAI },
  { name: 'YOUTUBE_API_KEY', value: process.env.S_YOUTUBE_API },
  { name: 'YOUTUBE_CLIENT_ID', value: process.env.S_YOUTUBE_CLIENT_ID },
  { name: 'YOUTUBE_CLIENT_SECRET', value: process.env.S_YOUTUBE_CLIENT_SECRET },
  { name: 'META_APP_ID', value: process.env.S_META_APP_ID },
  { name: 'META_APP_SECRET', value: process.env.S_META_APP_SECRET },
  { name: 'META_PAGE_ID', value: process.env.S_META_PAGE_ID },
  { name: 'META_PAGE_ACCESS_TOKEN', value: process.env.S_META_PAGE_TOKEN },
  { name: 'META_USER_ACCESS_TOKEN', value: process.env.S_META_USER_TOKEN },
  { name: 'META_KRITAGYA_PAGE_ID', value: process.env.S_META_KRITAGYA_PAGE },
  { name: 'BOT_WEBHOOK_SECRET', value: process.env.S_BOT_WEBHOOK },
  { name: 'AUDIO_WORKER_URL', value: process.env.S_AUDIO_WORKER_URL },
  { name: 'AUDIO_WORKER_API_KEY', value: process.env.S_AUDIO_WORKER_KEY },
  { name: 'RAPIDAPI_TRACK_ANALYSIS_KEY', value: process.env.S_RAPIDAPI_TRACK },
  { name: 'RAPIDAPI_NOISE_CANCELLER_KEY', value: process.env.S_RAPIDAPI_NOISE },
  { name: 'RAPIDAPI_LANDR_KEY', value: process.env.S_RAPIDAPI_LANDR },
  { name: 'RAPIDAPI_STEMSPLIT_KEY', value: process.env.S_RAPIDAPI_STEM },
  { name: 'SOLANA_TREASURY_PRIVATE_KEY', value: process.env.S_SOLANA },
  { name: 'SHC_TOKEN_MINT', value: process.env.S_SHC_MINT },
  { name: 'VITE_AI_BOT_API_URL', value: process.env.S_BOT_URL },
  { name: 'STRIPE_PRICE_SINGLE_999', value: process.env.S_STRIPE_PRICE_999 },
  { name: 'STRIPE_PRICE_MONTHLY_1499', value: process.env.S_STRIPE_PRICE_1499 },
  { name: 'STRIPE_PRICE_LIFETIME_149', value: process.env.S_STRIPE_PRICE_149 },
].filter(s => s.value); // Only set ones that have values

console.log(`Setting ${SECRETS.length} secrets in new Supabase...\n`);

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
  req.write(payload);
  req.end();
});

console.log(`Status: ${result.status}`);
if (result.status === 200 || result.status === 201) {
  console.log('✅ Secrets configured:');
  SECRETS.forEach(s => console.log(`  ✅ ${s.name}`));
} else {
  console.log('Response:', result.body.slice(0, 300));
}
