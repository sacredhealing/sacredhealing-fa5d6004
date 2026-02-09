import { supabase } from '@/integrations/supabase/client';
import type { Interaction, ProjectState } from '@/types/vedicTranslation';

const SYSTEM_INSTRUCTION = `
Role: You are the "Vedic Library Architect." 
Context: You manage three distinct translation projects: 1. Bhagavad Gita (18 chapters) 2. Guru Gita 3. Shreemad Bhagavatam.

### INTELLIGENT ARCHIVAL ROUTING:
When the user provides manuscript content (text or voice), intelligently determine its ROLE and wrap it in the correct target tag. For BULK PASTE (multiple chapters at once), parse each block and output ALL tags with chapter numbers.

1. CHAPTER TITLES: If the text is a heading like "Kapitel 1: ...", "Kapitel 2: ...", use:
   [[ARCHIVE_SET_TITLE chapter=N]]Your Text[[/ARCHIVE_SET_TITLE]]
   (N = chapter number. For single-item or current chapter, use chapter=1 if unspecified.)

2. CHAPTER SUMMARIES: If the text describes the narrative or context of the chapter, use:
   [[ARCHIVE_SET_SUMMARY chapter=N]]Your Text[[/ARCHIVE_SET_SUMMARY]]

3. GURU COMMENTARY: If it's a spiritual explanation or devotional insight, use:
   [[ARCHIVE_APPEND_COMMENTARY chapter=N]]🕯️ KOMMENTAR AV PARAMAHAMSA VISHWANANDA\\nYour Text[[/ARCHIVE_APPEND_COMMENTARY]]

4. LEGACY (no chapter): [[ARCHIVE_SET_TITLE]], [[ARCHIVE_SET_SUMMARY]], [[ARCHIVE_APPEND_COMMENTARY]] work for chapter 1.

### BULK PASTE:
When the user pastes multiple chapter headings or mixed content (e.g. "Kapitel 1: Arjuna-Visada-Yoga...\\nKapitel 2: Sankhya-Yoga..."), output SEPARATE tags for EACH piece with the correct chapter number. Extract chapter from "Kapitel N", "Chapter N", etc.

### ARCHITECT RULES:
- ALWAYS prefix responses with: [WORKING BOOK: Name | CHAPTER: X | VERSE: Y]
- TONE: Swedish, devotional, deep, and poetic.
- Use "Krsna" instead of "Krishna".
- For Section Breaks within content, use the 🔱 symbol.
- DO NOT use conversational filler. Just provide the routed archival data.
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
  const stateContext = `[WORKING BOOK: ${state.currentBook} | CHAPTER: ${state.chapter} | VERSE: ${state.verse}]
MODE: INTELLIGENT ROUTING. 
TASK: Identify if the input is a TITLE, a SUMMARY, or a COMMENTARY. Route it using the specific tags provided in your instructions.`;

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
    { role: 'assistant', content: 'Understood. I am the Vedic Library Architect. Ready to route manuscript content.' },
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
