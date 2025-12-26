import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, ArrowDownLeft, Gift, Clock, CheckCircle, Calendar, Play, Users, Crown, Eye, EyeOff, TrendingUp, Send, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHC } from '@/contexts/SHCContext';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import WalletConnectCard from '@/components/wallet/WalletConnectCard';
import { AffiliateEarningsCard } from '@/components/wallet/AffiliateEarningsCard';
import { SendSHCCard } from '@/components/wallet/SendSHCCard';
import { ConvertGuideCard } from '@/components/wallet/ConvertGuideCard';
import { BankWithdrawalCard } from '@/components/wallet/BankWithdrawalCard';
import { useTranslation } from 'react-i18next';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useSHCPrice } from '@/hooks/useSHCPrice';

type TabType = 'overview' | 'affiliate' | 'send' | 'convert';

const Wallet: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hideBalance, setHideBalance] = useState(false);
  const { walletAddress } = usePhantomWallet();
  const { balance, profile } = useSHC();
  const { transactions, withdrawSHC } = useSHCBalance();
  const { convertShcToEur, formatEur } = useSHCPrice();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    if (!walletAddress || !balance || balance.balance <= 0) return;
    setIsWithdrawing(true);
    await withdrawSHC(balance.balance);
    setIsWithdrawing(false);
  };

  const tabs = [
    { id: 'overview' as TabType, label: t('wallet.overview', 'Overview'), icon: Sparkles },
    { id: 'affiliate' as TabType, label: t('wallet.affiliate', 'Affiliate'), icon: TrendingUp },
    { id: 'send' as TabType, label: t('wallet.send', 'Send'), icon: Send },
    { id: 'convert' as TabType, label: t('wallet.convert', 'Convert'), icon: ArrowRightLeft },
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">{t('wallet.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('wallet.subtitle')}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHideBalance(!hideBalance)}
          className="text-muted-foreground"
        >
          {hideBalance ? <EyeOff size={20} /> : <Eye size={20} />}
        </Button>
      </header>

      {/* Wallet Connection */}
      <WalletConnectCard />

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-spiritual p-6 mb-6 animate-slide-up">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <p className="text-foreground/70 text-sm mb-1">{t('wallet.totalBalance')}</p>
          <div className="flex items-baseline gap-2 mb-1">
            {hideBalance ? (
              <span className="text-5xl font-heading font-bold text-foreground">••••••</span>
            ) : (
              <AnimatedCounter 
                value={balance?.balance ?? 0}
                className="text-5xl font-heading font-bold text-foreground"
              />
            )}
            <span className="text-xl text-accent font-medium">SHC</span>
          </div>
          {!hideBalance && (
            <p className="text-secondary text-sm mb-4">
              ≈ {formatEur(convertShcToEur(balance?.balance ?? 0))}
            </p>
          )}

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
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-primary">{hideBalance ? '••' : profile?.streak_days ?? 0}</p>
          <p className="text-xs text-muted-foreground">{t('wallet.dayStreak')}</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-secondary">{hideBalance ? '••' : transactions.length}</p>
          <p className="text-xs text-muted-foreground">{t('wallet.transactions')}</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-accent">
            {hideBalance ? '••' : <AnimatedCounter value={balance?.total_earned ?? 0} />}
          </p>
          <p className="text-xs text-muted-foreground">{t('wallet.earned')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx, index) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-card border border-border/50"
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
                  {hideBalance ? '••••' : `${tx.amount > 0 ? '+' : ''}${tx.amount} SHC`}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'affiliate' && (
          <div className="space-y-4">
            <AffiliateEarningsCard />
            <BankWithdrawalCard />
          </div>
        )}

        {activeTab === 'send' && <SendSHCCard />}

        {activeTab === 'convert' && <ConvertGuideCard />}
      </div>
    </div>
  );
};

export default Wallet;
