/**
 * Audio Conversion Utilities
 * 
 * These functions handle YouTube MP3 conversion and Voice-to-Text transcription
 * with proper error handling and status codes to prevent Edge Function bugs.
 */

export interface ConversionResponse {
  status: number;
  url?: string;
  text?: string;
  error?: string;
  message?: string;
}

/**
 * Convert YouTube video URL to MP3
 * 
 * @param videoUrl - YouTube video URL
 * @returns Promise with conversion response including status code
 */
export async function convertYouTubeToMP3(videoUrl: string): Promise<ConversionResponse> {
  try {
    // Validate URL format
    if (!videoUrl || typeof videoUrl !== 'string') {
      return {
        status: 400,
        error: 'Invalid video URL provided',
      };
    }

    // Check if it's a valid YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoUrl)) {
      return {
        status: 400,
        error: 'Invalid YouTube URL format',
      };
    }

    // Call Edge Function for YouTube conversion
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('creative-soul-youtube', {
      body: {
        youtubeUrl: videoUrl,
      },
    });

    if (error) {
      console.error('[convertYouTubeToMP3] Edge Function error:', error);
      return {
        status: 500,
        error: error.message || 'Failed to convert YouTube video to MP3',
      };
    }

    // Check if we got a valid response
    if (!data) {
      return {
        status: 400,
        error: 'No response from conversion service',
      };
    }

    // Edge functions now return 200 with success flag and error in body
    if (data.success === true && data.mp3Url) {
      return {
        status: 200,
        url: data.mp3Url,
        message: data.message || 'YouTube video converted to MP3 successfully',
      };
    }

    // Handle error responses (200 status with error in body)
    if (data.error || data.success === false) {
      return {
        status: 400, // Convert to 400 for frontend error handling
        error: data.error || 'Conversion failed',
        message: data.message || 'YouTube processing not yet implemented. Please use voice recording feature.',
      };
    }

    // Fallback error
    return {
      status: 500,
      error: 'Conversion completed but no MP3 URL was returned',
    };
  } catch (err: any) {
    console.error('[convertYouTubeToMP3] Exception:', err);
    return {
      status: 500,
      error: err.message || 'Failed to convert YouTube video to MP3',
    };
  }
}

/**
 * Convert audio blob to text using voice-to-text transcription
 * 
 * @param audioBlob - Audio blob from MediaRecorder or file input
 * @returns Promise with transcription response including status code
 */
export async function convertVoiceToText(audioBlob: Blob): Promise<ConversionResponse> {
  try {
    // Validate input
    if (!audioBlob || !(audioBlob instanceof Blob)) {
      return {
        status: 400,
        error: 'Invalid audio blob provided',
      };
    }

    // Check blob size (max 25MB for most transcription services)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxSize) {
      return {
        status: 400,
        error: `Audio file too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
      };
    }

    // Convert blob to base64 for Edge Function
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    // Call Edge Function for transcription
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('creative-soul-transcribe', {
      body: {
        audioBase64: base64Audio,
        mimeType: audioBlob.type || 'audio/webm',
      },
    });

    if (error) {
      console.error('[convertVoiceToText] Edge Function error:', error);
      return {
        status: 500,
        error: error.message || 'Failed to transcribe audio to text',
      };
    }

    // Check if we got a valid response
    if (!data) {
      return {
        status: 400,
        error: 'No response from transcription service',
      };
    }

    // Edge functions now return 200 with success flag and error in body
    if (data.success === true && data.text) {
      return {
        status: 200,
        text: data.text,
        message: 'Audio transcribed to text successfully',
      };
    }

    // Handle error responses (200 status with error in body)
    if (data.error || data.success === false) {
      return {
        status: 400, // Convert to 400 for frontend error handling
        error: data.error || 'Transcription failed',
        message: data.message || 'Failed to transcribe audio. Please check your access and try again.',
      };
    }

    // Fallback error
    return {
      status: 500,
      error: 'Transcription completed but no text was returned',
    };
  } catch (err: any) {
    console.error('[convertVoiceToText] Exception:', err);
    return {
      status: 500,
      error: err.message || 'Failed to convert voice to text',
    };
  }
}

/**
 * Validate audio file before processing
 * 
 * @param file - File object to validate
 * @returns Validation result with status code
 */
export function validateAudioFile(file: File): ConversionResponse {
  if (!file) {
    return {
      status: 400,
      error: 'No file provided',
    };
  }

  // Check file type
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
  ];

  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|aac|webm)$/i)) {
    return {
      status: 400,
      error: `Invalid file type. Supported formats: ${validTypes.join(', ')}`,
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      status: 400,
      error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
    };
  }

  return {
    status: 200,
    message: 'File validation passed',
  };
}

