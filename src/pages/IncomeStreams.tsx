import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Users, Sparkles, ArrowRight, Coins, GraduationCap, Bot, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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

// Static income streams for the hub
const staticStreams = [
  {
    id: 'affiliate',
    slug: 'affiliate',
    title: 'Affiliate Program',
    description: 'Earn commissions by referring new users to our platform.',
    icon: Users,
    color: 'from-primary to-primary/70',
    badge: 'Popular',
  },
  {
    id: 'shc-coin',
    slug: 'shc-coin',
    title: 'SHC Coin',
    description: 'Invest in our native token and grow with the community.',
    icon: Coins,
    color: 'from-accent to-amber-500',
    badge: 'Investment',
  },
  {
    id: 'copy-trading',
    slug: 'copy-trading',
    title: 'Copy Trading',
    description: 'Earn passively by copying professional forex trades. Fully automated.',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    badge: 'Passive',
  },
  {
    id: 'bitcoin-mining',
    slug: 'bitcoin-mining',
    title: 'Bitcoin Mining',
    description: 'Earn Bitcoin passively through cloud mining. No hardware required.',
    icon: Cpu,
    color: 'from-orange-500 to-amber-600',
    badge: 'Crypto',
  },
  {
    id: 'ai-income',
    slug: 'ai-income',
    title: 'AI Income Engine',
    description: 'Leverage AI tools to create automated income streams.',
    icon: Bot,
    color: 'from-violet-500 to-purple-600',
    badge: 'New',
  },
  {
    id: 'education',
    slug: 'education',
    title: 'Education Hub',
    description: 'Access courses and guides to master trading and investing.',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    badge: 'Learn',
  },
];

const IncomeStreams: React.FC = () => {
  const { t } = useTranslation();
  const [dbStreams, setDbStreams] = useState<IncomeStream[]>([]);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    const { data } = await supabase
      .from('income_streams' as any)
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (data) {
      // Filter out any streams that duplicate the static ones
      const filtered = (data as unknown as IncomeStream[]).filter(
        stream => !stream.title.toLowerCase().includes('copy trading') && 
                  !stream.title.toLowerCase().includes('ai income') &&
                  !stream.title.toLowerCase().includes('bitcoin') &&
                  !stream.title.toLowerCase().includes('mining')
      );
      setDbStreams(filtered);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Income Streams</h1>
            <p className="text-sm text-muted-foreground">Choose your path to financial growth</p>
          </div>
        </div>
      </div>

      {/* Income Stream Cards Grid */}
      <div className="px-4 grid gap-4">
        {staticStreams.map((stream) => {
          const IconComponent = stream.icon;
          return (
            <Link key={stream.id} to={`/income-streams/${stream.slug}`}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stream.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{stream.title}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {stream.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {stream.description}
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {/* Dynamic streams from database */}
        {dbStreams.map((stream) => (
          <a key={stream.id} href={stream.link} target="_blank" rel="noopener noreferrer">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{stream.title}</h3>
                      {stream.is_featured && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs shrink-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {stream.description || 'Explore this opportunity'}
                    </p>
                    {stream.potential_earnings && (
                      <p className="text-xs text-primary mt-1">
                        💰 {stream.potential_earnings}
                      </p>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 mt-8">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Ready to start earning? Explore any stream above to get started.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/income-streams/affiliate">
                <Users className="w-4 h-4 mr-2" />
                Quick Start: Affiliate Program
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncomeStreams;
