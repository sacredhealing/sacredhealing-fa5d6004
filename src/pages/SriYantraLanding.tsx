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
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.3em] mb-2">
            v2026.SUPREME
          </h1>
          <p className="text-lg md:text-xl opacity-80 tracking-wider text-[#D4AF37]">
            Non-Physical 1KM Bio-Field Protection
          </p>
        </div>
      </section>

      {/* Mantra Matrix */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-center text-2xl md:text-3xl font-semibold tracking-[0.2em] uppercase mb-10">
          THE 4-PILLAR MANTRA DEPLOYMENT
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white/5 border-l-4 border-[#D4AF37] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Solar-Fire (Viruses &amp; Mold)</h3>
            <p className="font-serif italic text-[#D4AF37] text-base mb-3">
              &quot;Om Ram Ramaya Namaha&quot;
            </p>
            <p className="text-sm text-white/80">
              Activates the Solar Plexus fire to shatter the protein shells of viruses and dry out
              mold spores within 1km.
            </p>
          </div>
          <div className="bg-white/5 border-l-4 border-[#D4AF37] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">EMF Transmutation</h3>
            <p className="font-serif italic text-[#D4AF37] text-base mb-3">
              &quot;Om Hrim Shrim Klim Adya Kalika Param Eshwari Swaha&quot;
            </p>
            <p className="text-sm text-white/80">
              Converts &quot;hot&quot; satellite and Wi-Fi radiation into cooling, life-supporting
              bio-electricity.
            </p>
          </div>
          <div className="bg-white/5 border-l-4 border-[#D4AF37] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Atmospheric Scrubbing</h3>
            <p className="font-serif italic text-[#D4AF37] text-base mb-3">
              &quot;Om Namah Shivaya&quot;
            </p>
            <p className="text-sm text-white/80">
              Utilizes acoustic ionization to clear chemtrails, smog, and heavy metals from your
              immediate 1km airspace.
            </p>
          </div>
          <div className="bg-white/5 border-l-4 border-[#D4AF37] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">The Death-Conqueror (Shield)</h3>
            <p className="font-serif italic text-[#D4AF37] text-base mb-3">
              &quot;Maha Mrityunjaya Mantra&quot;
            </p>
            <p className="text-sm text-white/80">
              The primary 1km firewall. Anchors the Sri Yantra geometry into the Akasha for 24/7
              protection.
            </p>
          </div>
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
              EMF: 95.4 mG (Extreme Satellite Loading)
            </div>
            <div
              className="font-mono text-sm font-bold uppercase mt-1"
              style={{ color: VIRUS_RED }}
            >
              PATHOGENS: High Mold/Viral Count
            </div>
            <div
              className="font-mono text-sm font-bold uppercase mt-1"
              style={{ color: VIRUS_RED }}
            >
              COLLECTIVE FEAR: High Anxiety Index
            </div>
          </div>
          <div className="flex-1 border border-[#27AE60] bg-[#e8f5e9] rounded-lg p-6 text-left text-[#111]">
            <p className="text-sm font-mono uppercase mb-3 opacity-80">
              AFTER SIDDHA SHIELD
            </p>
            <div
              className="font-mono text-sm font-bold uppercase"
              style={{ color: "#27AE60" }}
            >
              EMF: 0.2 mG (Harmonic Coherence)
            </div>
            <div
              className="font-mono text-sm font-bold uppercase mt-1"
              style={{ color: "#27AE60" }}
            >
              PATHOGENS: Inert / Phase-Neutralized
            </div>
            <div
              className="font-mono text-sm font-bold uppercase mt-1"
              style={{ color: "#27AE60" }}
            >
              COLLECTIVE FEAR: Peace-Field Stabilized
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
          One-Time GPS Handshake. Privacy Guaranteed. 24/7 Autonomy.
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
              "ACTIVATE FOR €49"
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
