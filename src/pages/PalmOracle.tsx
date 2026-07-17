import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, BookOpen, History, Hand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useMembership } from "@/hooks/useMembership";
import { usePalmOracleProgress } from "@/hooks/usePalmOracleProgress";
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank } from "@/lib/tierAccess";
import CourseSyllabus from "@/components/education/CourseSyllabus";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "oracle" | "course" | "archive";
type Mode = "self" | "other";

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldGlow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{ color: "#D4AF37", textShadow: "0 0 15px rgba(212,175,55,0.35)" }}
    >
      {children}
    </span>
  );
}

function GlassCard({
  children,
  className = "",
  style = {},
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-[28px] border ${className}`}
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.06)",
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: "0.4em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {children}
    </p>
  );
}

// ─── Scanner Frame ────────────────────────────────────────────────────────────

function ScannerFrame({ scanning, imageUrl }: { scanning: boolean; imageUrl?: string }) {
  return (
    <div
      className="relative w-full rounded-[28px] overflow-hidden"
      style={{
        paddingTop: "100%",
        background: imageUrl
          ? "transparent"
          : "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.05) 0%, #050505 70%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="Palm" className="w-full h-full object-cover" />
        ) : (
          <>
            {/* Rings */}
            {[85, 68, 50].map((size, i) => (
              <div
                key={i}
                className="absolute rounded-full border"
                style={{
                  width: `${size}%`,
                  height: `${size}%`,
                  borderColor: `rgba(212,175,55,${0.1 + i * 0.05})`,
                  animation: scanning
                    ? `spin ${5 + i * 3}s linear infinite ${i % 2 === 1 ? "reverse" : ""}`
                    : "none",
                }}
              />
            ))}
            {/* Corner markers */}
            {[
              { top: "8%", left: "8%" },
              { top: "8%", right: "8%", transform: "rotate(90deg)" },
              { bottom: "8%", left: "8%", transform: "rotate(270deg)" },
              { bottom: "8%", right: "8%", transform: "rotate(180deg)" },
            ].map((pos, i) => (
              <div key={i} className="absolute w-5 h-5" style={{ ...pos as any }}>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-[#D4AF37]" />
                <div className="absolute top-0 left-0 w-0.5 h-full bg-[#D4AF37]" />
              </div>
            ))}
            {/* Scan line */}
            {scanning && (
              <div
                className="absolute left-[8%] right-[8%] h-px"
                style={{
                  background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
                  animation: "scanLine 2s ease-in-out infinite",
                }}
              />
            )}
            {/* Hand icon */}
            <span style={{ fontSize: 72, opacity: scanning ? 0.15 : 0.3 }}>🤚</span>
            {/* Align label */}
            {!scanning && (
              <Label>
                <span
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  style={{ color: "rgba(212,175,55,0.5)", fontSize: 8, letterSpacing: "0.4em", fontWeight: 800 }}
                >
                  ALIGN PALM WITH GOLDEN OUTLINE
                </span>
              </Label>
            )}
          </>
        )}
      </div>
    </div>
  );
}


export default function PalmOracle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier: membershipTier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingCourseData, error: loadCourseError } = usePalmOracleProgress(membershipReady);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("oracle");
  const [mode, setMode] = useState<Mode>("self");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Load archive
  useEffect(() => {
    if (activeTab === "archive" && user) {
      (supabase as any)
        .from("palm_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }: any) => setHistory(data ?? []));
    }
  }, [activeTab, user]);

  // Image handling
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      setReadingResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleScan = async () => {
    if (!user) return toast.error("Sign in to use Palm Oracle");
    if (!capturedImage) {
      // Demo mode — show sample reading
      setScanning(true);
      setTimeout(() => {
        setScanning(false);
        setReadingResult("DEMO");
      }, 3500);
      return;
    }
    setScanning(true);
    try {
      const base64 = capturedImage.split(",")[1];
      const { data, error } = await supabase.functions.invoke("palm-oracle-reading", {
        body: { imageBase64: base64, readingOwner: mode, userId: user.id, membershipTier },
      });
      if (error) throw error;
      // If Gemini could not detect a hand, show a clear actionable message
      if (data?.handDetected === false) {
        toast.error(data?.message ?? "No hand detected — please retake the photo with your palm clearly visible.");
        setScanning(false);
        return;
      }
      if (!data?.reading) throw new Error("Empty reading returned");
      setReadingResult(data.reading);
      toast.success("Palm Oracle reading complete ✦");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Palm oracle error:", msg);
      toast.error("Reading failed — please try again. " + (msg.length < 80 ? msg : ""));
    } finally {
      setScanning(false);
    }
  };

  // ─── Tab: Oracle ──────────────────────────────────────────────────────────

  const OracleTab = () => (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        {(["self", "other"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-3 rounded-[14px] text-[8px] font-black tracking-[0.25em] uppercase transition-all"
            style={{
              background: mode === m ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${mode === m ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.06)"}`,
              color: mode === m ? "#D4AF37" : "rgba(255,255,255,0.4)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {m === "self" ? "🤲 Your Palm" : "📷 Another's Palm"}
          </button>
        ))}
      </div>

      {/* Scanner */}
      <ScannerFrame scanning={scanning} imageUrl={capturedImage ?? undefined} />

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 py-3 rounded-[18px] flex items-center justify-center gap-2 font-black text-[10px] tracking-[0.2em] uppercase"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #B8960C)",
            color: "#050505",
            boxShadow: "0 0 24px rgba(212,175,55,0.3)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Camera size={14} />
          TAKE PHOTO
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 rounded-[18px] flex items-center justify-center gap-2 font-black text-[10px] tracking-[0.2em] uppercase transition-all"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(212,175,55,0.25)",
            color: "#D4AF37",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Upload size={14} />
          UPLOAD
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
      />

      {/* Scan button */}
      <button
        onClick={handleScan}
        disabled={scanning}
        className="w-full py-4 rounded-[18px] flex items-center justify-center gap-3 font-black text-[10px] tracking-[0.3em] uppercase transition-all"
        style={{
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.3)",
          color: "#D4AF37",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          opacity: scanning ? 0.6 : 1,
        }}
      >
        <span style={{ animation: scanning ? "spin 1s linear infinite" : "none", display: "inline-block" }}>✦</span>
        {scanning ? "READING THE PALM LINES..." : "BEGIN SIDDHA PALM READING"}
        <span style={{ animation: scanning ? "spin 1s linear infinite reverse" : "none", display: "inline-block" }}>✦</span>
      </button>

      {/* Demo result */}
      {readingResult && (
        <GlassCard
          style={{ border: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.03)" }}
        >
          <div className="p-5 text-center border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <GoldGlow>
              <h3 className="font-black text-sm tracking-[0.15em]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ✦ YOUR PALM TRANSMISSION ✦
              </h3>
            </GoldGlow>
            <p className="mt-2 text-[11px] italic leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              "The lines upon your palm are the rivers of your karma made visible.
              What is written in the Akasha above is written in the flesh below."
            </p>
            <div
              className="inline-block mt-3 px-3 py-1 rounded-full text-[8px] font-black tracking-[0.3em] uppercase"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37" }}
            >
              Agastya Muni · Hasta Samudrika Shastra
            </div>
          </div>
          <div className="p-5">
            <Label>HAND NATURE · PANCHA BHUTA</Label>
            <div className="mt-2 p-4 rounded-[14px]" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)" }}>
              <p className="font-bold mb-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🔥 Agni Hasta — Fire Hand
              </p>
              <p style={{ fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
                Your palm bears the signature of Tejas — the fire element. Long, tapering fingers with a strong, well-defined palm indicate a soul of creative power, visionary intensity, and fierce dharmic will.
              </p>
            </div>
            <div className="mt-4 text-center">
              <p className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "rgba(212,175,55,0.6)" }}>
                ✦ Complete reading available in the Siddha Quantum tier ✦
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );

  // ─── Tab: Course ──────────────────────────────────────────────────────────

  const syllabusGroups = (() => {
    const tierOrder: { slug: string; label: string }[] = [
      { slug: 'free', label: 'Atma-Seed' },
      { slug: 'prana-flow', label: 'Prana-Flow' },
      { slug: 'siddha-quantum', label: 'Siddha-Quantum' },
      { slug: 'akasha-infinity', label: 'Akasha-Infinity' },
    ];
    const sortedCourses = [...courses].sort((a, b) => a.module_number - b.module_number);
    return tierOrder.map((t) => {
      const mods = sortedCourses.filter((c) => (c.tier_required || 'free') === t.slug);
      const completed = mods.filter((c) => progressByModuleId[c.id]?.completed).length;
      return {
        id: `tier-${t.slug}`,
        title: t.label,
        meta: `${completed} / ${mods.length} modules${completed === mods.length && mods.length > 0 ? ' complete' : ''}`,
        done: mods.length > 0 && completed === mods.length,
        current: false,
        lessons: mods.map((m) => {
          const done = Boolean(progressByModuleId[m.id]?.completed);
          const allowed = hasFeatureAccess(isAdmin, membershipTier, getCourseTierRequiredRank(m.tier_required));
          const state: 'done' | 'current' | 'available' | 'locked' = done ? 'done' : allowed ? 'available' : 'locked';
          return { id: m.id, number: m.module_number, title: m.title, state };
        }),
      };
    });
  })();

  const CourseTab = () => (
    <div className="space-y-4">
      {loadingCourseData && (
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Syncing your progress…
        </p>
      )}

      {/* Intro card */}
      <GlassCard style={{ border: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.02)" }}>
        <div className="p-5">
          <Label>THE LIVING LINEAGE</Label>
          <h2
            className="mt-2 font-black leading-tight"
            style={{ fontSize: 16, color: "rgba(255,255,255,0.92)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Hasta Samudrika Shastra
          </h2>
          <p className="mt-1 mb-3" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            The Siddha Science of Sacred Hands
          </p>
          <p style={{ fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.6)" }}>
            This curriculum flows directly from the oral and textual transmissions of the 18 Tamil Siddhas — encoded in the Agastiyar Hasta Lakshanam, Bogar 7000, Thirumantiram, and the Himalayan teachings of Mahavatar Babaji.
          </p>
        </div>
      </GlassCard>

      {loadCourseError && (
        <div style={{ borderRadius: 16, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "14px 18px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#F87171", margin: "0 0 4px" }}>Could not load this academy.</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", margin: 0 }}>{loadCourseError}</p>
        </div>
      )}

      <CourseSyllabus
        accent="#A855F7"
        courseIcon={<Hand size={20} />}
        courseTitle="Palm Oracle"
        academyName="Palm Oracle"
        progressLabel={`${stats.completedModules} / ${courses.length || 4} · ${stats.completionPercent}%`}
        progressPercent={stats.completionPercent}
        groups={syllabusGroups}
        onLessonClick={(lessonId, locked) => {
          if (locked) {
            const c = courses.find((m) => m.id === lessonId);
            navigate(getSalesPageForRank(getCourseTierRequiredRank(c?.tier_required)));
          } else {
            navigate(`/palm-oracle/module/${lessonId}`);
          }
        }}
      />
    </div>
  );


  // ─── Tab: Archive ─────────────────────────────────────────────────────────

  const ArchiveTab = () => (
    <div>
      {history.length === 0 ? (
        <GlassCard>
          <div className="p-16 text-center">
            <div style={{ fontSize: 52, opacity: 0.12, marginBottom: 18 }}>🤚</div>
            <p
              className="font-black text-sm"
              style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.1em" }}
            >
              Akashic Palm Archive
            </p>
            <p className="mt-2" style={{ fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,0.3)" }}>
              Your past readings will be stored here in the Akasha.
              <br />
              Complete your first Oracle scan to begin.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {history.map((reading) => (
            <GlassCard key={reading.id}>
              <div className="p-4">
                <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Palm Reading
                </p>
                <p className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {new Date(reading.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scanLine {
          0% { top: 8%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 92%; opacity: 0; }
        }
      `}</style>

      <div
        className="min-h-screen pb-24"
        style={{ background: "#050505", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-0">
          <button
            onClick={() => navigate("/siddha-portal")}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <ArrowLeft size={16} color="#D4AF37" />
          </button>
          <div>
            <GoldGlow>
              <h1
                className="font-black text-lg tracking-[0.12em]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                ✦ PALM ORACLE
              </h1>
            </GoldGlow>
            <Label>Siddha Hasta Samudrika Shastra</Label>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1.5 mx-5 mt-5 p-1 rounded-[16px]"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {([
            { id: "oracle", icon: <Hand size={12} />, label: "ORACLE" },
            { id: "course", icon: <BookOpen size={12} />, label: "COURSE" },
            { id: "archive", icon: <History size={12} />, label: "ARCHIVE" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-[12px] flex items-center justify-center gap-1.5 text-[8px] font-black tracking-[0.3em] uppercase transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(212,175,55,0.12)" : "transparent",
                color: activeTab === tab.id ? "#D4AF37" : "rgba(255,255,255,0.35)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: activeTab === tab.id ? "0 0 16px rgba(212,175,55,0.08)" : "none",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 mt-5">
          {activeTab === "oracle" && <OracleTab />}
          {activeTab === "course" && <CourseTab />}
          {activeTab === "archive" && <ArchiveTab />}
        </div>
      </div>
    </>
  );
}

