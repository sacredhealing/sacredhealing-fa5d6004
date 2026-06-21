#!/usr/bin/env node
// One-shot: deploy shreem-live-executor from Hetzner
// Run: GH_TOKEN=xxx node scripts/deploy_now.js
const https = require('https');

const PAT = process.env.SUPABASE_PAT || 'sbp_102e689504a6e8b6e2e8df3e36a7699a7d94d744';
const REF = 'ssygukfdbtehvtndandn';
const GH_TOKEN = process.env.GH_TOKEN;

if (!GH_TOKEN) { console.error('Set GH_TOKEN env var'); process.exit(1); }

function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  console.log('Fetching executor from GitHub...');
  const metaR = await req({ hostname:'api.github.com', path:'/repos/sacredhealing/sacredhealing-fa5d6004/contents/supabase/functions/shreem-live-executor/index.ts', headers:{'Authorization':`token ${GH_TOKEN}`,'User-Agent':'deploy'} });
  const meta = JSON.parse(metaR.body);
  const blobR = await req({ hostname:'api.github.com', path:`/repos/sacredhealing/sacredhealing-fa5d6004/git/blobs/${meta.sha}`, headers:{'Authorization':`token ${GH_TOKEN}`,'User-Agent':'deploy'} });
  const code = Buffer.from(JSON.parse(blobR.body).content, 'base64').toString('utf-8');
  console.log(`Code: ${code.length} chars | MAX_POSITIONS=${code.match(/MAX_POSITIONS\s*=\s*(\d+)/)?.[1]} | MIN_SIGNAL=${code.match(/MIN_SIGNAL_SOL\s*=\s*([\d.]+)/)?.[1]}`);
  
  const body = JSON.stringify({ verify_jwt: false, body: code });
  const deployR = await req({ hostname:'api.supabase.com', path:`/v1/projects/${REF}/functions/shreem-live-executor`, method:'PATCH', headers:{'Authorization':`Bearer ${PAT}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  console.log(`Deploy: HTTP ${deployR.status}`);
  const result = JSON.parse(deployR.body);
  if (result.id || deployR.status === 200) {
    console.log('✅ Deployed:', result.slug || result.id);
    setTimeout(async () => {
      const h = await req({hostname:'ssygukfdbtehvtndandn.supabase.co', path:'/functions/v1/shreem-live-executor/health'});
      const health = JSON.parse(h.body);
      console.log('Verified limits:', JSON.stringify(health.limits));
      process.exit(0);
    }, 10000);
  } else {
    console.log('❌ Failed:', JSON.stringify(result));
    process.exit(1);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
