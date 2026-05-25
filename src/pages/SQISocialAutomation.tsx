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

/* ─────────────────────────────────────────────
   Auto-Reel Creator Tab — YouTube Import + Zoom Processor
───────────────────────────────────────────── */

// ── YouTube helpers ──
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:v=)([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /shorts\/([\w-]{11})/,
    /embed\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  status: "public" | "unlisted" | "private";
  isZoom: boolean;
  publishedAt?: string;
}

const parseDuration = (iso: string): string => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "—";
  const h = m[1] ? `${m[1]}:` : "";
  const min = (m[2] || "0").padStart(h ? 2 : 1, "0");
  const sec = (m[3] || "0").padStart(2, "0");
  return `${h}${min}:${sec}`;
};

const detectZoom = (title: string) =>
  /zoom|meeting|session|client|consultation|call/i.test(title);

// ── ffmpeg loading ──
let ffmpegInstance: any = null;
const loadFFmpeg = async (): Promise<any> => {
  if (ffmpegInstance) return ffmpegInstance;
  // Dynamically load ffmpeg.wasm from CDN
  if (!(window as any).FFmpegWASM) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js";
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js";
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const { FFmpeg } = (window as any).FFmpegWASM || (window as any);
  const ff = new FFmpeg();
  await ff.load({
    coreURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
  });
  ffmpegInstance = ff;
  return ff;
};

// ── YouTube Import Component ──
const YouTubeImporter = ({
  onAddVideo,
}: {
  onAddVideo: (v: YTVideo) => void;
}) => {
  const [url, setUrl] = useState("");
  const [batchUrls, setBatchUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<YTVideo[]>([]);

  const fetchOne = async (inputUrl: string): Promise<YTVideo | null> => {
    const id = extractVideoId(inputUrl.trim());
    if (!id) { setError(`Could not extract video ID from: ${inputUrl.slice(0, 60)}`); return null; }

    if (!YOUTUBE_API_KEY) {
      // Fallback: create a card from the URL only (no metadata fetch)
      return {
        id,
        title: `YouTube Video — ${id}`,
        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        duration: "—",
        status: "unlisted",
        isZoom: false,
      };
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${id}&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    if (!data.items?.length) { setError(`Video ${id} not found — check the URL`); return null; }
    const item = data.items[0];
    return {
      id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      duration: parseDuration(item.contentDetails?.duration || ""),
      status: item.status?.privacyStatus || "public",
      isZoom: detectZoom(item.snippet.title),
      publishedAt: item.snippet.publishedAt,
    };
  };

  const handleFetch = async () => {
    setLoading(true); setError(null);
    const v = await fetchOne(url);
    if (v) { setFetched((prev) => [v, ...prev]); setUrl(""); onAddVideo(v); }
    setLoading(false);
  };

  const handleBatch = async () => {
    const urls = batchUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setLoading(true); setError(null);
    for (const u of urls) {
      const v = await fetchOne(u);
      if (v) { setFetched((prev) => [v, ...prev]); onAddVideo(v); }
    }
    setBatchUrls("");
    setLoading(false);
  };

  return (
    <div>
      {/* Info */}
      <div
        style={{
          background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.12)",
          borderRadius: 16, padding: "18px 20px", marginBottom: 20,
        }}
      >
        <SectionLabel>How YouTube Import Works</SectionLabel>
        {[
          { n: 1, t: "Paste any YouTube URL — listed, unlisted, or Zoom recordings uploaded to YouTube. Works by video ID without requiring OAuth." },
          { n: 2, t: "SQI fetches title, thumbnail, duration, and privacy status via YouTube Data API v3." },
          { n: 3, t: "Videos detected as Zoom recordings show a 'Process in Zoom Studio' button to crop your side out." },
        ].map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: C.gold, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 }}>{s.t}</p>
          </div>
        ))}
      </div>

      {/* Single URL */}
      <GlassCard style={{ padding: "20px 24px", marginBottom: 16 }}>
        <SectionLabel>Import by URL</SectionLabel>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="https://youtube.com/watch?v=… or youtu.be/… (listed or unlisted)"
            style={{
              flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 13,
              fontFamily: "inherit", outline: "none",
            }}
          />
          <GoldBtn onClick={handleFetch} disabled={loading || !url.trim()} small>
            {loading ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={13} />}
            {loading ? "Fetching…" : "Fetch"}
          </GoldBtn>
        </div>
        <p style={{ fontSize: 11, color: C.muted }}>Works with unlisted videos — paste the full URL including the video ID</p>
      </GlassCard>

      {/* Batch */}
      <GlassCard style={{ padding: "20px 24px", marginBottom: 20 }}>
        <SectionLabel>Batch Import — Multiple URLs</SectionLabel>
        <textarea
          value={batchUrls}
          onChange={(e) => setBatchUrls(e.target.value)}
          placeholder={"Paste multiple YouTube URLs, one per line:\nhttps://youtube.com/watch?v=abc123\nhttps://youtu.be/def456"}
          rows={4}
          style={{
            width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 12,
            fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" as const,
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
          <GoldBtn onClick={handleBatch} disabled={loading || !batchUrls.trim()} small variant="ghost">
            {loading ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={12} />}
            Import All
          </GoldBtn>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Up to 50 videos at once</p>
        </div>
      </GlassCard>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: C.red }}>
          ⚠ {error}
        </div>
      )}

      {/* Fetched results */}
      {fetched.length > 0 && (
        <div>
          <SectionLabel>Imported Videos</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fetched.map((v) => (
              <GlassCard
                key={v.id}
                style={{ padding: 16, background: "rgba(255,0,0,0.03)", border: "1px solid rgba(255,0,0,0.12)" }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 110, height: 62, borderRadius: 10, background: "#111", flexShrink: 0, overflow: "hidden", position: "relative" }}>
                    <img src={v.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.85)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4 }}>{v.duration}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", margin: "0 0 6px", lineHeight: 1.3 }}>{v.title}</p>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const, marginBottom: 10 }}>
                      <Tag label="youtube" color="#FF5555" />
                      <Tag label={v.status} color={v.status === "public" ? C.green : C.amber} />
                      {v.isZoom && <Tag label="Zoom Recording" color={C.cyan} />}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                      {v.isZoom && (
                        <GoldBtn variant="ghost" small onClick={() => onAddVideo({ ...v, isZoom: true })}>
                          <Film size={12} /> Send to Zoom Studio →
                        </GoldBtn>
                      )}
                      <GoldBtn variant="ghost" small>
                        <Scissors size={12} /> Create Reels
                      </GoldBtn>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Zoom Processor Component ──
const ZoomProcessor = ({ initialVideo }: { initialVideo?: YTVideo }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [keepSide, setKeepSide] = useState<"left" | "right">("left");
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [progressLabel, setProgressLabel] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reelQueued, setReelQueued] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    setVideoFile(file);
    setVideoObjectUrl(URL.createObjectURL(file));
    setOutputUrl(null); setReelQueued(false); setError(null); setProgressLog([]); setProgress(0);
    // Estimate end time from file
    const vid = document.createElement("video");
    vid.src = URL.createObjectURL(file);
    vid.onloadedmetadata = () => {
      const t = vid.duration;
      const h = Math.floor(t / 3600).toString().padStart(2, "0");
      const m = Math.floor((t % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(t % 60).toString().padStart(2, "0");
      setEndTime(`${h}:${m}:${s}`);
    };
  };

  const cropFilter = keepSide === "left" ? "crop=iw/2:ih:0:0" : "crop=iw/2:ih:iw/2:0";

  const processVideo = async () => {
    if (!videoFile) { setError("Upload a Zoom recording first"); return; }
    setProcessing(true); setProgress(0); setError(null); setProgressLog([]); setOutputUrl(null);

    const log = (msg: string) => setProgressLog((prev) => [...prev.slice(-8), msg]);

    try {
      log("Loading FFmpeg WebAssembly engine…");
      setProgressLabel("Loading FFmpeg…"); setProgress(5);

      const ff = await loadFFmpeg();
      ff.on("progress", ({ ratio }: any) => {
        const pct = Math.round(5 + ratio * 88);
        setProgress(pct);
        setProgressLabel(`Processing: ${pct}%`);
        log(`[ffmpeg] Progress: ${pct}%`);
      });
      ff.on("log", ({ message }: any) => log(`[ffmpeg] ${message}`));

      setProgressLabel("Reading video file…"); setProgress(8);
      log("Reading video file into memory…");

      const { fetchFile } = (window as any).FFmpegUtil || {};
      let inputData: Uint8Array;
      if (fetchFile) {
        inputData = await fetchFile(videoFile);
      } else {
        const buf = await videoFile.arrayBuffer();
        inputData = new Uint8Array(buf);
      }

      await ff.writeFile("input.mp4", inputData);
      setProgress(12); log("Video loaded — applying crop filter…");

      // Build ffmpeg args
      const args = ["-i", "input.mp4"];
      if (startTime && startTime !== "00:00:00") args.push("-ss", startTime);
      if (endTime) args.push("-to", endTime);
      args.push(
        "-vf", `${cropFilter},scale=1080:-2`,  // crop then scale to 1080px wide
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-movflags", "+faststart",
        "output.mp4"
      );

      setProgressLabel("Cropping and encoding…"); log("Running FFmpeg crop + encode…");
      await ff.exec(args);

      setProgress(96); setProgressLabel("Reading output…"); log("Reading output file…");
      const data = await ff.readFile("output.mp4");
      const blob = new Blob([(data as Uint8Array).buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setProgress(100); setProgressLabel("✓ Done!");
      log("✓ Processing complete — your side extracted successfully!");
    } catch (err: any) {
      setError(`Processing failed: ${err.message}. Try a shorter clip or smaller file.`);
    }
    setProcessing(false);
  };

  const downloadOutput = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `sqi-cropped-${keepSide}-${Date.now()}.mp4`;
    a.click();
  };

  return (
    <div>
      {/* Info */}
      <div style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
        <SectionLabel>Zoom Recording Processor</SectionLabel>
        {[
          { n: 1, t: "Download your Zoom recording from zoom.us → Recordings. Then upload it here — runs entirely in your browser, nothing sent to any server." },
          { n: 2, t: "Select which side of the split-screen is you — left or right. SQI draws the crop overlay so you can see exactly what gets removed." },
          { n: 3, t: "Hit Extract My Side → FFmpeg WASM processes the video locally and outputs a clean cropped vertical video ready for Instagram Reels and TikTok." },
        ].map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)", color: C.cyan, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 }}>{s.t}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {!videoFile ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          style={{ border: "2px dashed rgba(34,211,238,0.3)", borderRadius: 20, padding: "36px 24px", textAlign: "center" as const, cursor: "pointer", marginBottom: 20, background: "rgba(34,211,238,0.02)", transition: "all 0.2s" }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>🎬</div>
          <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", margin: "0 0 6px" }}>Upload Zoom Recording</p>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px" }}>MP4 or MOV · any size · processed locally in browser · never uploaded to any server</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Tag label="Browser-Only" color={C.cyan} />
            <Tag label="FFmpeg WASM" color={C.gold} />
          </div>
        </div>
      ) : (
        <div>
          {/* File info bar */}
          <GlassCard style={{ padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎬</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", margin: "0 0 4px" }}>{videoFile.name}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <Tag label={(videoFile.size / 1024 / 1024 / 1024).toFixed(2) + " GB"} color={C.amber} />
                <Tag label="Zoom Recording" color={C.cyan} />
              </div>
            </div>
            <button
              onClick={() => { setVideoFile(null); if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl); setVideoObjectUrl(null); setOutputUrl(null); }}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: C.red, fontSize: 11, fontWeight: 700, padding: "6px 12px", cursor: "pointer" }}
            >
              ✕ Remove
            </button>
          </GlassCard>

          {/* Split preview */}
          <SectionLabel>Split-Screen Preview</SectionLabel>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(34,211,238,0.2)", background: "#0a0a0a", aspectRatio: "16/9", marginBottom: 8 }}>
            {/* Simulated Zoom layout */}
            <div style={{ position: "absolute", inset: 0, display: "flex" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: 8, background: "linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.02))", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "2px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🙏</div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "0.05em", margin: 0 }}>KRITAGYA DAS</p>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: 8, background: "rgba(60,60,80,0.05)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(100,100,120,0.2)", border: "2px solid rgba(150,150,170,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "0.05em", margin: 0 }}>CLIENT</p>
              </div>
            </div>
            {/* Crop overlay */}
            <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none" }}>
              {keepSide === "left" ? (
                <>
                  <div style={{ flex: 1, background: "rgba(34,211,238,0.06)", border: "2px solid rgba(34,211,238,0.5)", position: "relative" }}>
                    <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(34,211,238,0.9)", color: "#050505", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 6 }}>✓ KEEP — Your Side</div>
                  </div>
                  <div style={{ flex: 1, background: "rgba(239,68,68,0.1)", position: "relative" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 32, opacity: 0.5 }}>✕</div>
                    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 700, color: "rgba(239,68,68,0.7)", whiteSpace: "nowrap" as const }}>CLIENT REMOVED</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, background: "rgba(239,68,68,0.1)", position: "relative" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 32, opacity: 0.5 }}>✕</div>
                    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 700, color: "rgba(239,68,68,0.7)", whiteSpace: "nowrap" as const }}>CLIENT REMOVED</div>
                  </div>
                  <div style={{ flex: 1, background: "rgba(34,211,238,0.06)", border: "2px solid rgba(34,211,238,0.5)", position: "relative" }}>
                    <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(34,211,238,0.9)", color: "#050505", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 6 }}>✓ KEEP — Your Side</div>
                  </div>
                </>
              )}
            </div>
          </div>
          <p style={{ fontSize: 11, color: C.muted, textAlign: "center" as const, marginBottom: 20 }}>
            FFmpeg filter: <code style={{ color: C.cyan, fontSize: 11 }}>{cropFilter}</code>
          </p>

          {/* Side selector */}
          <SectionLabel>Which side is you?</SectionLabel>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {(["left", "right"] as const).map((side) => (
              <button
                key={side}
                onClick={() => setKeepSide(side)}
                style={{
                  flex: 1, padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit",
                  background: keepSide === side ? "rgba(34,211,238,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${keepSide === side ? C.cyan : C.border}`,
                  transition: "all 0.2s",
                }}
              >
                {side === "left" && <span style={{ fontSize: 20 }}>⬅</span>}
                <div style={{ flex: 1, textAlign: "left" as const }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px", textTransform: "capitalize" as const }}>{side} Side</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>I appear on the {side}</p>
                </div>
                {side === "right" && <span style={{ fontSize: 20 }}>➡</span>}
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", background: C.cyan,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#050505", fontWeight: 900,
                  opacity: keepSide === side ? 1 : 0, transition: "opacity 0.2s",
                }}>✓</div>
              </button>
            ))}
          </div>

          {/* Clip range */}
          <GlassCard style={{ padding: "18px 20px", marginBottom: 20 }}>
            <SectionLabel>Clip Range (optional)</SectionLabel>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" as const }}>
              {[{ label: "Start", val: startTime, set: setStartTime }, { label: "End", val: endTime, set: setEndTime }].map((f) => (
                <div key={f.label} style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  <label style={{ fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>{f.label}</label>
                  <input
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder="HH:MM:SS"
                    style={{ width: 110, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 12, fontFamily: "monospace", outline: "none", textAlign: "center" as const }}
                  />
                </div>
              ))}
              <p style={{ fontSize: 11, color: C.muted, alignSelf: "flex-end", paddingBottom: 2 }}>Leave empty to process entire recording</p>
            </div>
          </GlassCard>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: C.red }}>
              ⚠ {error}
            </div>
          )}

          {/* Process button */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" as const }}>
            <GoldBtn onClick={processVideo} disabled={processing}>
              {processing ? (
                <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
              ) : (
                <><Zap size={14} /> Extract My Side</>
              )}
            </GoldBtn>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Runs in browser · may take 1–5 min for long recordings</p>
          </div>

          {/* Progress */}
          {processing && (
            <GlassCard style={{ padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${C.cyan},transparent)`, animation: "scanLine 1.5s linear infinite", top: 0 }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", margin: 0 }}>{progressLabel}</p>
                <p style={{ fontWeight: 800, fontSize: 13, color: C.gold, margin: 0 }}>{progress}%</p>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", background: `linear-gradient(90deg,${C.cyan},${C.gold})`, borderRadius: 4, width: `${progress}%`, transition: "width 0.3s ease" }} />
              </div>
              <div style={{ marginTop: 14, maxHeight: 120, overflowY: "auto" as const }}>
                {progressLog.map((l, i) => (
                  <p key={i} style={{ fontSize: 10, color: "rgba(34,211,238,0.5)", fontFamily: "monospace", margin: "2px 0" }}>{l}</p>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Output */}
          {outputUrl && (
            <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 18, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <CheckCircle2 size={18} color={C.green} />
                <p style={{ fontWeight: 800, fontSize: 15, color: "#fff", margin: 0 }}>Your Side Extracted — Ready for Social</p>
              </div>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" as const }}>
                <div style={{ width: "100%", maxWidth: 200, aspectRatio: "9/16", borderRadius: 14, background: "#0a0a0a", border: "1px solid rgba(34,211,238,0.2)", overflow: "hidden" }}>
                  <video src={outputUrl} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {[
                    ["Output", "960×1080 → 9:16 vertical"],
                    ["Client", "Removed ✓"],
                    ["Format", "MP4 H.264 + AAC"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: C.muted, fontWeight: 700 }}>{k}</span>
                      <span style={{ color: C.green }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 14 }}>
                    <GoldBtn small onClick={downloadOutput}><ArrowRight size={12} /> Download MP4</GoldBtn>
                    <GoldBtn small variant="ghost" onClick={() => setReelQueued(true)}><Scissors size={12} /> Send to Reel Creator</GoldBtn>
                  </div>
                  {reelQueued && (
                    <div style={{ marginTop: 14, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                      <CheckCircle2 size={14} color={C.gold} />
                      <p style={{ fontSize: 12, color: C.gold, margin: 0, fontWeight: 700 }}>Added to reel queue — switch to Existing Videos tab</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Existing Videos (static list) ──
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
  const [subTab, setSubTab] = useState<"yt" | "zoom" | "existing">("yt");
  const [selected, setSelected] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [zoomVideo, setZoomVideo] = useState<YTVideo | undefined>(undefined);
  const [extraVideos, setExtraVideos] = useState<YTVideo[]>([]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleAddVideo = (v: YTVideo) => {
    setExtraVideos((prev) => [v, ...prev.filter((x) => x.id !== v.id)]);
    if (v.isZoom) { setZoomVideo(v); setSubTab("zoom"); }
  };

  const handleGenerate = () => {
    if (selected.length === 0) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2800);
  };

  const SUB_TABS: { id: "yt" | "zoom" | "existing"; label: string }[] = [
    { id: "yt", label: "▶ YouTube Import" },
    { id: "zoom", label: "🎬 Zoom Processor" },
    { id: "existing", label: "📋 Existing Videos" },
  ];

  return (
    <div>
      {/* How it works */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        {[
          { Icon: Video, label: "1. Import", sub: "YouTube URLs or Zoom files" },
          { Icon: Scissors, label: "2. Crop", sub: "Remove client from Zoom" },
          { Icon: Wand2, label: "3. AI Reel", sub: "Captions + music + branding" },
          { Icon: Send, label: "4. Auto-Post", sub: "Schedule across all platforms" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "16px 14px", borderRight: i < 3 ? `1px solid ${C.border}` : "none", textAlign: "center" as const }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <s.Icon size={15} color={C.gold} />
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{s.label}</p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sub-tab navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
              border: `1px solid ${subTab === t.id ? C.gold : C.border}`,
              background: subTab === t.id ? "rgba(212,175,55,0.1)" : "transparent",
              color: subTab === t.id ? C.gold : C.muted,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === "yt" && <YouTubeImporter onAddVideo={handleAddVideo} />}
      {subTab === "zoom" && <ZoomProcessor initialVideo={zoomVideo} />}
      {subTab === "existing" && (
        <div>
          {/* Extra videos from YouTube import or Zoom */}
          {extraVideos.map((v) => (
            <GlassCard key={v.id} goldBorder={selected.includes(v.id)} style={{ padding: "14px 16px", marginBottom: 10, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }} onClick={() => toggleSelect(v.id)}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected.includes(v.id) ? C.gold : C.border}`, background: selected.includes(v.id) ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selected.includes(v.id) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#050505" strokeWidth="2" strokeLinecap="round" /></svg>}
                </div>
                <img src={v.thumbnail} alt="" style={{ width: 52, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{v.title}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Tag label="youtube" color="#FF5555" />
                    <Tag label={v.status} color={v.status === "public" ? C.green : C.amber} />
                    {v.isZoom && <Tag label="zoom-extracted" color={C.cyan} />}
                    <span style={{ fontSize: 11, color: C.muted }}>{v.duration}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* Scan mode toggle */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
            {(["recent", "live"] as const).map((m) => (
              <button key={m} style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                {m === "live" ? <Radio size={12} /> : <Film size={12} />}
                {m === "recent" ? "Recent Videos" : "Past Lives"}
              </button>
            ))}
            <button style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <RefreshCw size={12} /> Refresh Scan
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 20 }}>
            {MOCK_VIDEOS.map((v) => {
              const sel = selected.includes(v.id);
              return (
                <GlassCard key={v.id} goldBorder={sel} style={{ padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }} onClick={() => toggleSelect(v.id)}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? C.gold : C.border}`, background: sel ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#050505" strokeWidth="2" strokeLinecap="round" /></svg>}
                    </div>
                    <div style={{ width: 52, height: 36, borderRadius: 8, background: `${platformColor(v.platform)}15`, border: `1px solid ${platformColor(v.platform)}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{v.thumb}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 3px", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{v.title}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Tag label={v.platform} color={platformColor(v.platform)} />
                        {v.live && <Tag label="LIVE" color={C.red} />}
                        <span style={{ fontSize: 11, color: C.muted }}>{v.dur}</span>
                      </div>
                    </div>
                    <GoldBtn variant="ghost" small><Eye size={12} /> Preview</GoldBtn>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <GoldBtn onClick={handleGenerate} disabled={selected.length === 0 || generating}>
              {generating ? (<><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating Reels…</>) : (<><Wand2 size={14} /> Generate {selected.length > 0 ? `${selected.length} ` : ""}Reel{selected.length > 1 ? "s" : ""}</>)}
            </GoldBtn>
            {selected.length === 0 && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Select at least one video above</p>}
          </div>

          {generated && (
            <div style={{ marginTop: 24, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 18, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <CheckCircle2 size={18} color={C.green} />
                <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", margin: 0 }}>Reels Generated — Ready to Schedule</p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 16 }}>
                {selected.map((id, i) => {
                  const v = MOCK_VIDEOS.find((x) => x.id === id) || extraVideos.find((x) => x.id === id);
                  return (
                    <div key={id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fff" }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700 }}>Reel {i + 1}</p>
                      <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{(v && "title" in v ? v.title : (v as any)?.title || "")?.slice(0, 28)}…</p>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <GoldBtn variant="primary" small><Calendar size={13} /> Schedule Posts</GoldBtn>
                <GoldBtn variant="ghost" small><Upload size={13} /> Publish Now</GoldBtn>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scanLine { 0% { top: -4px; } 100% { top: 100%; } }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
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