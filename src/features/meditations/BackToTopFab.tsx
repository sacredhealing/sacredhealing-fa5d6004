import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function BackToTopFab() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 right-4 z-50 rounded-full border border-border bg-muted/80 backdrop-blur-sm px-4 py-3 text-sm text-foreground hover:bg-muted transition shadow-lg"
    >
      {t("meditations.backToTop", "↑ Top")}
    </button>
  );
}
