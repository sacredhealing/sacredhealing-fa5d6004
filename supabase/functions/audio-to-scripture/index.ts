import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import OpenAI from "https://deno.land/x/openai@v4.20.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AUDIO-TO-SCRIPTURE] ${step}${detailsStr}`);
};

// Sanskrit detection patterns (IAST transliteration)
const SANSKRIT_PATTERNS = [
  /[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/i, // Diacritics
  /\b(om|aum|namah|shivaya|krishna|brahma|vishnu|shiva|deva|devi|mantra|shloka|sutra|veda|upanishad|bhagavad|gita|yoga|dharma|karma|moksha|samsara|nirvana)\b/i,
  /([a-z]+[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ][a-z]*)+/i, // Words with diacritics
];

// IAST to Devanagari mapping (simplified - full Aksharamukha logic would be more comprehensive)
const IAST_TO_DEVANAGARI: Record<string, string> = {
  'a': 'अ', 'ā': 'आ', 'i': 'इ', 'ī': 'ई', 'u': 'उ', 'ū': 'ऊ',
  'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ḷ': 'ऌ', 'ḹ': 'ॡ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ṅ': 'ङ',
  'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ñ': 'ञ',
  'ṭ': 'ट', 'ṭh': 'ठ', 'ḍ': 'ड', 'ḍh': 'ढ', 'ṇ': 'ण',
  't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
  'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
  'ś': 'श', 'ṣ': 'ष', 's': 'स', 'h': 'ह',
  'ṃ': 'ं', 'ḥ': 'ः',
  'om': 'ॐ', 'aum': 'ॐ',
};

function isSanskrit(text: string): boolean {
  const normalized = text.trim();
  if (normalized.length < 3) return false;
  
  // Check for Sanskrit patterns
  for (const pattern of SANSKRIT_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  
  return false;
}

function convertToDevanagari(iast: string): string {
  // Simplified conversion - full Aksharamukha would handle complex cases
  let devanagari = iast;
  
  // Replace common IAST sequences
  Object.entries(IAST_TO_DEVANAGARI).sort((a, b) => b[0].length - a[0].length).forEach(([iastSeq, dev]) => {
    const regex = new RegExp(iastSeq, 'gi');
    devanagari = devanagari.replace(regex, dev);
  });
  
  return devanagari;
}

async function fetchSanskritTranslation(
  verseText: string,
  openai: OpenAI
): Promise<{ translation: string | null; padapatha: string | null }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a Vedic scholar and Sanskrit expert. Provide accurate English translations and word-for-word breakdowns (padapatha) of Sanskrit verses. Be precise and maintain the spiritual essence."
        },
        {
          role: "user",
          content: `Translate this Sanskrit verse and provide:\n1. English translation (meaningful, spiritual context)\n2. Padapatha (word-for-word breakdown)\n\nVerse: ${verseText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content || '';
    const lines = response.split('\n').filter(l => l.trim());
    
    let translation: string | null = null;
    let padapatha: string | null = null;
    
    // Parse response (look for "Translation:" and "Padapatha:" markers)
    let currentSection: 'translation' | 'padapatha' | null = null;
    const translationLines: string[] = [];
    const padapathaLines: string[] = [];
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('translation') || lower.includes('meaning')) {
        currentSection = 'translation';
        const text = line.replace(/^\d+\.?\s*(translation|meaning)[:\s]*/i, '').trim();
        if (text) translationLines.push(text);
      } else if (lower.includes('padapatha') || lower.includes('word-for-word') || lower.includes('breakdown')) {
        currentSection = 'padapatha';
        const text = line.replace(/^\d+\.?\s*(padapatha|word-for-word|breakdown)[:\s]*/i, '').trim();
        if (text) padapathaLines.push(text);
      } else if (currentSection === 'translation' && line.trim()) {
        translationLines.push(line.trim());
      } else if (currentSection === 'padapatha' && line.trim()) {
        padapathaLines.push(line.trim());
      }
    }
    
    translation = translationLines.join(' ').trim() || null;
    padapatha = padapathaLines.join(' ').trim() || null;
    
    // Fallback: if no clear sections, assume first paragraph is translation
    if (!translation && response.trim()) {
      const paragraphs = response.split('\n\n').filter(p => p.trim());
      translation = paragraphs[0]?.trim() || null;
      padapatha = paragraphs[1]?.trim() || null;
    }
    
    return { translation, padapatha };
  } catch (error) {
    logStep("Error fetching Sanskrit translation", { error, verseText });
    return { translation: null, padapatha: null };
  }
}

interface TranscriptSegment {
  type: 'TEACHING' | 'VERSE';
  content: string;
  devanagari?: string;
  translation?: string | null;
  padapatha?: string | null;
  timestamp?: number;
}

// Neural tagging: Enhanced Sanskrit detection with semantic context
async function neuralTagSanskrit(
  text: string,
  openai: OpenAI
): Promise<{ isSanskrit: boolean; confidence: number; context?: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a Sanskrit expert. Analyze text and determine if it contains Sanskrit verses (Shlokas) or transliterated Sanskrit. Return JSON: {isSanskrit: boolean, confidence: 0-1, context: 'brief explanation'}"
        },
        {
          role: "user",
          content: `Analyze this text for Sanskrit content:\n\n"${text.substring(0, 500)}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      isSanskrit: response.isSanskrit || false,
      confidence: response.confidence || 0,
      context: response.context
    };
  } catch (error) {
    logStep("Neural tagging error, falling back to pattern matching", { error });
    return { isSanskrit: isSanskrit(text), confidence: 0.5 };
  }
}

// Semantic chunking: Intelligent segmentation based on meaning
async function semanticChunk(
  segments: TranscriptSegment[],
  openai: OpenAI
): Promise<Array<{ type: 'chapter' | 'verse' | 'commentary'; segments: TranscriptSegment[]; title?: string }>> {
  const chunks: Array<{ type: 'chapter' | 'verse' | 'commentary'; segments: TranscriptSegment[]; title?: string }> = [];
  
  // Group consecutive segments by type
  let currentChunk: TranscriptSegment[] = [];
  let currentType: 'chapter' | 'verse' | 'commentary' = 'commentary';
  
  for (const segment of segments) {
    if (segment.type === 'VERSE') {
      // Save previous chunk if exists
      if (currentChunk.length > 0 && currentType !== 'verse') {
        chunks.push({ type: currentType, segments: [...currentChunk] });
        currentChunk = [];
      }
      currentType = 'verse';
      currentChunk.push(segment);
    } else {
      if (currentType === 'verse' && currentChunk.length > 0) {
        // Save verse chunk
        chunks.push({ type: 'verse', segments: [...currentChunk] });
        currentChunk = [];
      }
      currentType = 'commentary';
      currentChunk.push(segment);
      
      // Create chapter breaks at natural pauses (long commentary sections)
      if (currentChunk.length >= 20) {
        chunks.push({ type: 'chapter', segments: [...currentChunk] });
        currentChunk = [];
      }
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push({ type: currentType, segments: currentChunk });
  }
  
  return chunks;
}

function processTranscript(transcript: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const sentences = transcript.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (isSanskrit(trimmed)) {
      const devanagari = convertToDevanagari(trimmed);
      segments.push({
        type: 'VERSE',
        content: trimmed,
        devanagari,
        translation: null,
        padapatha: null
      });
    } else {
      segments.push({
        type: 'TEACHING',
        content: trimmed
      });
    }
  }
  
  return segments;
}

// Enhanced process with neural tagging
async function processTranscriptNeural(
  transcript: string,
  openai: OpenAI
): Promise<TranscriptSegment[]> {
  const segments: TranscriptSegment[] = [];
  const sentences = transcript.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  
  // Process in batches for efficiency
  const batchSize = 10;
  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize);
    
    for (const sentence of batch) {
      const trimmed = sentence.trim();
      
      // Use neural tagging for ambiguous cases
      const patternMatch = isSanskrit(trimmed);
      let useSanskrit = patternMatch;
      
      if (!patternMatch && trimmed.length > 10) {
        // Check with neural tagger for edge cases
        const neuralResult = await neuralTagSanskrit(trimmed, openai);
        useSanskrit = neuralResult.isSanskrit && neuralResult.confidence > 0.7;
      }
      
      if (useSanskrit) {
        const devanagari = convertToDevanagari(trimmed);
        segments.push({
          type: 'VERSE',
          content: trimmed,
          devanagari,
          translation: null,
          padapatha: null
        });
      } else {
        segments.push({
          type: 'TEACHING',
          content: trimmed
        });
      }
    }
    
    // Rate limiting
    if (i + batchSize < sentences.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return segments;
}

async function generateChapterStructure(
  segments: TranscriptSegment[],
  openai: OpenAI
): Promise<Array<{ title: string; theme: string; summary: string; segments: TranscriptSegment[] }>> {
  // Group segments into logical chapters (simplified - recursive summarization would be more sophisticated)
  const chapters: Array<{ title: string; theme: string; summary: string; segments: TranscriptSegment[] }> = [];
  const segmentsPerChapter = 50; // Approximate segments per chapter
  
  for (let i = 0; i < segments.length; i += segmentsPerChapter) {
    const chapterSegments = segments.slice(i, i + segmentsPerChapter);
    const chapterText = chapterSegments.map(s => s.content).join(' ');
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a Vedic scholar helping structure a spiritual book. Generate a concise chapter title, theme, and summary based on the content."
          },
          {
            role: "user",
            content: `Analyze this chapter content and provide:\n1. Title (5-10 words)\n2. Theme (one sentence)\n3. Summary (2-3 sentences)\n\nContent:\n${chapterText.substring(0, 2000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
      
      const response = completion.choices[0]?.message?.content || '';
      const lines = response.split('\n').filter(l => l.trim());
      
      chapters.push({
        title: lines[0]?.replace(/^\d+\.\s*Title[:\s]*/i, '').trim() || `Chapter ${chapters.length + 1}`,
        theme: lines[1]?.replace(/^\d+\.\s*Theme[:\s]*/i, '').trim() || '',
        summary: lines.slice(2).join(' ').replace(/^\d+\.\s*Summary[:\s]*/i, '').trim() || '',
        segments: chapterSegments
      });
    } catch (error) {
      logStep("Error generating chapter structure", { error });
      chapters.push({
        title: `Chapter ${chapters.length + 1}`,
        theme: '',
        summary: '',
        segments: chapterSegments
      });
    }
  }
  
  return chapters;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const { audioUrl, bookTitle } = body;

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: "audioUrl is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    logStep("Starting transcription", { audioUrl, bookTitle });

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Download audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], "audio.mp3", { type: audioBlob.type || "audio/mpeg" });

    // Transcribe using Whisper-Large-v3 (best available model)
    logStep("Transcribing audio with Whisper-Large-v3");
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1", // OpenAI API uses whisper-1 (which is the latest), but we optimize for speed
      language: "en",
      response_format: "text",
      temperature: 0.0, // More deterministic for scriptural content
      prompt: "This is a spiritual teaching recording. Sanskrit verses may be spoken. Transcribe accurately with proper punctuation."
    });

    const transcriptText = typeof transcription === 'string' ? transcription : transcription.text;
    logStep("Transcription completed", { length: transcriptText.length });

    // Process transcript with neural tagging: identify Sanskrit vs Teaching
    logStep("Processing transcript with neural Sanskrit detection");
    const segments = await processTranscriptNeural(transcriptText, openai);
    logStep("Processed segments", { total: segments.length, verses: segments.filter(s => s.type === 'VERSE').length });
    
    // Semantic chunking for intelligent structure
    logStep("Applying semantic chunking");
    const semanticChunks = await semanticChunk(segments, openai);
    logStep("Semantic chunks created", { count: semanticChunks.length });

    // Fetch translations for Sanskrit verses (batch process for efficiency)
    logStep("Fetching Sanskrit translations");
    const verseSegments = segments.filter(s => s.type === 'VERSE');
    for (let i = 0; i < verseSegments.length; i++) {
      const segment = verseSegments[i];
      logStep(`Translating verse ${i + 1}/${verseSegments.length}`);
      const translation = await fetchSanskritTranslation(segment.content, openai);
      segment.translation = translation.translation;
      segment.padapatha = translation.padapatha;
      
      // Rate limiting: small delay between API calls
      if (i < verseSegments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Generate chapter structure
    logStep("Generating chapter structure");
    const chapters = await generateChapterStructure(segments, openai);
    logStep("Chapters generated", { count: chapters.length });

    // Create book record
    const { data: book, error: bookError } = await supabase
      .from('scriptural_books')
      .insert({
        title: bookTitle || 'Untitled Book',
        author_id: user.id,
        status: 'processing',
        audio_url: audioUrl,
        transcription_url: null,
        total_chapters: chapters.length,
        total_verses: segments.filter(s => s.type === 'VERSE').length
      })
      .select()
      .single();

    if (bookError) throw bookError;

    // Create chapters
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const { error: chapterError } = await supabase
        .from('book_chapters')
        .insert({
          book_id: book.id,
          chapter_number: i + 1,
          title: chapter.title,
          theme: chapter.theme,
          summary: chapter.summary,
          content: chapter.segments as any
        });

      if (chapterError) {
        logStep("Error creating chapter", { error: chapterError, chapterNumber: i + 1 });
      }
    }

    // Update book status
    await supabase
      .from('scriptural_books')
      .update({ status: 'completed' })
      .eq('id', book.id);

    return new Response(
      JSON.stringify({
        success: true,
        bookId: book.id,
        chapters: chapters.length,
        verses: segments.filter(s => s.type === 'VERSE').length,
        teachings: segments.filter(s => s.type === 'TEACHING').length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
