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
      : t("meditations.startNow.buttonCalm", "Start now");

  return { title, subtitle, button };
}

export function StartNowCard({ item, dayPhase, userState, onStart }: Props) {
  const { t } = useTranslation();
  const c = getCopy(t as any, dayPhase, userState);

  return (
    <div className="mt-2 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="text-xl font-semibold text-foreground">{c.title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{c.subtitle}</div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {item ? (item.title ?? item.name ?? "") : t("meditations.startNow.selecting", "Selecting a meditation…")}
        </div>

        <button
          disabled={!item}
          onClick={() => item && onStart(item)}
          className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition
            ${item ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
        >
          {c.button}
        </button>
      </div>
    </div>
  );
}
