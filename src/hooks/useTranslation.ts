import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type Language = 'sv' | 'en';

interface TranslationCache {
  [key: string]: string;
}

/**
 * Universal Translation Hook
 * Pulls translations from Supabase and caches them
 * Auto-detects user language from profile
 */
export const useTranslation = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>('sv');
  const [translations, setTranslations] = useState<TranslationCache>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user language preference
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (!user) {
        setLanguage('sv'); // Default
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('language')
          .eq('user_id', user.id)
          .single();

        if ((profile as any)?.language && ((profile as any).language === 'sv' || (profile as any).language === 'en')) {
          setLanguage((profile as any).language as Language);
        } else {
          setLanguage('sv'); // Default
        }
      } catch (error) {
        console.error('Error fetching user language:', error);
        setLanguage('sv'); // Fallback
      }
    };

    fetchUserLanguage();
  }, [user]);

  // Fetch translations from Supabase
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('ui_translations')
          .select('key_name, en_text, sv_text');

        if (error) {
          console.error('Error fetching translations:', error);
          setIsLoading(false);
          return;
        }

        const cache: TranslationCache = {};
        ((data || []) as any[]).forEach((item: any) => {
          cache[item.key_name] = language === 'sv' ? item.sv_text : item.en_text;
        });

        setTranslations(cache);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchTranslations:', error);
        setIsLoading(false);
      }
    };

    if (language) {
      fetchTranslations();
    }
  }, [language]);

  // Translation function
  const t = useCallback((key: string, fallback?: string): string => {
    if (translations[key]) {
      return translations[key];
    }
    
    // If translation not found, return fallback or key
    if (fallback) {
      return fallback;
    }
    
    // Try to return a readable version of the key
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [translations]);

  // Change language
  const changeLanguage = useCallback(async (newLanguage: Language) => {
    if (!user) {
      setLanguage(newLanguage);
      return;
    }

    try {
      await (supabase as any)
        .from('profiles')
        .update({ language: newLanguage })
        .eq('user_id', user.id);

      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }, [user]);

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    isSwedish: language === 'sv',
    isEnglish: language === 'en'
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
