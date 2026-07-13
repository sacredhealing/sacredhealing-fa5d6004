import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('affiliate');
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
    { id: 'affiliate' as TabType, label: t('wallet.affiliate', 'Affiliate'), icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">{t('wallet.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('wallet.subtitle')}</p>
      </header>

      {/* SHC balance hero, stats, and wallet-connect intentionally not rendered
          here anymore (SHC removed from user-facing pages). The hooks above
          (useSHC, useSHCBalance, useSHCPrice, usePhantomWallet) are still
          called and still fetch data — infrastructure preserved if this is
          ever turned back on, just not shown. */}

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
            {/* AffiliateEarningsCard and BankWithdrawalCard intentionally not
                rendered here anymore. Found while removing SHC: both pull
                from the legacy useAffiliate() hook (commission_shc,
                SHC-denominated), a completely separate, disconnected system
                from the real affiliate_profiles/affiliate_commissions
                (EUR, Stripe Connect) system built this session. Someone
                could have seen a wrong "available earnings" figure here and
                attempted a withdrawal based on incorrect data - a real bug,
                not just an SHC-label issue. Pointing to the verified real
                dashboard instead of attempting a blind fix of the legacy
                cards' data source. */}
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground text-sm">View your real affiliate earnings and request payouts here:</p>
              <Button onClick={() => navigate('/affiliate/dashboard')} className="bg-primary">
                Open Affiliate Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
