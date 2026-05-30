
import https from 'https';
const PAT = process.env.PAT;
const SVC = process.env.SVC;
const REF = 'fjdzhrdpioxdeyyfogep';
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';

function sql(q) {
  return new Promise(res => {
    const b = JSON.stringify({query:q});
    const r = https.request({hostname:'api.supabase.com',path:`/v1/projects/${REF}/database/query`,method:'POST',
      headers:{'Authorization':`Bearer ${PAT}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}
    },resp=>{let d='';resp.on('data',c=>d+=c);resp.on('end',()=>{try{res(JSON.parse(d))}catch{res(d)}})});
    r.on('error',e=>res(e.message)); r.write(b); r.end();
  });
}

async function setTier(name, tier) {
  const prana = tier.includes('prana');
  const siddha = tier.includes('siddha') || prana;
  const akasha = tier.includes('akasha');
  const r = await sql(`UPDATE public.profiles SET
    membership_tier='${tier}', subscription_tier='${tier}', subscription_status='active',
    has_prana_flow_access=${prana||siddha||akasha},
    has_siddha_quantum_access=${siddha||akasha},
    has_akasha_infinity_access=${akasha}
    WHERE LOWER(full_name) LIKE LOWER('%${name}%') OR LOWER(display_name) LIKE LOWER('%${name}%')`);
  console.log(`  ${name} -> ${tier}:`, JSON.stringify(r.b).slice(0,60));
}

async function main() {
  console.log('Setting tiers...');
  for (const n of ['anette ahl','margaretha donosa','pia svanberg']) await setTier(n,'akasha_infinity');
  for (const n of ['julia atkins']) await setTier(n,'siddha_quantum');
  for (const n of ['monica mortensson','monica fransson','lunalarsdotter','tina ostensson','tina östensson']) await setTier(n,'prana_flow');

  const tiers = await sql('SELECT membership_tier, COUNT(*) as c FROM public.profiles GROUP BY membership_tier ORDER BY c DESC');
  console.log('Tier breakdown:', JSON.stringify(tiers.b));

  console.log('\nTriggering edge function for user data...');
  const r = await new Promise(res => {
    const b = JSON.stringify({});
    const req = https.request({hostname:'ssygukfdbtehvtndandn.supabase.co',
      path:'/functions/v1/migrate-to-new-project',method:'POST',
      headers:{'Content-Type':'application/json','x-new-service-role':SVC,'Content-Length':Buffer.byteLength(b)}
    },resp=>{let d='';resp.on('data',c=>d+=c);resp.on('end',()=>{try{res({s:resp.statusCode,b:JSON.parse(d)})}catch{res({s:resp.statusCode,b:d})}})});
    req.on('error',e=>res({s:0,b:e.message}));
    req.setTimeout(300000,()=>{req.destroy();res({s:0,b:'timeout'});});
    req.write(b); req.end();
  });
  console.log('Edge fn status:', r.s);
  if (r.b?.report) {
    const rp = r.b.report;
    console.log('Auth migrated:', JSON.stringify(rp.auth));
    Object.entries(rp).filter(([k])=>!['started_at','completed_at','auth_users_found','auth'].includes(k))
      .filter(([k,v])=>JSON.stringify(v)!=='{"count":0}' && JSON.stringify(v)!=='{"skipped":true}')
      .forEach(([k,v])=>console.log(' ',k,JSON.stringify(v)));
  } else { console.log('Response:', JSON.stringify(r.b).slice(0,300)); }
  console.log('DONE');
}
main().catch(e=>{console.error(e.message);process.exit(1);});
