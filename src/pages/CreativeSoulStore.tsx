import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Headphones, ArrowLeft, Check, Lightbulb, Languages, FileText, Mic, Youtube, Cpu, Music, Waves, Brain, Layers, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CreativeSoulStore = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [hasStudioAccess, setHasStudioAccess] = useState(false);
  const [hasMeditationAccess, setHasMeditationAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
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

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: entitlements } = await supabase
          .from('creative_soul_entitlements')
          .select('*')
          .eq('user_id', user.id)
          .eq('has_access', true);

        if (entitlements && entitlements.length > 0) {
          setHasStudioAccess(true);
          setHasMeditationAccess(true);
        }

        const { data: grantedAccess } = await supabase
          .from('admin_granted_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .in('access_type', ['creative_soul', 'creative_soul_meditation']);

        if (grantedAccess) {
          grantedAccess.forEach(access => {
            if (access.access_type === 'creative_soul') setHasStudioAccess(true);
            if (access.access_type === 'creative_soul_meditation') setHasMeditationAccess(true);
          });
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  const handleStudioAccess = () => {
    if (isAdmin || hasStudioAccess) {
      navigate('/creative-soul/tool');
    } else {
      handlePurchase('creative-soul-studio');
    }
  };

  const handleMeditationAccess = () => {
    if (isAdmin || hasMeditationAccess) {
      navigate('/creative-soul/meditation');
    } else {
      handlePurchase('creative-soul-meditation');
    }
  };

  const handlePurchase = async (toolSlug: string) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      navigate('/auth');
      return;
    }

    setPurchaseLoading(toolSlug);
    try {
      const { data, error } = await supabase.functions.invoke('create-creative-tool-checkout', {
        body: { 
          toolSlug,
          ...(affiliateId && { affiliateId })
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
      setPurchaseLoading(null);
    }
  };

  const studioFeatures = [
    { icon: Lightbulb, label: "Generate Ideas" },
    { icon: Languages, label: "Translate Content" },
    { icon: Mic, label: "Transcribe Audio" },
    { icon: FileText, label: "Analyze PDFs" },
    { icon: Youtube, label: "YouTube Insights" },
    { icon: Cpu, label: "Creative AI" },
  ];

  const meditationFeatures = [
    { icon: Waves, label: "Healing Frequencies" },
    { icon: Music, label: "15 Meditation Styles" },
    { icon: Brain, label: "Binaural Beats" },
    { icon: Layers, label: "Stem Separation" },
    { icon: Zap, label: "Multi-Variant" },
    { icon: Headphones, label: "High-Quality" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-purple-800/20 to-background" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 mb-6">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Creative Soul Store
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Creative tools designed for creative souls
          </p>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Tools Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">Creative Tools</h2>
          <p className="text-muted-foreground">AI-powered tools for your creative journey</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Creative Soul Studio Card */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">€19.99</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Free Access
                    </Badge>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                      AI Powered
                    </Badge>
                  </div>
                </div>
              </div>
              <CardTitle className="text-xl text-white mt-4">Creative Soul Studio</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your AI-powered creative companion. Generate ideas, translate content between languages, 
                extract insights from PDFs, transcribe audio, analyze YouTube videos, and more. 
                Everything you need to bring your creative visions to life.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {studioFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <feature.icon className="w-4 h-4 text-purple-400" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
              <Button 
                onClick={handleStudioAccess}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading || purchaseLoading === 'creative-soul-studio'}
              >
                {purchaseLoading === 'creative-soul-studio' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isAdmin || hasStudioAccess ? 'Open Studio (Admin Access)' : 'Get Access'}
              </Button>
            </CardContent>
          </Card>

          {/* Creative Soul Meditation Card */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30">
                  <Headphones className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="flex gap-2 mb-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Free Access
                    </Badge>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                      AI Powered
                    </Badge>
                  </div>
                </div>
              </div>
              <CardTitle className="text-xl text-white mt-4">Creative Soul Meditation</CardTitle>
              <CardDescription className="text-muted-foreground">
                Transform any audio into high-quality meditation tracks. Apply healing frequencies, 
                choose from 15 meditation styles, add binaural beats, and use stem separation 
                for professional-quality audio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Options */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background/50 rounded-lg p-3 text-center border border-border/50">
                  <div className="text-xl font-bold text-white">€149</div>
                  <div className="text-xs text-muted-foreground">Lifetime Access</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center border border-border/50">
                  <div className="text-xl font-bold text-white">€14.99</div>
                  <div className="text-xs text-muted-foreground">/ month</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center border border-border/50">
                  <div className="text-xl font-bold text-white">€9.99</div>
                  <div className="text-xs text-muted-foreground">One Meditation</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {meditationFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <feature.icon className="w-4 h-4 text-purple-400" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleMeditationAccess}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading || purchaseLoading === 'creative-soul-meditation'}
              >
                {purchaseLoading === 'creative-soul-meditation' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isAdmin || hasMeditationAccess ? 'Open Tool (Admin Access)' : 'Get Access'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Quote */}
        <div className="max-w-3xl mx-auto mt-16">
          <Card className="bg-card/30 border-border/30 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground italic mb-4">
                "You don't need to understand technology. Just start with a feeling — we'll help with the rest."
              </p>
              <p className="text-sm text-muted-foreground/70">
                Every purchase supports your growth, unlocks tools for your creative journey, and rewards affiliates automatically. 
                All tools include lifetime access and updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreativeSoulStore;
