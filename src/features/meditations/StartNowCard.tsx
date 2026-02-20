import { useTranslation } from "react-i18next";

type Props = {
  item: any | null;
  dayPhase: "morning" | "midday" | "evening";
  userState: "calm" | "busy" | "heavy" | "engaged";
  onStart: (item: any) => void;
};

/** All copy uses app language (t) — meditationLanguage only for empty-state text. */
function getCopy(t: (key: string, fallback?: string | Record<string, unknown>) => string, dayPhase: Props["dayPhase"], userState: Props["userState"]) {
  const title =
    userState === "busy"
      ? t("meditations.startNow.titleBusy", "Quick reset")
      : userState === "heavy"
      ? t("meditations.startNow.titleHeavy", "Soften what feels heavy")
      : userState === "engaged"
      ? t("meditations.startNow.titleEngaged", "Go deeper")
      : t("meditations.startNow.titleCalm", "Your daily practice");

  const subtitle =
    dayPhase === "morning"
      ? t("meditations.startNow.subtitleMorning", "Start your day gently — no decisions.")
      : dayPhase === "midday"
      ? t("meditations.startNow.subtitleMidday", "A pause that supports your day.")
      : t("meditations.startNow.subtitleEvening", "Let the evening settle in your body.");

  const button =
    userState === "busy"
      ? t("meditations.startNow.buttonBusy", "Start 2 min")
      : userState === "heavy"
      ? t("meditations.startNow.buttonHeavy", "Start comfort")
      : t("meditations.startNow.buttonCalm", "Initiate Practice");

  return { title, subtitle, button };
}

export function StartNowCard({ item, dayPhase, userState, onStart }: Props) {
  const { t } = useTranslation();
  const c = getCopy(t as any, dayPhase, userState);

  return (
    <div className="mt-2 flex items-center gap-4">
      {/* Glowing circular portal icon */}
      <div
        className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(212,175,55,0.25), rgba(212,175,55,0.05))",
          boxShadow: "0 0 0 1px rgba(212,175,55,0.2), 0 0 24px rgba(212,175,55,0.15)",
        }}
      >
        <div
          className="w-8 h-8 rounded-full border border-[#D4AF37]/50"
          style={{ boxShadow: "inset 0 0 12px rgba(212,175,55,0.2)" }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-serif italic text-amber-200/90" style={{ fontFamily: "Cinzel, DM Serif Display, Georgia, serif" }}>
          {item ? (item.title ?? item.name ?? "") : t("meditations.startNow.lineage", "The lineage awaits your presence.")}
        </p>
        <button
          disabled={!item}
          onClick={() => item && onStart(item)}
          className={`mt-2 rounded-full px-4 py-2 text-sm font-medium transition
            ${item ? "text-[#D4AF37] hover:bg-[#D4AF37]/10" : "text-muted-foreground cursor-not-allowed"}`}
        >
          {c.button}
        </button>
      </div>
    </div>
  );
}
