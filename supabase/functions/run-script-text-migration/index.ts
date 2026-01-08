import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The complete migration SQL
const MIGRATION_SQL = `
-- Step 1: Add script_text column to healing_audio for pre-written meditation scripts
ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

-- Step 2: Add index for faster queries on script_text
CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text 
ON public.healing_audio(script_text) 
WHERE script_text IS NOT NULL;

-- Step 3: Ensure RLS is enabled (should already be enabled, but safe to check)
ALTER TABLE public.healing_audio ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing admin policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can insert healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can delete healing audio" ON public.healing_audio;

-- Step 5: Create admin UPDATE policy (allows admins to update script_text)
CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 6: Create admin INSERT policy (allows admins to create new entries with script_text)
CREATE POLICY "Admins can insert healing audio"
ON public.healing_audio
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 7: Create admin DELETE policy (allows admins to delete entries)
CREATE POLICY "Admins can delete healing audio"
ON public.healing_audio
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`[MIGRATION] Starting migration for admin user: ${user.id}`);

    // Split SQL into individual statements
    const statements = MIGRATION_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('='))
      .map(s => {
        // Remove inline comments
        const lines = s.split('\n');
        return lines
          .map(line => {
            const commentIndex = line.indexOf('--');
            return commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line.trim();
          })
          .filter(line => line)
          .join(' ');
      })
      .filter(s => s);

    console.log(`[MIGRATION] Executing ${statements.length} SQL statements`);

    const results = [];
    const errors = [];

    // Execute SQL using PostgreSQL client
    // Supabase JS client doesn't support raw SQL, so we use Deno's postgres module
    console.log('[MIGRATION] Using PostgreSQL client to execute SQL...');
    
    // Import PostgreSQL client for Deno
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    // Get database connection string from environment
    // Construct from Supabase URL if DATABASE_URL not available
    let dbUrl = Deno.env.get("DATABASE_URL");
    if (!dbUrl) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const dbPassword = Deno.env.get("SUPABASE_DB_PASSWORD");
      const dbHost = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
      const projectRef = dbHost.split(".")[0];
      
      if (dbPassword) {
        dbUrl = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
      } else {
        throw new Error("DATABASE_URL or SUPABASE_DB_PASSWORD environment variable must be set");
      }
    }

    const client = new Client(dbUrl);
    
    try {
      await client.connect();
      console.log('[MIGRATION] Connected to database');

      // Execute all statements in a transaction
      await client.query("BEGIN");
      console.log('[MIGRATION] Transaction started');
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;
        
        try {
          console.log(`[MIGRATION] Executing statement ${i + 1}/${statements.length}`);
          await client.query(statement);
          results.push({ statement: i + 1, success: true });
          console.log(`[MIGRATION] Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`[MIGRATION] Error executing statement ${i + 1}:`, error);
          errors.push({ statement: i + 1, error: error.message });
          // Continue with other statements even if one fails (IF NOT EXISTS clauses should handle this)
        }
      }
      
      if (errors.length === 0 || errors.every(e => e.error.includes('already exists') || e.error.includes('does not exist'))) {
        await client.query("COMMIT");
        console.log('[MIGRATION] Transaction committed');
      } else {
        await client.query("ROLLBACK");
        console.log('[MIGRATION] Transaction rolled back due to errors');
        throw new Error(`Migration failed: ${errors.map(e => e.error).join('; ')}`);
      }
    } catch (error) {
      console.error('[MIGRATION] Database error:', error);
      throw error;
    } finally {
      await client.end();
      console.log('[MIGRATION] Database connection closed');
    }

    // Verify the column was added
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from("healing_audio")
      .select("script_text")
      .limit(1);

    const columnExists = verifyError === null || !verifyError.message.includes('script_text');

    console.log(`[MIGRATION] Verification: column exists = ${columnExists}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Migration completed successfully",
        statementsExecuted: results.length,
        errors: errors.length > 0 ? errors : undefined,
        columnVerified: columnExists,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[MIGRATION] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

