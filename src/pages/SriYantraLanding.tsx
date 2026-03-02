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
        className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
        style={{
          background: "radial-gradient(circle, #2A1B3D 0%, #0A0F1E 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.15] scale-150 rotate-15">
          <SriYantra isActive={false} />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1
            className="text-4xl md:text-5xl font-bold tracking-[4px] mb-2"
            style={{ letterSpacing: "4px" }}
          >
            v2026.SUPREME
          </h1>
          <p className="text-lg md:text-xl opacity-80 tracking-wider">
            ACTIVATING THE SIDDHA-QUANTUM 1KM BIO-FIELD
          </p>
        </div>
      </section>

      {/* HUD Before/After */}
      <section
        className="py-16 px-4 md:px-[10%] text-center"
        style={{ background: "#111" }}
      >
        <h2 className="text-xl font-mono tracking-widest uppercase mb-8">
          REAL-TIME HUD: BEFORE & AFTER
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
              95mG_CHAOTIC (7G/Satellite EMF)
            </div>
            <div
              className="font-mono text-sm font-bold uppercase mt-1"
              style={{ color: VIRUS_RED }}
            >
              HIGH_MOLD_VIRUS_VIBRATION
            </div>
          </div>
          <div className="flex-1 border border-[#333] rounded-lg p-6 text-left">
            <p className="text-sm font-mono uppercase mb-3 opacity-80">
              AFTER ACTIVATION (1KM SHIELD)
            </p>
            <div
              className="font-mono text-sm font-bold uppercase"
              style={{ color: QUANTUM_BLUE }}
            >
              0.5mG_COHERENT (Hex Lattice)
            </div>
            <div
              className="font-mono text-sm font-bold uppercase mt-1"
              style={{ color: QUANTUM_BLUE }}
            >
              PATHOGENS_INERT (Violet Flame)
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-4 md:px-[10%] text-center"
        style={{ background: COSMIC_BLUE }}
      >
        <p className="text-base opacity-70 mb-8 max-w-xl mx-auto">
          24/7 Autonomy. One-Time Anchor. Persistent Protection.
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
              "GET 1KM PROTECTION — €49"
            )}
          </Button>
        </motion.div>

        <p className="mt-8 text-sm opacity-50">
          Accepted: STRIPE / BTC / ETH
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
