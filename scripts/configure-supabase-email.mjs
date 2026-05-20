import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';
const RESEND_KEY = 're_W3iSeEDi_2vHcGx2mNZizdVpZfbrZHjg6';

const payload = JSON.stringify({
  smtp_admin_email: 'noreply@mail.siddhaquantumnexus.com',
  smtp_host: 'smtp.resend.com',
  smtp_port: '465',
  smtp_user: 'resend',
  smtp_pass: RESEND_KEY,
  smtp_sender_name: 'Sacred Healing',
  enable_signup: true,
  mailer_autoconfirm: false,
  smtp_max_frequency: 60,
  site_url: 'https://siddhaquantumnexus.com',
  uri_allow_list: 'https://siddhaquantumnexus.com/**,https://*.vercel.app/**'
});

const result = await new Promise((resolve) => {
  const req = https.request({
    hostname: 'api.supabase.com',
    path: `/v1/projects/${NEW_REF}/config/auth`,
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ s: res.statusCode, b: d }));
  });
  req.setTimeout(15000, () => { req.destroy(); resolve({ s: 0 }); });
  req.on('error', () => resolve({ s: 0 }));
  req.write(payload); req.end();
});

console.log('Status:', result.s);
if (result.s === 200) {
  console.log('✅ Supabase email configured with Resend SMTP');
} else {
  console.log('Response:', result.b.slice(0, 300));
}
