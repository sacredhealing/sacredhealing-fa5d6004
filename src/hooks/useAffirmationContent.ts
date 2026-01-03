import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface ContentItem {
  content_key: string;
  content: string | null;
  metadata: any;
}

export const useAffirmationContent = () => {
  const { i18n } = useTranslation();
  const [content, setContent] = useState<Record<string, ContentItem>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from('affirmation_content')
      .select('content_key, content, metadata')
      .eq('language', 'en');

    if (error) {
      console.error('Error fetching affirmation content:', error);
    } else {
      const contentMap: Record<string, ContentItem> = {};
      data?.forEach(item => {
        contentMap[item.content_key] = item;
      });
      setContent(contentMap);
    }
    setIsLoading(false);
  };

  const get = (key: string, fallback: string = ''): string => {
    return content[key]?.content || fallback;
  };

  const getMetadata = (key: string): any => {
    return content[key]?.metadata || {};
  };

  const getPrice = (key: string): { price: string; currency: string; stripeId: string } => {
    const item = content[key];
    return {
      price: item?.content || '0',
      currency: item?.metadata?.currency || 'SEK',
      stripeId: item?.metadata?.stripe_price_id || ''
    };
  };

  return { get, getMetadata, getPrice, isLoading, content };
};
