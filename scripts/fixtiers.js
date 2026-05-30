const https = require('https');
const PAT = process.env.PAT;
const REF = 'fjdzhrdpioxdeyyfogep';

function sql(q) {
  return new Promise(res => {
    const b = JSON.stringify({query:q});
    const r = https.request({hostname:'api.supabase.com',
      path:'/v1/projects/'+REF+'/database/query',
      method:'POST',
      headers:{'Authorization':'Bearer '+PAT,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}
    },resp=>{
      let d='';
      resp.on('data',c=>d+=c);
      resp.on('end',()=>{
        try{res({s:resp.statusCode,b:JSON.parse(d)})}
        catch{res({s:resp.statusCode,b:d})}
      });
    });
    r.on('error',e=>res({s:0,b:e.message}));
    r.write(b); r.end();
  });
}

async function main() {
  var queries = [
    "DROP POLICY IF EXISTS allow_write_own ON public.profiles",
    "CREATE POLICY allow_write_own ON public.profiles FOR ALL TO authenticated USING (auth.uid() = profiles.user_id OR auth.uid() = profiles.id) WITH CHECK (auth.uid() = profiles.user_id OR auth.uid() = profiles.id)",
    "UPDATE public.profiles SET membership_tier='akasha_infinity',subscription_tier='akasha_infinity',subscription_status='active',has_prana_flow_access=true,has_siddha_quantum_access=true,has_akasha_infinity_access=true WHERE full_name ILIKE ANY(ARRAY['%anette%','%margaretha%','%pia svanberg%'])",
    "UPDATE public.profiles SET membership_tier='siddha_quantum',subscription_tier='siddha_quantum',subscription_status='active',has_prana_flow_access=true,has_siddha_quantum_access=true,has_akasha_infinity_access=false WHERE full_name ILIKE '%julia%'",
    "UPDATE public.profiles SET membership_tier='prana_flow',subscription_tier='prana_flow',subscription_status='active',has_prana_flow_access=true,has_siddha_quantum_access=false,has_akasha_infinity_access=false WHERE full_name ILIKE ANY(ARRAY['%luna%','%tina%','%christina%','%monica mortensson%','%monica fransson%'])",
    "SELECT membership_tier, COUNT(*) as c FROM public.profiles GROUP BY membership_tier ORDER BY c DESC"
  ];
  
  for (var i = 0; i < queries.length; i++) {
    var r = await sql(queries[i]);
    console.log(queries[i].slice(0,50), '->', r.s, JSON.stringify(r.b).slice(0,100));
  }
}

main().catch(function(e){console.error('Error:',e.message);process.exit(1);});
