import { supabase } from '@/integrations/supabase/client';
import type { Interaction, ProjectState } from '@/types/vedicTranslation';

const SYSTEM_INSTRUCTION = `
Du är "Siddha-Scribe" — en helig AI-assistent som hjälper till att bygga Vishwanandas svenska bibliotek.

## DIN UPPGIFT
När användaren klistrar in TEXT från Bhagavad Gita, Guru Gita, Vishwanandas kommentar, förord eller satsang — 
oavsett om det är på engelska eller svenska — ska du AUTOMATISKT ge tillbaka strukturerat innehåll.

## ALLTID OUTPUT I DETTA FORMAT (för varje vers/avsnitt):

[[ARCHIVE_SET_TITLE chapter=N]]Kapitelns svenska titel[[/ARCHIVE_SET_TITLE]]

[[ARCHIVE_SET_SUMMARY chapter=N]]
Kort svensk sammanfattning av kapitlet (2-3 meningar, poetisk och hängiven ton).
[[/ARCHIVE_SET_SUMMARY]]

[[ARCHIVE_APPEND_COMMENTARY chapter=N]]
### Vers [nummer]

**🕉️ Sanskrit (Devanagari):**
[Korrekt Sanskrit-vers här — om du känner igen versen, skriv den. Annars: "Sanskrit ej tillgänglig"]

**🔤 Translitterering (IAST):**
[Romersk translitterering av Sanskrit-versen]

**🌹 Svensk Översättning:**
[Vacker, trogen svensk översättning i Vishwanandas anda]

**💛 Vishwanandas Kommentar:**
[2-4 meningar i Vishwanandas röst — kärleksfull, hjärtcentrerad, "Just Love"-energi. På svenska.]
[[/ARCHIVE_APPEND_COMMENTARY]]

## SANSKRIT-REGLER
- Om texten nämner en vers (t.ex. "BG 2.47", "Kapitel 4 vers 7") → hitta och skriv rätt Sanskrit
- Skriv alltid Devanagari + IAST-translitterering + svensk översättning
- Krsna (inte Krishna)

## BULK-INKLISTRING
Om användaren klistrar in flera kapitel på en gång (t.ex. "Kapitel 1: ... Kapitel 2: ..."):
→ Output ALLA taggar med rätt chapter=N för varje kapitel
→ Extrahera kapitelnummer från "Kapitel N", "Chapter N", "Adhyaya N"

## TON OCH SPRÅK
- Alltid på SVENSKA
- Vishwanandas stil: varm, hängiven, "Just Love"
- Poetisk men tydlig
- Sektionsbrytningar: 🔱

## BÖRJA ALLTID MED:
[BOK: {book} | KAPITEL: {chapter} | VERS: {verse}]
`;

export interface VedicAudioInput {
  data: string;
  mimeType: string;
}

export const generateVedicResponse = async (
  userInput: string,
  history: Interaction[],
  state: ProjectState,
  audio?: VedicAudioInput
): Promise<string> => {
  const stateContext = `[BOK: ${state.currentBook} | KAPITEL: ${state.chapter} | VERS: ${state.verse}]
UPPGIFT: Ta emot texten nedan och strukturera den med rätt arkiv-taggar. Inkludera alltid Sanskrit + svensk översättning + Vishwanandas kommentar.`;

  const lastUserContent = userInput.trim()
    ? userInput
    : audio
    ? 'Transkribera och strukturera detta röstinspelning som manuskriptinnehåll.'
    : '';

  const lastUserMessage: { role: 'user'; content: string; audio?: VedicAudioInput } = {
    role: 'user',
    content: lastUserContent,
  };
  if (audio?.data && audio?.mimeType) {
    lastUserMessage.audio = audio;
  }

  const messages = [
    {
      role: 'user',
      content: `${SYSTEM_INSTRUCTION}\n\n${stateContext}\n\nRedo att ta emot text.`,
    },
    {
      role: 'assistant',
      content: 'Förstått. Jag är Siddha-Scribe, redo att strukturera heligt innehåll på svenska med Sanskrit-verser.',
    },
    ...history.slice(-18).map((h) => ({ role: h.role, content: h.content })),
    lastUserMessage,
  ];

  const { data, error } = await supabase.functions.invoke<{ response: string }>('gemini-bridge', {
    body: { messages, feature: 'vedic_translation' },
  });

  if (error) {
    console.error('Vedic Gemini error:', error);
    return 'Fel vid kommunikation med Siddha-Scribe.';
  }

  return data?.response || 'Inget svar från Arkivet.';
};
