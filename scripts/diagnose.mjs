import https from 'https';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const GH_TOKEN = process.env.GITHUB_TOKEN;

const REAL_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';
const NEW_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';

function req(url, method, headers, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { ...headers, ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    r.setTimeout(15000, () => { r.destroy(); resolve({ s: 0, b: 'timeout' }); });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (payload) r.write(payload);
    r.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function writeResult(content) {
  const ex = await req('https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/docs/diagnosis-result.txt',
    'GET', { 'Authorization': `Bearer ${GH_TOKEN}`, 'User-Agent': 'node' });
  const sha = ex.b?.sha;
  const body = { message: 'fix: vercel env result', content: Buffer.from(content).toString('base64') };
  if (sha) body.sha = sha;
  await req('https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/docs/diagnosis-result.txt',
    'PUT', { 'Authorization': `Bearer ${GH_TOKEN}`, 'User-Agent': 'node', 'Content-Type': 'application/json' }, body);
}

async function main() {
  const lines = [];
  const log = (...a) => { const m = a.join(' '); console.log(m); lines.push(m); };

  const V = { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' };

  // 1. Find the project
  log('=== 1. Find Vercel project ===');
  const projects = await req('https://api.vercel.com/v9/projects?limit=20', 'GET', V);
  log('HTTP:', projects.s);
  const proj = projects.b?.projects?.find(p =>
    p.name?.includes('sacred') || p.name?.includes('siddha') || p.name?.includes('nexus')
  );
  if (!proj) {
    log('Projects found:', projects.b?.projects?.map(p => p.name).join(', '));
    log('ERROR: Could not find project');
    await writeResult(lines.join('\n'));
    return;
  }
  log('Project:', proj.name, '| ID:', proj.id);

  // 2. List current env vars
  log('\n=== 2. Current Vercel env vars ===');
  const envs = await req(`https://api.vercel.com/v9/projects/${proj.id}/env`, 'GET', V);
  log('HTTP:', envs.s, '| Count:', envs.b?.envs?.length);
  const supabaseVars = (envs.b?.envs || []).filter(e => e.key.includes('SUPABASE'));
  supabaseVars.forEach(e => log(`  ${e.key} = ${e.value?.slice(0, 60)}... [id:${e.id}]`));

  // 3. Delete and recreate each SUPABASE var with correct values
  log('\n=== 3. Update env vars ===');

  const TARGET_VARS = {
    'VITE_SUPABASE_URL': NEW_URL,
    'VITE_SUPABASE_ANON_KEY': REAL_ANON,
    'VITE_SUPABASE_PUBLISHABLE_KEY': REAL_ANON,
    'SUPABASE_URL': NEW_URL,
    'SUPABASE_PUBLISHABLE_KEY': REAL_ANON,
    'VITE_SUPABASE_PROJECT_ID': 'fjdzhrdpioxdeyyfogep',
  };

  // Delete existing SUPABASE vars
  for (const env of supabaseVars) {
    const del = await req(`https://api.vercel.com/v9/projects/${proj.id}/env/${env.id}`, 'DELETE', V);
    log(`  Deleted ${env.key}: ${del.s}`);
    await sleep(200);
  }

  // Create correct vars
  for (const [key, value] of Object.entries(TARGET_VARS)) {
    const cr = await req(`https://api.vercel.com/v10/projects/${proj.id}/env`, 'POST', V, {
      key, value, type: 'plain', target: ['production', 'preview', 'development']
    });
    log(`  Created ${key}: ${cr.s} ${cr.b?.error?.message || ''}`);
    await sleep(200);
  }

  // 4. Trigger redeploy
  log('\n=== 4. Trigger redeploy ===');
  const deploys = await req(`https://api.vercel.com/v6/deployments?projectId=${proj.id}&limit=1`, 'GET', V);
  const lastDeploy = deploys.b?.deployments?.[0];
  log('Last deploy:', lastDeploy?.uid, lastDeploy?.url);

  if (lastDeploy?.uid) {
    const redeploy = await req('https://api.vercel.com/v13/deployments', 'POST', V, {
      deploymentId: lastDeploy.uid,
      name: proj.name,
      target: 'production'
    });
    log('Redeploy HTTP:', redeploy.s, redeploy.b?.url || redeploy.b?.error?.message || '');
  }

  await writeResult(lines.join('\n'));
  log('\nDone - Vercel will rebuild with correct Supabase keys in ~2 min');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
