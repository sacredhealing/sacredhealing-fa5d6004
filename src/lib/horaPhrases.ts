/** English fallbacks when `dashboard.horaPoem.*` is missing */
export const HORA_PHRASES: Record<string, string> = {
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

type DashboardT = (key: string, fallbackOrOptions?: string | Record<string, unknown>) => string;

/** Localized cosmic strip subtitle under Alignment % */
export function getLocalizedSuccessWindowPhrase(planet: string, t: DashboardT): string {
  const normalized = planet?.trim() || 'Moon';
  const fallbackPoem = HORA_PHRASES[normalized] ?? HORA_PHRASES.Moon;
  const poem = t(`dashboard.horaPoem.${normalized}`, fallbackPoem);
  return t('dashboard.horaLine', { planet: normalized, phrase: poem });
}
