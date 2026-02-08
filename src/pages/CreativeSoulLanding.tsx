import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Headphones,
  Waves,
  Music,
  Brain,
  Layers,
  Zap,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MEDITATION_FEATURES = [
  { icon: Waves, label: "Healing Frequencies", color: "text-amber-400" },
  { icon: Music, label: "15 Meditation Styles", color: "text-violet-400" },
  { icon: Brain, label: "Binaural Beats", color: "text-cyan-400" },
  { icon: Layers, label: "Stem Separation", color: "text-rose-400" },
  { icon: Zap, label: "Multi-Variant", color: "text-amber-400" },
  { icon: Headphones, label: "High-Quality", color: "text-emerald-400" },
];

const PRICING_OPTIONS = [
  {
    plan: "lifetime" as const,
    price: "€149",
    label: "Lifetime Access",
    highlight: false,
  },
  {
    plan: "monthly" as const,
    price: "€14.99",
    label: "/ month",
    highlight: true,
  },
  {
    plan: "single" as const,
    price: "€9.99",
    label: "One Meditation",
    highlight: false,
  },
];

export default function CreativeSoulLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [hasMeditationAccess, setHasMeditationAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  // Lifetime = forever, monthly = until period end, single = after payment
  const hasValidEntitlement = (ent: { has_access: boolean; plan?: string }) => {
    if (!ent?.has_access) return false;
    return true;
  };

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setAffiliateId(ref);
      localStorage.setItem("creative_soul_affiliate", ref);
    } else {
      const stored = localStorage.getItem("creative_soul_affiliate");
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
          .from("creative_soul_entitlements")
          .select("has_access, plan")
          .eq("user_id", user.id);

        const { data: grantedAccess } = await supabase
          .from("admin_granted_access")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .in("access_type", ["creative_soul", "creative_soul_meditation"]);

        const hasEntitlement = entitlements?.some(hasValidEntitlement) ?? false;
        setHasMeditationAccess(hasEntitlement || (grantedAccess?.length ?? 0) > 0);
      } catch (error) {
        console.error("Error checking access:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAccess();
  }, [user]);

  const handleGetStarted = () => {
    if (hasMeditationAccess || isAdmin) {
      navigate("/creative-soul/meditation");
    } else if (user) {
      return;
    } else {
      navigate("/auth");
    }
  };

  const handlePurchase = async (plan: "lifetime" | "monthly" | "single") => {
    if (!user) {
      toast.info("Please sign in to purchase");
      navigate("/auth");
      return;
    }

    setPurchaseLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke(
        "creative-soul-create-checkout",
        {
          body: {
            plan,
            ...(affiliateId && { ref: affiliateId }),
          },
        }
      );

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
      setPurchaseLoading(null);
    }
  };

  const handleOpenStore = () => navigate("/creative-soul/store");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0808] via-[#1a1518] to-[#0d0a0c] flex flex-col">
      {/* Warm ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/12 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-6 md:px-8">
          <Button
            variant="ghost"
            onClick={handleOpenStore}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Store
          </Button>
          {!user && (
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-amber-500/40 text-amber-100 hover:bg-amber-500/10"
            >
              Sign In
            </Button>
          )}
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center px-6 py-12 md:py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-amber-500/30 mb-6">
            <Headphones className="w-8 h-8 text-amber-400" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              <Check className="w-3 h-3 mr-1" />
              Free Access
            </Badge>
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/40">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Creative Soul Meditation
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-12 leading-relaxed">
            Transform any audio into high-quality meditation tracks. Apply healing
            frequencies, choose from 15 meditation styles, add binaural beats, and
            use stem separation for professional-quality audio.
          </p>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-12">
            {PRICING_OPTIONS.map((option) => {
              const isLoading = purchaseLoading === option.plan;
              const disabled =
                loading ||
                purchaseLoading !== null ||
                hasMeditationAccess ||
                isAdmin;

              return (
                <button
                  key={option.plan}
                  onClick={() => handlePurchase(option.plan)}
                  disabled={disabled}
                  className={`
                    relative rounded-2xl p-6 text-center transition-all duration-300
                    border-2 backdrop-blur-sm
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${
                      option.highlight
                        ? "border-amber-500/60 bg-amber-500/10 hover:border-amber-400/80 hover:bg-amber-500/15"
                        : "border-white/10 bg-white/5 hover:border-amber-500/40 hover:bg-amber-500/5"
                    }
                  `}
                >
                  {option.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-500/90 text-black text-xs font-semibold">
                        Popular
                      </Badge>
                    </div>
                  )}
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
                  ) : (
                    <div className="text-3xl font-bold text-white mb-1">
                      {option.price}
                    </div>
                  )}
                  <div className="text-sm text-white/70 mb-3">{option.label}</div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs">
                    +1000 SHC
                  </Badge>
                </button>
              );
            })}
          </div>

          {(hasMeditationAccess || isAdmin) && (
            <Button
              onClick={() => navigate("/creative-soul/meditation")}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold px-8 py-6 text-lg"
            >
              <Headphones className="w-5 h-5 mr-2" />
              Open Meditation Tool
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          {!hasMeditationAccess && !isAdmin && user && (
            <p className="text-sm text-white/50">
              Choose a plan above to get started
            </p>
          )}
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-16 max-w-4xl">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            What You Get
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {MEDITATION_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <span className="text-white/90 font-medium">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-16 max-w-2xl">
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-amber-500/15 border border-amber-500/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to Transform Your Audio?
            </h2>
            <p className="text-white/70 mb-6">
              Upload any track, apply healing frequencies, and create
              professional meditation experiences.
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold px-8"
            >
              {hasMeditationAccess || isAdmin ? (
                <>
                  Open Tool
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : user ? (
                "Choose a Plan Above"
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </section>

        {affiliateId && (
          <p className="text-center text-sm text-white/40 pb-8">
            Affiliate referral applied
          </p>
        )}

        <footer className="text-center text-white/40 text-sm py-8 mt-auto">
          © {new Date().getFullYear()} Sacred Healing · Creative Soul Meditation
        </footer>
      </div>
    </div>
  );
}
