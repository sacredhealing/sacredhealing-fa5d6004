import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, PenTool, Heart, Zap, ExternalLink, Sparkles, ArrowRight, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreativeTools, UserToolAccess } from '@/hooks/useCreativeTools';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  Music,
  PenTool,
  Heart,
  Zap,
};

export const CreativeSoulSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { featuredTool, userTools, isLoading, hasAccess } = useCreativeTools();
  const [purchasingFeatured, setPurchasingFeatured] = useState(false);

  const handleOpenTool = (workspaceUrl: string, slug?: string) => {
    // If it's the main Creative Soul tool, redirect to store
    if (slug === 'creative-soul-studio' || slug?.includes('creative-soul')) {
      navigate('/creative-soul/store');
    } else if (workspaceUrl) {
      // If workspace_url points to /creative-soul-tool, redirect to store
      if (workspaceUrl === '/creative-soul-tool' || workspaceUrl.includes('/creative-soul-tool')) {
        navigate('/creative-soul/store');
      } else {
        window.open(workspaceUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleBuyFeatured = async () => {
    if (!featuredTool) return;
    
    if (!user) {
      toast.info('Please sign in to purchase creative tools');
      navigate('/auth');
      return;
    }

    // Check if already owned
    if (hasAccess(featuredTool.slug)) {
      const userAccess = userTools.find(ut => ut.tool.slug === featuredTool.slug);
      if (userAccess) {
        handleOpenTool(userAccess.tool.workspace_url);
      }
      return;
    }

    setPurchasingFeatured(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-creative-tool-checkout', {
        body: {
          toolSlug: featuredTool.slug,
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
      setPurchasingFeatured(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Get featured tool display info
  const featuredToolOwned = featuredTool ? hasAccess(featuredTool.slug) : false;
  const featuredToolAccess = featuredTool ? userTools.find(ut => ut.tool.slug === featuredTool.slug) : null;
  const FeaturedIcon = featuredTool ? (iconMap[featuredTool.icon_name || 'Sparkles'] || Sparkles) : null;

  return (
    <div id="creative-soul-section" className="mt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      {/* Featured Tool Spotlight - Always show if available */}
      {featuredTool && (
        <Card className="mb-6 border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <CardContent className="relative p-6">
            <div className="flex items-start gap-4 mb-4">
              {FeaturedIcon && (
                <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <FeaturedIcon className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Featured Tool
                  </Badge>
                  {featuredToolOwned && (
                    <Badge className="bg-green-500 text-white">
                      Owned
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
                  {featuredTool.name}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {featuredTool.description || 'Discover this powerful creative tool designed for your spiritual journey.'}
                </p>
              </div>
            </div>

            {/* Promotion Banner */}
            {featuredTool.promo_text && !featuredToolOwned && (
              <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
                <p className="text-red-600 dark:text-red-400 font-semibold text-center text-lg">
                  {featuredTool.promo_text}
                </p>
                {featuredTool.promo_discount_percent && featuredTool.promo_discount_percent > 0 && (
                  <p className="text-green-600 dark:text-green-400 font-bold text-center text-xl mt-1">
                    Save {featuredTool.promo_discount_percent}% Today!
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  {featuredTool.promo_discount_percent && featuredTool.promo_discount_percent > 0 && !featuredToolOwned ? (
                    <>
                      <span className="text-lg line-through text-muted-foreground">
                        €{featuredTool.price_eur.toFixed(2)}
                      </span>
                      <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                        €{(featuredTool.price_eur * (1 - featuredTool.promo_discount_percent / 100)).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-foreground">€{featuredTool.price_eur.toFixed(2)}</span>
                  )}
                </div>
                {!featuredToolOwned && (
                  <span className="text-sm text-muted-foreground">One-time purchase</span>
                )}
              </div>
              
              {featuredToolOwned && featuredToolAccess ? (
                <Button
                  onClick={() => handleOpenTool(featuredToolAccess.tool.workspace_url)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 text-lg"
                  size="lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Open Tool
                </Button>
              ) : (
                <Button
                  onClick={handleBuyFeatured}
                  disabled={purchasingFeatured}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 text-lg"
                  size="lg"
                >
                  {purchasingFeatured ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {featuredTool.featured_action_text || 'Get This Tool'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {!featuredToolOwned && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground italic">
                  Earn rewards as an affiliate when others purchase through your link!
                </p>
                {featuredTool.featured_end_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Offer ends {new Date(featuredTool.featured_end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Your Tools Section */}
      {userTools.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  Your Creative Soul Tools
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userTools.length} {userTools.length === 1 ? 'tool' : 'tools'} ready to use
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creative-soul')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userTools
              .filter(access => !featuredTool || access.tool.slug !== featuredTool.slug)
              .slice(0, 4)
              .map((access: UserToolAccess) => {
          const Icon = iconMap[access.tool.icon_name || 'Sparkles'] || Sparkles;
          const colorMap: Record<string, { bg: string; text: string; border: string }> = {
            music_beat: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
            soul_writing: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
            meditation_creator: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
            energy_translator: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
          };
          const colors = colorMap[access.tool.tool_type] || colorMap.music_beat;

          return (
            <Card
              key={access.id}
              className={`border-2 ${colors.border} hover:border-opacity-60 transition-all duration-300`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Owned
                  </Badge>
                </div>

                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  {access.tool.name}
                </h3>
                
                {access.tool.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {access.tool.description}
                  </p>
                )}

                <Button
                  onClick={() => handleOpenTool(access.tool.workspace_url, access.tool.slug)}
                  className={`w-full ${colors.bg.replace('/10', '')} ${colors.text} hover:opacity-90 font-semibold`}
                  size="lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Tool
                </Button>

                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Purchased {new Date(access.purchased_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          );
              })}
            </div>

            {userTools.filter(access => !featuredTool || access.tool.slug !== featuredTool.slug).length > 4 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/creative-soul')}
                >
                  View All {userTools.length} Tools
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State - Only show if no tools owned and no featured tool exists */}
        {userTools.length === 0 && !featuredTool && (
          <Card className="border-2 border-border/50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-semibold text-foreground">
                    Creative Soul Tools
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    AI-powered creative tools for your journey
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 text-lg">
                You haven't purchased any Creative Soul tools yet.
              </p>
              <Button
                onClick={() => navigate('/creative-soul')}
                className="w-full sm:w-auto"
                size="lg"
              >
                Explore Creative Tools
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

