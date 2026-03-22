/**
 * useTranslation - delegates to react-i18next so that all 4 languages
 * (en, sv, es, no) selected in the user's profile are reflected
 * everywhere in the app.
 */
import { useCallback } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t: i18nT, i18n } = useI18nTranslation();

  // Supports t(key), t(key, fallback), or t(key, { defaultValue, ...interpolation })
  const t = useCallback(
    (key: string, fallbackOrOptions?: string | Record<string, unknown>): string => {
      if (fallbackOrOptions === undefined) {
        return i18nT(key) as string;
      }
      if (typeof fallbackOrOptions === 'string') {
        const result = i18nT(key, { defaultValue: fallbackOrOptions });
        if (result === key) return fallbackOrOptions;
        return result as string;
      }
      return i18nT(key, fallbackOrOptions) as string;
    },
    [i18nT]
  );

  const changeLanguage = useCallback(
    async (lang: string) => {
      await i18n.changeLanguage(lang);
    },
    [i18n]
  );

  const language = (i18n.language || 'en').split('-')[0];

  return {
    t,
    language,
    changeLanguage,
    isLoading: false,
    isSwedish: language === 'sv',
    isEnglish: language === 'en',
  };
};

/**
 * Translation component wrapper for easy usage
 */
import React from 'react';

export const T: React.FC<{ k: string; fallback?: string }> = ({ k, fallback }) => {
  const { t } = useTranslation();
  return React.createElement(React.Fragment, null, t(k, fallback));
};
