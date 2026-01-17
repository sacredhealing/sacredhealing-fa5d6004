import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Music, Heart, Palette, Feather, Sun, Moon, Star, 
  ArrowRight, Play, Loader2, Crown, Wand2, Headphones, 
  Lightbulb, Mic, FileText, ImageIcon, Globe, Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  'creative-soul-meditation': Headphones,
  'music-beat-companion': Music,
  'soul-writing': Feather,
  'meditation-creator': Heart,
  'energy-translator': Zap,
};

// Tool routes
const toolRoutes: Record<string, string> = {
  'creative-soul-studio': '/creative-soul/tool',
  'creative-soul-meditation': '/creative-soul/meditation',
};

export default function CreativeSoulStore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { availableTools, isLoading, hasAccess, refetch } = useCreativeTools();
  const [searchParams] = useSearchParams();
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

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

  // Handle tool access
  const handleToolClick = async (tool: CreativeTool) => {
    if (isAdmin || hasAccess(tool.slug)) {
      const route = toolRoutes[tool.slug] || tool.workspace_url || '/creative-soul/tool';
      navigate(route);
    } else {
      handlePurchase(tool);
    }
  };

  // Purchase handler
  const handlePurchase = async (tool: CreativeTool) => {
    if (!user) {
      toast.info('Please sign in to unlock creative tools');
      navigate('/auth');
      return;
    }

    setPurchaseLoading(tool.slug);
    try {
      const { data, error } = await supabase.functions.invoke('create-creative-tool-checkout', {
        body: { 
          toolSlug: tool.slug,
          ...(affiliateId && { affiliateId })
        }
      });

      if (error) throw new Error(error.message);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payment');
      setPurchaseLoading(null);
    }
  };

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  // Hero features
  const heroFeatures = [
    { icon: Mic, label: "Voice to Vision" },
    { icon: Lightbulb, label: "AI Ideas" },
    { icon: ImageIcon, label: "Create Art" },
    { icon: Music, label: "Sound Design" },
  ];

  // Get the two main tools
  const studioTool = availableTools.find(t => t.slug === 'creative-soul-studio');
  const meditationTool = availableTools.find(t => t.slug === 'creative-soul-meditation');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50/30 to-rose-50/50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sun className="w-12 h-12 text-amber-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-rose-50/50 overflow-hidden">
      {/* Warm ambient background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-96 h-96 bg-rose-200/25 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      {/* Hero Section */}
      <motion.section 
        className="relative pt-12 pb-16 px-6 md:px-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Floating decorative elements */}
          <div className="absolute top-8 left-1/4 opacity-40">
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Star className="w-6 h-6 text-amber-400" />
            </motion.div>
          </div>
          <div className="absolute top-20 right-1/4 opacity-40">
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Heart className="w-5 h-5 text-rose-400" />
            </motion.div>
          </div>
          <div className="absolute top-32 left-1/3 opacity-30">
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <Palette className="w-7 h-7 text-orange-400" />
            </motion.div>
          </div>

          {/* Main heading */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/80 backdrop-blur-sm rounded-full border border-amber-200/50 mb-6">
              <Sun className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">For Creative Souls</span>
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight"
          >
            <span className="text-stone-800">Unlock Your</span>
            <br />
            <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              Creative Spirit
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-stone-600 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            A sanctuary for creative souls who embrace technology to
            <span className="text-amber-700 font-medium"> amplify their gifts</span>, 
            <span className="text-orange-600 font-medium"> manifest their visions</span>, and 
            <span className="text-rose-600 font-medium"> share their light</span> with the world.
          </motion.p>

          {/* Feature pills */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {heroFeatures.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-amber-100 shadow-sm"
              >
                <feature.icon className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-stone-700">{feature.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Admin badge */}
          {isAdmin && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-sm">
                <Crown className="w-4 h-4 mr-2" />
                Creator Access Enabled
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Tools Section */}
      <section className="relative px-6 md:px-12 pb-16">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-stone-800 mb-4">
              Your Creative Toolkit
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Two powerful tools designed to transform your creative process and bring your inner visions to life.
            </p>
          </motion.div>

          {/* Tool Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Creative Soul Studio */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card 
                className={`relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-200/50 cursor-pointer group h-full ${
                  hasAccess('creative-soul-studio') 
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50' 
                    : 'border-amber-200/50 bg-white/80 hover:border-amber-300'
                }`}
                onClick={() => studioTool && handleToolClick(studioTool)}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-8 relative">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>

                  {/* Status badges */}
                  <div className="flex gap-2 mb-4">
                    {hasAccess('creative-soul-studio') ? (
                      <Badge className="bg-amber-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        One-time Purchase
                      </Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl font-heading font-bold text-stone-800 mb-3">
                    Creative Soul Studio
                  </h3>
                  <p className="text-stone-600 mb-6 leading-relaxed">
                    Transform your voice into creative ideas, stunning images, and professional documents. 
                    Speak your vision, let AI amplify it.
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { icon: Mic, label: "Voice Recording" },
                      { icon: Lightbulb, label: "AI Ideas" },
                      { icon: ImageIcon, label: "Image Creation" },
                      { icon: FileText, label: "PDF Export" },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                        <f.icon className="w-4 h-4 text-amber-500" />
                        <span>{f.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                    <div>
                      <span className="text-3xl font-bold text-amber-600">
                        {studioTool ? formatPrice(studioTool.price_eur) : '€19.99'}
                      </span>
                      <span className="text-sm text-stone-500 ml-2">lifetime</span>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
                      disabled={purchaseLoading === 'creative-soul-studio'}
                    >
                      {purchaseLoading === 'creative-soul-studio' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : hasAccess('creative-soul-studio') || isAdmin ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Open Studio
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Get Access
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Creative Soul Meditation */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card 
                className={`relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-200/50 cursor-pointer group h-full ${
                  hasAccess('creative-soul-meditation') 
                    ? 'border-rose-300 bg-gradient-to-br from-rose-50 to-purple-50' 
                    : 'border-rose-200/50 bg-white/80 hover:border-rose-300'
                }`}
                onClick={() => meditationTool && handleToolClick(meditationTool)}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 via-transparent to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-8 relative">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-rose-200/50 group-hover:scale-110 transition-transform duration-300">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>

                  {/* Status badges */}
                  <div className="flex gap-2 mb-4">
                    {hasAccess('creative-soul-meditation') ? (
                      <Badge className="bg-rose-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-rose-300 text-rose-700">
                        One-time Purchase
                      </Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl font-heading font-bold text-stone-800 mb-3">
                    Soul Meditation Creator
                  </h3>
                  <p className="text-stone-600 mb-6 leading-relaxed">
                    Craft personalized meditation soundscapes with healing frequencies, 
                    binaural beats, and atmospheric layers.
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { icon: Music, label: "Sound Layers" },
                      { icon: Wand2, label: "DSP Effects" },
                      { icon: Heart, label: "Healing Hz" },
                      { icon: Globe, label: "Export MP3" },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                        <f.icon className="w-4 h-4 text-rose-500" />
                        <span>{f.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-rose-100">
                    <div>
                      <span className="text-3xl font-bold text-rose-600">
                        {meditationTool ? formatPrice(meditationTool.price_eur) : '€29.99'}
                      </span>
                      <span className="text-sm text-stone-500 ml-2">lifetime</span>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white shadow-lg shadow-rose-200/50"
                      disabled={purchaseLoading === 'creative-soul-meditation'}
                    >
                      {purchaseLoading === 'creative-soul-meditation' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : hasAccess('creative-soul-meditation') || isAdmin ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Open Tool
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Get Access
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="relative px-6 md:px-12 py-16 bg-gradient-to-b from-transparent via-amber-50/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-amber-100 mb-8">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-stone-700">Our Philosophy</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-heading font-bold text-stone-800 mb-6">
              Technology as a Creative Partner
            </h2>

            <p className="text-lg text-stone-600 leading-relaxed mb-8">
              We believe technology should <em className="text-amber-700">amplify</em> your creative gifts, not replace them. 
              These tools are designed to help you express what's already within you — 
              removing friction between your imagination and its manifestation in the world.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                {
                  icon: Sun,
                  title: "Illuminate",
                  description: "Bring your inner visions into the light with AI-assisted creation tools.",
                  color: "amber"
                },
                {
                  icon: Heart,
                  title: "Nurture",
                  description: "Cultivate your creative practice in a warm, supportive digital environment.",
                  color: "rose"
                },
                {
                  icon: Sparkles,
                  title: "Expand",
                  description: "Push the boundaries of your creativity with powerful yet intuitive tools.",
                  color: "orange"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-amber-100 hover:shadow-lg hover:shadow-amber-100/50 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    item.color === 'amber' ? 'from-amber-100 to-amber-200' :
                    item.color === 'rose' ? 'from-rose-100 to-rose-200' :
                    'from-orange-100 to-orange-200'
                  } flex items-center justify-center mb-4 mx-auto`}>
                    <item.icon className={`w-6 h-6 ${
                      item.color === 'amber' ? 'text-amber-600' :
                      item.color === 'rose' ? 'text-rose-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <h3 className="font-heading font-semibold text-stone-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 md:px-12 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 border-0 shadow-2xl shadow-orange-200/50">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <CardContent className="relative p-8 md:p-12 text-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                Ready to Create?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
                Join fellow creative souls who are using these tools to manifest their visions 
                and share their unique gifts with the world.
              </p>

              {user ? (
                <Button 
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 shadow-lg px-8"
                  onClick={() => {
                    const tool = studioTool || meditationTool;
                    if (tool) handleToolClick(tool);
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Explore Tools
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button 
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 shadow-lg px-8"
                  onClick={() => navigate('/auth')}
                >
                  <Sun className="w-5 h-5 mr-2" />
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 md:px-12 py-8 text-center">
        <p className="text-sm text-stone-500">
          🔒 Secure payments by Stripe • Lifetime access included • 
          {affiliateId && ` Referral: ${affiliateId}`}
        </p>
        <p className="text-xs text-stone-400 mt-2">
          © {new Date().getFullYear()} Creative Soul Tools • Made with ♥ for creative spirits
        </p>
      </footer>
    </div>
  );
}
