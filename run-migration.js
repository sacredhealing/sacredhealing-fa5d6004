#!/usr/bin/env node

/**
 * Run the script_text migration for healing_audio table
 * 
 * Usage:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node run-migration.js
 * 
 * Or set these in a .env file and use dotenv
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('');
  console.error('Please set:');
  console.error('  SUPABASE_URL=your_supabase_url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('Or run the SQL manually in Supabase Dashboard → SQL Editor');
  process.exit(1);
}

// Read the migration SQL file
const migrationFile = join(__dirname, 'RUN_THIS_NOW.sql');
let sql;

try {
  sql = readFileSync(migrationFile, 'utf-8');
  console.log('✅ Loaded migration file:', migrationFile);
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Execute the migration
async function runMigration() {
  console.log('');
  console.log('🚀 Starting migration...');
  console.log('');

  try {
    // Split SQL into individual statements (remove comments and empty lines)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('='))
      .map(s => {
        // Remove inline comments
        return s.split('--')[0].trim();
      })
      .filter(s => s);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`[${i + 1}/${statements.length}] Executing...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });

        if (error) {
          // Try direct query execution if RPC doesn't exist
          // Note: Supabase JS client doesn't support raw SQL execution directly
          // We'll need to use the REST API or PostgreSQL client
          console.log('⚠️  RPC method not available, trying alternative...');
          
          // For now, we'll show what needs to be run
          console.log('⚠️  Cannot execute SQL directly via JS client.');
          console.log('⚠️  Please run the SQL manually in Supabase Dashboard → SQL Editor');
          console.log('');
          console.log('📋 SQL to run:');
          console.log('─'.repeat(60));
          console.log(sql);
          console.log('─'.repeat(60));
          process.exit(0);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        console.log('');
        console.log('📋 Please run the SQL manually in Supabase Dashboard → SQL Editor');
        console.log('📄 File location:', migrationFile);
        process.exit(1);
      }
    }

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🔄 Please refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('📋 Please run the SQL manually in Supabase Dashboard → SQL Editor');
    console.log('📄 File location:', migrationFile);
    process.exit(1);
  }
}

// Run the migration
runMigration();

