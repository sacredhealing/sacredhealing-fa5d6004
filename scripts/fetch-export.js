const https = require('https');
const fs = require('fs');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const HOST = 'ssygukfdbtehvtndandn.supabase.co';
const FN = '/functions/v1/full-data-export';

// Hardcoded — skip the broken list endpoint entirely
const TABLES = [
  "profiles","memberships","orders","subscriptions","products","prices",
  "affiliate_links","affiliate_conversions","healing_sessions","quantum_frequencies",
  "frequency_purchases","user_frequencies","sacred_sites","virtual_pilgrimages",
  "pilgrimage_activations","scalar_sessions","akashic_codex","codex_entries",
  "codex_embeddings","akashic_transmissions","community_posts","community_comments",
  "community_groups","group_members","direct_messages","dm_threads","notifications",
  "video_calls","audio_tracks","audio_playlists","user_audio_history",
  "living_portraits","portrait_sessions","jyotish_charts","vedic_readings",
  "bhrigu_readings","ayurveda_profiles","dosha_assessments",
  "quantum_apothecary_sessions","shakti_cycle_logs","hormonal_alchemy_sessions",
  "social_tokens","social_posts","manychat_events","stripe_webhooks","payment_logs",
  "user_preferences","user_streaks","meditation_logs","practitioner_certifications",
  "siddha_transmissions"
];

function call(body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: HOST, path: FN, method: 'POST',
      headers: { 'Authorization': `Bearer ${KEY}`, 'apikey': KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.setTimeout(60000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`Fetching ${TABLES.length} tables from old Supabase...\n`);
  const allData = {};
  let grandTotal = 0;

  for (const table of TABLES) {
    process.stdout.write(`  ${table}: `);
    const rows = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const res = await call({ table, offset, limit: 500 });
      if (res.status !== 200) {
        process.stdout.write(`⚠️ skipped (${res.status})\n`);
        hasMore = false;
        break;
      }
      const parsed = JSON.parse(res.body);
      const batch = parsed.rows || [];
      rows.push(...batch);
      if (batch.length < 500) { hasMore = false; }
      else { offset += 500; await sleep(150); }
    }

    if (rows.length > 0) {
      console.log(`✅ ${rows.length} rows`);
      grandTotal += rows.length;
    } else {
      console.log(`○ empty`);
    }
    allData[table] = { count: rows.length, rows };
  }

  fs.writeFileSync('/tmp/export.json', JSON.stringify({ exported_at: new Date().toISOString(), tables: allData }));
  const mb = (fs.statSync('/tmp/export.json').size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Done: ${grandTotal} total rows, ${mb} MB export file`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
