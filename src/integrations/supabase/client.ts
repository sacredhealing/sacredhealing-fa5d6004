// Supabase client — SQI 2050
// Active project: fjdzhrdpioxdeyyfogep (new, all users migrated here)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://fjdzhrdpioxdeyyfogep.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey: 'sqi-2050-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
