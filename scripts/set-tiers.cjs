
const https = require('https');
const PAT = process.env.PAT;
const SVC = process.env.SVC;
const REF = 'fjdzhrdpioxdeyyfogep';

console.log('PAT:', PAT ? PAT.slice(0,15)+'...' : 'MISSING');
console.log('SVC:', SVC ? SVC.slice(0,15)+'...' : 'MISSING');

function sql(q) {
  return new Promise(res => {
    const b = JSON.stringify({query:q});
    const r = https.request({hostname:'api.supabase.com',path:'/v1/projects/'+REF+'/database/query',method:'POST',
      headers:{'Authorization':'Bearer '+PAT,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}
    },resp=>{let d='';resp.on('data',c=>d+=c);resp.on('end',()=>{try{res(JSON.parse(d))}catch{res(d)}})});
    r.on('error',e=>res(e.message)); r.write(b); r.end();
  });
}

async function main() {
  const test = await sql('SELECT COUNT(*) FROM public.profiles');
  console.log('Profile count:', JSON.stringify(test.b));
  
  const members = [
    ['anette ahl','akasha_infinity',true,true,true],
    ['margaretha donosa','akasha_infinity',true,true,true],
    ['pia svanberg','akasha_infinity',true,true,true],
    ['julia atkins','siddha_quantum',true,true,false],
    ['monica mortensson','prana_flow',true,false,false],
    ['monica fransson','prana_flow',true,false,false],
    ['lunalarsdotter','prana_flow',true,false,false],
    ['tina ostensson','prana_flow',true,false,false],
  ];
  
  for (const [name, tier, prana, siddha, akasha] of members) {
    const r = await sql(
      "UPDATE public.profiles SET membership_tier='"+tier+"', subscription_tier='"+tier+"', subscription_status='active', "+
      "has_prana_flow_access="+prana+", has_siddha_quantum_access="+siddha+", has_akasha_infinity_access="+akasha+" "+
      "WHERE LOWER(full_name) LIKE LOWER('%"+name+"%') OR LOWER(display_name) LIKE LOWER('%"+name+"%')"
    );
    console.log(name, '->', tier, ':', JSON.stringify(r.b).slice(0,60));
  }
  
  const tiers = await sql('SELECT membership_tier, COUNT(*) as c FROM public.profiles GROUP BY membership_tier ORDER BY c DESC');
  console.log('Final tiers:', JSON.stringify(tiers.b));
}

main().catch(e=>{console.error('Error:',e.message,e.stack);process.exit(1);});
