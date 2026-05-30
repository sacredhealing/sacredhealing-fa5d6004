
import https from 'https';
const PAT = process.env.PAT;
const SVC = process.env.SVC;
const REF = 'fjdzhrdpioxdeyyfogep';

console.log('PAT:', PAT ? PAT.slice(0,15)+'...' : 'MISSING');
console.log('SVC:', SVC ? SVC.slice(0,15)+'...' : 'MISSING');

function sql(q) {
  return new Promise(res => {
    const b = JSON.stringify({query:q});
    const r = https.request({hostname:'api.supabase.com',path:`/v1/projects/${REF}/database/query`,method:'POST',
      headers:{'Authorization':`Bearer ${PAT}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}
    },resp=>{let d='';resp.on('data',c=>d+=c);resp.on('end',()=>{try{res(JSON.parse(d))}catch{res(d)}})});
    r.on('error',e=>res(e.message)); r.write(b); r.end();
  });
}

async function main() {
  const r = await sql('SELECT COUNT(*) FROM public.profiles');
  console.log('Profile count test:', JSON.stringify(r.b));
  
  // Update tiers directly
  const updates = [
    {names: ['anette ahl','margaretha donosa','pia svanberg'], tier: 'akasha_infinity', prana:true, siddha:true, akasha:true},
    {names: ['julia atkins'], tier: 'siddha_quantum', prana:true, siddha:true, akasha:false},
    {names: ['monica mortensson','monica fransson','lunalarsdotter','tina ostensson'], tier: 'prana_flow', prana:true, siddha:false, akasha:false},
  ];
  
  for (const {names, tier, prana, siddha, akasha} of updates) {
    for (const name of names) {
      const q = `UPDATE public.profiles SET membership_tier='${tier}', subscription_tier='${tier}', subscription_status='active', has_prana_flow_access=${prana}, has_siddha_quantum_access=${siddha}, has_akasha_infinity_access=${akasha} WHERE LOWER(full_name) LIKE LOWER('%${name}%') OR LOWER(display_name) LIKE LOWER('%${name}%')`;
      const res = await sql(q);
      console.log(name, '->', tier, ':', JSON.stringify(res.b).slice(0,50));
    }
  }
  
  const tiers = await sql('SELECT membership_tier, COUNT(*) as c FROM public.profiles GROUP BY membership_tier ORDER BY c DESC');
  console.log('Final tiers:', JSON.stringify(tiers.b));
}
main().catch(e=>{console.error('Error:',e.message);process.exit(1);});
