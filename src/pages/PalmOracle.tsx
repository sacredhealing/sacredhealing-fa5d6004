import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, BookOpen, History, ChevronDown, Lock, Unlock, Hand, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { toast } from "sonner";
import {
  PALM_ORACLE_MODULES,
  PALM_ORACLE_LESSONS,
  LessonData,
  canAccessLesson,
} from "@/data/palmOracleData";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "oracle" | "course" | "archive";
type Mode = "self" | "other";

// ─── Tier badge colours ───────────────────────────────────────────────────────

const TIER_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  free:           { bg: "rgba(212,175,55,0.08)",  border: "rgba(212,175,55,0.25)",  text: "#D4AF37" },
  prana_flow:     { bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.25)",  text: "#22D3EE" },
  siddha_quantum: { bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.25)",  text: "#A855F7" },
  akasha_infinity:{ bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  text: "#F59E0B" },
};

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

// ─── Lesson Modal ─────────────────────────────────────────────────────────────

function LessonModal({
  lesson,
  onClose,
}: {
  lesson: LessonData | null;
  onClose: () => void;
}) {
  if (!lesson) return null;

  const ts = TIER_STYLES[lesson.tier];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[430px] overflow-y-auto pb-10"
        style={{
          maxHeight: "90vh",
          background: "#080808",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-white/10 mx-auto mt-3" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-[10px] flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <X size={14} color="rgba(255,255,255,0.4)" />
        </button>

        {/* Header */}
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="inline-block mb-2 px-3 py-1 rounded-full text-[8px] font-black tracking-[0.3em] uppercase"
            style={{ background: ts.bg, border: `1px solid ${ts.border}`, color: ts.text }}
          >
            {lesson.tierLabel}
          </div>
          <h2
            className="font-black leading-tight mb-1"
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.95)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {lesson.title}
          </h2>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
            {lesson.siddha} · {lesson.duration}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 space-y-6">
          {/* Overview */}
          <div>
            <Label>THE TRANSMISSION</Label>
            <p className="mt-2 leading-relaxed" style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              {lesson.overview.split("\n\n").map((para, i) => (
                <span key={i}>
                  {para}
                  {i < lesson.overview.split("\n\n").length - 1 && <><br /><br /></>}
                </span>
              ))}
            </p>
          </div>

          {/* Quote */}
          <div
            className="px-4 py-3 rounded-[14px]"
            style={{
              borderLeft: "2px solid rgba(212,175,55,0.4)",
              background: "rgba(212,175,55,0.03)",
            }}
          >
            <p className="italic leading-relaxed" style={{ fontSize: 11, color: "rgba(212,175,55,0.85)" }}>
              {lesson.quote}
            </p>
            <p className="mt-2 font-bold tracking-widest uppercase" style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
              — {lesson.quoteSource}
            </p>
          </div>

          {/* Teaching */}
          <div>
            <Label>SIDDHA TEACHING</Label>
            <div className="mt-2 leading-relaxed" style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              {lesson.bodyText.split("\n\n").map((para, i) => (
                <p key={i} className={i > 0 ? "mt-3" : ""}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Mantra */}
          <div
            className="rounded-[18px] p-4 text-center"
            style={{
              background: "rgba(212,175,55,0.04)",
              border: "1px solid rgba(212,175,55,0.12)",
            }}
          >
            <div className="mb-2" style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              SACRED MANTRA FOR THIS TRANSMISSION
            </div>
            <p
              className="font-bold leading-relaxed"
              style={{
                fontSize: 14,
                color: "#D4AF37",
                textShadow: "0 0 20px rgba(212,175,55,0.3)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "0.06em",
              }}
            >
              {lesson.mantra.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < lesson.mantra.split("\n").length - 1 && <br />}
                </span>
              ))}
            </p>
            <p className="mt-2 italic" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {lesson.mantraMeaning}
            </p>
          </div>

          {/* Practices */}
          <div>
            <Label>SIDDHA PRACTICES</Label>
            <div className="mt-3 space-y-2">
              {lesson.practices.map((practice, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-[14px]"
                  style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="w-6 h-6 rounded-[8px] flex-shrink-0 flex items-center justify-center text-[10px] font-black"
                    style={{ background: `${ts.bg}`, color: ts.text }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>
                    {practice}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-4 rounded-[18px] font-black tracking-[0.25em] uppercase flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8960C)",
              color: "#050505",
              fontSize: 10,
            }}
          >
            <Star size={12} />
            COMPLETE TRANSMISSION
            <Star size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PalmOracle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier: membershipTier } = useMembership();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("oracle");
  const [mode, setMode] = useState<Mode>("self");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
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
      setReadingResult(data?.reading ?? "DEMO");
      toast.success("Palm Oracle reading complete ✦");
    } catch {
      toast.error("Scan failed — ensure good lighting and a clear palm photo");
    } finally {
      setScanning(false);
    }
  };

  const openLesson = (lesson: LessonData) => {
    if (!canAccessLesson(membershipTier, lesson.tier)) {
      toast.error(`Unlock ${lesson.tierLabel} to access this transmission`);
      return;
    }
    setActiveLesson(lesson);
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

  const CourseTab = () => (
    <div className="space-y-4">
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
          <div className="flex flex-wrap gap-2 mt-3">
            {["4 SACRED MODULES", "29 TRANSMISSIONS", "18 SIDDHAS"].map((label) => (
              <span
                key={label}
                className="px-3 py-1 rounded-full text-[8px] font-black tracking-[0.2em]"
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37" }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Modules */}
      {PALM_ORACLE_MODULES.map((mod, idx) => {
        const ts = TIER_STYLES[mod.tier];
        const isOpen = expandedModule === idx;
        const hasAccess = canAccessLesson(membershipTier, mod.tier);

        return (
          <GlassCard key={mod.id}>
            {/* Module header */}
            <button
              className="w-full p-5 flex items-center gap-3 text-left"
              style={{ borderBottom: isOpen ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              onClick={() => setExpandedModule(isOpen ? null : idx)}
            >
              <div
                className="w-8 h-8 rounded-[10px] flex-shrink-0 flex items-center justify-center font-black text-sm"
                style={{ background: ts.bg, color: ts.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {["I", "II", "III", "IV"][idx]}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="inline-block mb-1 px-2 py-0.5 rounded-full text-[7px] font-black tracking-[0.3em] uppercase"
                  style={{ background: ts.bg, border: `1px solid ${ts.border}`, color: ts.text }}
                >
                  {mod.tierLabel}
                </div>
                <p
                  className="font-black text-sm leading-tight truncate"
                  style={{ color: "rgba(255,255,255,0.92)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {mod.title}
                </p>
                <p className="mt-0.5 text-[9px]" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
                  {mod.transmissions} transmissions · {mod.hours}
                </p>
              </div>
              <ChevronDown
                size={16}
                color="rgba(255,255,255,0.3)"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", flexShrink: 0 }}
              />
            </button>

            {/* Module body */}
            {isOpen && (
              <div className="p-5 space-y-4">
                <p style={{ fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>
                  {mod.description}
                </p>
                <p
                  className="text-[9px] font-bold tracking-[0.15em]"
                  style={{ color: ts.text, opacity: 0.7 }}
                >
                  ✦ {mod.primarySource}
                </p>

                <div
                  className="h-px"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />

                {/* Lesson list */}
                <div className="space-y-2">
                  {mod.lessons.map((lesson) => {
                    const accessible = canAccessLesson(membershipTier, lesson.tier);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => openLesson(lesson)}
                        className="w-full flex items-center gap-3 p-3 rounded-[16px] text-left transition-all"
                        style={{
                          background: "rgba(255,255,255,0.015)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          opacity: accessible ? 1 : 0.55,
                          cursor: accessible ? "pointer" : "default",
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-[10px] flex-shrink-0 flex items-center justify-center text-[10px] font-black"
                          style={{ background: ts.bg, color: ts.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {lesson.lessonNum}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-bold text-[11px] leading-tight"
                            style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-bold tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                              {lesson.duration}
                            </span>
                            <span
                              className="text-[7px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-full"
                              style={{ background: ts.bg, color: ts.text }}
                            >
                              {lesson.siddha.split("·")[0].trim()}
                            </span>
                          </div>
                        </div>
                        {accessible ? (
                          <Unlock size={12} color={ts.text} style={{ flexShrink: 0 }} />
                        ) : (
                          <Lock size={12} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Upgrade CTA if no access */}
                {!hasAccess && (
                  <button
                    onClick={() => navigate("/siddha-quantum")}
                    className="w-full py-3 rounded-[16px] font-black text-[9px] tracking-[0.25em] uppercase"
                    style={{
                      background: ts.bg,
                      border: `1px solid ${ts.border}`,
                      color: ts.text,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    UNLOCK {mod.tierLabel} →
                  </button>
                )}
              </div>
            )}
          </GlassCard>
        );
      })}
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

      {/* Lesson Modal */}
      <LessonModal lesson={activeLesson} onClose={() => setActiveLesson(null)} />
    </>
  );
}
