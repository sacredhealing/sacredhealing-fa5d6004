import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GitaCard } from "@/components/dashboard/GitaCard";
import { ParamahamsaVishwanandaDailyCard } from "@/components/dashboard/ParamahamsaVishwanandaDailyCard";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Zap, Sparkles, Hand, Eye } from "lucide-react";

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e]/30 to-[#1a0a2e] px-4 pb-24 pt-4">
      <div className="mb-3">
        <h1 className="text-3xl font-heading font-bold text-amber-50">{t("explore.title", "Library")}</h1>
      </div>

      <div className="mb-6"><GitaCard /></div>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-amber-100 mb-4 tracking-wide">Your Space</h2>
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-black p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Akashic Decoder", desc: "Soul manuscript.", href: "/akashic-records", Icon: Eye, adminOnly: true },
              { label: "Quantum Apothecary", desc: "Launch the 2050 Siddha-Soma Tool.", href: "https://sacredhealing.github.io/siddha-soma-apothecary/", Icon: Zap, adminOnly: true, external: true },
              { label: "Vedic Astrology", desc: "Daily Jyotish influence", href: "/vedic-astrology", Icon: Sparkles },
              { label: "Palm Oracle", desc: "Hand analysis", href: "/hand-analyzer", Icon: Hand, adminOnly: true },
            ].filter((item) => !item.adminOnly || isAdmin).map((item) => (
              <button
                key={item.label}
                onClick={item.external ? () => window.open(item.href, '_blank') : () => navigate(item.href)}
                className={`rounded-2xl px-4 py-4 text-left transition flex items-center gap-3 ${
                  item.external ? "bg-gradient-to-r from-amber-600/30 to-amber-500/20 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.25)]" : "bg-purple-600/30 border border-purple-400/40"
                }`}
              >
                <item.Icon className={`h-5 w-5 ${item.external ? "text-amber-200" : "text-purple-200"}`} />
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-purple-100/80">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      
      <div className="mt-8"><ParamahamsaVishwanandaDailyCard /></div>
    </div>
  );
}
