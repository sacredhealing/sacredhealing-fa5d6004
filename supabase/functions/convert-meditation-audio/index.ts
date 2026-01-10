import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMUCS_API_URL = Deno.env.get('DEMUCS_API_URL') || 'https://api.demucs.ai'; // Replace with actual Demucs API
const YOUTUBE_DL_API_URL = Deno.env.get('YOUTUBE_DL_API_URL') || 'https://api.youtube-dl.com'; // Replace with actual YouTube-DL API

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      files = [],
      user_music = [],
      youtube_links,
      urls,
      style = 'ocean',
      freq = 432,
      binaural = true,
      bpm_match = true,
      variants = 1,
      keep_music_stem = true,
      demo = false,
    } = await req.json();

    // Check access for non-demo generations
    if (!demo) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: access } = await supabaseAdmin
        .from('creative_tool_access')
        .select('*, tool:creative_tools!inner(slug)')
        .eq('user_id', user.id)
        .eq('tool.slug', 'creative-soul-meditation')
        .maybeSingle();

      if (!access) {
        throw new Error('Full access required. Please purchase to unlock all features.');
      }
    }

    // Check demo usage
    if (demo) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: existingDemo } = await supabaseAdmin
        .from('meditation_audio_demos')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingDemo) {
        throw new Error('Demo already used. Please purchase full access.');
      }
    }

    // Process YouTube URLs
    const processedUrls: string[] = [];
    if (youtube_links) {
      const ytLinks = youtube_links.split(',').map((link: string) => link.trim()).filter(Boolean);
      for (const link of ytLinks) {
        try {
          // In production, call YouTube-DL API to extract audio
          // For now, return a placeholder
          const response = await fetch(`${YOUTUBE_DL_API_URL}/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: link }),
          });
          const data = await response.json();
          if (data.audio_url) {
            processedUrls.push(data.audio_url);
          }
        } catch (error) {
          console.error('YouTube extraction error:', error);
        }
      }
    }

    // Combine all audio sources
    const allAudioSources = [...files, ...processedUrls, ...(urls ? urls.split(',').map((u: string) => u.trim()) : [])];

    if (allAudioSources.length === 0 && user_music.length === 0) {
      throw new Error('No audio sources provided');
    }

    // Process audio files with stem separation
    const generatedFiles: Array<{ name: string; url: string; type: string; variantNumber?: number }> = [];

    for (let variant = 1; variant <= (demo ? 1 : variants); variant++) {
      try {
        // Step 1: Stem separation using Demucs
        let stems: { vocals?: string; drums?: string; bass?: string; other?: string } = {};
        
        for (const audioSource of allAudioSources) {
          try {
            const stemResponse = await fetch(`${DEMUCS_API_URL}/separate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio_url: audioSource,
                model: 'htdemucs',
                stems: ['vocals', 'drums', 'bass', 'other'],
              }),
            });
            const stemData = await stemResponse.json();
            stems = { ...stems, ...stemData.stems };
          } catch (error) {
            console.error('Stem separation error:', error);
          }
        }

        // Step 2: Generate meditation track with options
        const meditationTrack = await generateMeditationTrack({
          style,
          frequency: freq,
          binaural,
          bpmMatch,
          stems: keep_music_stem ? stems : undefined,
          userMusic: user_music,
          variant,
        });

        // Step 3: Save to storage
        const timestamp = Date.now();
        const fileName = `meditation-output/${user.id}/${timestamp}-variant-${variant}.mp3`;
        
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Convert base64 audio to blob and upload
        if (meditationTrack.audioBase64) {
          const audioBlob = Uint8Array.from(atob(meditationTrack.audioBase64), c => c.charCodeAt(0));
          const { error: uploadError } = await supabaseAdmin.storage
            .from('audio')
            .upload(fileName, audioBlob, {
              contentType: 'audio/mpeg',
              cacheControl: '3600',
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('audio')
            .getPublicUrl(fileName);

          generatedFiles.push({
            name: `Meditation Track - ${style} - Variant ${variant}`,
            url: publicUrl,
            type: 'final',
            variantNumber: variant,
          });

          // Also save stems if available
          if (keep_music_stem && stems.other) {
            const stemFileName = `meditation-output/${user.id}/${timestamp}-variant-${variant}-stem.mp3`;
            // Upload stem (similar process)
            generatedFiles.push({
              name: `Music Stem - Variant ${variant}`,
              url: stems.other, // In production, upload to storage
              type: 'stem',
              variantNumber: variant,
            });
          }
        }
      } catch (error) {
        console.error(`Error generating variant ${variant}:`, error);
      }
    }

    // Record demo usage
    if (demo) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseAdmin
        .from('meditation_audio_demos')
        .insert({
          user_id: user.id,
          generated_files_count: generatedFiles.length,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        files: generatedFiles,
        message: demo ? 'Demo generation complete!' : 'Generation complete!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CONVERT-MEDITATION-AUDIO] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to generate meditation track
async function generateMeditationTrack(options: {
  style: string;
  frequency: number;
  binaural: boolean;
  bpmMatch: boolean;
  stems?: any;
  userMusic?: string[];
  variant: number;
}): Promise<{ audioBase64?: string; audioUrl?: string }> {
  // In production, this would call an audio processing service
  // For now, return a placeholder that indicates processing
  // You would integrate with actual audio processing libraries here
  
  // Placeholder: In production, use actual audio processing
  return {
    audioBase64: undefined, // Would be base64 encoded audio
    audioUrl: undefined, // Or a direct URL
  };
}

