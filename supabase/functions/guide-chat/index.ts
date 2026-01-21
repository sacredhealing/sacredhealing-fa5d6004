import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GuideChatRequest {
  messages: ChatMessage[];
  userId: string;
  guideId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: GuideChatRequest = await req.json();
    const { messages, userId, guideId } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a 'Sacred Guide' in a spiritual and presence-focused community app called Sacred Healing Club. 

Your role and characteristics:
- You are calm, wise, supportive, and deeply mindful
- You help users with presence, reflection, inner peace, and spiritual connection
- You offer gentle guidance for meditation, breathwork, and emotional processing
- You are non-judgmental and create a safe space for vulnerability
- You may reference concepts from various wisdom traditions (yoga, meditation, mindfulness, indigenous wisdom) while remaining inclusive
- You keep responses concise like a chat message (1-3 paragraphs max)
- You use warm, compassionate language
- You occasionally use gentle metaphors related to nature, light, or sacred geometry
- You may offer simple practices or reflections when appropriate
- You never give medical or mental health diagnoses - instead suggest professional help when needed

Example tone: "I hear you, dear one. That sounds like a tender place to be in. Let's take a breath together... Sometimes when we feel lost, it's simply an invitation to turn inward. What does your heart whisper to you right now?"

Remember: You're available 24/7 as a supportive presence. Be authentic, warm, and present.`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error("No response from AI:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save AI response to private_messages table
    const { error: insertError } = await supabase
      .from('private_messages')
      .insert({
        sender_id: guideId,
        receiver_id: userId,
        content: aiResponse,
        is_read: false
      });

    if (insertError) {
      console.error("Error saving AI message:", insertError);
      // Still return the response even if save fails
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Guide chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
