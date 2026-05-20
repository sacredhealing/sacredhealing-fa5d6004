import https from 'https';

const RESEND_KEY = process.env.RESEND_API_KEY;
const SUPABASE_PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

if (!RESEND_KEY || !SUPABASE_PAT) { console.error('Missing env vars'); process.exit(1); }

function supabaseApi(path, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.supabase.com',
      path, method: body ? 'POST' : 'GET',
      headers: { 'Authorization': `Bearer ${SUPABASE_PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: data }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function sendEmail(to, subject, html) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ from: 'Shiva Siddhananda <hello@sacredhealingvibe.com>', to: [to], subject, html });
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const emailHtml = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050505;font-family:Georgia,serif;">
<div style="max-width:600px;margin:20px auto;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:16px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#1a1a1a,#050505);padding:40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.15);">
<h1 style="margin:0;color:#D4AF37;font-size:28px;font-weight:normal;letter-spacing:3px;">SACRED HEALING</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:12px;letter-spacing:2px;">SIDDHA QUANTUM INTELLIGENCE</p>
</div>
<div style="padding:40px 35px;">
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Dear Sacred Soul,</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">We have an important update. Sacred Healing has ascended to a new sovereign home:</p>
<div style="text-align:center;margin:30px 0;">
<a href="https://www.siddhaquantumnexus.com" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.5);border-radius:12px;padding:16px 32px;color:#D4AF37;text-decoration:none;font-size:20px;letter-spacing:1px;">www.siddhaquantumnexus.com</a>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Everything is still here — your account, membership, healing audios, meditations, mantras, and Vedic transmissions. Log in with your existing email and password.</p>
<div style="padding:16px;background:rgba(212,175,55,0.05);border-left:3px solid #D4AF37;border-radius:0 8px 8px 0;margin-bottom:20px;">
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0;">Please update your bookmarks. The old link will no longer work soon.</p>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:30px 0 0;">In sacred service,<br/><span style="color:#D4AF37;font-size:18px;">Shiva Siddhananda</span><br/><span style="color:rgba(255,255,255,0.35);font-size:12px;">Sacred Healing · Siddha Quantum Nexus</span></p>
</div>
<div style="background:#050505;padding:20px;text-align:center;border-top:1px solid rgba(212,175,55,0.1);">
<p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;">Sacred Healing · siddhaquantumnexus.com</p>
</div>
</div></body></html>`;

async function main() {
  // Get all auth users via Management API
  console.log('Fetching all auth users...');
  const { status, body } = await supabaseApi(
    `/v1/projects/${NEW_REF}/auth/users?page=1&per_page=1000`, null
  );
  
  console.log('Auth API status:', status);
  
  let users = [];
  if (status === 200 && body.users) {
    users = body.users.filter(u => u.email);
  } else {
    // Fallback: query profiles table
    console.log('Trying profiles table...');
    const res = await supabaseApi(`/v1/projects/${NEW_REF}/database/query`, { 
      query: "SELECT email FROM auth.users WHERE email IS NOT NULL AND deleted_at IS NULL" 
    });
    console.log('Profiles status:', res.status);
    if (res.status === 200 && Array.isArray(res.body)) {
      users = res.body;
    }
  }

  console.log(`Found ${users.length} users\n`);

  let sent = 0, failed = 0;

  for (const user of users) {
    const email = user.email;
    if (!email) continue;
    
    const result = await sendEmail(email, 'Sacred Healing has a new home ✨', emailHtml);
    if (result.status === 200 || result.status === 201) {
      console.log(`  ✅ ${email}`);
      sent++;
    } else {
      console.log(`  ⚠️ ${email}: ${result.body.toString().slice(0, 80)}`);
      failed++;
    }
    await sleep(250);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ DONE: ${sent} sent, ${failed} failed`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
