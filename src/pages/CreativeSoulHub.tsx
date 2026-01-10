import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Music, Mic, Wand2, Heart, Zap, ArrowRight, Play, Loader2, Crown, Youtube, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCreativeTools, CreativeTool } from '@/hooks/useCreativeTools';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tool icon mapping
const toolIcons: Record<string, any> = {
  'creative-soul-studio': Sparkles,
  'creative-soul-meditation': Music,
  'music-beat-companion': Music,
  'soul-writing': FileText,
  'meditation-creator': Heart,
  'energy-translator': Zap,
};

// Tool route mapping
const toolRoutes: Record<string, string> = {
  'creative-soul-studio': '/creative-soul/store',
  'creative-soul-meditation': '/creative-soul-meditation-tool',
  'music-beat-companion': '/creative-soul/store',
  'soul-writing': '/creative-soul/store',
  'meditation-creator': '/creative-soul/store',
  'energy-translator': '/creative-soul/store',
};

export default function CreativeSoulHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { availableTools, userTools, isLoading, hasAccess } = useCreativeTools();
  const [searchParams] = useSearchParams();
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  // Detect affiliate code
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setAffiliateId(ref);
      localStorage.setItem('creative_soul_affiliate', ref);
    } else {
      const stored = localStorage.getItem('creative_soul_affiliate');
      if (stored) setAffiliateId(stored);
    }
  }, [searchParams]);

  // Handle tool click - admins bypass landing, go directly to tool
  const handleToolClick = async (tool: CreativeTool) => {
    // Admins have direct access to all tools
    if (isAdmin) {
      // Redirect /creative-soul-tool URLs to store
      const route = toolRoutes[tool.slug] || (tool.workspace_url && tool.workspace_url !== '/creative-soul-tool' && !tool.workspace_url.includes('/creative-soul-tool') ? tool.workspace_url : null) || '/creative-soul/store';
      navigate(route);
      return;
    }

    // Check if user has access to this tool
    const userHasAccess = hasAccess(tool.slug);
    
    if (userHasAccess) {
      // User has access, go directly to tool
      // Redirect /creative-soul-tool URLs to store
      const route = toolRoutes[tool.slug] || (tool.workspace_url && tool.workspace_url !== '/creative-soul-tool' && !tool.workspace_url.includes('/creative-soul-tool') ? tool.workspace_url : null) || '/creative-soul/store';
      navigate(route);
    } else {
      // User doesn't have access - show purchase/landing page
      if (tool.slug === 'creative-soul-meditation') {
        navigate(`/creative-soul-meditation-landing${affiliateId ? `?ref=${affiliateId}` : ''}`);
      } else if (tool.slug === 'creative-soul-studio') {
        navigate(`/creative-soul/store${affiliateId ? `?ref=${affiliateId}` : ''}`);
      } else {
        // For other tools, navigate to store instead of /creative-soul-tool
        const route = tool.workspace_url && tool.workspace_url !== '/creative-soul-tool' && !tool.workspace_url.includes('/creative-soul-tool') 
          ? tool.workspace_url 
          : '/creative-soul/store';
        navigate(route);
      }
    }
  };

  const formatPrice = (priceEur: number) => {
    return `€${priceEur.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50 p-8">
      {/* STORE FINGERPRINT MARKER - MUST RENDER */}
      <div className="bg-blue-500/30 border-b-2 border-blue-500 px-4 py-3 text-center mb-4">
        <span className="text-sm font-mono text-blue-700 dark:text-blue-400 font-bold">
          STORE_FINGERPRINT_CreativeSoulHub_tsx_AAA
        </span>
      </div>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform inline-block">
              Creative Soul Tools
            </h1>
            <p className="text-muted-foreground mt-2">
              Transform your creativity with AI-powered tools
            </p>
          </div>
        </div>
        {isAdmin && (
          <Badge className="mb-4 bg-purple-600 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Admin Access - Direct tool access enabled
          </Badge>
        )}
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto">
        {availableTools.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <p className="text-muted-foreground">No tools available at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTools.map((tool) => {
              const Icon = toolIcons[tool.slug] || Sparkles;
              const userHasAccess = hasAccess(tool.slug);
              const isFeatured = tool.is_featured;

              return (
                <Card
                  key={tool.id}
                  className={`border-2 hover:border-primary hover:shadow-xl transition-all cursor-pointer group hover:scale-105 ${
                    isFeatured ? 'border-purple-300 bg-gradient-to-br from-purple-50/50 to-white' : ''
                  } ${
                    userHasAccess ? 'border-green-300 bg-green-50/30' : ''
                  }`}
                  onClick={() => handleToolClick(tool)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-purple-600" />
                      </div>
                      {isFeatured && (
                        <Badge variant="secondary" className="bg-purple-600 text-white">
                          Featured
                        </Badge>
                      )}
                      {userHasAccess && (
                        <Badge variant="default" className="bg-green-600 text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          Owned
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl cursor-pointer">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tool.description || 'Transform your creative process with AI-powered tools.'}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(tool.price_eur)}
                      </span>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick(tool);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white cursor-pointer"
                        size="sm"
                      >
                        {isAdmin ? (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Open
                          </>
                        ) : userHasAccess ? (
                          <>
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Use Tool
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Learn More
                          </>
                        )}
                      </Button>
                    </div>

                    {tool.promo_text && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        {tool.promo_text}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto mt-12 text-center text-sm text-muted-foreground">
        <p>
          🔒 Secure payment processing by Stripe • 
          Coins automatically credited after purchase • 
          {affiliateId && ` Affiliate tracking: ${affiliateId}`}
        </p>
      </div>
    </div>
  );
}

