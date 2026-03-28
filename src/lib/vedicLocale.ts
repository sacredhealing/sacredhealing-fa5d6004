/** BCP 47 tag for dates/numbers on Vedic surfaces (matches profile i18n codes). */
export function vedicLocaleTag(lang: string | undefined): string {
  const base = (lang || 'en').split('-')[0] || 'en';
  switch (base) {
    case 'no':
      return 'nb-NO';
    case 'sv':
      return 'sv-SE';
    case 'es':
      return 'es-ES';
    default:
      return 'en-US';
  }
}
