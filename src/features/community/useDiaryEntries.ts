import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry } from "./diaryTypes";

export function useDiaryEntries(refreshKey: number = 0) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiaryEntries = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          diary_title,
          diary_type,
          content,
          created_at,
          user_id
        `)
        .eq('post_type', 'diary')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching diary entries:', error);
        setIsLoading(false);
        return;
      }

      const diaryEntries: DiaryEntry[] = (data || []).map((post: any) => ({
        id: post.id,
        type: (post.diary_type || 'daily') as DiaryEntry['type'],
        title: post.diary_title || '',
        body: post.content || '',
        createdAt: post.created_at,
        author: 'admin' as const,
      }));

      setEntries(diaryEntries);
      setIsLoading(false);
    };

    fetchDiaryEntries();
  }, [refreshKey]);

  return { entries, isLoading };
}
