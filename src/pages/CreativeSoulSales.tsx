import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Music, PenTool, Heart, Zap, ArrowLeft, Check, ArrowRight, Globe, Crown, Radio, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function CreativeSoulSales() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [hasMeditationAccess, setHasMeditationAccess] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  
  // Check access on mount and handle affiliate attribution
  useEffect(() => {
    const checkAccess = async () => {
      setIsCheckingAccess(true);
      const ref = searchParams.get('ref'); // affiliate ref

      // If not logged in, allow viewing store (affiliate ref will be handled by landing page)
    if (!user) {
        setIsCheckingAccess(false);
        setHasMeditationAccess(false);
      return;
    }

      // Save affiliate attribution (best effort)
      if (ref) {
        await supabase.from('affiliate_attribution').upsert(
          { user_id: user.id, ref_code: ref, last_seen_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        await supabase.from('affiliate_events').insert({
          ref_code: ref,
          user_id: user.id,
          tool_slug: 'creative-soul',
          event_type: 'visit',
        });
      }

      // Check admin status
      if (isAdmin) {
        setHasMeditationAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      // Check Creative Soul Meditation entitlement
      const { data: ent } = await supabase
        .from('creative_soul_entitlements')
        .select('has_access, plan')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasMeditationAccess(ent?.has_access === true);
      setIsCheckingAccess(false);
    };

    checkAccess();
  }, [user, isAdmin, searchParams]);

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
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                      €19.99
                    </Badge>
                    {isAdmin && (
                      <Badge variant="outline" className="text-sm font-semibold bg-green-500/10 text-green-400 border-green-500/30">
                        <Check className="w-3 h-3 mr-1" />
                        Free Access
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                      AI-Powered
                        </Badge>
                  </div>
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
                  
                {isAdmin ? (
                    <Button
                    onClick={() => navigate('/creative-soul-tool')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      size="lg"
                    >
                    <Check className="w-4 h-4 mr-2" />
                    Open Studio (Admin Access)
                    </Button>
                  ) : (
                    <Button
                    onClick={() => navigate('/creative-soul')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                      size="lg"
                    >
                    Get This Tool
                    <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
            </Card>
          </div>
        </section>

        {/* Creative Soul Meditation Banner - Hardcoded */}
        <section>
          <div className="max-w-2xl mx-auto">
            <Card className="relative overflow-hidden border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl opacity-40" />
              
              <div className="relative p-8 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <Headphones className="w-8 h-8 text-purple-400" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                    {isAdmin && (
                      <Badge variant="outline" className="text-sm font-semibold bg-green-500/10 text-green-400 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                        Free Access
                          </Badge>
                        )}
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                      AI-Powered
                        </Badge>
                      </div>
                    </div>

                <h3 className="text-3xl font-heading font-bold text-foreground mb-4">
                  Creative Soul Meditation
                    </h3>
                    
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  Transform any audio into high-quality meditation tracks. Apply healing frequencies, 
                  choose from 15 meditation styles, add binaural beats, and use stem separation for professional-quality audio.
                </p>

                {/* Pricing Options */}
                <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                  <div className="bg-purple-500/10 rounded-lg px-6 py-4 border border-purple-500/30 cursor-fancy">
                    <p className="text-2xl font-bold text-foreground">€149</p>
                    <p className="text-sm text-muted-foreground opacity-80">Lifetime Access</p>
                  </div>

                  <div className="bg-purple-500/10 rounded-lg px-6 py-4 border border-purple-500/30 cursor-fancy">
                    <p className="text-2xl font-bold text-foreground">€14.99 / month</p>
                    <p className="text-sm text-muted-foreground opacity-80">Monthly Creator Subscription</p>
                  </div>

                  <div className="bg-purple-500/10 rounded-lg px-6 py-4 border border-purple-500/30 cursor-fancy">
                    <p className="text-2xl font-bold text-foreground">€9.99</p>
                    <p className="text-sm text-muted-foreground opacity-80">One Meditation</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: Heart, label: 'Healing Frequencies' },
                    { icon: Crown, label: '15 Meditation Styles' },
                    { icon: Radio, label: 'Binaural Beats' },
                    { icon: Zap, label: 'Stem Separation' },
                    { icon: Sparkles, label: 'Multi-Variant' },
                    { icon: Music, label: 'High-Quality' },
                  ].map(({ icon: FeatureIcon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FeatureIcon className="w-4 h-4 text-purple-400" />
                      <span>{label}</span>
                    </div>
                  ))}
                      </div>

                {isCheckingAccess ? (
                        <Button
                    disabled
                    className="w-full bg-purple-600/50 text-white font-semibold"
                          size="lg"
                        >
                    Loading...
                        </Button>
                ) : (isAdmin || hasMeditationAccess) ? (
                          <Button
                    onClick={() => navigate('/creative-soul-meditation-tool')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                            size="lg"
                          >
                    <Check className="w-4 h-4 mr-2" />
                    {isAdmin ? 'Open Tool (Admin Access)' : 'Open Tool'}
                          </Button>
                    ) : (
                      <Button
                    onClick={() => {
                      const ref = searchParams.get('ref');
                      const qs = ref ? `?ref=${encodeURIComponent(ref)}` : '';
                      navigate(`/creative-soul-meditation-landing${qs}`);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                        size="lg"
                      >
                    Get This Tool
                    <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </Card>
          </div>
      </section>
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
