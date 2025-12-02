import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Users, Sparkles, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_earned: number;
  monthly_earned: number;
  rank: number;
}

interface Stats {
  totalMembers: number;
  activeThisMonth: number;
  totalSHCDistributed: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, activeThisMonth: 0, totalSHCDistributed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monthly' | 'alltime'>('monthly');

  useEffect(() => {
    fetchLeaderboard();
    fetchStats();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    
    if (activeTab === 'alltime') {
      // All-time leaderboard from user_balances
      const { data, error } = await supabase
        .from('user_balances')
        .select(`
          user_id,
          total_earned,
          balance
        `)
        .order('total_earned', { ascending: false })
        .limit(50);

      if (!error && data) {
        // Get profiles for these users
        const userIds = data.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const leaderboardData = data.map((entry, index) => ({
          user_id: entry.user_id,
          full_name: profileMap.get(entry.user_id)?.full_name || 'Sacred Soul',
          avatar_url: profileMap.get(entry.user_id)?.avatar_url || null,
          total_earned: Number(entry.total_earned),
          monthly_earned: 0,
          rank: index + 1
        }));

        setLeaderboard(leaderboardData);
      }
    } else {
      // Monthly leaderboard from transactions this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('shc_transactions')
        .select('user_id, amount')
        .eq('type', 'earned')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      if (!error && data) {
        // Aggregate by user
        const userTotals = new Map<string, number>();
        data.forEach(tx => {
          const current = userTotals.get(tx.user_id) || 0;
          userTotals.set(tx.user_id, current + Number(tx.amount));
        });

        // Sort and get top 50
        const sortedUsers = Array.from(userTotals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50);

        if (sortedUsers.length > 0) {
          const userIds = sortedUsers.map(([userId]) => userId);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', userIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

          const leaderboardData = sortedUsers.map(([userId, monthlyEarned], index) => ({
            user_id: userId,
            full_name: profileMap.get(userId)?.full_name || 'Sacred Soul',
            avatar_url: profileMap.get(userId)?.avatar_url || null,
            total_earned: 0,
            monthly_earned: monthlyEarned,
            rank: index + 1
          }));

          setLeaderboard(leaderboardData);
        } else {
          setLeaderboard([]);
        }
      }
    }
    
    setIsLoading(false);
  };

  const fetchStats = async () => {
    // Get total members
    const { count: memberCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active members this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: activeData } = await supabase
      .from('shc_transactions')
      .select('user_id')
      .gte('created_at', startOfMonth.toISOString());

    const uniqueActiveUsers = new Set(activeData?.map(d => d.user_id) || []);

    // Get total SHC distributed
    const { data: totalData } = await supabase
      .from('user_balances')
      .select('total_earned');

    const totalDistributed = totalData?.reduce((sum, b) => sum + Number(b.total_earned), 0) || 0;

    setStats({
      totalMembers: memberCount || 0,
      activeThisMonth: uniqueActiveUsers.size,
      totalSHCDistributed: totalDistributed
    });
  };

  const getRewardBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-500', reward: '5,000 SHC', bg: 'bg-yellow-500/20' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-400', reward: '3,000 SHC', bg: 'bg-gray-400/20' };
    if (rank === 3) return { icon: Medal, color: 'text-amber-600', reward: '1,500 SHC', bg: 'bg-amber-600/20' };
    return null;
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-32">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <Trophy className="text-secondary" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">Top SHC earners & monthly rewards</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
        <Card className="p-4 text-center bg-gradient-card border-border/50">
          <Users className="w-6 h-6 mx-auto text-primary mb-2" />
          <p className="text-2xl font-heading font-bold text-foreground">{stats.totalMembers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Members</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-card border-border/50">
          <TrendingUp className="w-6 h-6 mx-auto text-accent mb-2" />
          <p className="text-2xl font-heading font-bold text-foreground">{stats.activeThisMonth.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-card border-border/50">
          <Sparkles className="w-6 h-6 mx-auto text-secondary mb-2" />
          <p className="text-2xl font-heading font-bold text-foreground">{(stats.totalSHCDistributed / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground">SHC Earned</p>
        </Card>
      </div>

      {/* Monthly Rewards Info */}
      <Card className="p-4 mb-6 bg-gradient-spiritual border-secondary/30 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Monthly Rewards</p>
            <p className="text-sm text-muted-foreground mt-1">
              Top 3 earners each month receive: 🥇 5,000 SHC • 🥈 3,000 SHC • 🥉 1,500 SHC
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <Calendar size={16} />
          This Month
        </button>
        <button
          onClick={() => setActiveTab('alltime')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'alltime'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <Trophy size={16} />
          All Time
        </button>
      </div>

      {/* Leaderboard List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : leaderboard.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-card border-border/50">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No activity yet this month</p>
          <p className="text-sm text-muted-foreground mt-1">Start earning SHC to climb the leaderboard!</p>
        </Card>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {leaderboard.map((entry, index) => {
            const rewardBadge = getRewardBadge(entry.rank);
            
            return (
              <Card
                key={entry.user_id}
                className={`p-4 bg-gradient-card border-border/50 transition-all ${
                  entry.rank <= 3 ? 'border-secondary/50' : ''
                }`}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    {getRankDisplay(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-spiritual flex items-center justify-center overflow-hidden">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-foreground/70">
                        {(entry.full_name || 'S')[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{entry.full_name || 'Sacred Soul'}</p>
                    {rewardBadge && (
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${rewardBadge.bg} mt-1`}>
                        <rewardBadge.icon className={`w-3 h-3 ${rewardBadge.color}`} />
                        <span className={`text-xs font-medium ${rewardBadge.color}`}>{rewardBadge.reward}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-heading font-bold text-secondary">
                      {(activeTab === 'monthly' ? entry.monthly_earned : entry.total_earned).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">SHC</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
