import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SriYantra } from "@/components/sri-yantra/SriYantra";

const COSMIC_BLUE = "#0A0F1E";
const SIDDHA_GOLD = "#D4AF37";
const VIRUS_RED = "#E74C3C";

export default function SriYantraLanding() {
  const { t } = useTranslation();
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
      toast.info(t("sriYantraShield.landing.toastSignIn"));
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
      toast.error(t("sriYantraShield.landing.toastCheckoutFail"));
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
          <SriYantra isActive={false} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.3em] mb-2 text-center">
          {t("sriYantraShield.landing.heroTitle")}
        </h1>
        <p className="text-lg md:text-xl text-center" style={{ color: SIDDHA_GOLD }}>
          {t("sriYantraShield.landing.heroSub")}
        </p>
      </section>

      {/* Anchor + Mantra Codes */}
      <section className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2 px-4 md:px-[10%] py-10">
        <div className="bg-white/5 border border-yellow-500/30 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-semibold mb-3">
            {t("sriYantraShield.landing.anchorTitle")}
          </h3>
          <p className="text-sm md:text-base text-white/80">
            <span className="font-semibold">{t("sriYantraShield.landing.anchorLead")}</span>{" "}
            {t("sriYantraShield.landing.anchorBody")}
          </p>
          <hr className="my-5 border-white/10" />
          <h3 className="text-lg md:text-xl font-semibold mb-3">
            {t("sriYantraShield.landing.mineralTitle")}
          </h3>
          <p className="text-sm md:text-base text-white/80">
            <span className="font-semibold">{t("sriYantraShield.landing.mineralLead")}</span>{" "}
            {t("sriYantraShield.landing.mineralBody")}
          </p>
        </div>

        <div className="bg-white/5 border border-yellow-500/30 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-semibold mb-4">
            {t("sriYantraShield.landing.mantraTitle")}
          </h3>
          <ul className="space-y-4 text-sm md:text-base">
            <li className="border-b border-white/10 pb-3">
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                OM RAM RAMAYA NAMAHA
              </p>
              <p className="text-white/80">{t("sriYantraShield.landing.mantra1Line")}</p>
            </li>
            <li className="border-b border-white/10 pb-3">
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                OM HRIM SHRIM KLIM ADYA KALIKA...
              </p>
              <p className="text-white/80">{t("sriYantraShield.landing.mantra2Line")}</p>
            </li>
            <li className="border-b border-white/10 pb-3">
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                OM NAMAH SHIVAYA
              </p>
              <p className="text-white/80">{t("sriYantraShield.landing.mantra3Line")}</p>
            </li>
            <li>
              <p className="font-serif italic text-[15px]" style={{ color: SIDDHA_GOLD }}>
                MAHA MRITYUNJAYA
              </p>
              <p className="text-white/80">{t("sriYantraShield.landing.mantra4Line")}</p>
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
          {t("sriYantraShield.landing.scannerTitle")}
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-6 max-w-4xl mx-auto">
          <div className="flex-1 border border-[#333] rounded-lg p-6 text-left">
            <p className="text-sm font-mono uppercase mb-3 opacity-80">
              {t("sriYantraShield.landing.beforeTitle")}
            </p>
            <div
              className="font-mono text-sm font-bold uppercase"
              style={{ color: VIRUS_RED }}
            >
              {t("sriYantraShield.landing.beforeHud")}
            </div>
            <div className="mt-3 h-24 rounded-md bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.4)_0,transparent_60%)] border border-red-500/40" />
          </div>
          <div className="flex-1 border border-[#27AE60] bg-[#e8f5e9] rounded-lg p-6 text-left text-[#111]">
            <p className="text-sm font-mono uppercase mb-3 opacity-80">
              {t("sriYantraShield.landing.afterTitle")}
            </p>
            <div
              className="font-mono text-sm font-bold uppercase"
              style={{ color: "#27AE60" }}
            >
              {t("sriYantraShield.landing.afterHud")}
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
          {t("sriYantraShield.landing.ctaBody")}
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
                {t("sriYantraShield.landing.buyLoading")}
              </>
            ) : (
              t("sriYantraShield.landing.buyCta")
            )}
          </Button>
        </motion.div>

        <p className="mt-8 text-sm opacity-50">{t("sriYantraShield.landing.payments")}</p>
      </section>

      {/* Back */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          onClick={() => navigate("/explore")}
          className="text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 font-mono text-sm"
        >
          <ArrowLeft size={18} />
          {t("sriYantraShield.landing.backLibrary")}
        </Button>
      </div>
    </div>
  );
}
