import type { ContentLanguage } from "@/utils/contentLanguage";

type Props = {
  item: any | null;
  language: ContentLanguage;
  dayPhase: "morning" | "midday" | "evening";
  userState: "calm" | "busy" | "heavy" | "engaged";
  onStart: (item: any) => void;
};

function copy(language: ContentLanguage, dayPhase: Props["dayPhase"], userState: Props["userState"]) {
  const isSv = language === "sv";

  const title =
    userState === "busy"
      ? isSv ? "Snabb återställning" : "Quick reset"
      : userState === "heavy"
      ? isSv ? "Mjukna det som känns tungt" : "Soften what feels heavy"
      : userState === "engaged"
      ? isSv ? "Fördjupa din practice" : "Go deeper"
      : isSv ? "Din dagliga practice" : "Your daily practice";

  const subtitle =
    dayPhase === "morning"
      ? isSv ? "Börja dagen lugnt — utan att tänka." : "Start your day gently — no decisions."
      : dayPhase === "midday"
      ? isSv ? "En paus som bär resten av dagen." : "A pause that supports your day."
      : isSv ? "Låt kvällen landa i kroppen." : "Let the evening settle in your body.";

  const button =
    userState === "busy"
      ? isSv ? "Starta 2 min" : "Start 2 min"
      : userState === "heavy"
      ? isSv ? "Starta trygghet" : "Start comfort"
      : isSv ? "Starta nu" : "Start now";

  return { title, subtitle, button };
}

export function StartNowCard({ item, language, dayPhase, userState, onStart }: Props) {
  const c = copy(language, dayPhase, userState);

  return (
    <div className="mt-2 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="text-xl font-semibold text-foreground">{c.title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{c.subtitle}</div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {item ? (item.title ?? item.name ?? "") : (language === "sv" ? "Väljer en meditation…" : "Selecting a meditation…")}
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
