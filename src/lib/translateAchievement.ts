import { TFunction } from 'i18next';

/**
 * Translates achievement name and description based on slug
 */
export const translateAchievement = (
  slug: string,
  t: TFunction,
  fallbackName?: string,
  fallbackDescription?: string
): { name: string; description: string } => {
  const nameKey = `achievements.${slug}.name`;
  const descriptionKey = `achievements.${slug}.description`;
  
  const translatedName = t(nameKey);
  const translatedDescription = t(descriptionKey);
  
  return {
    name: translatedName !== nameKey ? translatedName : (fallbackName || slug),
    description: translatedDescription !== descriptionKey ? translatedDescription : (fallbackDescription || ''),
  };
};
