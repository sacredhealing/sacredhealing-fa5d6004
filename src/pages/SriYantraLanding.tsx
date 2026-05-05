import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SriYantra } from "@/components/sri-yantra/SriYantra";

const COSMIC_BLUE = "#0A0F1E";
const SIDDHA_GOLD = "#D4AF37";
const QUANTUM_BLUE = "#4A90E2";
const VIRUS_RED = "#E74C3C";

export default function SriYantraLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setAffiliateId(ref);
      localStorage.setItem("sri_yantra_affiliate", ref);
    } else {
      const stored = localStorage.getItem("sri_yantra_affiliate");
      if (stored) setAffiliateId(stored);
    }
  }, [searchParams]);

  const handleBuy = async () => {
    if (!user) {
      toast.info("Please sign in to purchase");
      navigate("/auth");
      return;
    }

    setPurchaseLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        "create-sri-yantra-shield-checkout",
        {
          body: affiliateId ? { affiliateId } : {},
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }
      );

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      console.error("Sri Yantra checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
      setPurchaseLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[#F5F5F5] font-sans overflow-hidden relative"
      style={{ background: COSMIC_BLUE }}
    >
      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-16 md:py-20"
        style={{
          background: "radial-gradient(circle at top, #1B2735 0%, #0A0F1E 100%)",
        }}
      >
        <div className="mb-6 h-40 w-40 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)]">
          <SriYantra />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.3em] mb-2 text-center">
          v2026.SUPREME
        </h1>
        <p className="text-lg md:text-xl text-center" style={{ color: SIDDHA_GOLD }}>
          ACTIVATING THE SIDDHA-QUANTUM 1KM BIO-FIELD
        </p>
      </section>

      {/* Anchor + Mantra Codes */}
      <section className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2 px-4 md:px-[10%] py-10">
        <div className="bg-white/5 border border-yellow-500/30 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-semibold mb-3">
            1. THE 1000M SRI YANTRA ANCHOR
          </h3>
          <p className="text-sm md:text-base text-white/80">
            <span className="font-semibold">One-Time GPS Lock:</span> Privacy-First Stationary
            Shield. The app anchors the Bindu (center point) to your coordinates once, then shuts
            off GPS. The field remains fixed in the Akasha 24/7.
          </p>
          <hr className="my-5 border-white/10" />
          <h3 className="text-lg md:text-xl font-semibold mb-3">MINERAL RESONANCE MATRIX</h3>
          <p className="text-sm md:text-base text-white/80">
            <span className="font-semibold">Elite Shungite + Orgonite:</span> Our 2050 technology
            uses the non-physical vibrational signature of Shungite Fullerenes to absorb EMF and
            Orgonite to pump constant Positive Orgone Radiation (POR) across the 1km radius.
          </p>
        </div>

        <div className="bg-white/5 border border-yellow-500/30 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-semibold mb-4">
            2. SIDDHA FREQUENCY &amp; MANTRA CODES
          </h3>
          <ul className="space-y-4 text-sm md:text-base">
            <li className="border-b border-white/10 pb-3">
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                OM RAM RAMAYA NAMAHA
              </p>
              <p className="text-white/80">
                Solar-Fire Pathogen Killer (Mold, Viruses, Parasites).
              </p>
            </li>
            <li className="border-b border-white/10 pb-3">
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                OM HRIM SHRIM KLIM ADYA KALIKA...
              </p>
              <p className="text-white/80">
                EMF Transmutation: Chaotic 7G to Coherent Field Memory.
              </p>
            </li>
            <li className="border-b border-white/10 pb-3">
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                OM NAMAH SHIVAYA
              </p>
              <p className="text-white/80">
                Atmospheric Scrubbing (Chemtrails / Pollution Deletion).
              </p>
            </li>
            <li>
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                MAHA MRITYUNJAYA
              </p>
              <p className="text-white/80">
                1km Boundary Protection &amp; Akashic Grounding.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* HUD Before/After */}
      <section
        className="py-16 px-4 md:px-[10%] text-center"
        style={{ background: "#111" }}
      >
        <h2 className="text-xl font-mono tracking-widest uppercase mb-8">
          QUANTUM SCANNER: 1000M RADIUS
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-6 max-w-4xl mx-auto">
          <div className="flex-1 border border-[#333] rounded-lg p-6 text-left">
            <p className="text-sm font-mono uppercase mb-3 opacity-80">
              BEFORE ACTIVATION
            </p>
            <div
              className="font-mono text-sm font-bold uppercase"
              style={{ color: VIRUS_RED }}
            >
              Chaotic EMF spikes, active pathogens, fear spikes.
            </div>
            <div className="mt-3 h-24 rounded-md bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.4)_0,transparent_60%)] border border-red-500/40" />
          </div>
          <div className="flex-1 border border-[#27AE60] bg-[#e8f5e9] rounded-lg p-6 text-left text-[#111]">
            <p className="text-sm font-mono uppercase mb-3 opacity-80">
              AFTER SIDDHA SHIELD
            </p>
            <div
              className="font-mono text-sm font-bold uppercase"
              style={{ color: "#27AE60" }}
            >
              Harmonic coherence, inert neutralized mold / viruses.
            </div>
            <div className="mt-3 h-24 rounded-md bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.45)_0,transparent_60%)] border border-emerald-500/60" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-4 md:px-[10%] text-center"
        style={{ background: COSMIC_BLUE }}
      >
        <p className="text-base opacity-70 mb-8 max-w-xl mx-auto">
          Test with any EMF meter to see spike stabilization. Perform a Water Freeze Test to see
          hexagonal symmetry. Experience Live Blood unclumping in 20 minutes.
        </p>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleBuy}
            disabled={purchaseLoading}
            className="rounded-full px-10 py-6 text-lg font-bold uppercase tracking-[2px] border-0 text-white shadow-lg transition-transform"
            style={{
              background:
                "linear-gradient(135deg, #D4AF37 0%, #F1C40F 100%)",
              boxShadow: "0 4px 15px rgba(212, 175, 55, 0.4)",
            }}
          >
            {purchaseLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirecting…
              </>
            ) : (
              "GET 24/7 1KM PROTECTION - €49 (STRIPE / CRYPTO)"
            )}
          </Button>
        </motion.div>

        <p className="mt-8 text-sm opacity-50">
          Accepted: VISA, MC, BTC, ETH
        </p>
      </section>

      {/* Back */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          onClick={() => navigate("/explore")}
          className="text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 font-mono text-sm"
        >
          <ArrowLeft size={18} />
          LIBRARY
        </Button>
      </div>
    </div>
  );
}
