import https from 'https';

const RESEND_KEY = process.env.RESEND_API_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (!RESEND_KEY || !STRIPE_KEY) { console.error('Missing RESEND_API_KEY or STRIPE_SECRET_KEY'); process.exit(1); }

function stripeGet(path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.stripe.com', path, method: 'GET',
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
    });
    req.setTimeout(15000, () => { req.destroy(); resolve({}); });
    req.on('error', e => resolve({}));
    req.end();
  });
}

function sendEmail(to, name, subject, html) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ from: 'Shiva Siddhananda <hello@sacredhealingvibe.com>', to: [to], subject, html });
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0 }); });
    req.on('error', e => resolve({ status: 0 }));
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const emailHtml = (name) => `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050505;font-family:Georgia,serif;">
<div style="max-width:600px;margin:20px auto;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:16px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#1a1a1a,#050505);padding:40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.15);">
<h1 style="margin:0;color:#D4AF37;font-size:28px;font-weight:normal;letter-spacing:3px;">SACRED HEALING</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:12px;letter-spacing:2px;">SIDDHA QUANTUM INTELLIGENCE</p>
</div>
<div style="padding:40px 35px;">
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Dear ${name || 'Sacred Soul'},</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">We have an important update. Sacred Healing has ascended to a new sovereign home:</p>
<div style="text-align:center;margin:30px 0;">
<a href="https://www.siddhaquantumnexus.com" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.5);border-radius:12px;padding:16px 32px;color:#D4AF37;text-decoration:none;font-size:20px;letter-spacing:1px;">www.siddhaquantumnexus.com</a>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Everything is still here — your account, membership, healing audios, meditations, mantras, and Vedic transmissions. Log in with your existing email and password.</p>
<div style="padding:16px;background:rgba(212,175,55,0.05);border-left:3px solid #D4AF37;border-radius:0 8px 8px 0;margin-bottom:20px;">
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0;">⚠️ Please update your bookmarks. The old link will no longer work soon.</p>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:30px 0 0;">In sacred service,<br/><span style="color:#D4AF37;font-size:18px;">Shiva Siddhananda</span><br/><span style="color:rgba(255,255,255,0.35);font-size:12px;">Sacred Healing · Siddha Quantum Nexus</span></p>
</div>
<div style="background:#050505;padding:20px;text-align:center;border-top:1px solid rgba(212,175,55,0.1);">
<p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;">Sacred Healing · siddhaquantumnexus.com</p>
</div>
</div></body></html>`;

async function main() {
  console.log('Fetching all customers from Stripe...');

  // Get all Stripe customers with pagination
  const emails = new Map(); // email -> name
  let startingAfter = null;
  let page = 0;

  while (true) {
    const path = `/v1/customers?limit=100${startingAfter ? `&starting_after=${startingAfter}` : ''}`;
    const data = await stripeGet(path);

    if (!data.data?.length) break;
    data.data.forEach(c => {
      if (c.email) emails.set(c.email, c.name || '');
    });

    console.log(`  Page ${++page}: ${data.data.length} customers (total so far: ${emails.size})`);
    if (!data.has_more) break;
    startingAfter = data.data[data.data.length - 1].id;
    await sleep(200);
  }

  console.log(`\nFound ${emails.size} unique customer emails\n`);

  let sent = 0, failed = 0;
  for (const [email, name] of emails) {
    const result = await sendEmail(email, name, 'Sacred Healing has a new home ✨', emailHtml(name));
    if (result.status === 200 || result.status === 201) {
      console.log(`  ✅ ${email}`);
      sent++;
    } else {
      console.log(`  ⚠️  ${email}: status ${result.status}`);
      failed++;
    }
    await sleep(250);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ DONE: ${sent} sent, ${failed} failed`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
