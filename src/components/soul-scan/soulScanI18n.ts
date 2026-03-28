const CHAKRA_SLUG: Record<string, string> = {
  Root: 'root',
  Sacral: 'sacral',
  Solar: 'solar',
  Heart: 'heart',
  Throat: 'throat',
  'Third Eye': 'thirdEye',
  Crown: 'crown',
};

export function translateChakraName(name: string, t: (k: string, d?: string) => string) {
  const slug = CHAKRA_SLUG[name];
  return slug ? t(`soulScan.chakraNames.${slug}`, name) : name;
}

export function translateChakraStatus(status: string, t: (k: string, d?: string) => string) {
  return t(`soulScan.chakraStatus.${status}`, status);
}

export function translateDoshaValue(v: string, t: (k: string, d?: string) => string) {
  if (v === 'Balanced') return t('soulScan.doshaBalanced');
  if (v === 'Vata') return t('soulScan.doshaVata');
  if (v === 'Pitta') return t('soulScan.doshaPitta');
  if (v === 'Kapha') return t('soulScan.doshaKapha');
  return v;
}

export function translateNervousValue(s: string, t: (k: string, d?: string) => string) {
  if (s === 'Deep Parasympathetic') return t('soulScan.nervousDeepParasympathetic');
  if (s === 'Sympathetic Dominant') return t('soulScan.nervousSympatheticDominant');
  return s;
}

const BLOCKAGE_EN_TO_KEY: Record<string, string> = {
  'Throat/Vishuddhi Nadi': 'blockageThroat',
  'Root/Muladhara Nadi': 'blockageRoot',
  'Heart/Anahata Nadi': 'blockageHeart',
  '3rd Eye/Ajna Nadi': 'blockageThirdEye',
  'Solar Plexus/Manipura Nadi': 'blockageSolar',
};

export function translatePresentKarma(text: string, t: (k: string, o?: Record<string, unknown>) => string) {
  if (text === 'Cleared') return t('soulScan.karmaCleared');
  const prefix = 'Blockage: ';
  if (text.startsWith(prefix)) {
    const detail = text.slice(prefix.length);
    const key = BLOCKAGE_EN_TO_KEY[detail];
    const translatedDetail = key ? t(`soulScan.${key}`) : detail;
    return t('soulScan.blockagePrefix', { detail: translatedDetail });
  }
  return text;
}
