#!/usr/bin/env node

/**
 * Simple script to display the SQL that needs to be run
 * Since Supabase JS client doesn't support raw SQL execution,
 * this script will show you exactly what to copy-paste
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationFile = join(__dirname, 'RUN_THIS_NOW.sql');

try {
  const sql = readFileSync(migrationFile, 'utf-8');
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MIGRATION SQL - COPY AND PASTE INTO SUPABASE SQL EDITOR');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(sql);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 Instructions:');
  console.log('  1. Copy the SQL above');
  console.log('  2. Go to Supabase Dashboard → SQL Editor');
  console.log('  3. Paste the SQL');
  console.log('  4. Click "Run"');
  console.log('  5. Refresh your browser');
  console.log('');
  
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

