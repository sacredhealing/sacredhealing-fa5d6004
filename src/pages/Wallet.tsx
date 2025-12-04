import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, ArrowDownLeft, Gift, Clock, CheckCircle, Calendar, Play, Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import { useTranslation } from 'react-i18next';

const Wallet: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const { walletAddress } = usePhantomWallet();
  const { balance, transactions, isLoading, withdrawSHC } = useSHCBalance();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const rewards = [
    { id: 1, title: t('wallet.dailyLoginDay7'), reward: 20, icon: Calendar, completed: false, available: true },
    { id: 2, title: t('wallet.completeMeditation'), reward: 5, icon: Play, completed: true, available: false },
    { id: 3, title: t('wallet.streakBonus7Day'), reward: 50, icon: CheckCircle, completed: false, available: true },
    { id: 4, title: t('wallet.inviteFriend'), reward: 100, icon: Users, completed: false, available: true },
    { id: 5, title: t('wallet.goPremium'), reward: 2000, icon: Crown, completed: false, available: true },
  ];

  const handleWithdraw = async () => {
    if (!walletAddress || !balance || balance.balance <= 0) return;
    setIsWithdrawing(true);
    await withdrawSHC(balance.balance);
    setIsWithdrawing(false);
  };

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">{t('wallet.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('wallet.subtitle')}</p>
      </header>

      {/* Wallet Connection */}
      <WalletConnectCard />

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-spiritual p-6 mb-6 animate-slide-up">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <p className="text-foreground/70 text-sm mb-1">{t('wallet.totalBalance')}</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-heading font-bold text-foreground">
              {isLoading ? '...' : (balance?.balance.toLocaleString() ?? '0')}
            </span>
            <span className="text-xl text-accent font-medium">SHC</span>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="glass" 
              size="sm" 
              className="flex-1"
              onClick={handleWithdraw}
              disabled={!walletAddress || !balance || balance.balance <= 0 || isWithdrawing}
            >
              <ArrowUpRight size={16} />
              {isWithdrawing ? t('wallet.sending') : t('wallet.withdraw')}
            </Button>
            <Button variant="glass" size="sm" className="flex-1" disabled>
              <ArrowDownLeft size={16} />
              {t('wallet.deposit')}
            </Button>
            <Button 
              variant="gold" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                if (!walletAddress) {
                  toast.error(t('wallet.connectFirst'), {
                    description: t('wallet.connectFirstDesc')
                  });
                  return;
                }
                toast.info(t('wallet.comingSoon'), {
                  description: t('wallet.comingSoonDesc')
                });
              }}
            >
              <Gift size={16} />
              {t('wallet.claim')}
            </Button>
          </div>
        </div>
      </div>

      {/* Streak info */}
      <div className="flex gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-primary">7</p>
          <p className="text-xs text-muted-foreground">{t('wallet.dayStreak')}</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-secondary">{transactions.length}</p>
          <p className="text-xs text-muted-foreground">{t('wallet.transactions')}</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-accent">
            {isLoading ? '...' : (balance?.total_earned.toLocaleString() ?? '0')}
          </p>
          <p className="text-xs text-muted-foreground">{t('wallet.earned')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'rewards'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          {t('wallet.rewards')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          {t('wallet.history')}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rewards' ? (
        <div className="space-y-3 animate-fade-in">
          {rewards.map((reward, index) => (
            <div
              key={reward.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                reward.completed
                  ? 'bg-secondary/10 border-secondary/30'
                  : 'bg-gradient-card border-border/50'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                reward.completed ? 'bg-secondary/20' : 'bg-primary/20'
              }`}>
                {reward.completed ? (
                  <CheckCircle className="text-secondary" size={22} />
                ) : (
                  <reward.icon className="text-primary" size={22} />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${reward.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {reward.title}
                </p>
                <p className="text-sm text-accent flex items-center gap-1">
                  <Sparkles size={12} />
                  +{reward.reward} SHC
                </p>
              </div>
              {!reward.completed && reward.available && (
                <Button 
                  variant="spiritual" 
                  size="sm"
                  onClick={() => {
                    toast.info(t('wallet.comingSoon'), {
                      description: t('wallet.rewardComingSoon', { title: reward.title })
                    });
                  }}
                >
                  {t('wallet.claim')}
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-card border border-border/50"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'earned' ? 'bg-secondary/20' : 'bg-destructive/20'
              }`}>
                {tx.type === 'earned' ? (
                  <ArrowDownLeft className="text-secondary" size={18} />
                ) : (
                  <ArrowUpRight className="text-destructive" size={18} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{tx.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                </p>
              </div>
              <span className={`font-heading font-semibold ${
                tx.amount > 0 ? 'text-secondary' : 'text-destructive'
              }`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} SHC
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wallet;
