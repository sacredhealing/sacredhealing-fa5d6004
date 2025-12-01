import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, DollarSign, TrendingUp, Users, Sparkles, Copy, CreditCard, Wallet, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SHC_TOKEN_ADDRESS = 'GLtvJisfuAVxV9VSP8wekeAVceZMTCxvbvNJGE8KZBxm';

interface IncomeStream {
  id: string;
  title: string;
  description: string | null;
  link: string;
  category: string;
  potential_earnings: string | null;
  is_featured: boolean;
  image_url: string | null;
  order_index: number;
}

const IncomeStreams: React.FC = () => {
  const { t } = useTranslation();
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    const { data, error } = await supabase
      .from('income_streams' as any)
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (data) {
      setStreams(data as unknown as IncomeStream[]);
    }
    if (error) console.error('Error fetching income streams:', error);
    setIsLoading(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(SHC_TOKEN_ADDRESS);
    setCopied(true);
    toast.success(t('common.success'));
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'affiliate':
        return <Users className="h-4 w-4" />;
      case 'investment':
        return <TrendingUp className="h-4 w-4" />;
      case 'passive':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'affiliate':
        return 'bg-primary/20 text-primary';
      case 'investment':
        return 'bg-green-500/20 text-green-400';
      case 'passive':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/20">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('incomeStreams.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('incomeStreams.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* SHC Coin Section */}
      <div className="px-4 space-y-4 mb-6">
        <Card className="bg-gradient-to-br from-accent/10 via-primary/10 to-secondary/10 border-accent/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center glow-gold">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">{t('incomeStreams.shcCoin.title')}</CardTitle>
                <Badge className="bg-accent/20 text-accent mt-1">{t('incomeStreams.shcCoin.badge')}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="prose prose-sm text-muted-foreground space-y-3">
              <p>{t('incomeStreams.shcCoin.description1')}</p>
              <p>{t('incomeStreams.shcCoin.description2')}</p>
              <p>
                {t('incomeStreams.shcCoin.description3')} <span className="text-accent font-medium">{t('incomeStreams.shcCoin.financialFreedom')}</span>. {t('incomeStreams.shcCoin.description4')}
              </p>
              <p className="text-foreground font-medium">
                ✨ {t('incomeStreams.shcCoin.symbolOfGrowth')}
              </p>
            </div>

            {/* Token Address */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-2">{t('incomeStreams.shcCoin.tokenAddress')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted/50 rounded-lg p-2 text-foreground font-mono break-all">
                  {SHC_TOKEN_ADDRESS}
                </code>
                <Button variant="ghost" size="icon" onClick={copyAddress} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* How to Buy Section */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-foreground">{t('incomeStreams.shcCoin.howToBuy')}</h3>
              
              {/* Phantom Wallet Method */}
              <div className="bg-background/50 rounded-xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h4 className="font-medium text-foreground">{t('incomeStreams.shcCoin.buyWithPhantom')}</h4>
                </div>
                <ol className="text-sm text-muted-foreground space-y-2 ml-7 list-decimal">
                  <li>{t('incomeStreams.shcCoin.phantomStep1')}</li>
                  <li>{t('incomeStreams.shcCoin.phantomStep2')}</li>
                  <li>{t('incomeStreams.shcCoin.phantomStep3')}</li>
                  <li>{t('incomeStreams.shcCoin.phantomStep4')}</li>
                  <li>{t('incomeStreams.shcCoin.phantomStep5')}</li>
                  <li>{t('incomeStreams.shcCoin.phantomStep6')}</li>
                </ol>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => window.open('https://phantom.app', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('incomeStreams.shcCoin.getPhantomWallet')}
                </Button>
              </div>

              {/* Credit Card Method */}
              <div className="bg-background/50 rounded-xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  <h4 className="font-medium text-foreground">{t('incomeStreams.shcCoin.buyWithCard')}</h4>
                </div>
                <ol className="text-sm text-muted-foreground space-y-2 ml-7 list-decimal">
                  <li>{t('incomeStreams.shcCoin.cardStep1')}</li>
                  <li>{t('incomeStreams.shcCoin.cardStep2')}</li>
                  <li>{t('incomeStreams.shcCoin.cardStep3')}</li>
                  <li>{t('incomeStreams.shcCoin.cardStep4')}</li>
                  <li>{t('incomeStreams.shcCoin.cardStep5')}</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 {t('incomeStreams.shcCoin.cardTip')}
                </p>
              </div>

              {/* Trade on DEX */}
              <Button 
                variant="gold" 
                className="w-full"
                onClick={() => window.open(`https://raydium.io/swap/?inputMint=sol&outputMint=${SHC_TOKEN_ADDRESS}`, '_blank')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('incomeStreams.shcCoin.tradeOnRaydium')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Other Income Streams */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">{t('incomeStreams.moreOpportunities')}</h2>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {streams.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('incomeStreams.noStreams')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('incomeStreams.checkBackSoon')}</p>
            </CardContent>
          </Card>
        ) : (
          streams.map((stream) => (
            <Card 
              key={stream.id} 
              className={`bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all hover:border-primary/50 ${
                stream.is_featured ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              {stream.image_url && (
                <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                  <img 
                    src={stream.image_url} 
                    alt={stream.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(stream.category)}>
                      {getCategoryIcon(stream.category)}
                      <span className="ml-1 capitalize">{stream.category}</span>
                    </Badge>
                    {stream.is_featured && (
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                        {t('common.featured')}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg mt-2">{stream.title}</CardTitle>
                {stream.potential_earnings && (
                  <p className="text-sm text-primary font-medium">
                    💰 {stream.potential_earnings}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {stream.description && (
                  <CardDescription className="text-muted-foreground whitespace-pre-line">
                    {stream.description}
                  </CardDescription>
                )}
                <Button 
                  className="w-full" 
                  onClick={() => window.open(stream.link, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('common.learnMore')}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default IncomeStreams;
