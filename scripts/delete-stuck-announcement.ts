/**
 * Script to delete the stuck "Mantra & Astrologi" announcement
 * 
 * Usage: npx tsx scripts/delete-stuck-announcement.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Read .env file manually
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error loading .env file:', error);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

async function deleteStuckAnnouncement() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('Searching for announcement "Mantra & Astrologi"...');

  // Find the announcement by title
  const { data: announcements, error: searchError } = await supabase
    .from('announcements')
    .select('id, title, message, is_active')
    .or('title.ilike.%Mantra & Astrologi%,title.ilike.%mantra & astrologi%,message.ilike.%vediska astrologi%,message.ilike.%Vediska astrologi%')
    .order('created_at', { ascending: false });

  if (searchError) {
    console.error('Error searching for announcements:', searchError);
    process.exit(1);
  }

  if (!announcements || announcements.length === 0) {
    console.log('No matching announcement found.');
    return;
  }

  console.log(`Found ${announcements.length} matching announcement(s):`);
  announcements.forEach((ann) => {
    console.log(`  - ID: ${ann.id}`);
    console.log(`    Title: ${ann.title}`);
    console.log(`    Active: ${ann.is_active}`);
    console.log(`    Message preview: ${ann.message.substring(0, 100)}...`);
  });

  // Delete all matching announcements
  for (const ann of announcements) {
    console.log(`\nDeleting announcement: ${ann.title} (${ann.id})...`);
    
    // First delete related dismissals
    const { error: dismissalsError } = await supabase
      .from('announcement_dismissals')
      .delete()
      .eq('announcement_id', ann.id);
    
    if (dismissalsError) {
      console.warn(`Warning deleting dismissals: ${dismissalsError.message}`);
    }
    
    // Then delete the announcement
    const { data, error: deleteError } = await supabase
      .from('announcements')
      .delete()
      .eq('id', ann.id)
      .select();

    if (deleteError) {
      console.error(`Error deleting announcement ${ann.id}:`, deleteError);
      console.error('Full error details:', JSON.stringify(deleteError, null, 2));
    } else {
      if (data && data.length > 0) {
        console.log(`✓ Successfully deleted: ${ann.title}`);
      } else {
        console.log(`⚠ No rows deleted - announcement may not exist or already deleted`);
      }
    }
  }
  
  // Verify deletion
  console.log('\nVerifying deletion...');
  const { data: remaining, error: verifyError } = await supabase
    .from('announcements')
    .select('id, title')
    .or('title.ilike.%Mantra & Astrologi%,title.ilike.%mantra & astrologi%,message.ilike.%vediska astrologi%,message.ilike.%Vediska astrologi%');
  
  if (verifyError) {
    console.error('Error verifying:', verifyError);
  } else if (remaining && remaining.length > 0) {
    console.error(`❌ FAILED: ${remaining.length} announcement(s) still exist:`);
    remaining.forEach(a => console.error(`  - ${a.title} (${a.id})`));
  } else {
    console.log('✓ Verification passed: No matching announcements found');
  }

  console.log('\nDone! All matching announcements have been deleted.');
}

deleteStuckAnnouncement().catch(console.error);
