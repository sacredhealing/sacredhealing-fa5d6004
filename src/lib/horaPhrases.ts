/** Poetic phrases for Success Window display (e.g. "Moon Hora: Flowing with Grace") */
const HORA_PHRASES: Record<string, string> = {
  Sun: 'Radiating with purpose',
  Moon: 'Flowing with grace',
  Mars: 'Aligned with courage',
  Mercury: 'Clarity in every word',
  Jupiter: 'Expanding in wisdom',
  Venus: 'Open to beauty',
  Saturn: 'Grounded in discipline',
};

export function getSuccessWindowPhrase(planet: string): string {
  const normalized = planet?.trim() || 'Moon';
  const phrase = HORA_PHRASES[normalized] ?? HORA_PHRASES.Moon ?? 'Flowing with grace';
  return `${normalized} Hora: ${phrase}`;
}
