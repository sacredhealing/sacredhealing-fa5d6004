const https = require('https');
const fs = require('fs');
const PAT = process.env.PAT;

function query(q, cb) {
  const b = JSON.stringify({query: q});
  const r = https.request({
    hostname: 'api.supabase.com',
    path: '/v1/projects/fjdzhrdpioxdeyyfogep/database/query',
    method: 'POST',
    headers: {'Authorization':'Bearer '+PAT,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}
  }, function(res) {
    let d='';
    res.on('data',c=>d+=c);
    res.on('end',()=>cb(res.statusCode,d));
  });
  r.on('error',e=>cb(0,e.message));
  r.write(b);r.end();
}

query(`SELECT tier_required, phase, COUNT(*) as cnt FROM public.ayurveda_courses GROUP BY tier_required, phase ORDER BY phase, tier_required`, (status, data) => {
  const result = {status, data: JSON.parse(data), timestamp: new Date().toISOString()};
  fs.writeFileSync('academy-verify.json', JSON.stringify(result, null, 2));
  console.log('HTTP:', status);
  console.log(data);
});
