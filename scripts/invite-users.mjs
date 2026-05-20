import https from 'https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const NEW_REF = 'fjdzhrdpioxdeyyfogep';

function api(method, path, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.supabase.com', path, method,
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ s: 0, b: '' }); });
    req.on('error', () => resolve({ s: 0, b: '' }));
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Get all emails from email_list table
  console.log('Fetching emails from new Supabase email_list...');
  const res = await api('POST', `/v1/projects/${NEW_REF}/database/query`, {
    query: "SELECT email FROM public.email_list WHERE subscribed = true ORDER BY email"
  });
  
  console.log(`DB status: ${res.s}`);
  const rows = Array.isArray(res.b) ? res.b : [];
  console.log(`Found ${rows.length} emails\n`);

  let created = 0, exists = 0, failed = 0;

  for (const { email } of rows) {
    process.stdout.write(`  ${email}... `);
    
    // Create/invite user in new Supabase auth
    const r = await api('POST', `/v1/projects/${NEW_REF}/auth/users`, {
      email,
      email_confirm: true,
      send_invite: true  // sends magic link email to set password
    });

    if (r.s === 200 || r.s === 201) {
      console.log('✅ invited');
      created++;
    } else if (r.s === 422 || (typeof r.b === 'object' && r.b?.msg?.includes('already'))) {
      console.log('○ already exists');
      exists++;
    } else {
      console.log(`⚠️  ${r.s}: ${JSON.stringify(r.b).slice(0, 80)}`);
      failed++;
    }
    await sleep(300);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Invited: ${created} | Already existed: ${exists} | Failed: ${failed}`);
  console.log('Users will receive an email to set their password on siddhaquantumnexus.com');
}

main().catch(e => { console.error(e.message); process.exit(1); });
