const https = require('https');
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

query(`SELECT tier_required, COUNT(*) as cnt FROM public.ayurveda_courses GROUP BY tier_required ORDER BY tier_required`, (status, data) => {
  console.log('HTTP:', status);
  console.log('Result:', data);
  process.exit(status >= 200 && status < 300 ? 0 : 1);
});
