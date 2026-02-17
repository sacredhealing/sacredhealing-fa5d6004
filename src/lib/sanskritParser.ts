/**
 * Siddha-Scribe: Sanskrit Parser (Aksharamukha-style transliteration)
 * Detects Sanskrit phonemes/IAST and converts to Devanagari with Vedic accents
 */

// Extended IAST to Devanagari mapping (Vedic accents included)
const IAST_TO_DEVANAGARI_MAP: Record<string, string> = {
  // Vowels
  'a': 'अ', 'ā': 'आ', 'i': 'इ', 'ī': 'ई', 'u': 'उ', 'ū': 'ऊ',
  'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ḷ': 'ऌ', 'ḹ': 'ॡ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  
  // Consonants
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ṅ': 'ङ',
  'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ñ': 'ञ',
  'ṭ': 'ट', 'ṭh': 'ठ', 'ḍ': 'ड', 'ḍh': 'ढ', 'ṇ': 'ण',
  't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
  'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
  'ś': 'श', 'ṣ': 'ष', 's': 'स', 'h': 'ह',
  
  // Anusvara and Visarga
  'ṃ': 'ं', 'm̐': 'ं', 'ḥ': 'ः',
  
  // Special symbols
  'om': 'ॐ', 'aum': 'ॐ', 'oṁ': 'ॐ',
  
  // Vedic accents (Svara) - simplified representation
  'á': 'अ', 'í': 'इ', 'ú': 'उ', 'é': 'ए', 'ó': 'ओ',
};

// Common Sanskrit words/phrases (for detection)
const SANSKRIT_KEYWORDS = [
  'om', 'aum', 'namah', 'shivaya', 'krishna', 'brahma', 'vishnu', 'shiva',
  'deva', 'devi', 'mantra', 'shloka', 'sutra', 'veda', 'upanishad',
  'bhagavad', 'gita', 'yoga', 'dharma', 'karma', 'moksha', 'samsara',
  'nirvana', 'atman', 'brahman', 'maya', 'prakriti', 'purusha', 'guna',
  'chakra', 'kundalini', 'prana', 'asana', 'pranayama', 'dhyana', 'samadhi'
];

/**
 * Detects if text contains Sanskrit (IAST transliteration or Devanagari)
 */
export function isSanskrit(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 2) return false;
  
  // Check for Sanskrit diacritics
  if (/[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/.test(normalized)) {
    return true;
  }
  
  // Check for Devanagari script
  if (/[\u0900-\u097F]/.test(text)) {
    return true;
  }
  
  // Check for common Sanskrit keywords
  for (const keyword of SANSKRIT_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }
  
  // Check for IAST pattern (consonant-vowel sequences)
  if (/[bcdfghjklmnpqrstvwxyz][āīūṛṝḷḹēōaiou]/.test(normalized)) {
    return true;
  }
  
  return false;
}

/**
 * Converts IAST transliteration to Devanagari script
 * Simplified Aksharamukha-style conversion
 */
export function convertToDevanagari(iast: string): string {
  let devanagari = iast;
  
  // Sort by length (longest first) to handle compound sequences
  const entries = Object.entries(IAST_TO_DEVANAGARI_MAP)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [iastSeq, dev] of entries) {
    const regex = new RegExp(iastSeq, 'gi');
    devanagari = devanagari.replace(regex, dev);
  }
  
  return devanagari;
}

/**
 * Extracts Sanskrit verses from text
 */
export function extractSanskritVerses(text: string): Array<{ text: string; iast: string; devanagari: string }> {
  const verses: Array<{ text: string; iast: string; devanagari: string }> = [];
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (isSanskrit(trimmed)) {
      const devanagari = convertToDevanagari(trimmed);
      verses.push({
        text: trimmed,
        iast: trimmed,
        devanagari
      });
    }
  }
  
  return verses;
}

/**
 * Processes transcript and identifies segments as TEACHING or VERSE
 */
export interface ProcessedSegment {
  type: 'TEACHING' | 'VERSE';
  content: string;
  devanagari?: string;
  iast?: string;
  timestamp?: number;
}

export function processTranscript(transcript: string): ProcessedSegment[] {
  const segments: ProcessedSegment[] = [];
  const sentences = transcript.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (isSanskrit(trimmed)) {
      const devanagari = convertToDevanagari(trimmed);
      segments.push({
        type: 'VERSE',
        content: trimmed,
        devanagari,
        iast: trimmed
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
