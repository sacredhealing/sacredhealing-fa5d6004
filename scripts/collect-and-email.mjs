import https from 'https';

const RESEND_KEY = process.env.RESEND_API_KEY;
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const OLD_HOST = 'ssygukfdbtehvtndandn.supabase.co';

function callOldFn(body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: OLD_HOST, path: '/functions/v1/full-data-export', method: 'POST',
      headers: { 'Authorization': `Bearer ${OLD_KEY}`, 'apikey': OLD_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: 0, body: {} }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, body: {} }); });
    req.on('error', () => resolve({ status: 0, body: {} }));
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

    const body = JSON.stringify({ from: 'Shiva Siddhananda <noreply@siddhaquantumnexus.com>', to: [to], subject: 'Sacred Healing has a new home ✨', html });
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { console.log(`  ${res.statusCode === 200 || res.statusCode === 201 ? '✅' : '⚠️ '} ${to} (${res.statusCode})`); resolve(res.statusCode); });
    });
    req.setTimeout(15000, () => { req.destroy(); resolve(0); });
    req.on('error', () => resolve(0));
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function isEmail(s) { return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

async function main() {
  console.log('Fetching email_subscribers from old Supabase...');
  const res = await callOldFn({ table: 'email_subscribers', offset: 0, limit: 1000 });
  
  if (res.status !== 200 || !res.body.rows) {
    console.error('Failed to fetch:', res.status);
    process.exit(1);
  }

  const emails = new Set();
  res.body.rows.forEach(row => {
    Object.values(row).forEach(v => { if (isEmail(v)) emails.add(v.toLowerCase()); });
  });

  console.log(`Found ${emails.size} emails\n`);
  console.log('Sending migration emails...\n');

  let sent = 0, failed = 0;
  for (const email of emails) {
    const status = await sendEmail(email);
    if (status === 200 || status === 201) sent++; else failed++;
    await sleep(300);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ DONE: ${sent} sent, ${failed} failed out of ${emails.size} total`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
