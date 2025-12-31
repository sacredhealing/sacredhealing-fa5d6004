import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Cpu, Check, ExternalLink, AlertTriangle, Percent, Zap, Clock, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSiteContent } from '@/hooks/useSiteContent';

const BitcoinMiningDetail: React.FC = () => {
  const { t } = useTranslation();
  
  // Fetch editable content
  const { content } = useSiteContent([
    'bitcoin_mining_title',
    'bitcoin_mining_subtitle',
    'bitcoin_mining_description',
    'bitcoin_mining_step1',
    'bitcoin_mining_step2',
    'bitcoin_mining_step3',
    'bitcoin_mining_returns',
    'bitcoin_mining_min_investment',
    'bitcoin_mining_link',
  ]);

  const miningLink = content['bitcoin_mining_link'] || 'https://example.com/bitcoin-mining';

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('common.back', 'Back to Income Streams')}</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ₿ {content['bitcoin_mining_title'] || t('bitcoinMining.title', 'Bitcoin Mining')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {content['bitcoin_mining_subtitle'] || t('bitcoinMining.subtitle', 'Passive Crypto Income')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/30">
            <CardContent className="p-3 text-center">
              <Percent className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.returns', 'Returns')}</p>
              <p className="font-bold text-foreground text-sm">
                {content['bitcoin_mining_returns'] || '5-15%'}
              </p>
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.monthly', 'monthly*')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-3 text-center">
              <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.effort', 'Effort')}</p>
              <p className="font-bold text-foreground text-sm">{t('bitcoinMining.passive', 'Passive')}</p>
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.income', 'Income')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.payout', 'Payout')}</p>
              <p className="font-bold text-foreground text-sm">{t('bitcoinMining.daily', 'Daily')}</p>
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.rewards', 'Rewards')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              {content['bitcoin_mining_description'] || t('bitcoinMining.description', 'Earn Bitcoin passively through cloud mining. No hardware required - simply invest and watch your crypto portfolio grow with daily mining rewards.')}
            </p>
          </CardContent>
        </Card>

        {/* Get Started Steps */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">🔗 {t('bitcoinMining.getStarted', 'Get Started')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {content['bitcoin_mining_step1'] || t('bitcoinMining.step1', 'Create Your Mining Account')}
                  </h4>
                </div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                onClick={() => window.open(miningLink, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('bitcoinMining.signUp', 'Sign Up for Cloud Mining')}
              </Button>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {content['bitcoin_mining_step2'] || t('bitcoinMining.step2', 'Choose Your Mining Plan')}
                  </h4>
                </div>
              </div>
              <div className="ml-11 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('bitcoinMining.minInvestment', 'Minimum investment')}: <span className="text-foreground font-medium">{content['bitcoin_mining_min_investment'] || '$100'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('bitcoinMining.contracts', 'Multiple contract durations available')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('bitcoinMining.hashpower', 'Instant hashpower allocation')}</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {content['bitcoin_mining_step3'] || t('bitcoinMining.step3', 'Start Earning Bitcoin')}
                  </h4>
                </div>
              </div>
              <div className="ml-11 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('bitcoinMining.dailyRewards', 'Daily mining rewards credited to your account')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{t('bitcoinMining.withdrawAnytime', 'Withdraw anytime to your wallet')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-lg">✨ {t('bitcoinMining.benefits', 'Benefits')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-foreground">{t('bitcoinMining.noHardware', 'No Hardware Required')}</span>
              </div>
              <Badge variant="secondary">{t('bitcoinMining.cloudBased', 'Cloud-based')}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-foreground">{t('bitcoinMining.compound', 'Compound Earnings')}</span>
              </div>
              <Badge variant="secondary">{t('bitcoinMining.reinvest', 'Auto-reinvest')}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-orange-500" />
                <span className="text-foreground">{t('bitcoinMining.instantStart', 'Instant Start')}</span>
              </div>
              <Badge variant="secondary">{t('bitcoinMining.noWait', 'No waiting')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Risk Disclaimer */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium mb-1">⚠️ {t('bitcoinMining.riskTitle', 'Cryptocurrency investments involve risk.')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('bitcoinMining.riskDesc', 'Mining returns vary based on Bitcoin price and network difficulty. Only invest what you can afford to lose.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/30">
          <CardContent className="p-4 text-center">
            <p className="text-foreground">
              ✨ {t('bitcoinMining.tagline', 'Earn Bitcoin while you sleep.')}
            </p>
            <p className="text-muted-foreground mt-2">
              {t('bitcoinMining.closing', 'Start your crypto journey today.')}<br />
              <span className="font-semibold text-foreground">Shreem Brzee</span>
            </p>
          </CardContent>
        </Card>

        {/* Main CTA */}
        <Button 
          className="w-full bg-orange-600 hover:bg-orange-700" 
          size="lg" 
          onClick={() => window.open(miningLink, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {t('bitcoinMining.startMining', 'Start Mining Bitcoin')}
        </Button>
      </div>
    </div>
  );
};

export default BitcoinMiningDetail;
