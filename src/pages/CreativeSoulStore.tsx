import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Headphones, ArrowLeft, Check, Music, Waves,
  Brain, Layers, Zap, Loader2, FlaskConical, Cpu, GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { adminGrantedFeatureOr } from "@/lib/adminGrantedAccess";
import { toast } from "sonner";

const SQI_STORE_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;700&display=swap');

.cs-store-root {
  min-height: 100vh;
  background: #050505;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  color: rgba(255,255,255,0.92);
  position: relative;
  overflow-x: hidden;
}
.cs-store-root::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 10% 80%, rgba(147,51,234,0.10) 0%, transparent 55%),
    radial-gradient(ellipse 40% 30% at 90% 20%, rgba(59,130,246,0.10) 0%, transparent 55%);
  pointer-events: none;
  z-index: 0;
}
.cs-store-inner {
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 0 auto;
  padding: 18px 16px 96px;
}
.cs-store-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}
.cs-store-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(5,5,5,0.9);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  cursor: pointer;
  transition: all 0.2s;
}
.cs-store-back:hover {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  box-shadow: 0 0 18px rgba(212,175,55,0.25);
}
.cs-store-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(212,175,55,0.35);
  background: radial-gradient(circle at 0 0, rgba(212,175,55,0.22), rgba(5,5,5,0.96));
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: #D4AF37;
  box-shadow: 0 0 24px rgba(212,175,55,0.35);
}
.cs-store-title-block {
  text-align: center;
  margin-top: 6px;
  margin-bottom: 26px;
}
.cs-store-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(22px, 3.5vw, 32px);
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #D4AF37;
  text-shadow: 0 0 34px rgba(212,175,55,0.45);
  margin-bottom: 6px;
}
.cs-store-subtitle {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.cs-store-grid { max-width: 760px; margin: 0 auto; }
.cs-store-card {
  border-radius: 26px;
  border-width: 1px;
  border-color: rgba(255,255,255,0.06);
  background: radial-gradient(circle at top left, rgba(212,175,55,0.09), rgba(12,12,12,0.98));
  box-shadow: 0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02);
}
.cs-store-oracle-card {
  border-radius: 26px;
  border-width: 1px;
  border-color: rgba(212,175,55,0.18);
  background: radial-gradient(ellipse at top, rgba(212,175,55,0.07), rgba(5,5,5,0.99));
  box-shadow: 0 24px 80px rgba(0,0,0,0.85), 0 0 40px rgba(212,175,55,0.08), 0 0 0 1px rgba(212,175,55,0.05);
}
.cs-store-price-pill {
  border-radius: 18px;
  border-width: 1px;
  padding: 10px 10px 8px;
  background: rgba(5,5,5,0.92);
  border-color: rgba(212,175,55,0.4);
}
.cs-store-bottom-quote { max-width: 760px; margin: 40px auto 0; }
.cs-store-quote-card {
  border-radius: 26px;
  border-width: 1px;
  border-color: rgba(255,255,255,0.06);
  background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.9));
}
/* Admin access glow */
.admin-access-glow {
  box-shadow: 0 0 30px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15);
}
`;

const CreativeSoulStore = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [hasMeditationAccess, setHasMeditationAccess] = useState(false);
  const [hasOracleAccess, setHasOracleAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  // Detect affiliate code — unchanged
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

  const hasValidEntitlement = (ent: { has_access: boolean; plan?: string }) => {
    if (!ent?.has_access) return false;
    return true;
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) { setLoading(false); return; }
      try {
        // Check meditation entitlements — unchanged
        const { data: entitlements } = await supabase
          .from('creative_soul_entitlements')
          .select('has_access, plan')
          .eq('user_id', user.id);

        const hasEntitlement = entitlements?.some(hasValidEntitlement) ?? false;
        if (hasEntitlement) setHasMeditationAccess(true);

        const { data: grantedAccess } = await supabase
          .from('admin_granted_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .or(adminGrantedFeatureOr('creative_soul_meditation'));

        if (grantedAccess?.length) setHasMeditationAccess(true);

        // Check oracle entitlements
        const { data: oracleEntitlements } = await supabase
          .from('admin_granted_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .or(adminGrantedFeatureOr('siddha_oracle'));

        if (oracleEntitlements?.length) setHasOracleAccess(true);

      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAccess();
  }, [user]);

  const handleMeditationAccess = () => {
    if (isAdmin || hasMeditationAccess) {
      navigate('/creative-soul/meditation');
    } else {
      navigate('/creative-soul');
    }
  };

  const handleOracleAccess = () => {
    navigate('/creative-soul/siddha-oracle');
  };

  // Meditation purchase — unchanged
  const handleMeditationPurchase = async (plan: 'lifetime' | 'monthly' | 'single') => {
    if (!user) {
      toast.error('Please sign in to purchase');
      navigate('/auth');
      return;
    }
    setPurchaseLoading(`meditation-${plan}`);
    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-create-checkout', {
        body: { plan, ...(affiliateId && { ref: affiliateId }) }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
      setPurchaseLoading(null);
    }
  };

  // Oracle purchase
  const handleOraclePurchase = async (plan: 'lifetime' | 'monthly' | 'single') => {
    if (!user) {
      toast.error('Please sign in to purchase');
      navigate('/auth');
      return;
    }
    setPurchaseLoading(`oracle-${plan}`);
    try {
      const { data, error } = await supabase.functions.invoke('siddha-oracle-create-checkout', {
        body: { plan, ...(affiliateId && { ref: affiliateId }) }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Oracle checkout error:', error);
      toast.error('Failed to start checkout');
      setPurchaseLoading(null);
    }
  };

  const meditationFeatures = [
    { icon: Waves, label: "Healing Frequencies" },
    { icon: Music, label: "15 Meditation Styles" },
    { icon: Brain, label: "Binaural Beats" },
    { icon: Layers, label: "Stem Separation" },
    { icon: Zap, label: "Multi-Variant" },
    { icon: Headphones, label: "High-Quality" },
  ];

  const oracleFeatures = [
    { icon: Sparkles, label: "Scalar Wave Fields" },
    { icon: Waves, label: "Siddha Scan (Siddha Quantum Intelligence)" },
    { icon: FlaskConical, label: "Master Energy Signatures" },
    { icon: Brain, label: "Binaural Synthesis" },
    { icon: Cpu, label: "FFmpeg Alchemy Engine" },
    { icon: GitBranch, label: "Supabase Storage" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SQI_STORE_STYLES }} />
      <div className="cs-store-root">
        <div className="cs-store-inner">

          {/* Top bar */}
          <div className="cs-store-topbar">
            <button type="button" className="cs-store-back" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-3 h-3" />
              Back to Nexus
            </button>
            <div className="cs-store-pill">
              <Sparkles className="w-3 h-3" />
              <span>Creative Soul · SQI 2050</span>
            </div>
          </div>

          {/* Title */}
          <div className="cs-store-title-block">
            <div className="cs-store-title">Creative Soul Store</div>
            <div className="cs-store-subtitle">Bhakti-Algorithms for Creators & Healers</div>
          </div>

          <div className="cs-store-grid space-y-8">

            {/* ── CARD 1: Creative Soul Meditation ── */}
            <Card className="cs-store-card overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#D4AF37]/12 border border-[#D4AF37]/35">
                    <Headphones className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex gap-2 justify-end">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-400/40 text-[10px] tracking-[0.18em] uppercase">
                        <Check className="w-3 h-3 mr-1" /> Access Ready
                      </Badge>
                      <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40 text-[10px] tracking-[0.18em] uppercase">
                        SQI Engine
                      </Badge>
                    </div>
                    <p className="text-[9px] font-semibold tracking-[0.32em] uppercase text-white/45">
                      Neural-Sync Meditation Studio · 2050
                    </p>
                  </div>
                </div>
                <CardTitle className="text-xl text-white/[0.92] mt-5">Creative Soul Meditation</CardTitle>
                <CardDescription className="text-sm leading-[1.6] text-white/[0.92] mt-2">
                  Transform any audio into a Siddha-grade meditation master. Apply healing frequencies,
                  choose from 15 meditation styles, add binaural beats, and use stem separation for
                  professional-quality audio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-7">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleMeditationPurchase('lifetime')}
                    disabled={loading || purchaseLoading?.startsWith('meditation-') || isAdmin || hasMeditationAccess}
                    className="cs-store-price-pill text-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D4AF37]/70 hover:shadow-[0_0_22px_rgba(212,175,55,0.35)] transition-all"
                  >
                    {purchaseLoading === 'meditation-lifetime'
                      ? <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                      : <div className="text-xl font-bold text-white">€149</div>}
                    <div className="text-[11px] text-white/55 mt-0.5">Lifetime Access</div>
                    <Badge className="mt-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-[10px] tracking-[0.18em] uppercase">+1000 SHC</Badge>
                  </button>
                  <button
                    onClick={() => handleMeditationPurchase('monthly')}
                    disabled={loading || purchaseLoading?.startsWith('meditation-') || isAdmin || hasMeditationAccess}
                    className="cs-store-price-pill text-center disabled:opacity-40 disabled:cursor-not-allowed ring-2 ring-[#D4AF37]/40"
                  >
                    {purchaseLoading === 'meditation-monthly'
                      ? <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                      : <div className="text-xl font-bold text-white">€14.99</div>}
                    <div className="text-[11px] text-white/55 mt-0.5">/ month</div>
                    <Badge className="mt-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-[10px] tracking-[0.18em] uppercase">+1000 SHC</Badge>
                  </button>
                  <button
                    onClick={() => handleMeditationPurchase('single')}
                    disabled={loading || purchaseLoading?.startsWith('meditation-') || isAdmin || hasMeditationAccess}
                    className="cs-store-price-pill text-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D4AF37]/60 hover:shadow-[0_0_18px_rgba(212,175,55,0.25)] transition-all"
                  >
                    {purchaseLoading === 'meditation-single'
                      ? <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                      : <div className="text-xl font-bold text-white">€9.99</div>}
                    <div className="text-[11px] text-white/55 mt-0.5">One Meditation</div>
                    <Badge className="mt-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-[10px] tracking-[0.18em] uppercase">+1000 SHC</Badge>
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {meditationFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-white/[0.85]">
                      <feature.icon className="w-4 h-4 text-[#D4AF37]" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>
                {(isAdmin || hasMeditationAccess) && (
                  <Button
                    onClick={handleMeditationAccess}
                    className="w-full bg-[#D4AF37] hover:bg-[#f0d26a] text-black font-semibold tracking-[0.18em] uppercase text-[10px] admin-access-glow"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Open Tool (Access Granted)
                  </Button>
                )}
                {affiliateId && (
                  <p className="text-[10px] text-center text-white/45 tracking-[0.18em] uppercase mt-1">
                    Affiliate field active · Your referrer earns 30% commission
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ── CARD 2: Siddha Sound Alchemy Oracle — visible to ALL users ── */}
            <Card className="cs-store-oracle-card overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#D4AF37]/12 border border-[#D4AF37]/35">
                    <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex gap-2 justify-end">
                      {isAdmin ? (
                        <Badge variant="outline" className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/60 text-[10px] tracking-[0.18em] uppercase">
                          ✦ Admin Access
                        </Badge>
                      ) : (hasOracleAccess ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-400/40 text-[10px] tracking-[0.18em] uppercase">
                          <Check className="w-3 h-3 mr-1" /> Access Granted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40 text-[10px] tracking-[0.18em] uppercase">
                          SQI Oracle
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[9px] font-semibold tracking-[0.32em] uppercase text-white/45">
                      Siddha Sound Alchemy Oracle · 2050
                    </p>
                  </div>
                </div>
                <CardTitle className="text-xl text-white/[0.92] mt-5">Siddha Sound Alchemy Oracle</CardTitle>
                <CardDescription className="text-sm leading-[1.6] text-white/[0.92] mt-2">
                  Quantum audio consecration engine. Upload any track — the Oracle performs a Siddha Scan
                  through Siddha Quantum Intelligence, channels living scalar wave transmissions from sacred masters, holy places,
                  and plant devas, and alchemizes the audio into a high-frequency healing vessel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-7">

                {/* Pricing — shown only if no access */}
                {!isAdmin && !hasOracleAccess && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleOraclePurchase('lifetime')}
                      disabled={loading || !!purchaseLoading}
                      className="cs-store-price-pill text-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D4AF37]/70 hover:shadow-[0_0_22px_rgba(212,175,55,0.35)] transition-all"
                    >
                      {purchaseLoading === 'oracle-lifetime'
                        ? <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                        : <div className="text-xl font-bold text-white">€144</div>}
                      <div className="text-[11px] text-white/55 mt-0.5">Lifetime Access</div>
                      <Badge className="mt-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-[10px] tracking-[0.18em] uppercase">+2000 SHC</Badge>
                    </button>
                    <button
                      onClick={() => handleOraclePurchase('monthly')}
                      disabled={loading || !!purchaseLoading}
                      className="cs-store-price-pill text-center disabled:opacity-40 disabled:cursor-not-allowed ring-2 ring-[#D4AF37]/40 transition-all"
                    >
                      {purchaseLoading === 'oracle-monthly'
                        ? <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                        : <div className="text-xl font-bold text-white">€22</div>}
                      <div className="text-[11px] text-white/55 mt-0.5">/ month</div>
                      <Badge className="mt-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-[10px] tracking-[0.18em] uppercase">+1000 SHC</Badge>
                    </button>
                    <button
                      onClick={() => handleOraclePurchase('single')}
                      disabled={loading || !!purchaseLoading}
                      className="cs-store-price-pill text-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#D4AF37]/60 hover:shadow-[0_0_18px_rgba(212,175,55,0.25)] transition-all"
                    >
                      {purchaseLoading === 'oracle-single'
                        ? <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                        : <div className="text-xl font-bold text-white">€11</div>}
                      <div className="text-[11px] text-white/55 mt-0.5">One Reading</div>
                      <Badge className="mt-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-[10px] tracking-[0.18em] uppercase">+500 SHC</Badge>
                    </button>
                  </div>
                )}

                {/* Features grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {oracleFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-white/[0.85]">
                      <feature.icon className="w-4 h-4 text-[#D4AF37]" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                {/* Scalar waves teaser */}
                <div className="rounded-2xl bg-black/40 border border-[#D4AF37]/10 p-4 space-y-2">
                  <p className="text-[9px] uppercase tracking-[0.26em] text-[#D4AF37] font-bold [text-shadow:0_0_12px_rgba(212,175,55,0.25)]">
                    Scalar Wave Transmissions Included
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["🌿 Tulsi", "🏔️ Kailash", "🔥 Babaji", "🤍 Ramana", "✨ Tiruvannamalai", "🙏 Neem Karoli Baba"].map(w => (
                      <span key={w} className="text-[10px] px-2 py-1 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5">
                        {w}
                      </span>
                    ))}
                    <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/45">
                      +9 more
                    </span>
                  </div>
                </div>

                {/* Admin: direct access button */}
                {isAdmin && (
                  <Button
                    onClick={handleOracleAccess}
                    className="w-full bg-[#D4AF37] hover:bg-[#f0d26a] text-black font-semibold tracking-[0.18em] uppercase text-[10px] admin-access-glow"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Open Siddha Sound Alchemy Oracle (Admin)
                  </Button>
                )}

                {/* Purchased user: access button */}
                {!isAdmin && hasOracleAccess && (
                  <Button
                    onClick={handleOracleAccess}
                    className="w-full bg-[#D4AF37] hover:bg-[#f0d26a] text-black font-semibold tracking-[0.18em] uppercase text-[10px]"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Open Siddha Sound Alchemy Oracle
                  </Button>
                )}

                {affiliateId && (
                  <p className="text-[10px] text-center text-white/45 tracking-[0.18em] uppercase mt-1">
                    Affiliate field active · Your referrer earns 30% commission
                  </p>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Bottom Quote */}
          <div className="cs-store-bottom-quote">
            <Card className="cs-store-quote-card backdrop-blur-2xl">
              <CardContent className="py-8 px-6 text-center">
                <p className="text-sm text-white/70 italic mb-4">
                  "You don&apos;t need to understand technology. Begin with a feeling — the Siddha-Quantum field will handle the code."
                </p>
                <p className="text-[11px] text-white/55 leading-relaxed max-w-xl mx-auto">
                  Every Creative Soul purchase opens a new protocol inside your Siddha Quantum Nexus: tools are upgraded over time,
                  affiliates are rewarded automatically, and your field stays synced with the 2050 timeline.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </>
  );
};

export default CreativeSoulStore;
