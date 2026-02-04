import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Crown, Radio, Zap, ArrowRight, Loader2, Check, 
  Brain, Music, Waves, Headphones, Scissors, Sliders, 
  Download, Youtube, Lock, Sparkles, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreativeSoulLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [loading, setLoading] = useState<string | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check entitlement
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('creative_soul_entitlements')
          .select('has_access')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHasAccess(isAdmin || (data?.has_access ?? false));
      } catch (err) {
        console.error('Error checking access:', err);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, isAdmin]);

  // Detect affiliate code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setAffiliateId(ref);
      localStorage.setItem('creative_soul_affiliate', ref);
    } else {
      const stored = localStorage.getItem('creative_soul_affiliate');
      if (stored) setAffiliateId(stored);
    }
  }, [searchParams]);

  const handlePurchase = async (plan: 'lifetime' | 'monthly' | 'single') => {
    if (!user) {
      toast.info('Please sign in to purchase');
      navigate('/auth');
      return;
    }

    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-create-checkout', {
        body: { 
          plan,
          ...(affiliateId && { ref: affiliateId })
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Failed to initiate payment');
      setLoading(null);
    }
  };

  const features = [
    { icon: Brain, title: "Neural Engine", description: "AI-powered audio processing and transformation" },
    { icon: Music, title: "15 Meditation Styles", description: "Indian, Tibetan, Nature, Space, and more" },
    { icon: Waves, title: "Healing Frequencies", description: "432Hz, 528Hz, and Solfeggio tones" },
    { icon: Headphones, title: "Binaural Beats", description: "Alpha, Theta, Delta brainwave entrainment" },
    { icon: Scissors, title: "Stem Separation", description: "Isolate vocals, music, or full mix" },
    { icon: Sliders, title: "DSP Mastering", description: "Professional reverb, delay, and warmth" },
    { icon: Download, title: "High-Quality Export", description: "WAV and MP3 format output" },
    { icon: Youtube, title: "YouTube Import", description: "Extract audio from any YouTube video" },
  ];

  const pricingPlans = [
    {
      id: 'lifetime' as const,
      title: 'Lifetime Access',
      price: '€149',
      period: 'one-time',
      coins: '+1000 SHC',
      icon: Crown,
      features: ['Unlimited exports', 'All meditation styles', 'Priority support', 'Future updates included'],
      popular: true,
      buttonText: 'Get Lifetime Access',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      id: 'monthly' as const,
      title: 'Monthly',
      price: '€14.99',
      period: '/month',
      coins: '+1000 SHC',
      icon: Radio,
      features: ['Unlimited exports', 'All meditation styles', 'Cancel anytime', 'Monthly SHC rewards'],
      popular: false,
      buttonText: 'Subscribe Monthly',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'single' as const,
      title: 'Single Use',
      price: '€9.99',
      period: 'per export',
      coins: '+1000 SHC',
      icon: Zap,
      features: ['One meditation export', 'All styles available', 'High-quality output', 'Pay as you go'],
      popular: false,
      buttonText: 'Pay Per Track',
      gradient: 'from-purple-500 to-violet-600',
    },
  ];

  const steps = [
    { num: 1, title: 'Upload Audio', description: 'Upload your audio file or paste a YouTube URL' },
    { num: 2, title: 'Choose Style', description: 'Select from 15 meditation styles and frequencies' },
    { num: 3, title: 'Apply DSP', description: 'Fine-tune with reverb, delay, and healing tones' },
    { num: 4, title: 'Export', description: 'Download your professional meditation track' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-6xl mx-auto text-center">
            {/* Logo/Title */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,254,0.4)]">
                <Headphones className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Spectral Alchemy
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-4 font-light">
              Neural Production Mastering Suite
            </p>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Transform any audio into healing meditation tracks with AI-powered processing,
              healing frequencies, and professional DSP mastering.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {hasAccess ? (
                <Button
                  onClick={() => navigate('/creative-soul/meditation')}
                  size="xl"
                  className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_30px_rgba(0,242,254,0.5)]"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Open Spectral Alchemy
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    size="xl"
                    className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_30px_rgba(0,242,254,0.5)]"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start Creating
                  </Button>
                  <Button
                    onClick={() => navigate('/creative-soul/meditation')}
                    variant="outline"
                    size="xl"
                    className="border-white/20 text-white hover:bg-white/5"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Try Demo
                  </Button>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 justify-center text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                15 Meditation Styles
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                Healing Frequencies
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                Professional Export
              </span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
              Powerful Features
            </h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
              Everything you need to create professional healing meditation tracks
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index}
                    className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all group"
                  >
                    <CardContent className="p-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-[0_0_20px_rgba(0,242,254,0.3)]">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
              Choose Your Plan
            </h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
              Select the payment option that works best for you
            </p>

            {hasAccess ? (
              <Card className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border-cyan-500/30">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">You Have Access!</h3>
                  <p className="text-slate-400 mb-6">
                    You already have access to Spectral Alchemy. Start creating now.
                  </p>
                  <Button
                    onClick={() => navigate('/creative-soul/meditation')}
                    size="lg"
                    className="w-full bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0]"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Open Tool
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pricingPlans.map((plan) => {
                  const Icon = plan.icon;
                  const isLoading = loading === plan.id;
                  
                  return (
                    <Card 
                      key={plan.id}
                      className={`bg-black/40 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all relative overflow-hidden ${
                        plan.popular ? 'ring-2 ring-cyan-500/50' : ''
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          MOST POPULAR
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1">{plan.title}</h3>
                        
                        <div className="mb-4">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                          <span className="text-slate-400 ml-1">{plan.period}</span>
                        </div>
                        
                        <p className="text-amber-400 font-semibold text-sm mb-6">{plan.coins}</p>
                        
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                              <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <Button
                          onClick={() => handlePurchase(plan.id)}
                          disabled={isLoading || checkingAccess}
                          className={`w-full bg-gradient-to-r ${plan.gradient} text-white font-bold hover:opacity-90`}
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            plan.buttonText
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {affiliateId && (
              <p className="text-center text-sm text-slate-500 mt-6">
                Affiliate tracking active: <span className="text-cyan-400">{affiliateId}</span>
              </p>
            )}
          </div>
        </section>

        {/* Trust Section */}
        <section className="px-6 py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-slate-300 italic mb-8">
              "You don't need to understand technology to create healing meditation tracks.
              Just upload, transform, and export."
            </p>
            
            <div className="flex flex-wrap gap-8 justify-center text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Secure Stripe Payment
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Instant Access
              </span>
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                30% Affiliate Commission
              </span>
            </div>
            
            {/* Link to Creative Soul Studio */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-slate-500 mb-4">Also check out:</p>
              <Button
                onClick={() => navigate('/creative-soul/store')}
                variant="ghost"
                className="text-slate-400 hover:text-white"
              >
                Creative Soul Studio (Voice-to-AI)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
