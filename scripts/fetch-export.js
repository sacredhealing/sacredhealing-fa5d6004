const https = require('https');
const fs = require('fs');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const URL = 'ssygukfdbtehvtndandn.supabase.co';
const PATH = '/functions/v1/full-data-export';

console.log('Calling full-data-export edge function...');

const req = https.request({ hostname: URL, path: PATH, method: 'GET',
  headers: { 'Authorization': `Bearer ${KEY}`, 'apikey': KEY }
}, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('Error response:', data.slice(0, 300));
      process.exit(1);
    }
    fs.writeFileSync('/tmp/export.json', data);
    const parsed = JSON.parse(data);
    const tables = parsed.tables || {};
    let totalRows = 0;
    Object.entries(tables).forEach(([name, info]) => {
      const count = info.count || 0;
      totalRows += count;
      if (count > 0) console.log(`  ✅ ${name}: ${count} rows`);
    });
    console.log(`\nTotal: ${Object.keys(tables).length} tables, ${totalRows} rows`);
    console.log('Export saved to /tmp/export.json');
  });
});
req.setTimeout(120000, () => { console.error('Timeout'); process.exit(1); });
req.on('error', e => { console.error('Error:', e.message); process.exit(1); });
req.end();
