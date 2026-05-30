const https = require('https');
const PAT = process.env.PAT;

function sql(q, cb) {
  const b = JSON.stringify({query:q});
  const r = https.request({
    hostname:'api.supabase.com',
    path:'/v1/projects/fjdzhrdpioxdeyyfogep/database/query',
    method:'POST',
    headers:{'Authorization':'Bearer '+PAT,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}
  }, function(res) {
    let d='';
    res.on('data',function(c){d+=c;});
    res.on('end',function(){cb(res.statusCode,d);});
  });
  r.on('error',function(e){cb(0,e.message);});
  r.write(b); r.end();
}

const queries = [
  "DROP POLICY IF EXISTS allow_write_own ON public.profiles",
  "CREATE POLICY allow_write_own ON public.profiles FOR ALL TO authenticated USING (auth.uid() = profiles.user_id OR auth.uid() = profiles.id) WITH CHECK (auth.uid() = profiles.user_id OR auth.uid() = profiles.id)",
  "UPDATE public.profiles SET membership_tier='akasha_infinity',subscription_tier='akasha_infinity',subscription_status='active',has_prana_flow_access=true,has_siddha_quantum_access=true,has_akasha_infinity_access=true WHERE full_name ILIKE ANY(ARRAY['%anette%','%margaretha%','%pia svanberg%'])",
  "UPDATE public.profiles SET membership_tier='siddha_quantum',subscription_tier='siddha_quantum',subscription_status='active',has_prana_flow_access=true,has_siddha_quantum_access=true,has_akasha_infinity_access=false WHERE full_name ILIKE '%julia%'",
  "UPDATE public.profiles SET membership_tier='prana_flow',subscription_tier='prana_flow',subscription_status='active',has_prana_flow_access=true,has_siddha_quantum_access=false,has_akasha_infinity_access=false WHERE full_name ILIKE ANY(ARRAY['%luna%','%tina%','%christina%','%monica mortensson%','%monica fransson%'])",
  "SELECT membership_tier, COUNT(*) as c FROM public.profiles GROUP BY membership_tier ORDER BY c DESC"
];

var i = 0;
function next() {
  if (i >= queries.length) { console.log('ALL DONE'); return; }
  var q = queries[i++];
  sql(q, function(s, d) {
    console.log(q.slice(0,50)+' -> '+s+' '+d.slice(0,80));
    next();
  });
}
next();
