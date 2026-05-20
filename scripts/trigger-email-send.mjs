import https from 'https';

const KEY = process.env.SUPABASE_TOKEN;
const HOST = 'fjdzhrdpioxdeyyfogep.supabase.co';

const SUBJECT = 'Sacred Healing has a new home ✨';
const HTML = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050505;font-family:Georgia,serif;">
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
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0;">Please update your bookmarks. The old link will stop working soon.</p>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:30px 0 0;">In sacred service,<br/><span style="color:#D4AF37;font-size:18px;">Shiva Siddhananda</span></p>
</div></div></body></html>`;

const body = JSON.stringify({ subject: SUBJECT, html: HTML });

const req = https.request({
  hostname: HOST, path: '/functions/v1/send-email-list', method: 'POST',
  headers: { 'Authorization': `Bearer ${KEY}`, 'apikey': KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, (res) => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => console.log(`Status: ${res.statusCode}\nResponse: ${d}`));
});
req.setTimeout(300000, () => { req.destroy(); console.log('timeout'); });
req.on('error', e => console.error(e.message));
req.write(body); req.end();
