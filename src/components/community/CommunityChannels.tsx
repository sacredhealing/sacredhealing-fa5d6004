import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Lock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMembership } from '@/hooks/useMembership';

interface Channel {
  id: string;
  name: string;
  description: string | null;
  channel_type: string;
  is_premium: boolean;
  member_count?: number;
  user_joined?: boolean;
}

const CommunityChannels: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium } = useMembership();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, [user, isPremium]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data: channelsData, error } = await (supabase as any)
        .from('community_channels')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;

      if (!user || !channelsData) {
        setChannels(channelsData || []);
        setLoading(false);
        return;
      }

      // Check which channels user is a member of
      const channelIds = channelsData.map(c => c.id);
      const { data: memberships } = await (supabase as any)
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id)
        .in('channel_id', channelIds);

      const joinedChannelIds = new Set(memberships?.map(m => m.channel_id) || []);

      // Get member counts
      const { data: memberCounts } = await (supabase as any)
        .from('channel_members')
        .select('channel_id')
        .in('channel_id', channelIds);

      const countsMap = new Map<string, number>();
      memberCounts?.forEach(m => {
        countsMap.set(m.channel_id, (countsMap.get(m.channel_id) || 0) + 1);
      });

      const channelsWithStatus = channelsData.map(channel => ({
        ...channel,
        member_count: countsMap.get(channel.id) || 0,
        user_joined: joinedChannelIds.has(channel.id),
      }));

      setChannels(channelsWithStatus);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChannel = async (channelId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to join channels',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('channel_members')
        .insert({
          channel_id: channelId,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You joined the channel!',
      });

      fetchChannels();
    } catch (error) {
      console.error('Error joining channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to join channel',
        variant: 'destructive',
      });
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return '📢';
      case 'support':
        return '💬';
      case 'group':
        return '👥';
      case 'premium_circle':
        return '✨';
      default:
        return '💬';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading channels...</div>;
  }

  return (
    <div className="space-y-3">
      {channels.map((channel) => {
        const canAccess = !channel.is_premium || isPremium;
        const canJoin = !channel.user_joined && canAccess;

        return (
          <Card
            key={channel.id}
            className={`p-4 transition-all bg-[rgba(212,175,55,0.03)] ${
              channel.user_joined
                ? 'border border-[rgba(212,175,55,0.2)] shadow-[0_0_20px_rgba(212,175,55,0.06),0_0_0_1px_rgba(147,51,234,0.12)]'
                : 'border border-white/10 hover:border-[rgba(212,175,55,0.15)]'
            }`}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">{getChannelIcon(channel.channel_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{channel.name}</h3>
                      {channel.is_premium && (
                        <Badge variant="default" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {channel.user_joined && (
                        <Badge variant="secondary" className="text-xs">Joined</Badge>
                      )}
                    </div>
                    {channel.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {channel.description}
                      </p>
                    )}
                    {channel.member_count !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {channel.member_count} members
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {channel.user_joined ? (
                    <Button variant="outline" size="sm" disabled>
                      Joined
                    </Button>
                  ) : canAccess ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => joinChannel(channel.id)}
                    >
                      Join
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Lock className="w-4 h-4 mr-1" />
                      Premium
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CommunityChannels;

