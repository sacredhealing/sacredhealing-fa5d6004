import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'fjdzhrdpioxdeyyfogep';

if (!PAT) { console.error('Missing SUPABASE_ACCESS_TOKEN'); process.exit(1); }
console.log(`PAT present: ${PAT.length} chars, prefix: ${PAT.slice(0,8)}`);

function run(cmd) {
  return execSync(cmd, {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: PAT },
    timeout: 180000,
    stdio: 'pipe'
  }).toString();
}

async function main() {
  // Install CLI
  console.log('Installing Supabase CLI...');
  run('npm install -g supabase@latest');
  const ver = run('supabase --version');
  console.log(`CLI: ${ver.trim()}`);

  // Login explicitly
  console.log('Logging in...');
  try {
    run(`supabase login --token ${PAT}`);
    console.log('Logged in OK');
  } catch(e) {
    console.log('Login output:', e.stdout?.toString(), e.stderr?.toString());
  }

  const fnDir = 'supabase/functions';
  const functions = readdirSync(fnDir)
    .filter(f => !f.startsWith('_') && statSync(join(fnDir, f)).isDirectory());

  console.log(`\nDeploying ${functions.length} functions...\n`);

  // Deploy critical ones first
  const critical = ['quantum-apothecary-chat', 'bhrigu-oracle', 'ayurveda-chat', 'jyotish-ephemeris', 'stripe-webhook', 'send-welcome-email'];
  const rest = functions.filter(f => !critical.includes(f));
  const ordered = [...critical.filter(f => functions.includes(f)), ...rest];

  let success = 0, failed = 0, errors = [];

  for (const fn of ordered) {
    process.stdout.write(`  ${fn}... `);
    try {
      const out = run(`supabase functions deploy ${fn} --project-ref ${PROJECT_REF} --no-verify-jwt`);
      console.log('✅');
      success++;
    } catch(e) {
      const err = (e.stderr?.toString() || e.stdout?.toString() || e.message || '').slice(0, 200);
      console.log(`❌ ${err}`);
      errors.push(fn);
      failed++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Success: ${success} | ❌ Failed: ${failed}`);
  if (errors.length) {
    console.log(`Failed functions: ${errors.join(', ')}`);
  }
  
  // Exit with error if critical functions failed
  const criticalFailed = errors.filter(f => critical.includes(f));
  if (criticalFailed.length > 0) {
    console.error(`CRITICAL FAILURES: ${criticalFailed.join(', ')}`);
    process.exit(1);
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
