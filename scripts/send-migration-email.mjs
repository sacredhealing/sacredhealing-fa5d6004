import { createRequire } from 'module';
import https from 'https';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MDMxMDMsImV4cCI6MjA2MzE3OTEwM30.placeholder';

// Use NEW Supabase edge function URL
const HOST = 'fjdzhrdpioxdeyyfogep.supabase.co';
const PATH = '/functions/v1/send-bulk-email';

const subject = 'Sacred Healing has a new home ✨';

const plainText = `Dear Sacred Soul,

We have an important update for you.

Sacred Healing has moved to a new, sovereign home:

www.siddhaquantumnexus.com

Everything you love is still here — your account, your membership, all your healing audios, meditations, mantras, and Vedic transmissions.

Simply visit www.siddhaquantumnexus.com and log in with your existing email and password. Everything is exactly as you left it.

Please update your bookmarks. The old link (sacredhealing.lovable.app) will no longer work soon.

Your spiritual journey continues — now on a stronger, more sovereign foundation.

In sacred service,
Shiva Siddhananda
Sacred Healing · Siddha Quantum Nexus`;

function callFunction(authToken) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ subject, plainText });
    const req = https.request({
      hostname: HOST, path: PATH, method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'apikey': authToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.setTimeout(60000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

const token = process.env.SUPABASE_TOKEN;
if (!token) { console.error('Missing SUPABASE_TOKEN'); process.exit(1); }

console.log('Sending migration announcement to all subscribers...');
const result = await callFunction(token);
if (result.status === 200) {
  console.log('✅ Email sent successfully');
} else {
  console.log('⚠️ Check response above');
}
