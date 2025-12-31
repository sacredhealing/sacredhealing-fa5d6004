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
              <p className="font-bold text-foreground text-sm">14%</p>
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.perCard', 'per card')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-3 text-center">
              <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.effort', 'Effort')}</p>
              <p className="font-bold text-foreground text-sm">{t('bitcoinMining.passive', 'Passive')}</p>
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.automated', 'Automated')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.cycle', 'Cycle')}</p>
              <p className="font-bold text-foreground text-sm">~90</p>
              <p className="text-xs text-muted-foreground">{t('bitcoinMining.days', 'days')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              {content['bitcoin_mining_description'] || t('bitcoinMining.description', 'Invest in a license that mines bitcoin through mining cards. The cards create bitcoin mining through an advanced computer algorithm that gives 14% back per card. It takes approximately 90 days until your 114% is mined.')}
            </p>
          </CardContent>
        </Card>

        {/* License Options */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">💳 {t('bitcoinMining.licenseOptions', 'License Options')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">$300 {t('bitcoinMining.license', 'License')}</span>
                <Badge variant="secondary">{t('bitcoinMining.starter', 'Starter')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t('bitcoinMining.upTo', 'Up to')} 9 {t('bitcoinMining.miningCards', 'mining cards')}</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">$1,000 {t('bitcoinMining.license', 'License')}</span>
                <Badge variant="secondary">{t('bitcoinMining.growth', 'Growth')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t('bitcoinMining.upTo', 'Up to')} 30 {t('bitcoinMining.miningCards', 'mining cards')}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">$1,500 {t('bitcoinMining.license', 'License')}</span>
                <Badge className="bg-orange-500/20 text-orange-400">{t('bitcoinMining.premium', 'Premium')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t('bitcoinMining.upTo', 'Up to')} 50 {t('bitcoinMining.miningCards', 'mining cards')}</p>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">⚡ {t('bitcoinMining.howItWorks', 'How It Works')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('bitcoinMining.buyCards', 'Buy Mining Cards')}</h4>
                  <p className="text-sm text-muted-foreground">{t('bitcoinMining.cardCost', 'Each card costs ~$300 and generates approximately $4/day in mining rewards.')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('bitcoinMining.autoCompound', 'Auto-Compound Growth')}</h4>
                  <p className="text-sm text-muted-foreground">{t('bitcoinMining.autoCompoundDesc', 'Earnings automatically purchase new cards. 4 cards become 10 cards in ~90 days!')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('bitcoinMining.scaleUp', 'Scale Your Income')}</h4>
                  <p className="text-sm text-muted-foreground">{t('bitcoinMining.scaleUpDesc', '30 cards = ~$30,000/month • 50 cards = ~$60,000/month in Bitcoin!')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Example */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-lg">💰 {t('bitcoinMining.earningsExample', 'Earnings Example')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <span className="text-muted-foreground">4 {t('bitcoinMining.cards', 'cards')}</span>
              <span className="font-bold text-foreground">$16/{t('bitcoinMining.day', 'day')} → $400/{t('bitcoinMining.month', 'month')}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <span className="text-muted-foreground">10 {t('bitcoinMining.cards', 'cards')}</span>
              <span className="font-bold text-foreground">$40/{t('bitcoinMining.day', 'day')} → $1,000/{t('bitcoinMining.month', 'month')}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10">
              <span className="text-foreground font-medium">30 {t('bitcoinMining.cards', 'cards')}</span>
              <span className="font-bold text-orange-400">$120/{t('bitcoinMining.day', 'day')} → $3,000/{t('bitcoinMining.month', 'month')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Future Potential */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium mb-1">📈 {t('bitcoinMining.futurePotential', 'Future Potential')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('bitcoinMining.futurePotentialDesc', 'Bitcoin is predicted to reach $15 million within 5 years. What you mine today could be worth 10x — holding your Bitcoin creates enormous future opportunity!')}
                </p>
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

        {/* Get Started */}
        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/30">
          <CardContent className="p-4 text-center">
            <p className="text-foreground font-medium mb-2">
              🚀 {t('bitcoinMining.interested', 'Interested in Getting Started?')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('bitcoinMining.zoomDesc', "Book a Zoom call with our team. We'll explain everything in depth, answer your questions, and help you get started.")}
            </p>
            <p className="text-muted-foreground text-sm">
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
          {t('bitcoinMining.bookZoom', 'Book a Zoom Meeting')}
        </Button>
      </div>
    </div>
  );
};

export default BitcoinMiningDetail;
