import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'fjdzhrdpioxdeyyfogep';

if (!PAT) { console.error('Missing SUPABASE_ACCESS_TOKEN'); process.exit(1); }
console.log(`PAT length: ${PAT.length}`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function run(cmd, silent = false) {
  try {
    return execSync(cmd, {
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: PAT },
      timeout: 120000,
      stdio: silent ? 'pipe' : 'pipe'
    }).toString();
  } catch(e) {
    return null;
  }
}

async function main() {
  console.log('Installing Supabase CLI...');
  run('npm install -g supabase@latest', true);
  const ver = run('supabase --version', true);
  console.log(`✅ Supabase CLI: ${ver?.trim()}\n`);

  const fnDir = 'supabase/functions';
  const functions = readdirSync(fnDir)
    .filter(f => !f.startsWith('_') && statSync(join(fnDir, f)).isDirectory());

  console.log(`Deploying ${functions.length} functions to ${PROJECT_REF}...\n`);

  let success = 0, failed = 0;
  const errors = [];

  for (const fn of functions) {
    process.stdout.write(`  ${fn}... `);
    try {
      execSync(
        `supabase functions deploy ${fn} --project-ref ${PROJECT_REF}`,
        { env: { ...process.env, SUPABASE_ACCESS_TOKEN: PAT }, timeout: 120000, stdio: 'pipe' }
      );
      console.log('✅');
      success++;
    } catch(e) {
      const err = e.stderr?.toString() || e.message;
      console.log(`⚠️  ${err.slice(0, 100)}`);
      errors.push(fn);
      failed++;
    }
    await sleep(300);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Deployed: ${success} | ⚠️ Failed: ${failed}`);
  if (errors.length) console.log(`Issues: ${errors.join(', ')}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
