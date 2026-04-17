import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Trophy, Activity, Wallet, Receipt, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PnLCardProps {
  isPaperMode: boolean;
  totalPnL: number;
  todayPnL: number;
  totalTrades: number;
  winRate: number;
  startingBalance: number;
  /** Paper: cash only (USDC.e simulated wallet) */
  currentBalance?: number;
  /** Paper: cash + marked positions — when set, primary balance display */
  paperEquity?: number;
  totalFees?: number;
  onResetBalance?: () => void;
}

export const PnLCard: React.FC<PnLCardProps> = ({
  isPaperMode,
  totalPnL,
  todayPnL,
  totalTrades,
  winRate,
  startingBalance = 1000,
  currentBalance,
  paperEquity,
  totalFees = 0,
  onResetBalance
}) => {
  const { t } = useTranslation();
  // Calculate percentage gain/loss based on starting balance
  const totalPnLPercent = startingBalance > 0 ? (totalPnL / startingBalance) * 100 : 0;
  const todayPnLPercent = startingBalance > 0 ? (todayPnL / startingBalance) * 100 : 0;
  
  const isPositive = totalPnL >= 0;
  const isTodayPositive = todayPnL >= 0;
  
  const displayBalance =
    paperEquity ??
    currentBalance ??
    (startingBalance + totalPnL);

  return (
    <Card className={`${isPaperMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className={isPaperMode ? 'border-amber-500/50 text-amber-400' : 'border-green-500/50 text-green-400'}>
            {isPaperMode ? t('polymarketBotDetail.pnlBadgePaper') : t('polymarketBotDetail.pnlBadgeLive')}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium">{t('polymarketBotDetail.pnlWinRateShort', { pct: winRate.toFixed(1) })}</span>
            </div>
            {isPaperMode && onResetBalance && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={onResetBalance}
                title={t('polymarketBotDetail.pnlPaperResetTitle')}
                aria-label={t('polymarketBotDetail.pnlPaperResetTitle')}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Balance Display (for paper trading) */}
        {isPaperMode && (
          <div className="mb-3 space-y-1.5 p-2 bg-background/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">€{displayBalance.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  {paperEquity != null ? t('polymarketBotDetail.pnlPaperPortfolio') : t('polymarketBotDetail.pnlPaperAvailable')}
                </span>
              </div>
              {totalFees > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Receipt className="w-3 h-3" />
                  <span>{t('polymarketBotDetail.pnlPaperFees', { amount: totalFees.toFixed(2) })}</span>
                </div>
              )}
            </div>
            {paperEquity != null && currentBalance != null && (
              <div className="pl-6 text-[11px] text-muted-foreground">
                {t('polymarketBotDetail.pnlPaperCashLine', { amount: currentBalance.toFixed(2) })}
              </div>
            )}
          </div>
        )}

        {/* Main PnL Display */}
        <div className="flex items-center gap-2 mb-4">
          {isPositive ? (
            <TrendingUp className="w-6 h-6 text-green-400" />
          ) : (
            <TrendingDown className="w-6 h-6 text-red-400" />
          )}
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}€{totalPnL.toFixed(2)}
              </span>
              <span className={`text-sm font-medium ${isPositive ? 'text-green-400/80' : 'text-red-400/80'}`}>
                ({isPositive ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isPaperMode ? t('polymarketBotDetail.pnlPaperTotalCaption') : t('polymarketBotDetail.pnlLiveTotalCaption')}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className={`font-mono text-sm font-bold ${isTodayPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isTodayPositive ? '+' : ''}€{todayPnL.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">{t('polymarketBotDetail.pnlToday')}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className={`font-mono text-sm font-bold ${isTodayPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isTodayPositive ? '+' : ''}{todayPnLPercent.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">{t('polymarketBotDetail.pnlTodayPercent')}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-primary" />
              <p className="font-mono text-sm font-bold">{totalTrades}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{t('polymarketBotDetail.pnlTrades')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
