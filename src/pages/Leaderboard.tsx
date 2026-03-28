import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Medal, Crown, Users, Sparkles, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

/** SQI 2050 — aligned with Profile / Mantras glass tokens */
const GOLD = '#D4AF37';
const GLASS_BG = 'rgba(255, 255, 255, 0.02)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.05)';

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
  const { t, language } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, activeThisMonth: 0, totalSHCDistributed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monthly' | 'alltime'>('monthly');

  const localeTag = useMemo(() => {
    if (language === 'sv') return 'sv-SE';
    if (language === 'es') return 'es-ES';
    if (language === 'no') return 'nb-NO';
    return 'en-US';
  }, [language]);

  useEffect(() => {
    fetchLeaderboard();
    fetchStats();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);

    if (activeTab === 'alltime') {
      const { data, error } = await supabase
        .from('user_balances')
        .select(
          `
          user_id,
          total_earned,
          balance
        `
        )
        .order('total_earned', { ascending: false })
        .limit(50);

      if (!error && data) {
        const userIds = data.map((d) => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        const leaderboardData = data.map((entry, index) => ({
          user_id: entry.user_id,
          full_name: profileMap.get(entry.user_id)?.full_name ?? null,
          avatar_url: profileMap.get(entry.user_id)?.avatar_url || null,
          total_earned: Number(entry.total_earned),
          monthly_earned: 0,
          rank: index + 1,
        }));

        setLeaderboard(leaderboardData);
      }
    } else {
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
        const userTotals = new Map<string, number>();
        data.forEach((tx) => {
          const current = userTotals.get(tx.user_id) || 0;
          userTotals.set(tx.user_id, current + Number(tx.amount));
        });

        const sortedUsers = Array.from(userTotals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50);

        if (sortedUsers.length > 0) {
          const userIds = sortedUsers.map(([userId]) => userId);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', userIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

          const leaderboardData = sortedUsers.map(([userId, monthlyEarned], index) => ({
            user_id: userId,
            full_name: profileMap.get(userId)?.full_name ?? null,
            avatar_url: profileMap.get(userId)?.avatar_url || null,
            total_earned: 0,
            monthly_earned: monthlyEarned,
            rank: index + 1,
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
    const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: activeData } = await supabase
      .from('shc_transactions')
      .select('user_id')
      .gte('created_at', startOfMonth.toISOString());

    const uniqueActiveUsers = new Set(activeData?.map((d) => d.user_id) || []);

    const { data: totalData } = await supabase.from('user_balances').select('total_earned');

    const totalDistributed = totalData?.reduce((sum, b) => sum + Number(b.total_earned), 0) || 0;

    setStats({
      totalMembers: memberCount || 0,
      activeThisMonth: uniqueActiveUsers.size,
      totalSHCDistributed: totalDistributed,
    });
  };

  const getRewardBadge = (rank: number) => {
    if (rank === 1)
      return {
        icon: Crown,
        color: 'text-[#D4AF37]',
        bg: 'bg-[#D4AF37]/15',
        reward: t('leaderboard.rewardFirst', '5,000 SHC'),
      };
    if (rank === 2)
      return {
        icon: Medal,
        color: 'text-slate-300',
        bg: 'bg-white/[0.08]',
        reward: t('leaderboard.rewardSecond', '3,000 SHC'),
      };
    if (rank === 3)
      return {
        icon: Medal,
        color: 'text-amber-500',
        bg: 'bg-amber-500/15',
        reward: t('leaderboard.rewardThird', '1,500 SHC'),
      };
    return null;
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1)
      return (
        <Crown
          className="w-6 h-6 text-[#D4AF37]"
          style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.45))' }}
          aria-hidden
        />
      );
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" aria-hidden />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-500" aria-hidden />;
    return (
      <span className="text-lg font-black tracking-tight text-white/35" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        #{rank}
      </span>
    );
  };

  const glassCard =
    'rounded-[40px] border backdrop-blur-[40px] transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.04)]';

  const rewardsBody = t('leaderboard.monthlyRewardsBody', {
    defaultValue: 'Top 3 each month: 🥇 {{first}} · 🥈 {{second}} · 🥉 {{third}}',
    first: t('leaderboard.rewardFirst', '5,000 SHC'),
    second: t('leaderboard.rewardSecond', '3,000 SHC'),
    third: t('leaderboard.rewardThird', '1,500 SHC'),
  });

  return (
    <div
      className="min-h-screen px-4 pt-6 pb-32"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: 'rgba(255,255,255,0.92)' }}
    >
      <header className="mb-8 animate-fade-in">
        <p
          className="text-[8px] font-extrabold uppercase tracking-[0.5em] mb-3"
          style={{ color: 'rgba(212, 175, 55, 0.75)' }}
        >
          {t('leaderboard.heroEyebrow', 'Bhakti-Algorithm · Prema-Pulse')}
        </p>
        <h1
          className="text-3xl md:text-4xl font-black flex items-center tracking-tight flex-wrap gap-x-3 gap-y-2"
          style={{ color: GOLD, textShadow: '0 0 24px rgba(212, 175, 55, 0.25)', letterSpacing: '-0.05em' }}
        >
          <Trophy className="w-8 h-8 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
          {t('leaderboard.title', 'Leaderboard')}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed max-w-xl" style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 400 }}>
          {t('leaderboard.heroSubtitle', 'Top SHC earners and sovereign monthly rewards across the field.')}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up">
        {[
          {
            icon: Users,
            value: stats.totalMembers.toLocaleString(localeTag),
            label: t('leaderboard.statMembers', 'Members'),
            accent: GOLD,
          },
          {
            icon: TrendingUp,
            value: stats.activeThisMonth.toLocaleString(localeTag),
            label: t('leaderboard.statActive', 'Active'),
            accent: '#22D3EE',
          },
          {
            icon: Sparkles,
            value: `${(stats.totalSHCDistributed / 1000).toFixed(0)}K`,
            label: t('leaderboard.statShcTotal', 'SHC earned'),
            accent: GOLD,
          },
        ].map(({ icon: Icon, value, label, accent }) => (
          <div
            key={label}
            className={`${glassCard} p-4 text-center`}
            style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}
          >
            <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: accent }} strokeWidth={2} aria-hidden />
            <p
              className="text-xl md:text-2xl font-black tabular-nums tracking-tight truncate"
              style={{ color: '#fff', letterSpacing: '-0.04em' }}
            >
              {value}
            </p>
            <p
              className="text-[8px] font-extrabold uppercase tracking-[0.45em] mt-2 leading-tight"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <div
        className={`${glassCard} p-5 mb-8 border-[rgba(212,175,55,0.18)] animate-slide-up shadow-[0_0_32px_rgba(212,175,55,0.08)]`}
        style={{ background: GLASS_BG, animationDelay: '0.1s' }}
      >
        <div className="flex items-start gap-4">
          <Calendar className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} strokeWidth={2} aria-hidden />
          <div>
            <p className="font-black text-base tracking-tight text-white" style={{ letterSpacing: '-0.03em' }}>
              {t('leaderboard.monthlyRewards', 'Monthly Rewards')}
            </p>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>
              {rewardsBody}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <button
          type="button"
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-3.5 rounded-[40px] font-bold transition-all duration-300 flex items-center justify-center gap-2 border text-sm`}
          style={
            activeTab === 'monthly'
              ? { background: GOLD, color: '#050505', borderColor: 'rgba(212,175,55,0.4)', boxShadow: '0 0 28px rgba(212,175,55,0.2)' }
              : { background: GLASS_BG, color: 'rgba(255,255,255,0.55)', borderColor: GLASS_BORDER }
          }
        >
          <Calendar size={18} strokeWidth={2} aria-hidden />
          {t('leaderboard.tabThisMonth', 'This Month')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('alltime')}
          className={`flex-1 py-3.5 rounded-[40px] font-bold transition-all duration-300 flex items-center justify-center gap-2 border text-sm`}
          style={
            activeTab === 'alltime'
              ? { background: GOLD, color: '#050505', borderColor: 'rgba(212,175,55,0.4)', boxShadow: '0 0 28px rgba(212,175,55,0.2)' }
              : { background: GLASS_BG, color: 'rgba(255,255,255,0.55)', borderColor: GLASS_BORDER }
          }
        >
          <Trophy size={18} strokeWidth={2} aria-hidden />
          {t('leaderboard.tabAllTime', 'All Time')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3" role="status" aria-live="polite">
          <Loader2 className="w-9 h-9 animate-spin" style={{ color: GOLD }} aria-hidden />
          <span className="text-[8px] font-extrabold uppercase tracking-[0.4em] text-white/40">
            {t('leaderboard.loading', 'Syncing the field…')}
          </span>
        </div>
      ) : leaderboard.length === 0 ? (
        <div
          className={`${glassCard} p-10 text-center border-dashed`}
          style={{ background: GLASS_BG, borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-40" style={{ color: GOLD }} aria-hidden />
          <p className="font-bold text-white tracking-tight">
            {activeTab === 'monthly'
              ? t('leaderboard.emptyMonthTitle', 'No activity yet this month')
              : t('leaderboard.emptyAllTimeTitle', 'No records yet')}
          </p>
          <p className="text-sm mt-2 leading-relaxed max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {activeTab === 'monthly'
              ? t('leaderboard.emptyMonthBody', 'Earn SHC through practice and referrals to rise on the board.')
              : t('leaderboard.emptyAllTimeBody', 'The Akasha-Neural field is still gathering balances.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {leaderboard.map((entry, index) => {
            const rewardBadge = getRewardBadge(entry.rank);
            const displayName = entry.full_name?.trim() || t('leaderboard.anonymousName', 'Sacred Soul');
            const amount = activeTab === 'monthly' ? entry.monthly_earned : entry.total_earned;

            return (
              <div
                key={entry.user_id}
                className={`${glassCard} p-4 md:p-5`}
                style={{
                  background: GLASS_BG,
                  borderColor: entry.rank <= 3 ? 'rgba(212, 175, 55, 0.22)' : GLASS_BORDER,
                  boxShadow: entry.rank <= 3 ? '0 0 36px rgba(212, 175, 55, 0.07)' : undefined,
                  animationDelay: `${index * 0.03}s`,
                }}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 flex justify-center shrink-0">{getRankDisplay(entry.rank)}</div>

                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/[0.08]">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={t('leaderboard.avatarAlt', 'Profile photo')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-black text-white/60" style={{ letterSpacing: '-0.05em' }}>
                        {displayName[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                      {displayName}
                    </p>
                    {rewardBadge && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mt-1.5 ${rewardBadge.bg}`}
                      >
                        <rewardBadge.icon className={`w-3.5 h-3.5 shrink-0 ${rewardBadge.color}`} aria-hidden />
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${rewardBadge.color}`}>
                          {rewardBadge.reward}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-lg tabular-nums tracking-tight" style={{ color: GOLD }}>
                      {amount.toLocaleString(localeTag)}
                    </p>
                    <p className="text-[8px] font-extrabold uppercase tracking-[0.35em] mt-1 text-white/40">
                      {t('leaderboard.shc', 'SHC')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
