/**
 * SQI 2050 conversion UI — sticky banner, locked overlays.
 * Post-session upgrade modal lives in `@/components/UpgradeModal`.
 */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useMembershipTier } from "@/features/membership/useMembershipTier";
import { tierRank, type MembershipTier } from "@/features/membership/tier";

const GOLD = "#D4AF37";
const BLACK = "#050505";
const CYAN = "#22D3EE";

const AUTH_PAGES = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/auth",
  "/welcome",
  "/onboarding",
  "/reset-password",
  "/forgot-password",
  "/verify",
];

export type PaidTierKey = "prana" | "siddha" | "akasha";

type TierRoutes = Record<
  PaidTierKey,
  { path: string; color: string; emoji: string }
>;

const TIER_ROUTES: TierRoutes = {
  prana: { path: "/prana-flow", color: CYAN, emoji: "🌊" },
  siddha: { path: "/siddha-quantum", color: GOLD, emoji: "⚡" },
  akasha: { path: "/akasha-infinity", color: "#C084FC", emoji: "♾️" },
};

const REQUIRED_MEMBERSHIP: Record<PaidTierKey, MembershipTier> = {
  prana: "monthly",
  siddha: "annual",
  akasha: "lifetime",
};

export function ConversionProvider({ children }: { children: React.ReactNode }) {
  // Sticky upgrade banner removed per request — it was showing for paid members and
  // the "76 members are inside the Nexus" copy was popping up on every app open.
  return <>{children}</>;
}

export function StickyUpgradeBanner() {
  const { user } = useAuth();
  const tier = useMembershipTier();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 3000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;
  if (tier !== "free") return null;

  const path = location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  const isAuthPage = AUTH_PAGES.some(
    (p) => path === p || path.startsWith(p + "/")
  );
  if (isAuthPage) return null;
  if (dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 72,
        left: 12,
        right: 12,
        zIndex: 900,
        background: `linear-gradient(135deg, rgba(5,5,5,0.97), rgba(20,15,5,0.97))`,
        border: `1px solid rgba(212,175,55,0.25)`,
        borderRadius: 16,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: GOLD,
          boxShadow: pulse ? `0 0 10px ${GOLD}` : "none",
          transition: "box-shadow 0.5s",
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: GOLD,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t("conversion.banner.headline")}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {t("conversion.banner.subline")}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/membership")}
        style={{
          padding: "8px 16px",
          borderRadius: 20,
          background: `linear-gradient(135deg, ${GOLD}, #B8960C)`,
          border: "none",
          color: BLACK,
          fontSize: 11,
          fontWeight: 900,
          cursor: "pointer",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {t("conversion.banner.unlock")}
      </button>

      <button
        type="button"
        aria-label={t("conversion.banner.dismissAria")}
        onClick={() => setDismissed(true)}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.2)",
          cursor: "pointer",
          fontSize: 16,
          padding: "0 4px",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

type LockedTierProp = "prana" | "siddha" | "akasha";

export function LockedContentCard({
  children,
  tier = "siddha",
  featureName,
}: {
  children: React.ReactNode;
  tier?: LockedTierProp;
  featureName: string;
}) {
  const userTier = useMembershipTier();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  const required = REQUIRED_MEMBERSHIP[tier];
  const unlocked = tierRank[userTier] >= tierRank[required];

  if (adminLoading || isAdmin || unlocked) return <>{children}</>;

  const meta = TIER_ROUTES[tier];
  const tierBundle = t(`conversion.tiers.${tier}`, { returnObjects: true }) as unknown as {
    label: string;
    price: string;
  };

  return (
    <div style={{ position: "relative", borderRadius: 24, overflow: "hidden" }}>
      <div style={{ filter: "blur(6px)", opacity: 0.3, pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(ellipse at center, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.7) 100%)`,
          backdropFilter: "blur(2px)",
          cursor: "pointer",
          transition: "all 0.3s",
          borderRadius: 24,
          border: `1px solid rgba(${hexToRgb(meta.color)},0.2)`,
          boxShadow: hovered ? `0 0 40px rgba(${hexToRgb(meta.color)},0.15)` : "none",
          padding: 20,
          textAlign: "center",
        }}
        onClick={() => navigate(meta.path)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate(meta.path);
        }}
        role="button"
        tabIndex={0}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `rgba(${hexToRgb(meta.color)},0.1)`,
            border: `1px solid rgba(${hexToRgb(meta.color)},0.3)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            marginBottom: 12,
            boxShadow: hovered ? `0 0 20px rgba(${hexToRgb(meta.color)},0.3)` : "none",
            transition: "all 0.3s",
          }}
        >
          🔒
        </div>

        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.5em",
            color: meta.color,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          {t("conversion.locked.requiredBadge", { tierUpper: tierBundle.label.toUpperCase() })}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 4 }}>
          {t("conversion.locked.lockedTitle", { feature: featureName })}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
            marginBottom: 14,
            maxWidth: 220,
          }}
        >
          {t("conversion.locked.unlockPrompt", { tier: tierBundle.label, price: tierBundle.price })}
        </div>

        <div
          style={{
            padding: "8px 20px",
            borderRadius: 20,
            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}88)`,
            color: BLACK,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.05em",
            boxShadow: `0 4px 16px rgba(${hexToRgb(meta.color)},0.3)`,
          }}
        >
          {t("conversion.locked.unlockCta", { emoji: meta.emoji })}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  if (!hex || hex.length < 7) return "212,175,55";
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
