import https from 'https';

const RESEND_KEY = process.env.RESEND_API_KEY;
const SUPABASE_PAT = process.env.SUPABASE_ACCESS_TOKEN;
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const OLD_HOST = 'ssygukfdbtehvtndandn.supabase.co';
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

const TABLES = [
  "profiles","memberships","orders","subscriptions","products",
  "affiliate_links","affiliate_conversions","healing_sessions",
  "quantum_frequencies","frequency_purchases","user_frequencies",
  "community_posts","community_comments","direct_messages",
  "audio_tracks","jyotish_charts","vedic_readings","bhrigu_readings",
  "ayurveda_profiles","dosha_assessments","quantum_apothecary_sessions",
  "social_tokens","social_posts","stripe_webhooks","payment_logs",
  "user_preferences","user_streaks","meditation_logs",
  "email_subscribers","practitioner_certifications"
];

function callOldFn(body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: OLD_HOST,
      path: '/functions/v1/full-data-export',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OLD_KEY}`, 'apikey': OLD_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: {} }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, body: {} }); });
    req.on('error', e => resolve({ status: 0, body: {} }));
    req.write(payload);
    req.end();
  });
}

function dbQuery(sql) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${NEW_REF}/database/query`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SUPABASE_PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: [] }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, body: [] }); });
    req.on('error', e => resolve({ status: 0, body: [] }));
    req.write(payload);
    req.end();
  });
}

function sendEmail(to) {
  return new Promise((resolve) => {
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050505;font-family:Georgia,serif;">
<div style="max-width:600px;margin:20px auto;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:16px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#1a1a1a,#050505);padding:40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.15);">
<h1 style="margin:0;color:#D4AF37;font-size:28px;font-weight:normal;letter-spacing:3px;">SACRED HEALING</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:12px;letter-spacing:2px;">SIDDHA QUANTUM INTELLIGENCE</p>
</div>
<div style="padding:40px 35px;">
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Dear Sacred Soul,</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Sacred Healing has moved to a new sovereign home:</p>
<div style="text-align:center;margin:30px 0;">
<a href="https://www.siddhaquantumnexus.com" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.5);border-radius:12px;padding:16px 32px;color:#D4AF37;text-decoration:none;font-size:20px;letter-spacing:1px;">www.siddhaquantumnexus.com</a>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Log in with your existing email and password — everything is exactly as you left it.</p>
<div style="padding:16px;background:rgba(212,175,55,0.05);border-left:3px solid #D4AF37;border-radius:0 8px 8px 0;margin-bottom:20px;">
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0;">⚠️ Please update your bookmarks. The old link will stop working soon.</p>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:30px 0 0;">In sacred service,<br/><span style="color:#D4AF37;font-size:18px;">Shiva Siddhananda</span></p>
</div></div></body></html>`;

    const body = JSON.stringify({ from: 'Shiva Siddhananda <hello@sacredhealingvibe.com>', to: [to], subject: 'Sacred Healing has a new home ✨', html });
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(res.statusCode));
    });
    req.setTimeout(15000, () => { req.destroy(); resolve(0); });
    req.on('error', () => resolve(0));
    req.write(body);
    req.end();
  });
}

function isEmail(str) {
  return typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const emails = new Set();

  console.log('=== Step 1: Scanning all tables for email addresses ===\n');

  for (const table of TABLES) {
    process.stdout.write(`  Scanning ${table}... `);
    const res = await callOldFn({ table, offset: 0, limit: 500 });
    if (res.status === 200 && res.body.rows?.length > 0) {
      const rows = res.body.rows;
      let found = 0;
      rows.forEach(row => {
        Object.values(row).forEach(val => {
          if (isEmail(val)) { emails.add(val.toLowerCase()); found++; }
        });
      });
      console.log(`${rows.length} rows, ${found} emails found`);
    } else {
      console.log(`empty/skip`);
    }
    await sleep(150);
  }

  console.log(`\n✅ Total unique emails found: ${emails.size}`);
  console.log([...emails].join('\n'));

  if (emails.size === 0) {
    console.log('\nNo emails found in public tables. Emails are in auth.users only.');
    process.exit(0);
  }

  // Step 2: Create email_list table in new Supabase and insert
  console.log('\n=== Step 2: Saving to new Supabase email_list table ===\n');

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS public.email_list (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'migration',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const values = [...emails].map(e => `('${e}', 'migration')`).join(', ');
  const insertRes = await dbQuery(`INSERT INTO public.email_list (email, source) VALUES ${values} ON CONFLICT DO NOTHING`);
  console.log(`Inserted ${emails.size} emails into email_list table (status: ${insertRes.status})`);

  // Step 3: Send emails
  console.log('\n=== Step 3: Sending migration emails ===\n');
  let sent = 0, failed = 0;

  for (const email of emails) {
    const status = await sendEmail(email);
    if (status === 200 || status === 201) {
      console.log(`  ✅ ${email}`);
      sent++;
    } else {
      console.log(`  ⚠️  ${email} (status: ${status})`);
      failed++;
    }
    await sleep(300);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ COMPLETE: ${sent} emails sent, ${failed} failed`);
  console.log(`📊 email_list table populated with ${emails.size} addresses`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
