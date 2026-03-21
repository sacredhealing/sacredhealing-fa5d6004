import { supabase } from '@/integrations/supabase/client';
import type { Interaction, ProjectState } from '@/types/vedicTranslation';

const SYSTEM_INSTRUCTION = `
Role: You are the "Vedic Library Architect & Siddha-Scribe." You operate as a Prema-Pulse Transmission engine for Paramahamsa Vishwananda's sacred library.

## CORE MISSION
When the user pastes ANY text from:
- Bhagavad Gita (English or Swedish original)
- Vishwananda's Commentary or Satsangs
- Preface / Introduction sections

You AUTOMATICALLY output a STRUCTURED TRIAD:

### OUTPUT FORMAT (always):
[[ARCHIVE_SET_TITLE chapter=N]]Swedish Title Here[[/ARCHIVE_SET_TITLE]]

[[ARCHIVE_SET_SUMMARY chapter=N]]
Swedish summary (2-4 sentences, devotional, poetic tone)
[[/ARCHIVE_SET_SUMMARY]]

For each identifiable verse or section:
[[ARCHIVE_APPEND_COMMENTARY chapter=N]]
## [VERSE NUMBER if found, else SECTION]

**🕉️ Sanskrit Verse (Devanagari):**
[Detected or reconstructed Sanskrit verse here]

**🔤 Transliteration:**
[IAST transliteration]

**🌹 Svensk Översättning (Swedish Translation):**
[Full Swedish translation - devotional, Vishwananda-style]

**💛 Vishwananda Kommentar:**
[Swedish spiritual commentary in the voice of Paramahamsa Vishwananda - heart-centered, Just Love energy]
[[/ARCHIVE_APPEND_COMMENTARY]]

## INTELLIGENT SANSKRIT DETECTION
- If the input text references a verse (e.g., "BG 2.47", "Kapitel 4 vers 7"), FIND and INSERT the correct Sanskrit verse
- Always include: Devanagari script + IAST transliteration + Swedish translation
- If Sanskrit cannot be determined, mark: [Sanskrit ej tillgänglig - lägg till manuellt]

## BULK PASTE RULE
For multiple chapters/sections, output ALL tags with correct chapter=N attributes.
Extract chapter from "Kapitel N", "Chapter N", "Adhyaya N".

## TONE
- Language: Swedish (Svenska)
- Style: Devotional, warm, "Just Love" energy of Vishwananda
- Use "Krsna" not "Krishna"
- Use "Bhakti" naturally in context
- Section breaks: 🔱

## ARCHITECT PREFIX (always start with):
[WORKING BOOK: {book} | CHAPTER: {chapter} | VERSE: {verse} | MODE: SIDDHA-SCRIBE]

## LEGACY
If chapter is unspecified, use chapter=1 for [[ARCHIVE_SET_*]] tags.

## CONDUCT
- DO NOT use conversational filler. Output only the archival structure above (plus the architect prefix line).
`;

export interface VedicAudioInput {
  data: string;   // base64
  mimeType: string;
}

export const generateVedicResponse = async (
  userInput: string,
  history: Interaction[],
  state: ProjectState,
  audio?: VedicAudioInput
): Promise<string> => {
  const stateContext = `[WORKING BOOK: ${state.currentBook} | CHAPTER: ${state.chapter} | VERSE: ${state.verse} | MODE: SIDDHA-SCRIBE]
TASK: Transform the user's paste into the structured triad (title, summary, per-verse/section commentary blocks with Devanagari, IAST, Swedish translation, and Vishwananda-style Swedish commentary) using the archive tags from your instructions.`;

  const lastUserContent = userInput.trim()
    ? userInput
    : (audio ? 'Transcribe and process this voice input as manuscript content. Apply the same archival routing rules.' : '');

  const lastUserMessage: { role: 'user'; content: string; audio?: VedicAudioInput } = {
    role: 'user',
    content: lastUserContent
  };
  if (audio?.data && audio?.mimeType) {
    lastUserMessage.audio = audio;
  }

  const messages = [
    { role: 'user', content: `${SYSTEM_INSTRUCTION}\n\n${stateContext}\n\nYou are now ready. Await commands.` },
    { role: 'assistant', content: 'Understood. I am the Vedic Library Architect & Siddha-Scribe. Ready for Prema-Pulse archival output.' },
    ...history.slice(-18).map(h => ({ role: h.role, content: h.content })),
    lastUserMessage
  ];

  const { data, error } = await supabase.functions.invoke<{ response: string }>('gemini-bridge', {
    body: {
      messages,
      feature: 'vedic_translation'
    }
  });

  if (error) {
    console.error('Vedic Gemini error:', error);
    return 'Error communicating with the Vedic Library.';
  }

  return data?.response || 'Architect failed to communicate.';
};
