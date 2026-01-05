import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, path_slug } = await req.json();

    if (!user_id || !path_slug) {
      return new Response(
        JSON.stringify({ error: "user_id and path_slug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the chat room for this path
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("path_slug", path_slug)
      .eq("type", "path")
      .single();

    if (roomError || !room) {
      console.log(`No chat room found for path: ${path_slug}`);
      return new Response(
        JSON.stringify({ error: "Circle not found for this path", path_slug }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("chat_members")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", user_id)
      .single();

    if (existingMember) {
      return new Response(
        JSON.stringify({ success: true, message: "Already a member of this circle" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add user to the circle
    const { error: insertError } = await supabase
      .from("chat_members")
      .insert({
        room_id: room.id,
        user_id,
        role: "member"
      });

    if (insertError) {
      console.error("Error adding user to circle:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to join circle", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also add user to Community Lounge
    const { data: loungeRoom } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("type", "community")
      .single();

    if (loungeRoom) {
      await supabase
        .from("chat_members")
        .upsert({
          room_id: loungeRoom.id,
          user_id,
          role: "member"
        }, { onConflict: "room_id,user_id" });
    }

    return new Response(
      JSON.stringify({ success: true, message: "User added to circle", room_id: room.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
