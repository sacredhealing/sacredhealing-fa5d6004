import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

// Cache translations to avoid repeated API calls
const translationCache = new Map<string, string>();

export const useTranslateContent = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const translateText = useCallback(async (text: string, targetLang?: string): Promise<string> => {
    const lang = targetLang || currentLanguage;
    
    // If already in English or target is English, return as-is
    if (lang === 'en' || !text || text.trim() === '') {
      return text;
    }

    // Check cache first
    const cacheKey = `${lang}:${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { text, targetLanguage: lang }
      });

      if (error) {
        console.error('Translation error:', error);
        return text;
      }

      const translatedText = data?.translatedText || text;
      
      // Cache the result
      translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }, [currentLanguage]);

  // Batch translate multiple texts at once
  const translateBatch = useCallback(async (texts: string[], targetLang?: string): Promise<string[]> => {
    const lang = targetLang || currentLanguage;
    
    if (lang === 'en') {
      return texts;
    }

    const results = await Promise.all(texts.map(text => translateText(text, lang)));
    return results;
  }, [currentLanguage, translateText]);

  return { translateText, translateBatch, currentLanguage };
};

// Hook for translating a single piece of content
export const useTranslatedText = (text: string) => {
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const { translateText, currentLanguage } = useTranslateContent();

  useEffect(() => {
    let isMounted = true;
    
    const doTranslate = async () => {
      if (!text || currentLanguage === 'en') {
        setTranslatedText(text);
        return;
      }
      
      setIsLoading(true);
      const result = await translateText(text);
      if (isMounted) {
        setTranslatedText(result);
        setIsLoading(false);
      }
    };

    doTranslate();
    
    return () => {
      isMounted = false;
    };
  }, [text, currentLanguage, translateText]);

  return { text: translatedText, isLoading };
};

// Hook for translating multiple items (like product lists)
export const useTranslatedItems = <T extends Record<string, any>>(
  items: T[],
  fieldsToTranslate: (keyof T)[]
) => {
  const [translatedItems, setTranslatedItems] = useState<T[]>(items);
  const [isLoading, setIsLoading] = useState(false);
  const { translateText, currentLanguage } = useTranslateContent();

  useEffect(() => {
    let isMounted = true;

    const doTranslate = async () => {
      if (currentLanguage === 'en' || items.length === 0) {
        setTranslatedItems(items);
        return;
      }

      setIsLoading(true);

      const translated = await Promise.all(
        items.map(async (item) => {
          const translatedFields: Partial<T> = {};
          
          for (const field of fieldsToTranslate) {
            const value = item[field];
            if (typeof value === 'string' && value.trim()) {
              translatedFields[field] = await translateText(value) as T[keyof T];
            }
          }

          return { ...item, ...translatedFields };
        })
      );

      if (isMounted) {
        setTranslatedItems(translated);
        setIsLoading(false);
      }
    };

    doTranslate();

    return () => {
      isMounted = false;
    };
  }, [items, currentLanguage, translateText, fieldsToTranslate.join(',')]);

  return { items: translatedItems, isLoading };
};
