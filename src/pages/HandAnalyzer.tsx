import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Camera, Loader2, Heart, Brain, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type Phase = "camera" | "scanning" | "results";

interface PalmReading {
  heartLine: string;
  headLine: string;
  lifeLine: string;
  soulFrequency: string;
  overallMessage: string;
}

const GOLDEN_MANDALA_SVG = (
  <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 pointer-events-none" aria-hidden>
    <defs>
      <linearGradient id="mandalaGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <circle cx="100" cy="100" r="92" fill="none" stroke="url(#mandalaGold)" strokeWidth="1.5" opacity="0.9" />
    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#mandalaGold)" strokeWidth="0.8" opacity="0.6" />
    {Array.from({ length: 16 }).map((_, i) => {
      const a = (i * 360) / 16;
      const rad = (a * Math.PI) / 180;
      const x1 = 100 + 70 * Math.cos(rad);
      const y1 = 100 + 70 * Math.sin(rad);
      const x2 = 100 + 85 * Math.cos(rad);
      const y2 = 100 + 85 * Math.sin(rad);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#mandalaGold)" strokeWidth="1.2" opacity="0.85" filter="url(#glow)" />;
    })}
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * 360) / 8 + 22.5;
      const rad = (a * Math.PI) / 180;
      const x1 = 100 + 25 * Math.cos(rad);
      const y1 = 100 + 25 * Math.sin(rad);
      const x2 = 100 + 45 * Math.cos(rad);
      const y2 = 100 + 45 * Math.sin(rad);
      return <line key={`inner-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#mandalaGold)" strokeWidth="1.5" opacity="0.9" />;
    })}
    <circle cx="100" cy="100" r="18" fill="none" stroke="url(#mandalaGold)" strokeWidth="1" opacity="0.8" />
  </svg>
);

async function analyzePalmWithAI(imageBase64: string): Promise<PalmReading> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a sacred palm reader and spiritual guide with deep knowledge of palmistry, Vedic traditions, and energy healing. 
Analyze the hand image provided and give a warm, loving, spiritually meaningful reading.
You MUST respond with ONLY valid JSON, no other text, in this exact format:
{
  "heartLine": "2-3 sentence reading of the heart line",
  "headLine": "2-3 sentence reading of the head line", 
  "lifeLine": "2-3 sentence reading of the life line",
  "soulFrequency": "Recommend 1-2 specific Hz frequencies (e.g. 528 Hz, 432 Hz) and why they match this person's energy",
  "overallMessage": "A warm, personal 2-sentence spiritual message for this soul"
}
Be warm, loving, specific, and spiritually grounded. If the image quality is poor or hand lines are not clearly visible, still provide a meaningful intuitive reading.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "Please analyze this palm and provide a sacred reading.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("API error");

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Invalid response");
  }
}

const FALLBACK_READING: PalmReading = {
  heartLine: "Your heart line speaks of deep emotional wisdom and a capacity for profound love. You carry warmth that touches those around you.",
  headLine: "Your head line reveals a mind that bridges the intuitive and the rational. Trust your inner knowing — it is strong.",
  lifeLine: "Your life line shows vitality and a path of purposeful growth. You are on a journey of sacred transformation.",
  soulFrequency: "528 Hz (DNA Repair & Heart Opening) resonates deeply with your energy. Also 432 Hz for grounding your cosmic harmony.",
  overallMessage: "You are a soul on a sacred path of awakening. Trust the journey unfolding before you — it is perfectly guided.",
};

export default function HandAnalyzer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("camera");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [reading, setReading] = useState<PalmReading | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      setError(t("handAnalyzer.cameraError", "Camera access is needed. Please allow camera and try again."));
    }
  }, [t]);

  useEffect(() => {
    if (phase === "camera") startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [phase, startCamera]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);

    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;

    setPhase("scanning");
    setScanProgress(0);
    setAiLoading(true);

    try {
      const palmReading = await analyzePalmWithAI(dataUrl);
      setReading(palmReading);
    } catch (e) {
      console.error("AI analysis failed:", e);
      setReading(FALLBACK_READING);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Progress animation
  useEffect(() => {
    if (phase !== "scanning") return;
    const duration = 4000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / duration) * 100, 95);
      setScanProgress(progress);
      if (elapsed < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [phase]);

  // Move to results when AI is done AND progress has run
  useEffect(() => {
    if (phase === "scanning" && !aiLoading && reading) {
      setScanProgress(100);
      setTimeout(() => setPhase("results"), 300);
    }
  }, [phase, aiLoading, reading]);

  const reset = useCallback(() => {
    setCapturedDataUrl(null);
    setScanProgress(0);
    setReading(null);
    setPhase("camera");
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a0a2e]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-amber-500/20 bg-[#1a0a2e]/90 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-amber-200 hover:bg-amber-500/20">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-amber-100">
          {t("handAnalyzer.title", "Sovereign Hand Analyzer")}
        </h1>
        <div className="w-10" />
      </header>

      {/* Main area */}
      <div className="flex-1 relative overflow-hidden">

        {/* CAMERA PHASE */}
        {phase === "camera" && (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            {/* Mandala overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-amber-400/90 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                {GOLDEN_MANDALA_SVG}
              </div>
            </div>
            {/* Guide text */}
            <div className="absolute top-6 left-0 right-0 flex justify-center">
              <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-amber-500/30">
                <p className="text-amber-100 text-sm text-center">
                  ✋ {t("handAnalyzer.guide", "Hold your palm inside the mandala")}
                </p>
              </div>
            </div>
            {error && (
              <div className="absolute bottom-24 left-4 right-4 rounded-xl bg-red-900/80 text-red-100 px-4 py-3 text-sm">
                {error}
                <button type="button" onClick={startCamera} className="block mt-2 underline text-red-200">{t("handAnalyzer.tryAgain", "Try again")}</button>
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
              <Button
                onClick={capture}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-6 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)] border border-amber-400/50"
              >
                <Camera className="w-6 h-6 mr-2" />
                {t("handAnalyzer.capture", "Read My Palm")}
              </Button>
            </div>
          </>
        )}

        {/* SCANNING PHASE */}
        {(phase === "scanning" || phase === "results") && capturedDataUrl && (
          <div className="absolute inset-0">
            <img src={capturedDataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {phase === "scanning" && (
              <>
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.8)]"
                  style={{ top: `${scanProgress}%`, transition: "top 0.1s linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex flex-col items-center gap-4 text-center px-8">
                    <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                    <span className="text-amber-100 font-semibold text-lg">
                      {t("handAnalyzer.scanning", "Reading your sacred lines...")}
                    </span>
                    <p className="text-amber-200/60 text-sm">{t("handAnalyzer.consulting", "Consulting the ancient wisdom 🙏")}</p>
                    {/* Progress bar */}
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Results panel */}
      {phase === "results" && reading && (
        <div
          className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-gradient-to-b from-[#2d1b4e] to-[#1a0a2e] border-t border-amber-500/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 overflow-y-auto"
          style={{ maxHeight: "72vh" }}
        >
          <div className="p-6 pb-8 space-y-4">
            <h2 className="text-2xl font-bold text-amber-100">
              {t("handAnalyzer.resultsTitle", "Your Reading")}
            </h2>

            {/* Overall message */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-900/40 to-orange-900/30 border border-amber-400/30 p-4">
              <p className="text-amber-100/90 text-sm leading-relaxed italic">✨ {reading.overallMessage}</p>
            </div>

            {/* Heart Line */}
            <div className="rounded-2xl bg-purple-900/40 border border-rose-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-rose-400" />
                <span className="font-semibold text-amber-100">{t("handAnalyzer.heartLine", "Heart Line")}</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{reading.heartLine}</p>
            </div>

            {/* Head Line */}
            <div className="rounded-2xl bg-purple-900/40 border border-blue-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-amber-100">{t("handAnalyzer.headLine", "Head Line")}</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{reading.headLine}</p>
            </div>

            {/* Life Line */}
            <div className="rounded-2xl bg-purple-900/40 border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-amber-100">{t("handAnalyzer.lifeLine", "Life Line")}</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{reading.lifeLine}</p>
            </div>

            {/* Soul Frequency */}
            <div className="rounded-2xl bg-amber-500/15 border border-amber-400/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-amber-200">{t("handAnalyzer.soulFrequency", "Soul Frequency")}</span>
              </div>
              <p className="text-amber-100/90 text-sm leading-relaxed">{reading.soulFrequency}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={reset}
                className="flex-1 border-amber-500/50 text-amber-200 hover:bg-amber-500/20 rounded-xl"
              >
                {t("handAnalyzer.scanAgain", "Scan again")}
              </Button>
              <Button
                onClick={() => navigate("/healing")}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl"
              >
                {t("handAnalyzer.goToHealing", "Go to Healing")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
