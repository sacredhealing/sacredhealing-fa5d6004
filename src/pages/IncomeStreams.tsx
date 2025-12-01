import React, { useState, useEffect } from 'react';
import { ExternalLink, DollarSign, TrendingUp, Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const IncomeStreams: React.FC = () => {
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
