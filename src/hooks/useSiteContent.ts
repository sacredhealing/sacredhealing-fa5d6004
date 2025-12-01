import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContentMap {
  [key: string]: string;
}

export const useSiteContent = (keys: string[]) => {
  const [content, setContent] = useState<ContentMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key, content')
        .in('content_key', keys);

      if (data) {
        const map: ContentMap = {};
        data.forEach((item) => {
          map[item.content_key] = item.content;
        });
        setContent(map);
      }
      if (error) console.error('Error fetching site content:', error);
      setIsLoading(false);
    };

    if (keys.length > 0) {
      fetchContent();
    } else {
      setIsLoading(false);
    }
  }, [keys.join(',')]);

  return { content, isLoading };
};

export const useAllSiteContent = () => {
  const [content, setContent] = useState<ContentMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key, content');

      if (data) {
        const map: ContentMap = {};
        data.forEach((item) => {
          map[item.content_key] = item.content;
        });
        setContent(map);
      }
      if (error) console.error('Error fetching site content:', error);
      setIsLoading(false);
    };

    fetchContent();
  }, []);

  return { content, isLoading };
};
