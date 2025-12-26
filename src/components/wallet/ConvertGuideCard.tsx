import React from 'react';
import { ArrowRightLeft, ExternalLink, Info, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSHCPrice } from '@/hooks/useSHCPrice';
import { useTranslation } from 'react-i18next';

const SHC_TOKEN_ADDRESS = "DiwhKbK8Bx2pDSHq35kWA5wAWhQ2DNjiyKCJ59Pq78xm";

const DEX_LINKS = [
  { name: 'Jupiter', url: `https://jup.ag/swap/SOL-${SHC_TOKEN_ADDRESS}`, icon: '🪐' },
  { name: 'Raydium', url: `https://raydium.io/swap/?inputMint=sol&outputMint=${SHC_TOKEN_ADDRESS}`, icon: '💧' },
  { name: 'Orca', url: `https://www.orca.so/`, icon: '🐋' },
];

export const ConvertGuideCard: React.FC = () => {
  const { t } = useTranslation();
  const { price, formatEur, isLoading } = useSHCPrice();

  const steps = [
    t('wallet.convertStep1', 'Connect your Phantom wallet to Sacred Healing'),
    t('wallet.convertStep2', 'Withdraw your SHC to your Phantom wallet'),
    t('wallet.convertStep3', 'Go to a DEX like Jupiter or Raydium'),
    t('wallet.convertStep4', 'Swap SHC for SOL, USDC, or other tokens'),
    t('wallet.convertStep5', 'Transfer to an exchange to cash out'),
  ];

  return (
    <Card className="bg-gradient-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRightLeft className="h-5 w-5 text-accent" />
          {t('wallet.convertSHC', 'Convert SHC')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div className="p-4 rounded-xl bg-background/50 border border-border/30">
          <p className="text-sm text-muted-foreground mb-1">{t('wallet.currentPrice', 'Current Price')}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-secondary">
              {isLoading ? '...' : formatEur(price?.priceEur || 0)}
            </span>
            <span className="text-muted-foreground">per SHC</span>
          </div>
          {price?.fallback && (
            <p className="text-xs text-amber-500 mt-1">{t('wallet.priceFallback', 'Using estimated price')}</p>
          )}
          <a 
            href={`https://dexscreener.com/solana/${SHC_TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
          >
            {t('wallet.viewOnDexScreener', 'View on DEXScreener')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Swap on DEX */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {t('wallet.swapOnDEX', 'Swap on a DEX')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEX_LINKS.map((dex) => (
              <Button
                key={dex.name}
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-3"
                onClick={() => window.open(dex.url, '_blank')}
              >
                <span className="text-lg mb-1">{dex.icon}</span>
                <span className="text-xs">{dex.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Step by step guide */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            {t('wallet.howToConvert', 'How to convert SHC to cash')}
          </p>
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Warning */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-400">
            ⚠️ {t('wallet.swapWarning', 'Be aware of slippage and fees when swapping. Always double-check addresses before confirming transactions.')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
