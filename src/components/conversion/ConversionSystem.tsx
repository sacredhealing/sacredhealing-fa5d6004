
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
