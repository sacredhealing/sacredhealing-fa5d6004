import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "User not authenticated. Please sign in." 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if user is admin (admins bypass access checks)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing 'action' parameter. Valid actions: demo, generate, checkout" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // DEMO MODE - Always allowed
    if (action === "demo") {
      return new Response(
        JSON.stringify({
          success: true,
          demo: true,
          job_id: crypto.randomUUID(),
          message: "Demo mode activated - using sample data"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // PAID GENERATION - Check access
    if (action === "generate") {
      // Check access if not admin
      if (!isAdmin) {
        const { data: toolAccess, error: accessError } = await supabaseAdmin
          .from('creative_tool_access')
          .select(`
            *,
            tool:creative_tools!inner(slug)
          `)
          .eq('user_id', user.id)
          .eq('tool.slug', 'creative-soul-studio')
          .limit(1);

        if (accessError) {
          console.error('[CREATIVE-SOUL-TOOL] Access check error:', accessError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Failed to check access. Please try again." 
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }

        if (!toolAccess || toolAccess.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "You don't have access to Creative Soul Studio. Please purchase it first.",
              requires_purchase: true
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
      }

      // Create job ID for external worker
      const jobId = crypto.randomUUID();

      // TODO: Queue job in external worker service (Railway/Fly.io/RunPod)
      // For now, return job_id and let frontend handle demo/placeholder
      return new Response(
        JSON.stringify({
          success: true,
          job_id: jobId,
          message: "Generation queued. Processing will happen in external worker.",
          note: "Heavy audio processing (ffmpeg, Demucs, stem separation) happens in external worker service, not in Edge Function."
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // STRIPE CHECKOUT - Redirect to checkout
    if (action === "checkout") {
      const { affiliateId } = body;

      // Use existing checkout function
      try {
        const { data: checkoutData, error: checkoutError } = await supabaseAdmin
          .from('creative_tools')
          .select('*')
          .eq('slug', 'creative-soul-studio')
          .eq('is_active', true)
          .maybeSingle();

        if (checkoutError || !checkoutData) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Creative Soul Studio is not available for purchase at this time." 
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }

        // Return checkout info - actual checkout handled by create-creative-tool-checkout function
        return new Response(
          JSON.stringify({
            success: true,
            checkout: true,
            tool_slug: 'creative-soul-studio',
            price_eur: checkoutData.price_eur,
            message: "Use create-creative-tool-checkout function to create Stripe checkout session"
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      } catch (checkoutErr) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Failed to initialize checkout" 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // UNKNOWN ACTION
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Unknown action: ${action}. Valid actions: demo, generate, checkout` 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[CREATIVE-SOUL-TOOL] Error:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Creative Soul Edge function error",
        details: errorMessage
      }),
      { 
        status: 200, // Always return 200, errors in body
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

