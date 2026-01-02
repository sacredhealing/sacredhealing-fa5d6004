import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Coins, Check, ExternalLink, Copy, Wallet, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SHC_TOKEN_ADDRESS = 'GLtvJisfuAVxV9VSP8wekeAVceZMTCxvbvNJGE8KZBxm';

const SHCCoinDetail: React.FC = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(SHC_TOKEN_ADDRESS);
    setCopied(true);
    toast.success(t('shcCoin.addressCopied', 'Token address copied!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const phantomSteps = [
    t('shcCoin.phantomStep1', 'Download Phantom Wallet from phantom.app'),
    t('shcCoin.phantomStep2', 'Create or import your wallet'),
    t('shcCoin.phantomStep3', 'Fund your wallet with SOL'),
    t('shcCoin.phantomStep4', 'Go to the swap feature in Phantom'),
    t('shcCoin.phantomStep5', 'Paste the SHC token address'),
    t('shcCoin.phantomStep6', 'Enter amount and confirm swap'),
  ];

  const cardSteps = [
    t('shcCoin.cardStep1', 'Open Phantom Wallet'),
    t('shcCoin.cardStep2', 'Tap "Buy" and select your amount in USD'),
    t('shcCoin.cardStep3', 'Complete KYC if required'),
    t('shcCoin.cardStep4', 'Buy SOL with your card'),
    t('shcCoin.cardStep5', 'Swap SOL to SHC using the token address'),
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('common.back', 'Back to Income Streams')}</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center">
            <Coins className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('shcCoin.title', 'SHC Coin')}</h1>
            <Badge variant="secondary" className="mt-1">{t('shcCoin.badge', 'Investment')}</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Overview */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent" />
              {t('shcCoin.whatIsIt', 'What is SHC Coin?')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              {t('shcCoin.overviewP1', 'SHC (Sacred Healing Coin) is our native utility token built on the Solana blockchain. It powers the ecosystem and rewards active community members.')}
            </p>
            <p>
              {t('shcCoin.overviewP2', 'As the platform grows, so does the value and utility of SHC. Early adopters benefit from holding and using the token.')}
            </p>
          </CardContent>
        </Card>

        {/* Token Address */}
        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">{t('shcCoin.tokenAddressLabel', 'Token Address (Solana)')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background/50 rounded-lg p-3 text-foreground font-mono break-all">
                {SHC_TOKEN_ADDRESS}
              </code>
              <Button variant="ghost" size="icon" onClick={copyAddress} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How to Buy - Phantom */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              {t('shcCoin.buyWithPhantom', 'Buy with Phantom Wallet')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {phantomSteps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <Button variant="outline" className="w-full mt-4" onClick={() => window.open('https://phantom.app', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('shcCoin.getPhantom', 'Get Phantom Wallet')}
            </Button>
          </CardContent>
        </Card>

        {/* How to Buy - Card */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-secondary" />
              {t('shcCoin.buyWithCard', 'Buy with Credit Card')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {cardSteps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/30 rounded-lg">
              💡 {t('shcCoin.tip', 'Tip: Moonpay and other providers in Phantom support card purchases.')}
            </p>
          </CardContent>
        </Card>

        {/* Risk Disclaimer */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">{t('shcCoin.riskTitle', 'Risk Disclaimer')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('shcCoin.riskDesc', 'Cryptocurrency investments carry significant risk. Only invest what you can afford to lose. Past performance does not guarantee future results. Do your own research before investing.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button variant="gold" className="w-full" size="lg" onClick={() => window.open(`https://raydium.io/swap/?inputMint=sol&outputMint=${SHC_TOKEN_ADDRESS}`, '_blank')}>
          <TrendingUp className="w-4 h-4 mr-2" />
          {t('shcCoin.tradeOnRaydium', 'Trade on Raydium DEX')}
        </Button>
      </div>
    </div>
  );
};

export default SHCCoinDetail;
