// Standalone Supabase client — new project, not locked in Lovable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = "https://fjdzhrdpioxdeyyfogep.supabase.co";
const KEY = "sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F";

// Cast to any to bypass old Database type definitions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const newSupabase: SupabaseClient<any> = createClient(URL, KEY);
