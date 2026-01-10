import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Music, Sparkles, ArrowRight, Play, Download, Headphones, Radio, Zap, Check, Youtube, Upload, Link as LinkIcon, Wand2, Crown, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreativeSoulMeditationLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { balance } = useSHCBalance();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  // Check for affiliate code
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setAffiliateId(ref);
      localStorage.setItem('creative_soul_meditation_affiliate', ref);
    } else {
      const stored = localStorage.getItem('creative_soul_meditation_affiliate');
      if (stored) setAffiliateId(stored);
    }
  }, [searchParams]);

  // Check access
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      if (isAdmin) {
        setHasAccess(true);
        return;
      }

      try {
        const { data: access } = await (supabase as any)
          .from('creative_tool_access')
          .select('*, tool:creative_tools!inner(slug)')
          .eq('user_id', user.id)
          .eq('tool.slug', 'creative-soul-meditation')
          .maybeSingle();

        if (access) {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
  }, [user, isAdmin]);

  const handleGetStarted = () => {
    if (hasAccess) {
      navigate('/creative-soul-meditation-tool');
    } else if (user) {
      navigate('/creative-soul-meditation-tool');
    } else {
      navigate('/auth');
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.info('Please sign in to purchase');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-audio-checkout', {
        body: {
          ...(affiliateId && { affiliateId }),
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const features = [
    { icon: Youtube, title: 'YouTube Support', description: 'Convert any YouTube video into meditation audio', color: 'text-red-500' },
    { icon: Upload, title: 'Audio Upload', description: 'Upload your own audio files (MP3, WAV, M4A)', color: 'text-blue-500' },
    { icon: LinkIcon, title: 'URL Support', description: 'Process audio from direct URLs', color: 'text-green-500' },
    { icon: Radio, title: 'Stem Separation', description: 'High-quality Demucs stem separation with keep/delete options', color: 'text-purple-500' },
    { icon: Wand2, title: 'Multi-Variant Generation', description: 'Generate 1-5 unique meditation track variants', color: 'text-pink-500' },
    { icon: Headphones, title: 'Binaural Beats', description: 'Add binaural beats for deeper meditation', color: 'text-indigo-500' },
    { icon: Music, title: 'Frequency Tuning', description: '432Hz, 528Hz, or 440Hz frequency options', color: 'text-amber-500' },
    { icon: Download, title: 'High-Quality Downloads', description: 'Download final audio and stems in studio quality', color: 'text-teal-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white text-center py-20 px-4 rounded-xl mb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold cursor-pointer hover:scale-105 transition-transform">
              Creative Soul Meditation
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-6 leading-relaxed">
            Transform any audio or YouTube video into high-quality meditation, affirmation, and healing tracks
          </p>
          <p className="text-lg mb-8 text-purple-100">
            Use real music, binaural beats, frequency tuning, and full stem separation to create professional-quality audio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-6 px-8 rounded-lg text-xl cursor-pointer hover:scale-105 transition-transform shadow-xl"
            >
              {hasAccess ? (
                <>
                  <Music className="w-5 h-5 mr-2" />
                  Open Tool
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Try Creative Soul Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-12 space-y-12">
        {/* Demo Notice */}
        <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold text-amber-900 cursor-pointer hover:scale-105 transition-transform inline-block">
              Try the <strong className="text-amber-700">one free demo</strong> before purchase. Upload audio or paste a YouTube link!
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Powerful Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to create professional meditation audio tracks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform ${feature.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800 cursor-pointer">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="shadow-xl border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">How It Works</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-start gap-4 p-4 bg-white/80 rounded-xl backdrop-blur-sm hover:bg-white transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 hover:scale-110 transition-transform">
                  1
                </div>
                <div>
                  <span className="font-semibold text-lg">Upload or Link Audio</span>
                  <p className="text-gray-600 mt-1">Upload files, paste YouTube URLs, or provide direct audio links</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/80 rounded-xl backdrop-blur-sm hover:bg-white transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 hover:scale-110 transition-transform">
                  2
                </div>
                <div>
                  <span className="font-semibold text-lg">Configure Options</span>
                  <p className="text-gray-600 mt-1">Choose style, frequency, binaural beats, BPM matching, and stem separation options</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/80 rounded-xl backdrop-blur-sm hover:bg-white transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0 hover:scale-110 transition-transform">
                  3
                </div>
                <div>
                  <span className="font-semibold text-lg">Generate Variants</span>
                  <p className="text-gray-600 mt-1">Create 1-5 unique meditation track variants with professional quality</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/80 rounded-xl backdrop-blur-sm hover:bg-white transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold flex-shrink-0 hover:scale-110 transition-transform">
                  4
                </div>
                <div>
                  <span className="font-semibold text-lg">Download & Enjoy</span>
                  <p className="text-gray-600 mt-1">Download high-quality final audio and stems for your meditation practice</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing CTA */}
        <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <CardContent className="p-12 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="w-8 h-8" />
              <h2 className="text-4xl font-bold">One-Time Purchase</h2>
            </div>
            <p className="text-2xl font-bold mb-2">€19.99</p>
            <p className="text-lg mb-6 text-purple-100">+ 1000 Sacred Healing Coins instantly credited</p>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Lifetime access with all features, updates, and unlimited generations included
            </p>
            <div className="space-y-4">
              {!hasAccess && (
                <Button
                  onClick={handlePurchase}
                  size="lg"
                  disabled={loading}
                  className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Unlock Full Features Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
              {hasAccess && (
                <Button
                  onClick={() => navigate('/creative-soul-meditation-tool')}
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                >
                  <Music className="w-5 h-5 mr-2" />
                  Access Your Tool
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              {balance && (
                <p className="text-sm text-purple-200 mt-4">
                  Your current balance: <strong>{balance.balance || 0} SHC</strong>
                </p>
              )}
            </div>
            {affiliateId && (
              <p className="mt-6 text-sm text-purple-200">
                Affiliate tracking active: {affiliateId}
              </p>
            )}
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card className="bg-white shadow-lg border-2 border-purple-100">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                '✅ One free demo generation',
                '✅ YouTube / URL / Upload support',
                '✅ High-quality stem separation (Demucs)',
                '✅ Keep/delete stem options',
                '✅ Multi-variant generation (1-5 variants)',
                '✅ BPM/frequency/binaural options',
                '✅ Curated library + user music uploads',
                '✅ High-quality final audio + stems download',
                '✅ Stripe payment (€19.99)',
                '✅ 1000 Sacred Healing Coins on purchase',
                '✅ Affiliate tracking (?ref=AFFILIATEID)',
                '✅ Lifetime access & updates',
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors cursor-pointer hover:scale-105 transform"
                >
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-base">{feature.replace('✅ ', '')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-8">
          &copy; {new Date().getFullYear()} Creative Soul Meditation. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

