import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Music, PenTool, Heart, Zap, ArrowLeft, Check, ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreativeTools } from '@/hooks/useCreativeTools';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  Music,
  PenTool,
  Heart,
  Zap,
};

export default function CreativeSoulSales() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { availableTools, userTools, hasAccess, refetch, isLoading } = useCreativeTools();

  useEffect(() => {
    // Handle success/cancel from Stripe redirect
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Payment successful! Your creative tool is ready to use.');
      // Refetch user tools to show newly purchased tool
      refetch();
    } else if (canceled === 'true') {
      toast.info('Payment was canceled. You can try again anytime.');
    }
  }, [searchParams, refetch]);

  const handleBuy = async (toolSlug: string) => {
    if (!user) {
      toast.info('Please sign in to purchase creative tools');
      navigate('/auth');
      return;
    }

    // Check if already owned
    if (hasAccess(toolSlug)) {
      toast.info('You already own this tool!');
      return;
    }

    setPurchasing(toolSlug);

    try {
      const { data, error } = await supabase.functions.invoke('create-creative-tool-checkout', {
        body: {
          toolSlug,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error?.message || 'Failed to start checkout. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const getColorClasses = (toolType: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; button: string }> = {
      music_beat: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        button: 'bg-purple-600 hover:bg-purple-700',
      },
      soul_writing: {
        bg: 'bg-pink-500/10',
        text: 'text-pink-400',
        border: 'border-pink-500/30',
        button: 'bg-pink-600 hover:bg-pink-700',
      },
      meditation_creator: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
      energy_translator: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        button: 'bg-orange-600 hover:bg-orange-700',
      },
    };
    return colors[toolType] || colors.music_beat;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-background px-4 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Creative Soul Studio
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-2">
            Tools designed for creative souls — artists, musicians, writers, healers.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Express yourself, get guidance, and create with intention. These tools support your creativity, not replace it.
          </p>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mt-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Tools Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-heading font-semibold text-foreground mb-2 text-center">
          Creative Tools
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Choose the tool that resonates with your creative journey
        </p>

        {/* Featured Tool Spotlight on Sales Page */}
        {availableTools.find(t => t.is_featured === true) && (() => {
          const featured = availableTools.find(t => t.is_featured === true)!;
          const FeaturedIcon = iconMap[featured.icon_name || 'Sparkles'] || Sparkles;
          const featuredOwned = hasAccess(featured.slug);
          const featuredAccess = userTools.find(ut => ut.tool.slug === featured.slug);
          const colors = getColorClasses(featured.tool_type);

          return (
            <Card className="mb-8 border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <CardContent className="relative p-8">
                <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                  <div className={`w-20 h-20 rounded-xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center flex-shrink-0`}>
                    <FeaturedIcon className={`w-10 h-10 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary text-primary-foreground text-sm font-semibold">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Featured Tool
                      </Badge>
                      {featuredOwned && (
                        <Badge className="bg-green-500 text-white text-sm">
                          Owned
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-3xl font-heading font-bold text-foreground mb-3">
                      {featured.name}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {featured.description || 'Discover this powerful creative tool designed for your spiritual journey.'}
                    </p>
                  </div>
                </div>

                {/* Promotion Banner */}
                {featured.promo_text && !featuredOwned && (
                  <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30">
                    <p className="text-red-600 dark:text-red-400 font-bold text-center text-xl mb-2">
                      {featured.promo_text}
                    </p>
                    {featured.promo_discount_percent && featured.promo_discount_percent > 0 && (
                      <p className="text-green-600 dark:text-green-400 font-bold text-center text-2xl">
                        Save {featured.promo_discount_percent}% Today!
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      {featured.promo_discount_percent && featured.promo_discount_percent > 0 && !featuredOwned ? (
                        <>
                          <span className="text-xl line-through text-muted-foreground">
                            €{featured.price_eur.toFixed(2)}
                          </span>
                          <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                            €{(featured.price_eur * (1 - featured.promo_discount_percent / 100)).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-foreground">€{featured.price_eur.toFixed(2)}</span>
                      )}
                    </div>
                    {!featuredOwned && (
                      <span className="text-muted-foreground">One-time purchase</span>
                    )}
                  </div>
                  
                  {featuredOwned && featuredAccess ? (
                    <Button
                      onClick={() => window.open(featuredAccess.tool.workspace_url, '_blank')}
                      className={`${colors.button} text-white font-semibold px-8 py-3 text-lg w-full sm:w-auto`}
                      size="lg"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Open Tool
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBuy(featured.slug)}
                      disabled={purchasing === featured.slug}
                      className={`${colors.button} text-white font-semibold px-8 py-3 text-lg w-full sm:w-auto`}
                      size="lg"
                    >
                      {purchasing === featured.slug ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {featured.featured_action_text || 'Get This Tool'}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {!featuredOwned && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground italic">
                      Earn rewards as an affiliate when others purchase through your link!
                    </p>
                    {featured.featured_end_date && (
                      <p className="text-xs text-muted-foreground mt-2 font-medium">
                        ⏰ Offer ends {new Date(featured.featured_end_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableTools
              .filter(tool => !tool.is_featured) // Exclude featured tool from grid (shown above)
              .map((tool) => {
              const colors = getColorClasses(tool.tool_type);
              const Icon = iconMap[tool.icon_name || 'Sparkles'] || Sparkles;
              const isPurchasing = purchasing === tool.slug;
              const owned = hasAccess(tool.slug);
              const userAccess = userTools.find(ut => ut.tool.slug === tool.slug);

              return (
                <Card
                  key={tool.id}
                  className={`relative overflow-hidden border-2 ${colors.border} hover:border-opacity-60 transition-all duration-300 ${owned ? 'ring-2 ring-green-500/50' : ''}`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50`} />
                  <div className="relative p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {owned && (
                          <Badge className="bg-green-500 text-white">
                            <Check className="w-3 h-3 mr-1" />
                            Owned
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-sm font-semibold">
                          €{tool.price_eur.toFixed(2)}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-2xl font-heading font-bold text-foreground mb-3">
                      {tool.name}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6 flex-grow">
                      {tool.description || 'Creative tool for your spiritual journey'}
                    </p>

                    {owned && userAccess ? (
                      <Button
                        onClick={() => window.open(userAccess.tool.workspace_url, '_blank')}
                        className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold`}
                        size="lg"
                      >
                        Open Tool
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleBuy(tool.slug)}
                        disabled={isPurchasing}
                        className={`w-full ${colors.button} text-white font-semibold`}
                        size="lg"
                      >
                        {isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          'Buy Now'
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer Reassurance */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-center border-t border-border/50">
        <div className="bg-muted/30 rounded-2xl p-8">
          <p className="text-muted-foreground italic text-lg mb-4">
            "You don't need to understand technology. Just start with a feeling — we'll help with the rest."
          </p>
          <p className="text-sm text-muted-foreground">
            Every purchase supports your growth, unlocks tools for your creative journey, 
            and rewards affiliates automatically. All tools include lifetime access and updates.
          </p>
        </div>
      </section>
    </div>
  );
}

