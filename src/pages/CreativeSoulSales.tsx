import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Music, PenTool, Heart, Zap, ArrowLeft, Check, ExternalLink, ArrowRight, TrendingUp, Globe, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { toast } from 'sonner';

interface CreativeSoulItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_eur: number;
  type: 'tool' | 'income' | 'course';
  is_active: boolean;
  requires_membership: boolean;
  admin_only: boolean;
  icon_name: string | null;
  workspace_url: string | null;
  internal_url: string | null;
  order_index: number;
}

const iconMap: Record<string, React.ElementType> = {
  Music,
  PenTool,
  Heart,
  Zap,
  Sparkles,
  TrendingUp,
  Globe,
  Crown,
};

export default function CreativeSoulSales() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [items, setItems] = useState<CreativeSoulItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Load items from registry - NO edge functions, NO blocking
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        // Load directly from creative_soul_items table
        // Admins see ALL items (including admin_only), regular users see active non-admin items
        const query = (supabase as any)
          .from('creative_soul_items')
          .select('*')
          .order('order_index', { ascending: true })
          .order('type', { ascending: true });

        // RLS policy handles filtering - admins see all, others see active only
        const { data, error } = await query;

        if (error) {
          console.error('[CreativeSoulSales] Error loading items:', error);
          // Don't block rendering on error - show empty state
          setItems([]);
          return;
        }

        // If admin, show all. Otherwise filter by is_active and admin_only
        let filteredItems = isAdmin 
          ? (data || []) 
          : (data || []).filter(item => item.is_active && !item.admin_only);

        // HARD REQUIREMENT: Show ONLY Creative Soul Studio
        // Remove ALL other items (tools, income streams, courses)
        // Keep only: slug === 'creative-soul-studio' OR title === 'Creative Soul Studio'
        filteredItems = filteredItems.filter(item => {
          return item.slug === 'creative-soul-studio' || item.title === 'Creative Soul Studio';
        });

        setItems(filteredItems as CreativeSoulItem[]);
      } catch (err) {
        console.error('[CreativeSoulSales] Exception loading items:', err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [isAdmin]);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Payment successful! Your creative tool is ready to use.');
    } else if (canceled === 'true') {
      toast.info('Payment was canceled. You can try again anytime.');
    }
  }, [searchParams]);

  // Handle purchase - ONLY called when button clicked, NOT on render
  const handleBuy = async (slug: string, type: string) => {
    if (!user) {
      toast.info('Please sign in to purchase');
      navigate('/auth');
      return;
    }

    // Admins bypass purchase
    if (isAdmin) {
      toast.info('Admin access: You have full access to all tools.');
      return;
    }

    // Income streams redirect to their internal URL
    if (type === 'income') {
      const item = items.find(i => i.slug === slug);
      if (item?.internal_url) {
        navigate(item.internal_url);
      }
      return;
    }

    // For tools, initiate checkout
    setPurchasing(slug);

    try {
      const { data, error } = await supabase.functions.invoke('create-creative-tool-checkout', {
        body: { toolSlug: slug },
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
      setPurchasing(null);
    }
  };

  const handleView = (item: CreativeSoulItem) => {
    if (item.type === 'income' && item.internal_url) {
      navigate(item.internal_url);
    } else if (item.type === 'tool' && item.workspace_url) {
      // If workspace_url is /creative-soul-tool, redirect to store instead
      if (item.workspace_url === '/creative-soul-tool' || item.workspace_url.includes('/creative-soul-tool')) {
        navigate('/creative-soul/store');
      } else {
        window.open(item.workspace_url, '_blank');
      }
    } else if (item.type === 'tool') {
      navigate('/creative-soul/store');
    }
  };

  const getColorClasses = (type: string, iconName: string | null) => {
    const defaultColors = {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      button: 'bg-purple-600 hover:bg-purple-700',
    };

    const typeColors: Record<string, any> = {
      tool: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        button: 'bg-purple-600 hover:bg-purple-700',
      },
      income: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/30',
        button: 'bg-green-600 hover:bg-green-700',
      },
      course: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
    };

    return typeColors[type] || defaultColors;
  };

  // Group items by type
  const tools = items.filter(i => i.type === 'tool');
  const incomeStreams = items.filter(i => i.type === 'income');
  const courses = items.filter(i => i.type === 'course');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-background px-4 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Creative Soul Store
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-2">
            Creative tools designed for creative souls
          </p>
          <div className="flex gap-2 justify-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Creative Soul Studio Banner - Always visible */}
        <section>
          <h2 className="text-3xl font-heading font-semibold text-foreground mb-2 text-center">
            Creative Tools
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            AI-powered tools for your creative journey
          </p>
          
          {/* Creative Soul Studio Card */}
          <div className="max-w-2xl mx-auto">
            <Card className="relative overflow-hidden border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl opacity-40" />
              
              <div className="relative p-8 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <Badge variant="outline" className="text-sm font-semibold bg-purple-500/10 text-purple-400 border-purple-500/30">
                    AI-Powered
                  </Badge>
                </div>

                <h3 className="text-3xl font-heading font-bold text-foreground mb-4">
                  Creative Soul Studio
                </h3>
                
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  Your AI-powered creative companion. Generate ideas, translate content between languages, 
                  extract insights from PDFs, transcribe audio, analyze YouTube videos, and more. 
                  Everything you need to bring your creative visions to life.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: PenTool, label: 'Generate Ideas' },
                    { icon: Globe, label: 'Translate Content' },
                    { icon: Music, label: 'Transcribe Audio' },
                    { icon: Zap, label: 'Analyze PDFs' },
                    { icon: Heart, label: 'YouTube Insights' },
                    { icon: Crown, label: 'Creative AI' },
                  ].map(({ icon: FeatureIcon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FeatureIcon className="w-4 h-4 text-purple-400" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate('/creative-soul')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  size="lg"
                >
                  Get This Tool
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Dynamic items from database */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Additional Tools from database */}
            {tools.length > 0 && (
              <section>
                <h2 className="text-2xl font-heading font-semibold text-foreground mb-6 text-center">
                  More Tools
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tools.map((item) => {
                    const colors = getColorClasses(item.type, item.icon_name);
                    const Icon = iconMap[item.icon_name || 'Sparkles'] || Sparkles;

                    return (
                      <Card
                        key={item.id}
                        className={`relative overflow-hidden border-2 ${colors.border} hover:border-opacity-60 transition-all duration-300`}
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50`} />
                        <div className="relative p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                              <Icon className={`w-6 h-6 ${colors.text}`} />
                            </div>
                            {item.price_eur > 0 && (
                              <Badge variant="outline" className="text-sm font-semibold">
                                €{item.price_eur.toFixed(2)}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-2xl font-heading font-bold text-foreground mb-3">
                            {item.title}
                          </h3>
                          
                          <p className="text-muted-foreground mb-6 flex-grow">
                            {item.description || 'Creative tool for your spiritual journey'}
                          </p>

                          <Button
                            onClick={() => navigate('/creative-soul')}
                            className={`w-full ${colors.button} text-white font-semibold`}
                            size="lg"
                          >
                            Get This Tool
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Income Streams Section */}
            {incomeStreams.length > 0 && (
              <section>
                <h2 className="text-3xl font-heading font-semibold text-foreground mb-2 text-center">
                  Income Streams
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Opportunities to earn while you learn and grow
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {incomeStreams.map((item) => {
                    const colors = getColorClasses(item.type, item.icon_name);
                    const Icon = iconMap[item.icon_name || 'TrendingUp'] || TrendingUp;

                    return (
                      <Card
                        key={item.id}
                        className={`relative overflow-hidden border-2 ${colors.border} hover:border-opacity-60 transition-all duration-300`}
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50`} />
                        <div className="relative p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                              <Icon className={`w-6 h-6 ${colors.text}`} />
                            </div>
                            <Badge variant="outline" className="text-sm font-semibold bg-green-500/10 text-green-600 border-green-500/30">
                              Income
                            </Badge>
                          </div>

                          <h3 className="text-2xl font-heading font-bold text-foreground mb-3">
                            {item.title}
                          </h3>
                          
                          <p className="text-muted-foreground mb-6 flex-grow">
                            {item.description || 'Income opportunity'}
                          </p>

                          <Button
                            onClick={() => handleView(item)}
                            className={`w-full ${colors.button} text-white font-semibold`}
                            size="lg"
                          >
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Courses Section */}
            {courses.length > 0 && (
              <section>
                <h2 className="text-3xl font-heading font-semibold text-foreground mb-2 text-center">
                  Courses
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Learn and grow with structured courses
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((item) => {
                    const colors = getColorClasses(item.type, item.icon_name);
                    const Icon = iconMap[item.icon_name || 'Heart'] || Heart;

                    return (
                      <Card
                        key={item.id}
                        className={`relative overflow-hidden border-2 ${colors.border} hover:border-opacity-60 transition-all duration-300`}
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50`} />
                        <div className="relative p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                              <Icon className={`w-6 h-6 ${colors.text}`} />
                            </div>
                            {item.price_eur > 0 && (
                              <Badge variant="outline" className="text-sm font-semibold">
                                €{item.price_eur.toFixed(2)}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-2xl font-heading font-bold text-foreground mb-3">
                            {item.title}
                          </h3>
                          
                          <p className="text-muted-foreground mb-6 flex-grow">
                            {item.description || 'Course description'}
                          </p>

                          <Button
                            onClick={() => handleView(item)}
                            className={`w-full ${colors.button} text-white font-semibold`}
                            size="lg"
                          >
                            {item.price_eur > 0 ? 'Enroll' : 'View'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
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
