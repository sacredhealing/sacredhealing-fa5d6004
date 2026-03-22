/** BCP-47 locale for Web Speech API from app language (profile / i18n). */
const SPEECH_BY_LANG: Record<string, string> = {
  en: 'en-US',
  sv: 'sv-SE',
  no: 'nb-NO',
  es: 'es-ES',
};

export function chatSpeechLocale(lang: string | undefined): string {
  const base = (lang || 'en').split('-')[0] || 'en';
  return SPEECH_BY_LANG[base] || 'en-US';
}
