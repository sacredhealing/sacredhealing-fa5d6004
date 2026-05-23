// New standalone Supabase project — not locked in Lovable
// Used by PolymarketOracle and any new features
// When full migration is complete, this becomes the main client
import { createClient } from '@supabase/supabase-js';

const NEW_SUPABASE_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const NEW_SUPABASE_KEY = 'sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F';

export const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);
