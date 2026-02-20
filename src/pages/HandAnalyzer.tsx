import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Camera, Loader2, Heart, Brain, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "camera" | "scanning" | "results";

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
    {/* Outer ring */}
    <circle cx="100" cy="100" r="92" fill="none" stroke="url(#mandalaGold)" strokeWidth="1.5" opacity="0.9" />
    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#mandalaGold)" strokeWidth="0.8" opacity="0.6" />
    {/* Petals */}
    {Array.from({ length: 16 }).map((_, i) => {
      const a = (i * 360) / 16;
      const rad = (a * Math.PI) / 180;
      const x1 = 100 + 70 * Math.cos(rad);
      const y1 = 100 + 70 * Math.sin(rad);
      const x2 = 100 + 85 * Math.cos(rad);
      const y2 = 100 + 85 * Math.sin(rad);
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="url(#mandalaGold)"
          strokeWidth="1.2"
          opacity="0.85"
          filter="url(#glow)"
        />
      );
    })}
    {/* Inner lotus */}
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * 360) / 8 + 22.5;
      const rad = (a * Math.PI) / 180;
      const x1 = 100 + 25 * Math.cos(rad);
      const y1 = 100 + 25 * Math.sin(rad);
      const x2 = 100 + 45 * Math.cos(rad);
      const y2 = 100 + 45 * Math.sin(rad);
      return (
        <line
          key={`inner-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="url(#mandalaGold)"
          strokeWidth="1.5"
          opacity="0.9"
        />
      );
    })}
    <circle cx="100" cy="100" r="18" fill="none" stroke="url(#mandalaGold)" strokeWidth="1" opacity="0.8" />
  </svg>
);

export default function HandAnalyzer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraFailureCount, setCameraFailureCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCameraOnGesture = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhase("camera");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      const code = err.name || "UnknownError";
      const msg = err.message || "Unknown error";
      setError(`${code}: ${msg}`);
      setCameraFailureCount((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleUploadPhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedDataUrl(dataUrl);
      setError(null);
      setPhase("scanning");
      setScanProgress(0);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const capture = useCallback(() => {
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

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setPhase("scanning");
    setScanProgress(0);
  }, []);

  useEffect(() => {
    if (phase !== "scanning") return;
    const duration = 3000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setScanProgress(Math.min((elapsed / duration) * 100, 100));
      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        setPhase("results");
      }
    };
    requestAnimationFrame(tick);
  }, [phase]);

  const reset = useCallback(() => {
    stopStream();
    setCapturedDataUrl(null);
    setScanProgress(0);
    setError(null);
    setPhase("idle");
  }, [stopStream]);

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
        {/* Idle: START SCAN (camera only on user gesture) + optional UPLOAD PHOTO after 2 failures */}
        {phase === "idle" && (
          <>
            <div className="absolute inset-0 bg-[#1a0a2e]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4">
              <div className="text-amber-400/90 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                {GOLDEN_MANDALA_SVG}
              </div>
              {error && (
                <div className="w-full max-w-md rounded-xl bg-red-900/90 text-red-100 px-4 py-3 text-sm font-mono break-all border border-red-500/30">
                  {error}
                </div>
              )}
              <Button
                onClick={startCameraOnGesture}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-6 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)] border border-amber-400/50"
              >
                <Camera className="w-6 h-6 mr-2" />
                {t("handAnalyzer.startScan", "START SCAN")}
              </Button>
              {cameraFailureCount >= 2 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadPhoto}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-amber-500/50 text-amber-200 hover:bg-amber-500/20 px-6 py-4"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {t("handAnalyzer.uploadPhoto", "UPLOAD PHOTO")}
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {/* Camera: live feed + Capture */}
        {phase === "camera" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-amber-400/90 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                {GOLDEN_MANDALA_SVG}
              </div>
            </div>
            {error && (
              <div className="absolute bottom-24 left-4 right-4 rounded-xl bg-red-900/90 text-red-100 px-4 py-3 text-sm font-mono break-all border border-red-500/30">
                {error}
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
              <Button
                onClick={capture}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-6 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)] border border-amber-400/50"
              >
                <Camera className="w-6 h-6 mr-2" />
                {t("handAnalyzer.capture", "Capture")}
              </Button>
            </div>
          </>
        )}

        {(phase === "scanning" || phase === "results") && capturedDataUrl && (
          <div className="absolute inset-0">
            <img
              src={capturedDataUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {phase === "scanning" && (
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.8)] transition-none"
                style={{ top: `${scanProgress}%` }}
              />
            )}
            {phase === "scanning" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                  <span className="text-amber-100 font-semibold text-lg">
                    {t("handAnalyzer.scanning", "Reading your lines...")}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Slide-up results panel */}
      {phase === "results" && (
        <div
          className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-gradient-to-b from-[#2d1b4e] to-[#1a0a2e] border-t border-amber-500/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300"
          style={{ maxHeight: "70vh" }}
        >
          <div className="p-6 pb-8 overflow-y-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-amber-100 mb-4">
              {t("handAnalyzer.resultsTitle", "Your Reading")}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="rounded-2xl bg-purple-900/40 border border-amber-500/20 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-6 h-6 text-amber-400" />
                  <span className="font-semibold text-amber-100 text-lg">
                    {t("handAnalyzer.heartLine", "Heart Line")}
                  </span>
                </div>
                <p className="text-white/80 text-sm">
                  {t("handAnalyzer.heartLinePlaceholder", "Emotional flow and connection — your reading will appear here in a full release.")}
                </p>
              </div>
              <div className="rounded-2xl bg-purple-900/40 border border-amber-500/20 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-6 h-6 text-amber-400" />
                  <span className="font-semibold text-amber-100 text-lg">
                    {t("handAnalyzer.headLine", "Head Line")}
                  </span>
                </div>
                <p className="text-white/80 text-sm">
                  {t("handAnalyzer.headLinePlaceholder", "Mind and clarity — your reading will appear here in a full release.")}
                </p>
              </div>
              <div className="rounded-2xl bg-purple-900/40 border border-amber-500/20 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                  <span className="font-semibold text-amber-100 text-lg">
                    {t("handAnalyzer.lifeLine", "Life Line")}
                  </span>
                </div>
                <p className="text-white/80 text-sm">
                  {t("handAnalyzer.lifeLinePlaceholder", "Vitality and path — your reading will appear here in a full release.")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-500/15 border border-amber-400/40 p-4 mb-6">
              <h3 className="text-lg font-bold text-amber-200 mb-2">
                {t("handAnalyzer.soulFrequency", "Soul Frequency")}
              </h3>
              <p className="text-amber-100/90 text-sm">
                {t("handAnalyzer.soulFrequencyRecommendation", "We recommend 528 Hz (Heart opening) and 417 Hz (Transmutation) for your current energy. Play these in Healing or Music.")}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={reset}
                className="flex-1 border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
              >
                {t("handAnalyzer.scanAgain", "Scan again")}
              </Button>
              <Button
                onClick={() => navigate("/healing")}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold"
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
