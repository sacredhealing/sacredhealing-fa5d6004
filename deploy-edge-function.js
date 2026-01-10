/**
 * Deploy Edge Function to Supabase via Management API
 * 
 * Usage:
 *   node deploy-edge-function.js
 * 
 * Environment Variables Required:
 *   SUPABASE_ACCESS_TOKEN - Get from: Supabase Dashboard → Account → Access Tokens
 *   SUPABASE_PROJECT_REF  - Your project ref: ssygukfdbtehvtndandn
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'ssygukfdbtehvtndandn';
const FUNCTION_NAME = 'convert-meditation-audio';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('   Get it from: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const functionPath = path.join(__dirname, 'supabase', 'functions', FUNCTION_NAME, 'index.ts');

if (!fs.existsSync(functionPath)) {
  console.error(`❌ Error: Function file not found at: ${functionPath}`);
  process.exit(1);
}

const functionCode = fs.readFileSync(functionPath, 'utf-8');

console.log(`📦 Deploying function: ${FUNCTION_NAME}`);
console.log(`   Project: ${SUPABASE_PROJECT_REF}`);
console.log(`   File: ${functionPath}`);

const deployFunction = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${SUPABASE_PROJECT_REF}/functions/${FUNCTION_NAME}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Function deployed successfully!');
          console.log(`   Response: ${data}`);
          resolve(data);
        } else {
          console.error(`❌ Deployment failed with status ${res.statusCode}`);
          console.error(`   Response: ${data}`);
          reject(new Error(`Deployment failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    // Note: Management API requires base64 encoded code
    // For now, we'll just provide instructions
    const payload = JSON.stringify({
      name: FUNCTION_NAME,
      body: Buffer.from(functionCode).toString('base64'),
      verify_jwt: true,
    });

    req.write(payload);
    req.end();
  });
};

// Note: The Management API might require different format
// If this doesn't work, use Option 1 (Dashboard) or Option 2 (CLI)
console.log('\n⚠️  Note: Management API deployment may require different format.');
console.log('   For easiest deployment, use Supabase Dashboard (see DEPLOY_EDGE_FUNCTION.md)\n');

deployFunction().catch((error) => {
  console.error('\n❌ Deployment failed. Try Option 1 (Dashboard) instead.');
  console.error('   See: DEPLOY_EDGE_FUNCTION.md\n');
  process.exit(1);
});

