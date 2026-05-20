const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'fjdzhrdpioxdeyyfogep';

if (!PAT) { console.error('Missing SUPABASE_ACCESS_TOKEN'); process.exit(1); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function deployFunction(fnName) {
  return new Promise((resolve) => {
    try {
      // Use supabase CLI to deploy
      const result = execSync(
        `supabase functions deploy ${fnName} --project-ref ${PROJECT_REF} --no-verify-jwt`,
        { 
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: PAT },
          timeout: 60000,
          stdio: 'pipe'
        }
      );
      resolve({ success: true, output: result.toString() });
    } catch(e) {
      resolve({ success: false, error: e.stderr?.toString() || e.message });
    }
  });
}

async function main() {
  // Install supabase CLI
  console.log('Installing Supabase CLI...');
  execSync('npm install -g supabase@latest', { stdio: 'pipe' });
  console.log('✅ CLI ready\n');

  const fnDir = 'supabase/functions';
  const functions = fs.readdirSync(fnDir)
    .filter(f => !f.startsWith('_') && fs.statSync(path.join(fnDir, f)).isDirectory());

  console.log(`Deploying ${functions.length} edge functions to ${PROJECT_REF}...\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (const fn of functions) {
    process.stdout.write(`  ${fn}... `);
    const result = await deployFunction(fn);
    if (result.success) {
      console.log('✅');
      success++;
    } else {
      console.log(`⚠️  ${result.error?.slice(0, 80)}`);
      errors.push(fn);
      failed++;
    }
    await sleep(500);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Deployed: ${success} | ⚠️ Failed: ${failed}`);
  if (errors.length) console.log(`Failed: ${errors.join(', ')}`);
  console.log('='.repeat(50));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
