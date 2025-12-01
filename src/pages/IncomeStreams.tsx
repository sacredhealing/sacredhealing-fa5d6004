import React, { useState, useEffect } from 'react';
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
    toast.success('Token address copied!');
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
            <h1 className="text-2xl font-bold text-foreground">Income Streams</h1>
            <p className="text-sm text-muted-foreground">Discover ways to earn</p>
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
                <CardTitle className="text-xl text-foreground">The Sacred Healing Coin</CardTitle>
                <Badge className="bg-accent/20 text-accent mt-1">SHC Token</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="prose prose-sm text-muted-foreground space-y-3">
              <p>
                The Sacred Healing Coin is more than a symbol—it is a gentle companion on the journey back to yourself. Infused with the vibrations of healing energy and spiritual intention, it serves as a reminder to slow down, breathe deeply, and reconnect with the inner wisdom that guides your life.
              </p>
              <p>
                Each coin carries the essence of freedom—freedom from old patterns, freedom to grow, and freedom to rise into the fullest version of who you are. Like healing music for the soul, its presence encourages balance, clarity, and renewal.
              </p>
              <p>
                Designed to inspire personal transformation, the Sacred Healing Coin also opens the path toward <span className="text-accent font-medium">financial freedom</span>. It represents alignment: when your energy is clear and your purpose awakened, abundance flows with greater ease.
              </p>
              <p className="text-foreground font-medium">
                ✨ A symbol of growth, a tool of empowerment, and a keeper of inner light.
              </p>
            </div>

            {/* Token Address */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Token Address (Solana)</p>
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
              <h3 className="font-heading font-semibold text-foreground">How to Buy SHC</h3>
              
              {/* Phantom Wallet Method */}
              <div className="bg-background/50 rounded-xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h4 className="font-medium text-foreground">Buy with Phantom Wallet</h4>
                </div>
                <ol className="text-sm text-muted-foreground space-y-2 ml-7 list-decimal">
                  <li>Download <a href="https://phantom.app" target="_blank" rel="noopener" className="text-primary hover:underline">Phantom Wallet</a> (mobile or browser extension)</li>
                  <li>Create or import your wallet and add SOL (Solana)</li>
                  <li>Open Phantom and tap the <span className="text-foreground">Swap</span> icon</li>
                  <li>Select SOL as the token you're swapping from</li>
                  <li>Paste the SHC token address above or search "Sacred Healing Coin"</li>
                  <li>Enter the amount and confirm the swap</li>
                </ol>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => window.open('https://phantom.app', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Phantom Wallet
                </Button>
              </div>

              {/* Credit Card Method */}
              <div className="bg-background/50 rounded-xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  <h4 className="font-medium text-foreground">Buy with Credit Card</h4>
                </div>
                <ol className="text-sm text-muted-foreground space-y-2 ml-7 list-decimal">
                  <li>Open Phantom Wallet and tap <span className="text-foreground">Buy</span></li>
                  <li>Select your preferred provider (MoonPay, Coinbase, etc.)</li>
                  <li>Enter your card details and amount to purchase SOL</li>
                  <li>Once SOL arrives, use the <span className="text-foreground">Swap</span> feature</li>
                  <li>Swap your SOL for SHC using the token address above</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Phantom's built-in "Buy" feature lets you purchase crypto directly with your card—no external exchange needed!
                </p>
              </div>

              {/* Trade on DEX */}
              <Button 
                variant="gold" 
                className="w-full"
                onClick={() => window.open(`https://raydium.io/swap/?inputMint=sol&outputMint=${SHC_TOKEN_ADDRESS}`, '_blank')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trade SHC on Raydium
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Other Income Streams */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">More Opportunities</h2>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {streams.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No income streams available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for opportunities!</p>
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
                        Featured
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
                  Learn More
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
