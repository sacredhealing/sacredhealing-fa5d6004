import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Method not allowed. Use POST." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing authorization header. Please sign in." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Supabase client (Edge-safe)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnon);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Auth user (explicit token approach for reliability)
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Unauthorized. Please sign in." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin (admins bypass all checks)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid JSON in request body" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // mode: "demo" | "paid" (default to "demo" for backwards compatibility)
    const mode = body?.mode ?? (body?.demo === true ? "demo" : "paid");

    // 1) DEMO path (allow once per user, admins bypass)
    if (mode === "demo") {
      if (!isAdmin) {
        // Check if demo already used
        const { data: existingDemo, error: demoCheckError } = await supabaseAdmin
          .from("meditation_audio_demos")
          .select("id, created_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (demoCheckError) {
          console.error('[CONVERT-MEDITATION-AUDIO] Demo check error:', demoCheckError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Failed to check demo status. Please try again.",
              details: String(demoCheckError.message)
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (existingDemo) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Demo already used. Please purchase to unlock all features." 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Mark demo as used (upsert since table has UNIQUE constraint on user_id)
        const { error: upsertError } = await supabaseAdmin
          .from("meditation_audio_demos")
          .upsert({ 
            user_id: user.id, 
            generated_files_count: 0,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          console.error('[CONVERT-MEDITATION-AUDIO] Demo mark error:', upsertError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Failed to mark demo used. Please try again.",
              details: String(upsertError.message)
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Return queued job response (audio processing happens in external worker)
      return new Response(
        JSON.stringify({ 
          success: true, 
          mode: "demo", 
          job_id: crypto.randomUUID(),
          message: "Demo generation queued. Processing will begin shortly."
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 2) PAID path (requires entitlement, admins bypass)
    if (!isAdmin) {
      const { data: access, error: accessError } = await supabaseAdmin
        .from("creative_tool_access")
        .select("*, tool:creative_tools!inner(slug, name)")
        .eq("user_id", user.id)
        .eq("tool.slug", "creative-soul-meditation")
        .maybeSingle();

      if (accessError) {
        console.error('[CONVERT-MEDITATION-AUDIO] Access check error:', accessError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Failed to check access. Please try again.",
            details: String(accessError.message)
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!access) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Full access required. Please purchase to unlock all features." 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Return queued paid job (audio processing happens in external worker)
    return new Response(
      JSON.stringify({ 
        success: true, 
        mode: "paid", 
        job_id: crypto.randomUUID(),
        message: "Generation queued. Processing will begin shortly."
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[CONVERT-MEDITATION-AUDIO] Runtime error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "RUNTIME_ERROR",
        details: errorMessage
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
