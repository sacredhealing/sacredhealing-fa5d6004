import { useState, useEffect, useRef } from "react";
import {
  Youtube,
  Instagram,
  Facebook,
  Music2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Video,
  Scissors,
  Upload,
  Calendar,
  Play,
  Radio,
  BarChart3,
  Settings,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Globe,
  User,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Film,
  Wand2,
  Send,
  Plus,
  LayoutGrid,
  List,
  Bell,
  ArrowRight,
  Cpu,
  Target,
} from "lucide-react";

/* ─────────────────────────────────────────────
   SQI 2050 Design Tokens
───────────────────────────────────────────── */
const C = {
  gold: "#D4AF37",
  black: "#050505",
  glass: "rgba(255,255,255,0.02)",
  border: "rgba(255,255,255,0.06)",
  cyan: "#22D3EE",
  red: "#EF4444",
  green: "#22C55E",
  amber: "#F59E0B",
  muted: "rgba(255,255,255,0.45)",
  subtle: "rgba(255,255,255,0.06)",
};

/* ─────────────────────────────────────────────
   Shared micro-components
───────────────────────────────────────────── */
const GlassCard = ({
  children,
  className = "",
  glow = false,
  goldBorder = false,
  style = {},
}: any) => (
  <div
    style={{
      background: "rgba(255,255,255,0.025)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      border: `1px solid ${goldBorder ? "rgba(212,175,55,0.35)" : C.border}`,
      borderRadius: 24,
      boxShadow: glow
        ? "0 0 40px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
        : "inset 0 1px 0 rgba(255,255,255,0.04)",
      ...style,
    }}
    className={className}
  >
    {children}
  </div>
);

const Tag = ({ label, color = C.gold }: any) => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.18em",
      textTransform: "uppercase" as const,
      color,
      background: `${color}18`,
      border: `1px solid ${color}30`,
      borderRadius: 6,
      padding: "3px 8px",
    }}
  >
    {label}
  </span>
);

const StatusDot = ({ status }: { status: "connected" | "error" | "pending" | "disconnected" }) => {
  const map = {
    connected: C.green,
    error: C.red,
    pending: C.amber,
    disconnected: C.muted,
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: map[status],
        boxShadow: `0 0 8px ${map[status]}`,
        flexShrink: 0,
      }}
    />
  );
};

const SectionLabel = ({ children }: any) => (
  <p
    style={{
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.2em",
      textTransform: "uppercase" as const,
      color: C.gold,
      marginBottom: 16,
    }}
  >
    {children}
  </p>
);

const GoldBtn = ({ onClick, children, variant = "primary", disabled = false, small = false }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background:
        variant === "primary"
          ? "linear-gradient(135deg, #D4AF37, #B8960C)"
          : "rgba(212,175,55,0.08)",
      border: `1px solid ${variant === "primary" ? "transparent" : "rgba(212,175,55,0.3)"}`,
      borderRadius: 12,
      color: variant === "primary" ? "#050505" : C.gold,
      fontWeight: 700,
      fontSize: small ? 12 : 13,
      letterSpacing: "0.04em",
      padding: small ? "8px 16px" : "11px 22px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      display: "flex",
      alignItems: "center",
      gap: 7,
      transition: "all 0.2s",
      flexShrink: 0,
    }}
  >
    {children}
  </button>
);

/* ─────────────────────────────────────────────
   Platform config
───────────────────────────────────────────── */
const PLATFORMS = [
  {
    id: "youtube",
    label: "YouTube",
    Icon: Youtube,
    color: "#FF0000",
    status: "error" as const,
    statusLabel: "API Rejected",
    handle: "@kritagya_das",
    followers: "—",
    note: "OAuth review rejected. Action required.",
    consoleUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    id: "instagram",
    label: "Instagram",
    Icon: Instagram,
    color: "#E1306C",
    status: "connected" as const,
    statusLabel: "Connected",
    handle: "@kritagya_das",
    followers: "20K",
    note: "Long-lived token active.",
    consoleUrl: "https://developers.facebook.com/apps",
  },
  {
    id: "facebook",
    label: "Facebook",
    Icon: Facebook,
    color: "#1877F2",
    status: "pending" as const,
    statusLabel: "Partial Access",
    handle: "Sacred Healing",
    followers: "—",
    note: "Business portfolio access pending.",
    consoleUrl: "https://business.facebook.com",
  },
  {
    id: "tiktok",
    label: "TikTok",
    Icon: Music2,
    color: "#69C9D0",
    status: "pending" as const,
    statusLabel: "App Under Review",
    handle: "@kritagya_das",
    followers: "—",
    note: "Developer app submitted. Awaiting approval.",
    consoleUrl: "https://developers.tiktok.com",
  },
];

const PROFILES = [
  { id: "kritagya", label: "Kritagya Das", sub: "@kritagya_das", Icon: User, color: C.gold },
  { id: "laila", label: "Laila Amrouche", sub: "Nexus co-founder", Icon: User, color: "#E1306C" },
  { id: "nexus", label: "SQI Nexus", sub: "Brand channel", Icon: Globe, color: C.cyan },
];

/* ─────────────────────────────────────────────
   Tabs definition
───────────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "Overview", Icon: LayoutGrid },
  { id: "reel-creator", label: "Auto-Reel Creator", Icon: Scissors },
  { id: "publisher", label: "Publisher", Icon: Send },
  { id: "live-scanner", label: "Live Scanner", Icon: Radio },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
];

/* ─────────────────────────────────────────────
   YouTube Fix Banner
───────────────────────────────────────────── */
const YouTubeFixBanner = () => {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.35)",
        borderRadius: 20,
        padding: "20px 24px",
        marginBottom: 24,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} color={C.red} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", margin: 0 }}>
              YouTube Data API — OAuth Request Rejected
            </p>
            <Tag label="Action Required" color={C.red} />
          </div>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px 0", lineHeight: 1.6 }}>
            Google rejected your app's request for YouTube Data API v3 OAuth scopes. This blocks
            video uploads, analytics, and Live access. This is common on first submission —{" "}
            <strong style={{ color: "#fff" }}>you simply need to re-apply</strong> with a stronger
            app description and privacy policy URL.
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 14,
            }}
          >
            <SectionLabel>3-Step Fix</SectionLabel>
            {[
              {
                n: 1,
                title: "Open Google Cloud Console → OAuth Consent Screen",
                url: "https://console.cloud.google.com/apis/credentials/consent",
                action: "Open Console",
              },
              {
                n: 2,
                title: 'Update "App Description" — explain WHY you need YouTube access (posting spiritual content, analytics). Add Privacy Policy URL from your website.',
                url: null,
                action: null,
              },
              {
                n: 3,
                title: 'Click "Submit for Verification" again. Processing takes 4–6 weeks.',
                url: null,
                action: null,
              },
            ].map((step) => (
              <div
                key={step.n}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.2)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    color: C.red,
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {step.n}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>
                    {step.title}
                  </p>
                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 11,
                        color: C.cyan,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                        textDecoration: "none",
                      }}
                    >
                      {step.action} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer">
              <GoldBtn variant="primary" small>
                <ExternalLink size={13} /> Open Google Cloud Console
              </GoldBtn>
            </a>
            <GoldBtn variant="ghost" small onClick={() => setOpen(false)}>
              Dismiss
            </GoldBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Platform Status Grid
───────────────────────────────────────────── */
const PlatformGrid = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 14,
      marginBottom: 28,
    }}
  >
    {PLATFORMS.map((p) => (
      <GlassCard
        key={p.id}
        goldBorder={p.status === "error"}
        style={{ padding: "18px 20px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${p.color}18`,
              border: `1px solid ${p.color}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p.Icon size={16} color={p.color} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", margin: 0 }}>{p.label}</p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{p.handle}</p>
          </div>
          <StatusDot status={p.status} />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <Tag
            label={p.statusLabel}
            color={
              p.status === "connected"
                ? C.green
                : p.status === "error"
                ? C.red
                : C.amber
            }
          />
        </div>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 12px 0", lineHeight: 1.5 }}>
          {p.note}
        </p>
        <a
          href={p.consoleUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 11,
            color: C.gold,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            textDecoration: "none",
          }}
        >
          Manage <ExternalLink size={10} />
        </a>
      </GlassCard>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   Auto-Reel Creator Tab
───────────────────────────────────────────── */
const MOCK_VIDEOS = [
  { id: "v1", title: "Siddha Nada Transmission — Full Session", platform: "youtube", dur: "58:22", thumb: "🎥", live: false },
  { id: "v2", title: "Morning Pranayama Live", platform: "instagram", dur: "32:10", thumb: "🔴", live: true },
  { id: "v3", title: "Bhakti Chanting Circle", platform: "facebook", dur: "1:12:04", thumb: "🎥", live: false },
  { id: "v4", title: "Quantum Healing Intro", platform: "youtube", dur: "18:47", thumb: "🎥", live: false },
];

const platformColor = (p: string) => {
  if (p === "youtube") return "#FF0000";
  if (p === "instagram") return "#E1306C";
  if (p === "facebook") return "#1877F2";
  return C.cyan;
};

const ReelCreator = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [scanMode, setScanMode] = useState<"recent" | "live">("recent");

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (selected.length === 0) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2800);
  };

  return (
    <div>
      {/* How it works */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          background: "rgba(255,255,255,0.025)",
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {[
          { Icon: Video, label: "1. Scan", sub: "Fetch your videos & lives" },
          { Icon: Scissors, label: "2. AI Cuts", sub: "Auto-detect highlights" },
          { Icon: Wand2, label: "3. Generate Reel", sub: "Captions + music + branding" },
          { Icon: Send, label: "4. Auto-Post", sub: "Schedule across all platforms" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "16px 14px",
              borderRight: i < 3 ? `1px solid ${C.border}` : "none",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
              }}
            >
              <s.Icon size={15} color={C.gold} />
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{s.label}</p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Scan Mode Toggle */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {(["recent", "live"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setScanMode(m)}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: `1px solid ${scanMode === m ? C.gold : C.border}`,
              background: scanMode === m ? "rgba(212,175,55,0.1)" : "transparent",
              color: scanMode === m ? C.gold : C.muted,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {m === "live" ? <Radio size={12} /> : <Film size={12} />}
            {m === "recent" ? "Recent Videos" : "Past Lives"}
          </button>
        ))}
        <button
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.muted,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={12} /> Refresh Scan
        </button>
      </div>

      {/* Video list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {MOCK_VIDEOS.map((v) => {
          const sel = selected.includes(v.id);
          return (
            <GlassCard
              key={v.id}
              goldBorder={sel}
              style={{
                padding: "14px 16px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 14 }}
                onClick={() => toggleSelect(v.id)}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `2px solid ${sel ? C.gold : C.border}`,
                    background: sel ? C.gold : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {sel && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#050505" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                {/* Thumb */}
                <div
                  style={{
                    width: 52,
                    height: 36,
                    borderRadius: 8,
                    background: `${platformColor(v.platform)}15`,
                    border: `1px solid ${platformColor(v.platform)}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {v.thumb}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#fff",
                      margin: "0 0 3px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {v.title}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Tag label={v.platform} color={platformColor(v.platform)} />
                    {v.live && <Tag label="LIVE" color={C.red} />}
                    <span style={{ fontSize: 11, color: C.muted }}>{v.dur}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <GoldBtn variant="ghost" small>
                    <Eye size={12} /> Preview
                  </GoldBtn>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* AI Options */}
      {selected.length > 0 && (
        <GlassCard style={{ padding: "18px 20px", marginBottom: 20 }}>
          <SectionLabel>AI Reel Options</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Clip Duration", value: "30s / 60s / 90s", icon: Clock },
              { label: "Captions", value: "Auto (EN + SV)", icon: MessageCircle },
              { label: "Background Music", value: "Siddha Soundscape", icon: Music2 },
              { label: "Branding", value: "SQI 2050 Overlay", icon: Sparkles },
            ].map((opt) => (
              <div
                key={opt.label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <opt.icon size={14} color={C.gold} />
                <div>
                  <p style={{ fontSize: 10, color: C.muted, margin: "0 0 2px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{opt.label}</p>
                  <p style={{ fontSize: 12, color: "#fff", margin: 0, fontWeight: 600 }}>{opt.value}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Generate Button */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <GoldBtn
          onClick={handleGenerate}
          disabled={selected.length === 0 || generating}
        >
          {generating ? (
            <>
              <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
              Generating Reels…
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Generate {selected.length > 0 ? `${selected.length} ` : ""}Reel
              {selected.length > 1 ? "s" : ""}
            </>
          )}
        </GoldBtn>
        {selected.length === 0 && (
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            Select at least one video above
          </p>
        )}
      </div>

      {/* Generated output */}
      {generated && (
        <div
          style={{
            marginTop: 24,
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 18,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <CheckCircle2 size={18} color={C.green} />
            <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", margin: 0 }}>
              Reels Generated — Ready to Schedule
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {selected.map((id, i) => {
              const v = MOCK_VIDEOS.find((x) => x.id === id);
              return (
                <div
                  key={id}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 12,
                    color: "#fff",
                  }}
                >
                  <p style={{ margin: "0 0 4px", fontWeight: 700 }}>Reel {i + 1}</p>
                  <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{v?.title?.slice(0, 28)}…</p>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <GoldBtn variant="primary" small>
              <Calendar size={13} /> Schedule Posts
            </GoldBtn>
            <GoldBtn variant="ghost" small>
              <Upload size={13} /> Publish Now
            </GoldBtn>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────

/* ─────────────────────────────────────────────
   Publisher Tab — Sovereign Multi-Platform Engine
───────────────────────────────────────────── */
const SUPABASE_URL = "https://fjdzhrdpioxdeyyfogep.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYzOTYwMDAsImV4cCI6MjAzMTk3MjAwMH0.placeholder";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Publisher = () => {
  const [activeProfile, setActiveProfile] = useState("kritagya");
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /* ── File Upload ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError("File too large — max 100MB"); return; }
    setMediaFile(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as any);
      }
    }
  };

  /* ── Voice Mic ── */
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Voice input not supported in this browser"); return; }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript;
      setCaption((prev) => (prev ? prev + " " + spoken : spoken));
      setIsListening(false);
    };
    recognition.onerror = () => { setIsListening(false); setError("Voice capture failed — try again"); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  /* ── AI Generation ── */
  const generateAI = async () => {
    setAiGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/social-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "generate_caption",
          context: caption || "Siddha Quantum Nexus healing meditation and spiritual activation",
          platforms: selectedPlatforms,
          mediaType,
        }),
      });
      const data = await res.json();
      if (data.caption) setCaption(data.caption);
      if (data.hashtags) setHashtags(data.hashtags);
    } catch {
      setError("AI generation failed — check edge function");
    }
    setAiGenerating(false);
  };

  /* ── Publish ── */
  const publish = async () => {
    if (!caption && !mediaFile) { setError("Add a caption or media first"); return; }
    setPublishing(true);
    setError(null);
    setPublishResult(null);
    try {
      let mediaBase64 = null;
      let mediaMimeType = null;
      if (mediaFile) {
        mediaBase64 = await fileToBase64(mediaFile);
        mediaMimeType = mediaFile.type;
      }
      const fullCaption =
        caption + (hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/social-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "publish",
          caption: fullCaption,
          platforms: selectedPlatforms,
          mediaBase64,
          mediaMimeType,
          mediaType,
          scheduledTime: scheduledTime || null,
          profile: activeProfile,
        }),
      });
      const data = await res.json();
      setPublishResult(data);
    } catch (err: any) {
      setError(err.message || "Publish failed");
    }
    setPublishing(false);
  };

  /* ── Remove media ── */
  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      {/* Profile selector */}
      <SectionLabel>Publishing Profile</SectionLabel>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {PROFILES.map((pr) => (
          <GlassCard
            key={pr.id}
            goldBorder={activeProfile === pr.id}
            style={{ padding: "12px 16px", cursor: "pointer", flex: 1, minWidth: 140, transition: "all 0.2s" }}
          >
            <div onClick={() => setActiveProfile(pr.id)} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `${pr.color}18`, border: `1px solid ${pr.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <pr.Icon size={14} color={pr.color} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#fff", margin: 0 }}>{pr.label}</p>
                <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{pr.sub}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Platform toggles */}
      <SectionLabel>Post To</SectionLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {PLATFORMS.map((p) => {
          const active = selectedPlatforms.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              title={p.status !== "connected" ? `${p.statusLabel} — ${p.note}` : ""}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 14px", borderRadius: 10,
                border: `1px solid ${active ? p.color : C.border}`,
                background: active ? `${p.color}14` : "transparent",
                color: active ? p.color : C.muted,
                fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <p.Icon size={13} />
              {p.label}
              {p.status === "error" && <AlertTriangle size={11} color={C.red} />}
              {p.status === "pending" && <Clock size={11} color={C.amber} />}
            </button>
          );
        })}
      </div>

      {/* Media Upload Drop Zone */}
      <SectionLabel>Media — Photo or Video</SectionLabel>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {!mediaPreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: `2px dashed rgba(212,175,55,0.3)`,
            borderRadius: 20,
            padding: "36px 24px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: 20,
            background: "rgba(212,175,55,0.02)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)")}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            }}
          >
            <Upload size={22} color={C.gold} />
          </div>
          <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", margin: "0 0 6px" }}>
            Drop photo or video here
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            or tap to browse · JPG, PNG, MP4, MOV · max 100MB
          </p>
        </div>
      ) : (
        <GlassCard style={{ padding: 16, marginBottom: 20, position: "relative" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {mediaType === "image" && mediaPreview ? (
              <img
                src={mediaPreview}
                alt="preview"
                style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 80, height: 60, borderRadius: 10, flexShrink: 0,
                  background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Film size={22} color={C.cyan} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#fff", margin: "0 0 3px" }}>
                {mediaFile?.name}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <Tag label={mediaType === "video" ? "VIDEO" : "IMAGE"} color={mediaType === "video" ? C.cyan : C.gold} />
                <span style={{ fontSize: 11, color: C.muted }}>
                  {mediaFile ? (mediaFile.size / 1024 / 1024).toFixed(1) + " MB" : ""}
                </span>
              </div>
            </div>
            <button
              onClick={removeMedia}
              style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, color: C.red, fontSize: 11, fontWeight: 700,
                padding: "6px 12px", cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>

          {/* Platform format info */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectedPlatforms.includes("instagram") && (
              <div style={{ fontSize: 10, color: C.muted, background: "rgba(225,48,108,0.08)", border: "1px solid rgba(225,48,108,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                📸 IG: 1:1 or 9:16 · 60s reel max
              </div>
            )}
            {selectedPlatforms.includes("tiktok") && (
              <div style={{ fontSize: 10, color: C.muted, background: "rgba(105,201,208,0.08)", border: "1px solid rgba(105,201,208,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                🎵 TikTok: 9:16 · 3min max
              </div>
            )}
            {selectedPlatforms.includes("youtube") && (
              <div style={{ fontSize: 10, color: C.muted, background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                ▶ YT Shorts: 9:16 · 60s
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Caption Editor */}
      <SectionLabel>Caption / Spiritual Transmission</SectionLabel>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <textarea
          ref={textareaRef}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Speak your healing transmission here… or tap 🎙️ to dictate, or ✦ AI Generate below"
          rows={5}
          style={{
            width: "100%", background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "16px 18px 48px", color: "#fff", fontSize: 13,
            lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit",
            boxSizing: "border-box", transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        {/* Mic button inside textarea */}
        <button
          onClick={startListening}
          disabled={isListening}
          title="Voice dictate"
          style={{
            position: "absolute", bottom: 14, right: 14,
            background: isListening ? "rgba(239,68,68,0.2)" : "rgba(212,175,55,0.1)",
            border: `1px solid ${isListening ? "rgba(239,68,68,0.5)" : "rgba(212,175,55,0.3)"}`,
            borderRadius: 9, padding: "7px 12px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, color: isListening ? C.red : C.gold,
          }}
        >
          <Radio size={12} style={isListening ? { animation: "pulse 1s infinite" } : {}} />
          {isListening ? "Listening…" : "🎙️ Mic"}
        </button>
      </div>
      <p style={{ fontSize: 11, color: C.muted, margin: "0 0 16px" }}>
        {caption.length} chars · ~{Math.ceil(caption.length / 150)} read-min
      </p>

      {/* AI Generate row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <GoldBtn onClick={generateAI} disabled={aiGenerating} variant="ghost" small>
          {aiGenerating ? (
            <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
          ) : (
            <><Sparkles size={12} /> AI Generate Caption + Hashtags</>
          )}
        </GoldBtn>
        <GoldBtn variant="ghost" small onClick={() => setShowSchedule(!showSchedule)}>
          <Calendar size={12} /> {showSchedule ? "Hide Schedule" : "Schedule Post"}
        </GoldBtn>
      </div>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <GlassCard style={{ padding: "14px 16px", marginBottom: 20 }}>
          <SectionLabel>AI Hashtags — Viral Protocol</SectionLabel>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {hashtags.map((tag, i) => (
              <div
                key={i}
                onClick={() => setHashtags(hashtags.filter((_, j) => j !== i))}
                style={{
                  fontSize: 12, fontWeight: 600, color: C.gold,
                  background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                title="Click to remove"
              >
                #{tag}
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center" }}>
              tap to remove
            </div>
          </div>
        </GlassCard>
      )}

      {/* Schedule picker */}
      {showSchedule && (
        <GlassCard style={{ padding: "16px 18px", marginBottom: 20 }}>
          <SectionLabel>Schedule Transmission</SectionLabel>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 12,
                outline: "none", fontFamily: "inherit",
              }}
            />
            <div style={{ fontSize: 11, color: C.muted }}>
              Best times: <span style={{ color: C.gold }}>Sat–Sun 9–11am CET</span> · Tue–Thu 7–9pm CET
            </div>
          </div>
          {/* Optimal day guide */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <div
                key={d}
                style={{
                  fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
                  background: [5, 6].includes(i) ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                  color: [5, 6].includes(i) ? C.gold : C.muted,
                  border: `1px solid ${[5, 6].includes(i) ? "rgba(212,175,55,0.3)" : C.border}`,
                }}
              >
                {d}
                {[5, 6].includes(i) && <span style={{ marginLeft: 3 }}>✦</span>}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 16,
          fontSize: 12, color: C.red, display: "flex", gap: 8, alignItems: "center",
        }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Publish / Draft buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <GoldBtn onClick={publish} disabled={publishing || (!caption && !mediaFile)}>
          {publishing ? (
            <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Publishing…</>
          ) : scheduledTime ? (
            <><Calendar size={14} /> Schedule Transmission</>
          ) : (
            <><Send size={14} /> Publish Now</>
          )}
        </GoldBtn>
        <GoldBtn variant="ghost">
          <Clock size={14} /> Save Draft
        </GoldBtn>
      </div>

      {/* Publish Result */}
      {publishResult && (
        <div
          style={{
            marginTop: 20,
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 18,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <CheckCircle2 size={18} color={C.green} />
            <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", margin: 0 }}>
              {publishResult.success ? "Transmission Sent" : "Partial Transmission"}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {publishResult.results && Object.entries(publishResult.results).map(([platform, result]: any) => (
              <div
                key={platform}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 12, color: result.success ? C.green : C.muted,
                }}
              >
                {result.success ? <CheckCircle2 size={13} color={C.green} /> : <XCircle size={13} color={C.muted} />}
                <span style={{ textTransform: "capitalize", fontWeight: 700 }}>{platform}</span>
                {result.postId && <span style={{ color: C.muted }}>· ID: {result.postId}</span>}
                {result.reason && <span style={{ color: C.muted }}>· {result.reason}</span>}
                {result.scheduledFor && <span style={{ color: C.gold }}>· Scheduled for {result.scheduledFor}</span>}
              </div>
            ))}
          </div>
          {publishResult.queueId && (
            <p style={{ fontSize: 11, color: C.muted, margin: "12px 0 0" }}>
              Queue ID: {publishResult.queueId} — post saved in transmission queue
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};


   Live Scanner Tab
───────────────────────────────────────────── */
const LiveScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setFound(true);
    }, 2200);
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(212,175,55,0.04))",
          border: `1px solid rgba(34,211,238,0.15)`,
          borderRadius: 20,
          padding: "24px 28px",
          marginBottom: 24,
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Radio size={22} color={C.cyan} />
        </div>
        <div>
          <p style={{ fontWeight: 900, fontSize: 16, color: "#fff", margin: "0 0 4px" }}>
            Live Video Scanner
          </p>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>
            Automatically detects your live streams across YouTube, Instagram, and Facebook.
            When a live ends, SQI instantly offers to clip and publish highlights as Reels.
          </p>
        </div>
      </div>

      {/* Monitoring status */}
      <SectionLabel>Platform Monitoring</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {PLATFORMS.map((p) => (
          <GlassCard key={p.id} style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <p.Icon size={16} color={p.color} />
              <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>
                {p.label}
              </p>
              <StatusDot status={p.status} />
              <Tag
                label={p.status === "connected" ? "Monitoring" : p.status === "error" ? "Fix Required" : "Setup Needed"}
                color={p.status === "connected" ? C.green : p.status === "error" ? C.red : C.amber}
              />
            </div>
          </GlassCard>
        ))}
      </div>

      <GoldBtn onClick={handleScan} disabled={scanning}>
        {scanning ? (
          <>
            <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
            Scanning All Platforms…
          </>
        ) : (
          <>
            <Cpu size={14} /> Run Live Scan Now
          </>
        )}
      </GoldBtn>

      {found && (
        <div
          style={{
            marginTop: 20,
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 800, color: C.gold, margin: "0 0 8px" }}>
            ✦ 1 Ended Live Found — Morning Pranayama (32 min)
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>
            Instagram @kritagya_das · Ended 2h ago · 847 peak viewers
          </p>
          <GoldBtn variant="primary" small>
            <Scissors size={13} /> Create Reel from This Live
          </GoldBtn>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Analytics Tab
───────────────────────────────────────────── */
const Analytics = () => {
  const metrics = [
    { label: "Total Followers", value: "20K+", sub: "Instagram primary", Icon: Users, color: "#E1306C" },
    { label: "Avg. Reach / Post", value: "—", sub: "Connect platforms", Icon: Eye, color: C.gold },
    { label: "Engagement Rate", value: "—", sub: "Connect platforms", Icon: Heart, color: C.red },
    { label: "Content Published", value: "0", sub: "This month", Icon: Send, color: C.cyan },
  ];
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {metrics.map((m) => (
          <GlassCard key={m.label} style={{ padding: "18px 20px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: `${m.color}15`,
                border: `1px solid ${m.color}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <m.Icon size={15} color={m.color} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 3px", letterSpacing: "-0.03em" }}>
              {m.value}
            </p>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: C.gold, margin: "0 0 2px" }}>
              {m.label}
            </p>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{m.sub}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard style={{ padding: "22px 24px" }}>
        <SectionLabel>Best Time To Post — Instagram</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
            <div key={d} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: [60, 80, 55, 90, 75, 100, 65][i],
                  background: `linear-gradient(to top, rgba(212,175,55,0.6), rgba(212,175,55,0.1))`,
                  borderRadius: "4px 4px 0 0",
                  marginBottom: 6,
                }}
              />
              <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 16, margin: "16px 0 0" }}>
          Peak engagement: <strong style={{ color: C.gold }}>Saturday 9–11 AM CET</strong> based on follower activity patterns.
        </p>
      </GlassCard>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Overview Tab
───────────────────────────────────────────── */
const Overview = ({ setTab }: { setTab: (t: string) => void }) => (
  <div>
    <PlatformGrid />
    {/* Quick actions */}
    <SectionLabel>Quick Actions</SectionLabel>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
      {[
        { label: "Create Reel from Video", Icon: Scissors, tab: "reel-creator", desc: "AI clips + auto-post" },
        { label: "Publish New Post", Icon: Send, tab: "publisher", desc: "Tri-Node publisher" },
        { label: "Scan Live Streams", Icon: Radio, tab: "live-scanner", desc: "Detect & clip lives" },
        { label: "View Analytics", Icon: BarChart3, tab: "analytics", desc: "Engagement insights" },
      ].map((a) => (
        <GlassCard
          key={a.label}
          style={{ padding: "18px 20px", cursor: "pointer" }}
        >
          <div onClick={() => setTab(a.tab)}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <a.Icon size={16} color={C.gold} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", margin: "0 0 4px" }}>{a.label}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{a.desc}</p>
          </div>
        </GlassCard>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
const SocialAutomationV = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <Overview setTab={setActiveTab} />;
      case "reel-creator":
        return <ReelCreator />;
      case "publisher":
        return <Publisher />;
      case "live-scanner":
        return <LiveScanner />;
      case "analytics":
        return <Analytics />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.black,
        fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
        color: "#fff",
        padding: "24px 16px 80px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Tag label="SQI 2050" />
          <Tag label="Sovereign Media Engine" color={C.cyan} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 5vw, 32px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#fff",
            margin: "0 0 6px",
          }}
        >
          Social Automation{" "}
          <span
            style={{
              color: C.gold,
              textShadow: "0 0 20px rgba(212,175,55,0.4)",
            }}
          >
            Command Center
          </span>
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>
          Scan · Create · Publish · Analyse — all 4 platforms in one sovereign intelligence hub.
        </p>
      </div>

      {/* YouTube Fix Banner — always shows when on overview or when error */}
      <YouTubeFixBanner />

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          padding: "4px",
          background: "rgba(255,255,255,0.025)",
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          marginBottom: 24,
          scrollbarWidth: "none",
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 16px",
                borderRadius: 12,
                border: "none",
                background: active
                  ? "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))"
                  : "transparent",
                color: active ? C.gold : C.muted,
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                cursor: "pointer",
                letterSpacing: active ? "0.02em" : "0",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                boxShadow: active ? `inset 0 0 0 1px rgba(212,175,55,0.2)` : "none",
              }}
            >
              <tab.Icon size={13} />
              {tab.label}
              {tab.id === "reel-creator" && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: C.gold,
                    background: "rgba(212,175,55,0.15)",
                    border: "1px solid rgba(212,175,55,0.25)",
                    borderRadius: 5,
                    padding: "2px 5px",
                    textTransform: "uppercase",
                  }}
                >
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>{renderTab()}</div>
    </div>
  );
};

export default SocialAutomationV;