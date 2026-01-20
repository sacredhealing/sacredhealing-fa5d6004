import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  trackId: string;
  title: string;
  artist: string;
  genre: string;
  duration_seconds: number;
  bpm?: number;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { trackId, title, artist, genre, duration_seconds, bpm, description }: AnalysisRequest = await req.json();

    if (!trackId) {
      throw new Error('Track ID is required');
    }

    // Update status to analyzing
    await supabase
      .from('music_tracks')
      .update({ analysis_status: 'analyzing' })
      .eq('id', trackId);

    // Build context for AI analysis
    const durationMinutes = Math.round(duration_seconds / 60);
    const trackContext = `
Title: ${title}
Artist: ${artist}
Genre: ${genre}
Duration: ${durationMinutes} minutes
${bpm ? `BPM: ${bpm}` : ''}
${description ? `Description: ${description}` : ''}
    `.trim();

    // Use AI to generate spiritual metadata
    const systemPrompt = `You are a spiritual music analyst for a meditation and healing music app called "Sacred Healing". 
Your job is to analyze music tracks and generate meaningful spiritual context for users.

Based on the track information provided, generate:
1. Energy level (low/medium/high) - based on likely tempo and intensity
2. Rhythm type (steady/flowing/dynamic) - based on genre and style
3. Vocal type (instrumental/mantra/lyrics/spoken) - best guess based on genre
4. Frequency band (low/balanced/high) - dominant frequencies likely present
5. Best time of day (morning/midday/evening/sleep/anytime)
6. Mood (calm/grounding/energizing/healing/focused)
7. Recommended spiritual path (inner_peace/focus_mastery/sleep_sanctuary/deep_healing/awakening)
8. A short spiritual description (1-2 sentences about the track's purpose and healing qualities)
9. A suggested affirmation (1 line that resonates with the track's energy)

Respond ONLY with valid JSON in this exact format:
{
  "energy_level": "low|medium|high",
  "rhythm_type": "steady|flowing|dynamic",
  "vocal_type": "instrumental|mantra|lyrics|spoken",
  "frequency_band": "low|balanced|high",
  "best_time_of_day": "morning|midday|evening|sleep|anytime",
  "mood": "calm|grounding|energizing|healing|focused",
  "spiritual_path": "inner_peace|focus_mastery|sleep_sanctuary|deep_healing|awakening",
  "spiritual_description": "Your 1-2 sentence description here",
  "affirmation": "Your affirmation here",
  "intended_use": "meditation|focus|sleep|yoga|healing|relaxation|energy"
}`;

    // Use Gemini API directly (no Lovable credits)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nAnalyze this music track and generate spiritual metadata:\n\n${trackContext}` }] }
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Update status to failed
      await supabase
        .from('music_tracks')
        .update({ 
          analysis_status: 'failed',
          auto_analysis_data: { error: errorText, timestamp: new Date().toISOString() }
        })
        .eq('id', trackId);

      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from AI response
    let analysisResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI analysis result');
    }

    // Update track with analysis results
    const { error: updateError } = await supabase
      .from('music_tracks')
      .update({
        energy_level: analysisResult.energy_level,
        rhythm_type: analysisResult.rhythm_type,
        vocal_type: analysisResult.vocal_type,
        frequency_band: analysisResult.frequency_band,
        best_time_of_day: analysisResult.best_time_of_day,
        mood: analysisResult.mood,
        spiritual_path: analysisResult.spiritual_path,
        intended_use: analysisResult.intended_use,
        auto_generated_description: analysisResult.spiritual_description,
        auto_generated_affirmation: analysisResult.affirmation,
        auto_analysis_data: {
          raw_response: content,
          analyzed_at: new Date().toISOString(),
          input_context: trackContext,
        },
        analysis_status: 'completed',
        analysis_completed_at: new Date().toISOString(),
      })
      .eq('id', trackId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      trackId,
      analysis: analysisResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-music-track:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});