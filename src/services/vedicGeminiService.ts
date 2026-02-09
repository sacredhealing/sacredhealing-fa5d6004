import { supabase } from '@/integrations/supabase/client';
import type { Interaction, ProjectState } from '@/types/vedicTranslation';

const SYSTEM_INSTRUCTION = `
Role: You are the "Vedic Library Architect." 
Context: You manage three distinct translation projects: 1. Bhagavad Gita 2. Guru Gita 3. Shreemad Bhagavatam.

### INTELLIGENT ARCHIVAL ROUTING:
When the user provides manuscript content (text or voice), you must intelligently determine its ROLE and wrap it in the correct target tag:

1. CHAPTER TITLES: If the text is a heading like "Kapitel 1: ...", use:
   [[ARCHIVE_SET_TITLE]]Your Text[[/ARCHIVE_SET_TITLE]]

2. CHAPTER SUMMARIES: If the text describes the narrative or context of the chapter, use:
   [[ARCHIVE_SET_SUMMARY]]Your Text[[/ARCHIVE_SET_SUMMARY]]

3. GURU COMMENTARY: If it's a spiritual explanation or devotional insight, use:
   [[ARCHIVE_APPEND_COMMENTARY]]🕯️ KOMMENTAR AV PARAMAHAMSA VISHWANANDA\\nYour Text[[/ARCHIVE_APPEND_COMMENTARY]]

### ARCHITECT RULES:
- ALWAYS prefix responses with: [WORKING BOOK: Name | CHAPTER: X | VERSE: Y]
- TONE: Swedish, devotional, deep, and poetic.
- Use "Krsna" instead of "Krishna".
- For Section Breaks within content, use the 🔱 symbol.
- DO NOT use conversational filler like "Here is your update". Just provide the routed archival data.
`;

export const generateVedicResponse = async (
  userInput: string,
  history: Interaction[],
  state: ProjectState
): Promise<string> => {
  const stateContext = `[WORKING BOOK: ${state.currentBook} | CHAPTER: ${state.chapter} | VERSE: ${state.verse}]
MODE: INTELLIGENT ROUTING. 
TASK: Identify if the input is a TITLE, a SUMMARY, or a COMMENTARY. Route it using the specific tags provided in your instructions.`;

  const messages = [
    { role: 'user', content: `${SYSTEM_INSTRUCTION}\n\n${stateContext}\n\nYou are now ready. Await commands.` },
    { role: 'assistant', content: 'Understood. I am the Vedic Library Architect. Ready to route manuscript content.' },
    ...history.slice(-18).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userInput }
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
