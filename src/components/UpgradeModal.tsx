/**
 * Post-session upgrade modal — bottom sheet, show-once via localStorage for free tier.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useMembershipTier } from "@/features/membership/useMembershipTier";

const GOLD = "#D4AF37";
const BLACK = "#050505";
const CYAN = "#22D3EE";

/** Persisted when dismissed — modal shows once per browser for free users */
export const UPGRADE_MODAL_STORAGE_KEY = "sqn_upgrade_modal_shown";

export type PaidTierKey = "prana" | "siddha" | "akasha";
export type UpgradeTrigger = "meditation" | "audio" | "ayurveda" | "jyotish";

type TierRoutes = Record<PaidTierKey, { path: string; color: string; emoji: string }>;

const TIER_ROUTES: TierRoutes = {
  prana: { path: "/prana-flow", color: CYAN, emoji: "🌊" },
  siddha: { path: "/siddha-quantum", color: GOLD, emoji: "⚡" },
  akasha: { path: "/akasha-infinity", color: "#C084FC", emoji: "♾️" },
};

function hexToRgb(hex: string): string {
  if (!hex || hex.length < 7) return "212,175,55";
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  trigger?: UpgradeTrigger;
};

export function UpgradeModal({ isOpen, onClose, trigger = "meditation" }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedTier, setSelectedTier] = useState<PaidTierKey>("siddha");

  const tierOrder = useMemo(() => ["prana", "siddha", "akasha"] as PaidTierKey[], []);

  const tierBundles = useMemo(() => {
    return tierOrder.map((key) => {
      const bundle = t(`conversion.tiers.${key}`, { returnObjects: true }) as unknown as {
        label: string;
        price: string;
        tagline?: string;
        includes: string[];
      };
      const routes = TIER_ROUTES[key];
      return {
        key,
        label: bundle.label,
        price: bundle.price,
        tagline: bundle.tagline ?? "",
        includes: bundle.includes ?? [],
        color: routes.color,
        emoji: routes.emoji,
        path: routes.path,
        recommended: key === "siddha",
      };
    });
  }, [t, tierOrder]);

  const triggerMessages: Record<UpgradeTrigger, { title: string; sub: string }> = useMemo(
    () => ({
      meditation: {
        title: t("conversion.modal.triggers.meditation.title"),
        sub: t("conversion.modal.triggers.meditation.sub"),
      },
      audio: {
        title: t("conversion.modal.triggers.audio.title"),
        sub: t("conversion.modal.triggers.audio.sub"),
      },
      ayurveda: {
        title: t("conversion.modal.triggers.ayurveda.title"),
        sub: t("conversion.modal.triggers.ayurveda.sub"),
      },
      jyotish: {
        title: t("conversion.modal.triggers.jyotish.title"),
        sub: t("conversion.modal.triggers.jyotish.sub"),
      },
    }),
    [t]
  );

  if (!isOpen) return null;

  const msg = triggerMessages[trigger] ?? triggerMessages.meditation;
  const selected = tierBundles.find((x) => x.key === selectedTier) ?? tierBundles[1];

  const usePostSessionHero = trigger === "meditation" || trigger === "audio";
  const microLine = usePostSessionHero
    ? t("conversion.modal.sheet.microLabel")
    : t("conversion.modal.microLabel");
  const titleLine = usePostSessionHero ? t("conversion.modal.sheet.title") : msg.title;
  const subLine = usePostSessionHero ? t("conversion.modal.sheet.subtitle") : msg.sub;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="codex-upgrade-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 540,
          background: "linear-gradient(180deg, #0d0a02 0%, #050505 100%)",
          border: "1px solid rgba(212,175,55,0.18)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px 40px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.12)",
            margin: "0 auto 20px",
          }}
        />

        <button
          type="button"
          aria-label={t("conversion.modal.closeAria")}
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.25)",
            fontSize: 22,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            aria-hidden
            style={{
              fontSize: 28,
              marginBottom: 10,
              filter: "drop-shadow(0 0 12px rgba(212,175,55,0.4))",
            }}
          >
            🔱
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.5em",
              color: GOLD,
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            {microLine}
          </div>
          <h2
            id="codex-upgrade-title"
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "white",
              margin: "0 0 8px",
            }}
          >
            {titleLine}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
            {subLine}
          </p>
        </div>

        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.4em",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          {t("conversion.modal.choosePath")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {tierBundles.map((tb) => {
            const isSelected = selectedTier === tb.key;
            const rgb = hexToRgb(tb.color);
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => setSelectedTier(tb.key)}
                style={{
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: `1.5px solid ${isSelected ? tb.color : "rgba(255,255,255,0.07)"}`,
                  background: isSelected ? `rgba(${rgb},0.12)` : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  textAlign: "left",
                  position: "relative",
                  transition: "all 0.15s",
                }}
              >
                {tb.recommended ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 12,
                      background: GOLD,
                      color: BLACK,
                      fontSize: 9,
                      fontWeight: 900,
                      padding: "3px 10px",
                      borderRadius: 20,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t("conversion.modal.sheet.mostPopular")}
                  </span>
                ) : null}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: isSelected ? 10 : 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{tb.emoji}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: isSelected ? tb.color : "rgba(255,255,255,0.75)",
                      }}
                    >
                      {tb.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isSelected ? tb.color : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {tb.price}
                  </span>
                </div>

                {isSelected ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {tb.includes.map((item, i) => (
                      <div key={`${tb.key}-f-${i}`} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ color: tb.color, fontSize: 10, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            navigate(selected.path);
            onClose();
          }}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 20,
            background: `linear-gradient(135deg, ${selected.color}, ${selected.color}99)`,
            border: "none",
            color: BLACK,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: "0.05em",
            cursor: "pointer",
            marginBottom: 12,
            boxShadow: `0 6px 24px ${selected.color}40`,
          }}
        >
          {t("conversion.modal.ctaUnlock", {
            emoji: selected.emoji,
            tierUpper: selected.label.toUpperCase(),
            price: selected.price,
          })}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.22)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {t("conversion.modal.sheet.continueFree")}
        </button>
      </div>
    </div>
  );
}

/**
 * Call `triggerUpgradeModal()` when meditation/healing audio ends (free tier only, once per browser).
 * Render `<UpgradeModalComponent />` once inside the player shell or layout.
 */
export function useUpgradeModal() {
  const { user } = useAuth();
  const tier = useMembershipTier();
  const [open, setOpen] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<UpgradeTrigger>("meditation");

  const triggerUpgradeModal = useCallback(
    (tr: UpgradeTrigger = "meditation") => {
      if (!user || tier !== "free") return;
      try {
        if (localStorage.getItem(UPGRADE_MODAL_STORAGE_KEY) === "true") return;
      } catch {
        /* ignore */
      }
      setActiveTrigger(tr);
      setOpen(true);
    },
    [user, tier]
  );

  const handleClose = useCallback(() => {
    try {
      localStorage.setItem(UPGRADE_MODAL_STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const UpgradeModalComponent = useCallback(() => {
    return <UpgradeModal isOpen={open} onClose={handleClose} trigger={activeTrigger} />;
  }, [open, activeTrigger, handleClose]);

  return { triggerUpgradeModal, UpgradeModalComponent };
}
