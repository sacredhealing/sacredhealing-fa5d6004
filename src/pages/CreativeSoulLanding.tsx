import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Mic, Lightbulb, Image as ImageIcon, FileText, ArrowRight, Play, Loader2, Check, Zap, Globe, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCreativeTools } from "@/hooks/useCreativeTools";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreativeSoulLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { hasAccess, isLoading: toolsLoading, refetch } = useCreativeTools();
  const [demoActive, setDemoActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  
  // Admins have full access
  const hasToolAccess = user && (isAdmin || hasAccess('creative-soul-studio'));

  // Admin bypass: Redirect admins directly to store
  useEffect(() => {
    if (user && isAdmin && !toolsLoading) {
      navigate('/creative-soul/store', { replace: true });
    }
  }, [user, isAdmin, toolsLoading, navigate]);

  // Check access from database (refetch on mount and periodically)
  useEffect(() => {
    if (user) {
      refetch();
      // Poll every 5 seconds for access update (in case webhook just processed)
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      
      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(interval), 120000);
      
      return () => clearInterval(interval);
    }
  }, [user, refetch]);

  // Mock demo data for admin/demo access
  const demoText = "This is a demo transcription of your voice. Imagine speaking about your creative vision, and AI transforms it into actionable ideas.";
  const demoIdeas = "1. Write a self-healing journal\n2. Create a digital vision board\n3. Design a meditation poster\n4. Develop a personal affirmation practice";
  const demoImage = "https://via.placeholder.com/400x400/9333EA/FFFFFF?text=Creative+Idea+Image";
  const demoPDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  // Detect affiliate code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setAffiliateId(ref);
      // Store in localStorage for persistence
      localStorage.setItem('creative_soul_affiliate', ref);
    } else {
      // Check localStorage for existing affiliate
      const stored = localStorage.getItem('creative_soul_affiliate');
      if (stored) setAffiliateId(stored);
    }

    // Note: Payment verification is now handled via webhook and database check
  // Users will be automatically granted access when webhook processes payment
  }, [searchParams]);

  const handleDemoAccess = () => setDemoActive(true);

  const handleGetStarted = () => {
    if (hasToolAccess) {
      navigate('/creative-soul/store');
    } else if (user) {
      navigate('/creative-soul/store');
    } else {
      navigate('/auth');
    }
  };

  // Stripe Checkout with affiliate tracking
  const handlePurchase = async () => {
    if (!user) {
      toast.info('Please sign in to purchase creative tools');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      // Use Supabase Edge Function for checkout
      const { data, error } = await supabase.functions.invoke('create-creative-tool-checkout', {
        body: { 
          toolSlug: 'creative-soul-studio',
          ...(affiliateId && { affiliateId })
        }
      });

      if (error) {
        console.error('Checkout function error:', error);
        throw new Error(error.message || 'Failed to create checkout session. Please ensure you are signed in.');
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errorMessage = err.message || err.error?.message || 'Failed to initiate payment. Please ensure you are signed in and try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  };


  const features = [
    { icon: Mic, title: "Voice Recording", description: "Record your voice directly in the browser, no app needed.", color: "text-purple-500" },
    { icon: Sparkles, title: "AI Transcription", description: "Convert your voice to text in any language with Whisper AI.", color: "text-blue-500" },
    { icon: Lightbulb, title: "Idea Generation", description: "Generate creative ideas based on your words using GPT-4.", color: "text-yellow-500" },
    { icon: ImageIcon, title: "Image Creation", description: "Create high-quality images with DALL-E 3 from your ideas.", color: "text-pink-500" },
    { icon: FileText, title: "PDF Export", description: "Export your creations as professional PDF documents.", color: "text-green-500" },
    { icon: Globe, title: "Multi-language", description: "Works with any language for transcription and translation.", color: "text-indigo-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 flex flex-col">
      {/* STORE FINGERPRINT MARKER - MUST RENDER */}
      <div className="bg-green-500/30 border-b-2 border-green-500 px-4 py-3 text-center">
        <span className="text-sm font-mono text-green-700 dark:text-green-400 font-bold">
          STORE_FINGERPRINT_CreativeSoulLanding_tsx_AAA
        </span>
      </div>
      {/* Hero Section */}
      <div className="flex flex-col items-center px-6 py-12 md:py-20 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-20" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 animate-fade-in">
            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent text-center animate-gradient">
              Creative Soul Studio
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-gray-700 text-center max-w-3xl mb-4 leading-relaxed">
            Transform your voice into <strong className="text-purple-600">creative ideas</strong>, <strong className="text-purple-600">images</strong>, and <strong className="text-purple-600">documents</strong>.
          </p>
          <p className="text-base md:text-lg text-gray-600 text-center max-w-2xl mb-8">
            Voice-to-text transcription, AI idea generation, image creation, and PDF export—all in one powerful tool.
          </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
            disabled={toolsLoading}
          >
            {toolsLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : hasToolAccess ? (
              <>
                Open Studio
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          {!user && (
            <Button
              onClick={handleDemoAccess}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Demo
            </Button>
          )}

          {user && !hasToolAccess && (
            <Button
              onClick={handlePurchase}
              size="lg"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Unlock Full Access (€19.99)
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          )}
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <div className="container mx-auto px-6 mb-12 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Powerful Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to transform your voice into creative content
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works Section */}
        <Card className="shadow-xl border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">How It Works</h2>
            
            <div className="p-6 bg-white/80 rounded-xl backdrop-blur-sm">
              <ol className="space-y-4 text-gray-700 max-w-2xl mx-auto">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <span className="font-semibold">Record your voice</span> directly in the browser—no app needed
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <span className="font-semibold">AI converts your voice</span> into text in any language using Whisper AI
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <span className="font-semibold">Generate creative ideas</span> based on your words using GPT-4
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <span className="font-semibold">Create high-quality images</span> with DALL-E 3 and export as PDFs
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">5</div>
                  <div>
                    <span className="font-semibold">Pay once (€19.99)</span> and get full lifetime access with all updates
                  </div>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Section */}
      {demoActive && (
        <div className="container mx-auto px-6 mb-12 max-w-4xl">
          <Card className="shadow-lg border-2 border-purple-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-800">Demo Preview</h3>
                <Badge className="ml-auto bg-green-500 text-white">Free Trial</Badge>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Transcribed Text:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">{demoText}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Generated Ideas:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">{demoIdeas}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Generated Image:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <img 
                      src={demoImage} 
                      alt="Demo AI Image" 
                      className="rounded-lg shadow-md max-w-full h-auto mx-auto" 
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Exported PDF:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <a
                      href={demoPDF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline font-medium inline-flex items-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Download Demo PDF
                    </a>
                  </div>
                </div>
              </div>

              {demoActive && (
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                  {!user && (
                    <Button
                      onClick={handlePurchase}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Get Full Access (€19.99)
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                  {hasToolAccess && (
                    <Button
                      onClick={() => {
                        console.log("CREATIVE_SOUL_CLICK_V1");
                        navigate('/creative-soul/store');
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      size="lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Open Creative Studio
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features List Section */}
      <div className="container mx-auto px-6 mb-12 max-w-4xl">
        <Card className="bg-white shadow-lg border-2 border-purple-100">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "✅ Demo access without paying",
                "✅ Stripe one-time payment (€19.99)",
                "✅ Affiliate tracking via ?ref=ID",
                "✅ AI idea generation (GPT-powered)",
                "✅ AI image generation (DALL·E)",
                "✅ PDF export ready",
                "✅ Fully responsive Tailwind UI",
                "✅ Multi-language support",
                "✅ Voice-to-text transcription",
                "✅ Lifetime access & updates"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors cursor-pointer">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm md:text-base">{feature.replace('✅ ', '')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 mb-12 max-w-4xl">
        <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <CardContent className="p-12 text-center relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to Create?</h2>
            <p className="text-lg mb-8 text-purple-100 max-w-2xl mx-auto">
              Start transforming your voice into beautiful creations today. One-time purchase, lifetime access with all future updates included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={loading || toolsLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : hasToolAccess ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Open Studio
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Get Started Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              {!user && (
                <Button
                  onClick={handleDemoAccess}
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try Demo First
                </Button>
              )}
            </div>
            {affiliateId && (
              <p className="mt-6 text-sm text-purple-200">
                Affiliate tracking active: {affiliateId}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-8 mt-auto">
        &copy; {new Date().getFullYear()} Creative Soul Studio. All rights reserved.
      </footer>
    </div>
  );
}
