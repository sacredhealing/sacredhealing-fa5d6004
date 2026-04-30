import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const GOLD = "#D4AF37";
const CYAN = "#22D3EE";
const BLACK = "#050505";

type ApiStatusKey = "live" | "pending" | "review" | "setup";

const API_STATUS: { name: string; status: ApiStatusKey; note: string }[] = [
  { name: "Caption Generator (AI)", status: "live", note: "Generates captions for all platforms instantly" },
  { name: "YouTube API", status: "live", note: "Keys saved in Supabase — ready to post" },
  { name: "Meta App", status: "live", note: "App created, tokens saved in Supabase" },
  { name: "Facebook Page", status: "live", note: "Siddha Quantum Nexus page connected" },
  { name: "Nexus Data Bridge", status: "live", note: "All posts logged to Supabase" },
  { name: "Instagram (Kritagya)", status: "pending", note: "Token pending — Instagram API access needed" },
  { name: "Instagram (Laila)", status: "setup", note: "Laila needs to connect her account" },
  { name: "TikTok", status: "review", note: "Submitted for review — 2-4 weeks" },
  { name: "ManyChat", status: "setup", note: "Account needed at manychat.com" },
];

const STATUS_COLOR: Record<ApiStatusKey, string> = {
  live: "#4ADE80",
  pending: GOLD,
  review: GOLD,
  setup: "#F87171",
};

const STATUS_LABEL: Record<ApiStatusKey, string> = {
  live: "✓ LIVE",
  pending: "⏳ PENDING",
  review: "⏳ REVIEW",
  setup: "○ SETUP NEEDED",
};

export function SocialAutomationBanner() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  return (
    <div style={{ marginBottom: 28 }}>

      {/* ── MAIN BANNER ────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(34,211,238,0.04) 100%)`,
        border: `1px solid rgba(212,175,55,0.2)`,
        borderRadius: 24,
        padding: "24px 22px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Background glow */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Admin badge — only show to admins */}
        {isAdmin && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 20, marginBottom: 14,
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.25)",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80" }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, letterSpacing: "0.4em" }}>
              ADMIN TOOL
            </span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, rgba(212,175,55,0.15), rgba(34,211,238,0.08))`,
            border: `1px solid rgba(212,175,55,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.5em", color: GOLD, fontWeight: 800, marginBottom: 4 }}>
              SQI 2050 · TRI-NODE SYSTEM
            </div>
            <h2 style={{
              fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em",
              margin: "0 0 4px",
              background: `linear-gradient(90deg, ${GOLD}, ${CYAN})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Sovereign Content Publisher
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
              Generate captions with AI · Post to all platforms at once · ManyChat automation · Tri-Node architecture
            </p>
          </div>
        </div>

        {/* Platform pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {[
            { name: "Instagram", color: "#E1306C", icon: "📸" },
            { name: "TikTok", color: "#FF0050", icon: "🎵" },
            { name: "YouTube", color: "#FF0000", icon: "▶" },
            { name: "Facebook", color: "#1877F2", icon: "f" },
          ].map(p => (
            <div key={p.name} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20,
              background: p.color + "14",
              border: `1px solid ${p.color}30`,
              fontSize: 11, color: p.color, fontWeight: 700,
            }}>
              <span style={{ fontSize: 12 }}>{p.icon}</span> {p.name}
            </div>
          ))}
          <div style={{
            padding: "5px 12px", borderRadius: 20,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 11, color: "rgba(255,255,255,0.35)",
          }}>
            + ManyChat automation
          </div>
        </div>

        {/* How it works — 3 steps */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10, marginBottom: 20,
        }}>
          {[
            { step: "1", title: "Choose who posts", desc: "Kritagya · Laila · Nexus" },
            { step: "2", title: "AI writes caption", desc: "Per platform, in your voice" },
            { step: "3", title: "Post everywhere", desc: "All platforms simultaneously" },
          ].map(s => (
            <div key={s.step} style={{
              padding: "12px 14px", borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "rgba(212,175,55,0.12)",
                border: `1px solid rgba(212,175,55,0.25)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 900, color: GOLD,
                margin: "0 auto 8px",
              }}>{s.step}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.8)", marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => navigate("/social-automation")}
              style={{
                flex: 1, padding: "13px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${GOLD}, #A8860A)`,
                border: "none",
                color: BLACK, fontSize: 13, fontWeight: 900,
                letterSpacing: "0.05em", cursor: "pointer",
              }}>
              ⚡ OPEN CONTENT PUBLISHER
            </button>
          ) : (
            <div style={{
              flex: 1, padding: "13px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.25)",
              fontSize: 13, fontWeight: 800,
              textAlign: "center", letterSpacing: "0.05em",
            }}>
              🔒 Admin Only
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/social-automation?tab=status")}
            style={{
              padding: "13px 18px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
            View Status
          </button>
        </div>
      </div>

      {/* ── STATUS PANEL — admin only ───────────────────────── */}
      {isAdmin && (
        <div style={{
          marginTop: 12,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          padding: "18px 20px",
        }}>
          <div style={{
            fontSize: 9, letterSpacing: "0.5em", color: GOLD,
            fontWeight: 800, marginBottom: 14,
          }}>
            PLATFORM STATUS · ADMIN VIEW
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {API_STATUS.map((s, i) => (
              <div key={s.name} style={{
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 12,
                padding: "9px 0",
                borderBottom: i < API_STATUS.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {s.note}
                  </div>
                </div>
                <div style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: "0.3em",
                  color: STATUS_COLOR[s.status],
                  background: STATUS_COLOR[s.status] + "15",
                  border: `1px solid ${STATUS_COLOR[s.status]}30`,
                  padding: "4px 10px", borderRadius: 20,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {STATUS_LABEL[s.status]}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, padding: "14px 16px",
            borderRadius: 14,
            background: "rgba(34,211,238,0.05)",
            border: "1px solid rgba(34,211,238,0.12)",
          }}>
            <div style={{ fontSize: 9, letterSpacing: "0.4em", color: CYAN, fontWeight: 800, marginBottom: 10 }}>
              NEXT STEPS TO COMPLETE
            </div>
            {[
              "Instagram: Go to Graph API Explorer → generate instagram_content_publish token → save as INSTAGRAM_ACCESS_TOKEN in Supabase",
              "Laila: Switch her Instagram to Professional → connect to Nexus page → generate her token → save as LAILA_META_ACCESS_TOKEN",
              "TikTok: Waiting for review (submitted April 29) — check developers.tiktok.com in 2-4 weeks",
              "ManyChat: Create account at manychat.com → connect @kritagya_das → build 5 keyword flows",
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                marginBottom: i < 3 ? 10 : 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(34,211,238,0.12)",
                  border: "1px solid rgba(34,211,238,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: CYAN,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
