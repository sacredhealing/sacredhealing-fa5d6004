import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
const ROUTES = {
  libraryAbundance: "/library/abundance",
  incomeStreams: "/income-streams",
  wallet: "/wallet",
  shcCoin: "/income-streams/shc-coin",
  affiliate: "/income-streams/affiliate",
} as const;

export default function LibraryAbundance() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen px-4 pb-24 pt-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          {t("libraryAbundance.title", "Inner Abundance")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "libraryAbundance.subtitle",
            "A calm space for life support — feeling alive, held, and open to what's possible."
          )}
        </p>
      </div>

      {/* What this is */}
      <div className="mt-8 rounded-2xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-foreground">
              {t("libraryAbundance.whatThisIs", "What this is")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "libraryAbundance.whatThisIsBody",
                "Inner Abundance is not about money or investing. It's about feeling resourced from the inside: safety, breath, connection, and a sense that life can support you. When you're ready, you can explore coins, wallet, and earning in one dedicated place below."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Gentle prompts */}
      <div className="mt-6 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-foreground">
            <span className="font-medium text-primary">
              {t("libraryAbundance.promptTodayLabel", "Today:")}
            </span>{" "}
            {t(
              "libraryAbundance.promptToday",
              "Where do you feel already full? Notice one small thing."
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-foreground">
            <span className="font-medium text-primary">
              {t("libraryAbundance.promptWeekLabel", "This week:")}
            </span>{" "}
            {t(
              "libraryAbundance.promptWeek",
              "One practice that makes you feel alive — return to it."
            )}
          </p>
        </div>
      </div>

      {/* Optional: Advanced (Wallet & Earnings) — one link only */}
      <div className="mt-8 rounded-2xl border border-border/50 bg-muted/20 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("libraryAbundance.optionalLabel", "Optional")}
        </p>
        <p className="mt-1 text-sm text-foreground">
          {t(
            "libraryAbundance.optionalBody",
            "Wallet, SHC coins, affiliate, and other earning tools live in one place if you want to go there."
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => navigate(ROUTES.incomeStreams)}
        >
          {t("libraryAbundance.ctaAdvanced", "Wallet & Earnings (Advanced)")}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
