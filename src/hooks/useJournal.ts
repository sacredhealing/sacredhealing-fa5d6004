import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHC } from '@/contexts/SHCContext';
import { toast } from 'sonner';

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  prompt: string | null;
  content: string;
  mood: number | null;
  gratitude_items: string[] | null;
  path_day_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useJournal = () => {
  const { user } = useAuth();
  const { earnSHC } = useSHC();
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ['journal-entries', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!user,
  });

  const todayEntryQuery = useQuery({
    queryKey: ['journal-entry-today', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as JournalEntry | null;
    },
    enabled: !!user,
  });

  const createEntry = useMutation({
    mutationFn: async ({
      content,
      prompt,
      mood,
      gratitudeItems,
      pathDayId,
    }: {
      content: string;
      prompt?: string;
      mood?: number;
      gratitudeItems?: string[];
      pathDayId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_journal_entries')
        .insert({
          user_id: user.id,
          entry_date: today,
          content,
          prompt: prompt || null,
          mood: mood || null,
          gratitude_items: gratitudeItems || null,
          path_day_id: pathDayId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Award SHC for journaling
      await earnSHC(10, 'Journal entry completed');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry-today'] });
      toast.success('Journal saved! +10 SHC 📝');
    },
    onError: (error) => {
      console.error('Error saving journal:', error);
      toast.error('Failed to save journal entry');
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({
      id,
      content,
      mood,
      gratitudeItems,
    }: {
      id: string;
      content?: string;
      mood?: number;
      gratitudeItems?: string[];
    }) => {
      const updates: Partial<JournalEntry> = {};
      if (content !== undefined) updates.content = content;
      if (mood !== undefined) updates.mood = mood;
      if (gratitudeItems !== undefined) updates.gratitude_items = gratitudeItems;

      const { error } = await supabase
        .from('user_journal_entries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry-today'] });
      toast.success('Journal updated');
    },
  });

  return {
    entries: entriesQuery.data || [],
    todayEntry: todayEntryQuery.data,
    isLoading: entriesQuery.isLoading,
    createEntry,
    updateEntry,
  };
};
