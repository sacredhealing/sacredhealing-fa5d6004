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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("Not authenticated");

    const { contentId } = await req.json();
    if (!contentId) throw new Error("contentId is required");

    // Access check runs as the calling user (RLS + SECURITY DEFINER function),
    // so this can't be spoofed by a client passing a different user id.
    const { data: hasAccess, error: accessError } = await supabaseClient.rpc("get_content_access", {
      _user_id: user.id,
      _content_id: contentId,
    });

    if (accessError) throw accessError;
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "You don't have access to this content yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Service-role client only to read the private bucket + create the signed URL —
    // never used to bypass the access check above.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: content, error: contentError } = await supabaseAdmin
      .from("content_vault")
      .select("media_path")
      .eq("id", contentId)
      .single();

    if (contentError || !content) throw new Error("Content not found");

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("content-vault")
      .createSignedUrl(content.media_path, 60 * 30); // 30 minutes

    if (signError || !signed) throw signError || new Error("Could not sign URL");

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
