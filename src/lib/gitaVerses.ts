/**
 * Bhagavad Gita Oracle - Jyotish-synced verses
 * Maps planetary cycles to Gita verses (Bhrigu Vision)
 */

export interface GitaVerse {
  chapter: number;
  verse: number;
  sanskrit: string; // Devanagari
  transliteration: string;
  producersTranslation: string;
}

export const GITA_VERSES: Record<string, GitaVerse> = {
  Rahu: {
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतurb् भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    transliteration: 'karmaṇy-evādhikāras te mā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi',
    producersTranslation: 'You have the right to work, but never to the fruit of work. Work without attachment. Don\'t be driven by results. Stay free from inaction.',
  },
  Shukra: {
    chapter: 10,
    verse: 41,
    sanskrit: 'यद्यद्विभूतिमत्सत्त्वं श्रीमदूर्जितमेव वा। तत्तदेवावगच्छ त्वं मम तेजोंऽशसंभवम्॥',
    transliteration: 'yad yad vibhūtimat sattvaṁ śhrīmad ūrjitam eva vā\ntat tad evāvagachchha tvaṁ mama tejo-’ṁśha-sambhavam',
    producersTranslation: 'Whatever is glorious, prosperous, or powerful—know that it springs from a fragment of My splendor. All beauty, all art, all abundance flows from Me.',
  },
  Guru: {
    chapter: 4,
    verse: 34,
    sanskrit: 'तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया। उपदेक्ष्यन्ति ते ज्ञानं ज्ञानिनस्तत्त्वदर्शिनः॥',
    transliteration: 'tad viddhi praṇipātena paripraśhnena sevayā\nupadekṣhyanti te jñānaṁ jñāninas tattva-darśhinaḥ',
    producersTranslation: 'Learn that truth by approaching a realized master. Inquire with humility and serve. Those who have seen the truth will share it with you.',
  },
  // Fallback for other planets (use Guru's verse)
  default: {
    chapter: 4,
    verse: 34,
    sanskrit: 'तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया। उपदेक्ष्यन्ति ते ज्ञानं ज्ञानिनस्तत्त्वदर्शिनः॥',
    transliteration: 'tad viddhi praṇipātena paripraśhnena sevayā\nupadekṣhyanti te jñānaṁ jñāninas tattva-darśhinaḥ',
    producersTranslation: 'Learn that truth by approaching a realized master. Inquire with humility and serve. Those who have seen the truth will share it with you.',
  },
};

/**
 * Get Gita verse based on Jyotish cycle
 * @param cycle - Planet name from Jyotish (Rahu, Shukra/Venus, Guru/Jupiter, etc.)
 */
export function getGitaVerseForCycle(cycle: string | null | undefined): GitaVerse {
  if (!cycle) return GITA_VERSES.default;
  
  const normalized = cycle.toLowerCase().trim();
  
  // Map variations
  if (normalized === 'rahu') return GITA_VERSES.Rahu;
  if (normalized === 'shukra' || normalized === 'venus') return GITA_VERSES.Shukra;
  if (normalized === 'guru' || normalized === 'jupiter') return GITA_VERSES.Guru;
  
  return GITA_VERSES.default;
}
