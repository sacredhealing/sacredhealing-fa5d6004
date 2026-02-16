import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  order_index: number;
  vote_count?: number;
  percentage?: number;
}

export interface CommunityPoll {
  id: string;
  room_id: string;
  question: string;
  created_by: string;
  created_at: string;
  ends_at: string | null;
  options: PollOption[];
  user_vote_option_id: string | null;
}

export const useCommunityPolls = (roomId: string) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [polls, setPolls] = useState<CommunityPoll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolls = useCallback(async () => {
    if (!roomId) return;
    const { data: pollsData, error } = await supabase
      .from('community_polls')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) {
      // Tables may not exist if migration not run (e.g. Supabase only via Lovable)
      setPolls([]);
      setLoading(false);
      return;
    }

    const pollIds = pollsData?.map(p => p.id) || [];
    if (pollIds.length === 0) {
      setPolls([]);
      setLoading(false);
      return;
    }

    const { data: optionsData } = await supabase
      .from('community_poll_options')
      .select('*')
      .in('poll_id', pollIds)
      .order('order_index');

    const { data: votesData } = await supabase
      .from('community_poll_votes')
      .select('poll_id, option_id')
      .in('poll_id', pollIds)
      .eq('user_id', user?.id || '');

    const userVoteByPoll = new Map<string, string>();
    votesData?.forEach(v => userVoteByPoll.set(v.poll_id, v.option_id));

    const optionCounts = new Map<string, number>();
    const { data: allVotes } = await supabase
      .from('community_poll_votes')
      .select('option_id')
      .in('poll_id', pollIds);
    allVotes?.forEach(v => {
      optionCounts.set(v.option_id, (optionCounts.get(v.option_id) || 0) + 1);
    });

    const optionsByPoll = new Map<string, PollOption[]>();
    optionsData?.forEach(opt => {
      const list = optionsByPoll.get(opt.poll_id) || [];
      const voteCount = optionCounts.get(opt.id) || 0;
      list.push({ ...opt, vote_count: voteCount, percentage: 0 });
      optionsByPoll.set(opt.poll_id, list);
    });

    const totalVotesByPoll = new Map<string, number>();
    optionsByPoll.forEach((opts, pid) => {
      const total = opts.reduce((s, o) => s + (o.vote_count || 0), 0);
      totalVotesByPoll.set(pid, total);
    });

    const pollsWithOptions: CommunityPoll[] = (pollsData || []).map(p => {
      const options = (optionsByPoll.get(p.id) || []).map(o => ({
        ...o,
        percentage: totalVotesByPoll.get(p.id)
          ? Math.round(((o.vote_count || 0) / totalVotesByPoll.get(p.id)!) * 100)
          : 0,
      }));
      return {
        ...p,
        options,
        user_vote_option_id: userVoteByPoll.get(p.id) || null,
      };
    });

    setPolls(pollsWithOptions);
    setLoading(false);
  }, [roomId, user?.id]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const vote = async (pollId: string, optionId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('community_poll_votes').insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    });
    if (error) {
      if (error.code === '23505') return true; // already voted
      return false;
    }
    await fetchPolls();
    return true;
  };

  const createPoll = async (question: string, optionTexts: string[]) => {
    if (!user || !isAdmin || optionTexts.length < 2 || optionTexts.length > 4) return null;
    const { data: poll, error: pollError } = await supabase
      .from('community_polls')
      .insert({ room_id: roomId, question, created_by: user.id })
      .select('id')
      .single();
    if (pollError || !poll) return null;
    const opts = optionTexts.map((text, i) => ({ poll_id: poll.id, text, order_index: i }));
    const { error: optsError } = await supabase.from('community_poll_options').insert(opts);
    if (optsError) return null;
    await fetchPolls();
    return poll.id;
  };

  return { polls, loading, vote, createPoll, isAdmin, fetchPolls };
};
