import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Music, Heart, ArrowLeft, Check, ArrowRight, Headphones, Layers, Split } from 'lucide-react';
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
  
  // Handle affiliate attribution on mount
  useEffect(() => {
    const handleAttribution = async () => {
      const ref = searchParams.get('ref');
      if (!user || !ref) return;

      // Save affiliate attribution (best effort)
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
    };

    handleAttribution();
  }, [user, searchParams]);

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
        {/* Creative Soul Meditation */}
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
                  choose from 15 meditation styles, add binaural beats, and use stem separation for 
                  professional-quality audio.
                </p>

                {/* Pricing Tiers */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="flex flex-col items-center p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                    <span className="text-lg font-bold text-foreground">€149</span>
                    <span className="text-xs text-muted-foreground text-center">Lifetime Access</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                    <span className="text-lg font-bold text-foreground">€14.99</span>
                    <span className="text-xs text-muted-foreground text-center">/ month</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                    <span className="text-lg font-bold text-foreground">€9.99</span>
                    <span className="text-xs text-muted-foreground text-center">One Meditation</span>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: Heart, label: 'Healing Frequencies' },
                    { icon: Layers, label: '15 Meditation Styles' },
                    { icon: Headphones, label: 'Binaural Beats' },
                    { icon: Split, label: 'Stem Separation' },
                    { icon: Sparkles, label: 'Multi-Variant' },
                    { icon: Music, label: 'High-Quality' },
                  ].map(({ icon: FeatureIcon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FeatureIcon className="w-4 h-4 text-purple-400" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                  
                {isAdmin ? (
                  <Button
                    onClick={() => navigate('/creative-soul-meditation-tool')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    size="lg"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Open Tool (Admin Access)
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
