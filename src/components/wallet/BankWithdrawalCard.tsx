import React, { useState } from 'react';
import { Building2, CheckCircle, Clock, ExternalLink, AlertCircle, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAffiliatePayouts } from '@/hooks/useAffiliatePayouts';
import { useSHCPrice } from '@/hooks/useSHCPrice';
import { useAffiliate } from '@/hooks/useAffiliate';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const MIN_WITHDRAWAL_EUR = 1;

export const BankWithdrawalCard: React.FC = () => {
  const { t } = useTranslation();
  const { data: affiliateData } = useAffiliate();
  const { connectStatus, createStripeConnectAccount, requestBankPayout, isLoading } = useAffiliatePayouts();
  const { price, convertShcToEur, convertEurToShc, formatEur } = useSHCPrice();
  
  const [amount, setAmount] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const availableEarnings = affiliateData?.totalEarnings || 0;
  const amountNum = parseFloat(amount) || 0;
  const eurValue = convertShcToEur(amountNum);
  const minShcForWithdrawal = convertEurToShc(MIN_WITHDRAWAL_EUR);

  const handleConnectBank = async () => {
    setIsConnecting(true);
    try {
      await createStripeConnectAccount('NO');
      toast.success(t('wallet.stripeRedirect', 'Opening Stripe to complete setup...'));
    } catch (err) {
      console.error('Connect error:', err);
      toast.error(t('wallet.connectFailed', 'Failed to start bank setup'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWithdraw = async () => {
    if (amountNum <= 0 || amountNum > availableEarnings) {
      toast.error(t('wallet.invalidAmount', 'Invalid withdrawal amount'));
      return;
    }

    if (eurValue < MIN_WITHDRAWAL_EUR) {
      toast.error(t('wallet.minWithdrawal', `Minimum withdrawal is €${MIN_WITHDRAWAL_EUR}`));
      return;
    }

    setIsWithdrawing(true);
    try {
      await requestBankPayout(amountNum, price?.priceEur || 0);
      toast.success(t('wallet.withdrawalSuccess', 'Withdrawal request submitted!'));
      setAmount('');
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error(err instanceof Error ? err.message : t('wallet.withdrawalFailed', 'Withdrawal failed'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse h-32 bg-muted/30 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          {t('wallet.bankWithdrawal', 'Bank Withdrawal')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Account Status */}
        {!connectStatus?.hasAccount ? (
          // No account - prompt to create
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-background/30 border border-border/30">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">
                    {t('wallet.connectBankTitle', 'Connect Your Bank Account')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('wallet.connectBankDesc', 'Set up Stripe Connect to withdraw your affiliate earnings directly to your bank account.')}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleConnectBank} 
              disabled={isConnecting}
              className="w-full"
              variant="gold"
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  {t('wallet.connectBank', 'Connect Bank Account')}
                </>
              )}
            </Button>
          </div>
        ) : connectStatus.status === 'pending' ? (
          // Account pending verification
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400 mb-1">
                  {t('wallet.verificationPending', 'Verification Pending')}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('wallet.completeVerification', 'Please complete your Stripe verification to enable withdrawals.')}
                </p>
                <Button onClick={handleConnectBank} size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('wallet.completeSetup', 'Complete Setup')}
                </Button>
              </div>
            </div>
          </div>
        ) : connectStatus.status === 'active' ? (
          // Account active - show withdrawal form
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-400">
                {t('wallet.bankConnected', 'Bank account connected')}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-background/30">
              <p className="text-sm text-muted-foreground mb-1">
                {t('wallet.availableToWithdraw', 'Available to withdraw')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {availableEarnings.toLocaleString()} SHC
              </p>
              <p className="text-sm text-secondary">
                ≈ {formatEur(convertShcToEur(availableEarnings))}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t('wallet.withdrawAmount', 'Withdrawal amount (SHC)')}
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                max={availableEarnings}
              />
              {amountNum > 0 && (
                <p className="text-sm text-secondary">
                  = {formatEur(eurValue)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('wallet.minWithdrawalNote', `Minimum: €${MIN_WITHDRAWAL_EUR} (≈ ${Math.ceil(minShcForWithdrawal)} SHC)`)}
              </p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing || amountNum <= 0 || amountNum > availableEarnings || eurValue < MIN_WITHDRAWAL_EUR}
              className="w-full"
              variant="gold"
            >
              {isWithdrawing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  {t('wallet.withdrawToBank', 'Withdraw to Bank')}
                </>
              )}
            </Button>
          </div>
        ) : (
          // Account restricted
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-1">
                  {t('wallet.accountRestricted', 'Account Restricted')}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('wallet.contactSupport', 'Please contact support or complete additional verification.')}
                </p>
                <Button onClick={handleConnectBank} size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('wallet.updateAccount', 'Update Account')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
