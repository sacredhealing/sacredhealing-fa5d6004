import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Zap, Upload, Play, Pause, Square, Download, Sparkles, Loader2, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/* ── frequency presets ── */
const SOLFEGGIO_PRESETS = [
  { hz: 174, label: "174 Hz — Foundation" },
  { hz: 285, label: "285 Hz — Cellular Repair" },
  { hz: 396, label: "396 Hz — Liberation" },
  { hz: 417, label: "417 Hz — Transmutation" },
  { hz: 432, label: "432 Hz — Cosmic Tuning" },
  { hz: 528, label: "528 Hz — DNA Repair" },
  { hz: 639, label: "639 Hz — Heart Bridge" },
  { hz: 741, label: "741 Hz — Intuition" },
  { hz: 852, label: "852 Hz — Third Eye" },
  { hz: 963, label: "963 Hz — Crown Activation" },
];

const BINAURAL_PRESETS = [
  { beat: 4, label: "4 Hz — Deep Theta" },
  { beat: 7.83, label: "7.83 Hz — Schumann" },
  { beat: 10, label: "10 Hz — Alpha Flow" },
  { beat: 14, label: "14 Hz — Focus Beta" },
  { beat: 40, label: "40 Hz — Gamma Insight" },
];

const EQ_PRESETS = [
  { name: "Warm Temple", low: 4, mid: -1, high: -3 },
  { name: "Ethereal Bright", low: -2, mid: 0, high: 5 },
  { name: "Grounded Earth", low: 6, mid: 2, high: -4 },
  { name: "Crystal Clear", low: 0, mid: 3, high: 3 },
  { name: "Sacred Depth", low: 5, mid: -2, high: -1 },
];

const SiddhaSoundAlchemyOracle = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { toast } = useToast();

  /* ── state ── */
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [solfeggioHz, setSolfeggioHz] = useState(528);
  const [solfeggioVol, setSolfeggioVol] = useState(0.15);
  const [solfeggioOn, setSolfeggioOn] = useState(false);
  const [binauralBeat, setBinauralBeat] = useState(7.83);
  const [binauralVol, setBinauralVol] = useState(0.12);
  const [binauralOn, setBinauralOn] = useState(false);
  const [eqPreset, setEqPreset] = useState(EQ_PRESETS[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  /* ── refs ── */
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const solOscRef = useRef<OscillatorNode | null>(null);
  const solGainRef = useRef<GainNode | null>(null);
  const binOscLRef = useRef<OscillatorNode | null>(null);
  const binOscRRef = useRef<OscillatorNode | null>(null);
  const binGainRef = useRef<GainNode | null>(null);
  const eqLowRef = useRef<BiquadFilterNode | null>(null);
  const eqMidRef = useRef<BiquadFilterNode | null>(null);
  const eqHighRef = useRef<BiquadFilterNode | null>(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => navigate("/creative-soul/store");

  /* ── ensure AudioContext ── */
  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  /* ── load file into buffer ── */
  const loadFile = useCallback(async (f: File) => {
    const ctx = ensureCtx();
    const arrayBuf = await f.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);
    bufferRef.current = audioBuf;
    setDuration(audioBuf.duration);
    setCurrentTime(0);
    offsetRef.current = 0;
    setFile(f);
    toast({ title: "Audio loaded", description: `${f.name} (${Math.round(audioBuf.duration)}s)` });
  }, [ensureCtx, toast]);

  /* ── EQ chain ── */
  const buildEQ = useCallback((ctx: AudioContext) => {
    const low = ctx.createBiquadFilter();
    low.type = "lowshelf"; low.frequency.value = 250;
    const mid = ctx.createBiquadFilter();
    mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1;
    const high = ctx.createBiquadFilter();
    high.type = "highshelf"; high.frequency.value = 4000;
    low.connect(mid).connect(high);
    eqLowRef.current = low; eqMidRef.current = mid; eqHighRef.current = high;
    applyEQ();
    return { input: low, output: high };
  }, []);

  const applyEQ = useCallback(() => {
    if (eqLowRef.current && eqPreset) eqLowRef.current.gain.value = eqPreset.low;
    if (eqMidRef.current && eqPreset) eqMidRef.current.gain.value = eqPreset.mid;
    if (eqHighRef.current && eqPreset) eqHighRef.current.gain.value = eqPreset.high;
  }, [eqPreset]);

  useEffect(() => { applyEQ(); }, [applyEQ]);

  /* ── solfeggio oscillator ── */
  const startSolfeggio = useCallback(() => {
    const ctx = ensureCtx();
    stopSolfeggio();
    const osc = ctx.createOscillator();
    osc.type = "sine"; osc.frequency.value = solfeggioHz;
    const g = ctx.createGain(); g.gain.value = solfeggioVol;
    osc.connect(g).connect(ctx.destination);
    osc.start();
    solOscRef.current = osc; solGainRef.current = g;
    setSolfeggioOn(true);
  }, [ensureCtx, solfeggioHz, solfeggioVol]);

  const stopSolfeggio = useCallback(() => {
    try { solOscRef.current?.stop(); } catch {}
    solOscRef.current = null;
    setSolfeggioOn(false);
  }, []);

  useEffect(() => {
    if (solOscRef.current) solOscRef.current.frequency.value = solfeggioHz;
  }, [solfeggioHz]);
  useEffect(() => {
    if (solGainRef.current) solGainRef.current.gain.value = solfeggioVol;
  }, [solfeggioVol]);

  /* ── binaural beat ── */
  const startBinaural = useCallback(() => {
    const ctx = ensureCtx();
    stopBinaural();
    const carrier = 200;
    const merger = ctx.createChannelMerger(2);
    const oscL = ctx.createOscillator(); oscL.frequency.value = carrier;
    const oscR = ctx.createOscillator(); oscR.frequency.value = carrier + binauralBeat;
    const gL = ctx.createGain(); gL.gain.value = binauralVol;
    const gR = ctx.createGain(); gR.gain.value = binauralVol;
    oscL.connect(gL).connect(merger, 0, 0);
    oscR.connect(gR).connect(merger, 0, 1);
    merger.connect(ctx.destination);
    oscL.start(); oscR.start();
    binOscLRef.current = oscL; binOscRRef.current = oscR;
    binGainRef.current = gL; // use for vol
    setBinauralOn(true);
  }, [ensureCtx, binauralBeat, binauralVol]);

  const stopBinaural = useCallback(() => {
    try { binOscLRef.current?.stop(); } catch {}
    try { binOscRRef.current?.stop(); } catch {}
    binOscLRef.current = null; binOscRRef.current = null;
    setBinauralOn(false);
  }, []);

  useEffect(() => {
    if (binOscLRef.current) binOscLRef.current.frequency.value = 200;
    if (binOscRRef.current) binOscRRef.current.frequency.value = 200 + binauralBeat;
  }, [binauralBeat]);

  /* ── playback ── */
  const play = useCallback(() => {
    if (!bufferRef.current) return;
    const ctx = ensureCtx();
    const src = ctx.createBufferSource();
    src.buffer = bufferRef.current;
    const gain = ctx.createGain(); gain.gain.value = 1;
    const eq = buildEQ(ctx);
    src.connect(eq.input);
    eq.output.connect(gain).connect(ctx.destination);
    gainRef.current = gain;
    sourceRef.current = src;
    startTimeRef.current = ctx.currentTime;
    src.start(0, offsetRef.current);
    src.onended = () => { setIsPlaying(false); offsetRef.current = 0; setCurrentTime(0); };
    setIsPlaying(true);
    const tick = () => {
      if (!audioCtxRef.current) return;
      setCurrentTime(offsetRef.current + (audioCtxRef.current.currentTime - startTimeRef.current));
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [ensureCtx, buildEQ]);

  const pause = useCallback(() => {
    if (sourceRef.current) {
      const ctx = audioCtxRef.current!;
      offsetRef.current += ctx.currentTime - startTimeRef.current;
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current = null;
    }
    cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    pause();
    offsetRef.current = 0;
    setCurrentTime(0);
  }, [pause]);

  /* ── Gemini analysis ── */
  const analyzeTrack = useCallback(async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisText("");
    try {
      const prompt = `You are the Siddha Sound Alchemy Oracle (SQI-2050). Analyze this track "${file.name}" (${Math.round(duration)}s, ${file.type}).

Provide:
1. **Frequency Signature Reading** — Detect the dominant frequency character (warm, bright, hollow, etc.)
2. **Recommended Solfeggio Overlay** — Which Hz to layer (174–963) and why
3. **Binaural Protocol** — Best brainwave entrainment Hz for this audio
4. **EQ Tonal Balance** — Warm Temple, Ethereal Bright, Grounded Earth, Crystal Clear, or Sacred Depth
5. **Alchemical Insight** — A short spiritual-sonic reading of the track's energy

Format with bold headings and bullet points. Keep each section 2-3 sentences.`;

      const { data, error } = await supabase.functions.invoke("gemini-bridge", {
        body: { prompt, feature: "music", model: "flash" },
      });
      if (error) throw error;
      setAnalysisText(data?.response || "No analysis returned.");
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, duration, toast]);

  /* ── offline render & export ── */
  const exportAlchemized = useCallback(async () => {
    if (!bufferRef.current) return;
    setIsExporting(true);
    try {
      const buf = bufferRef.current;
      const offCtx = new OfflineAudioContext(buf.numberOfChannels, buf.length, buf.sampleRate);

      // source
      const src = offCtx.createBufferSource();
      src.buffer = buf;

      // EQ chain
      const low = offCtx.createBiquadFilter(); low.type = "lowshelf"; low.frequency.value = 250; low.gain.value = eqPreset?.low ?? 0;
      const mid = offCtx.createBiquadFilter(); mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = eqPreset?.mid ?? 0;
      const high = offCtx.createBiquadFilter(); high.type = "highshelf"; high.frequency.value = 4000; high.gain.value = eqPreset?.high ?? 0;

      src.connect(low).connect(mid).connect(high);

      // solfeggio
      if (solfeggioOn) {
        const osc = offCtx.createOscillator(); osc.type = "sine"; osc.frequency.value = solfeggioHz;
        const g = offCtx.createGain(); g.gain.value = solfeggioVol;
        osc.connect(g).connect(offCtx.destination);
        osc.start();
      }

      // binaural
      if (binauralOn) {
        const merger = offCtx.createChannelMerger(2);
        const oL = offCtx.createOscillator(); oL.frequency.value = 200;
        const oR = offCtx.createOscillator(); oR.frequency.value = 200 + binauralBeat;
        const gL = offCtx.createGain(); gL.gain.value = binauralVol;
        const gR = offCtx.createGain(); gR.gain.value = binauralVol;
        oL.connect(gL).connect(merger, 0, 0);
        oR.connect(gR).connect(merger, 0, 1);
        merger.connect(offCtx.destination);
        oL.start(); oR.start();
      }

      high.connect(offCtx.destination);
      src.start();

      const rendered = await offCtx.startRendering();

      // encode WAV
      const wavBlob = audioBufferToWav(rendered);
      const baseName = file?.name?.replace(/\.[^.]+$/, "") || "alchemy";
      const fileName = `${baseName}_alchemized_${solfeggioHz}hz.wav`;

      // upload to storage
      const storagePath = `oracle-exports/${Date.now()}_${fileName}`;
      const { error: upErr } = await supabase.storage
        .from("creative-soul-library")
        .upload(storagePath, wavBlob, { contentType: "audio/wav" });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("creative-soul-library")
        .getPublicUrl(storagePath);

      // also trigger download
      const a = document.createElement("a");
      a.href = URL.createObjectURL(wavBlob);
      a.download = fileName;
      a.click();

      toast({ title: "Export complete", description: `Saved to library & downloaded: ${fileName}` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [file, eqPreset, solfeggioOn, solfeggioHz, solfeggioVol, binauralOn, binauralBeat, binauralVol, toast]);

  /* ── cleanup ── */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      try { sourceRef.current?.stop(); } catch {}
      try { solOscRef.current?.stop(); } catch {}
      try { binOscLRef.current?.stop(); } catch {}
      try { binOscRRef.current?.stop(); } catch {}
      audioCtxRef.current?.close();
    };
  }, []);

  /* ── format time ── */
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  /* ── admin gate ── */
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col">
        <div className="max-w-4xl mx-auto px-6 py-10 w-full">
          <button type="button" onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#D4AF37] mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Creative Soul Store
          </button>
          <div className="rounded-3xl border border-red-500/30 bg-red-500/5 px-6 py-8">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-red-300 mb-2">Admin Only Field</p>
            <p className="text-sm text-white/70">The Siddha Sound Alchemy Oracle is a protected creation space and can only be opened from an Administrator account.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN UI ── */
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#3a1510] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-[#D4AF37] blur-[160px] opacity-40" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* header */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#D4AF37]">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-black/60 px-3 py-1 text-[10px] font-bold tracking-[0.26em] uppercase text-[#D4AF37]">
            <Zap className="w-3 h-3" /> Siddha Sound Alchemy Oracle
          </div>
        </div>

        {/* ── UPLOAD ZONE ── */}
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-[#D4AF37]/30 hover:border-[#D4AF37]/60 rounded-3xl p-16 text-center transition-colors bg-black/40 backdrop-blur-xl"
          >
            <Upload className="w-10 h-10 mx-auto mb-4 text-[#D4AF37]/60" />
            <p className="text-sm text-white/60 uppercase tracking-[0.18em]">Drop or click to upload audio</p>
            <p className="text-xs text-white/40 mt-2">WAV, MP3, FLAC, OGG — any format</p>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) loadFile(e.target.files[0]); }} />
          </div>
        ) : (
          <>
            {/* ── TRANSPORT BAR ── */}
            <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {!isPlaying ? (
                    <button onClick={play} className="p-2 rounded-full bg-[#D4AF37] text-black hover:bg-[#f0d26a] transition-colors">
                      <Play className="w-5 h-5" />
                    </button>
                  ) : (
                    <button onClick={pause} className="p-2 rounded-full bg-[#D4AF37] text-black hover:bg-[#f0d26a] transition-colors">
                      <Pause className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={stop} className="p-2 rounded-full border border-white/20 text-white/60 hover:text-white transition-colors">
                    <Square className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d26a] transition-all"
                      style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-white/40">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>
                <p className="text-xs text-white/50 truncate max-w-[200px]">{file.name}</p>
                <button onClick={() => { stop(); stopSolfeggio(); stopBinaural(); setFile(null); bufferRef.current = null; setAnalysisText(""); }}
                  className="text-[10px] uppercase tracking-wider text-white/40 hover:text-red-400">Replace</button>
              </div>
            </div>

            {/* ── CONTROLS GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* solfeggio */}
              <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Healing Hz Overlay</h3>
                  <button onClick={solfeggioOn ? stopSolfeggio : startSolfeggio}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border transition-colors ${solfeggioOn ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10" : "border-white/20 text-white/50 hover:text-white"}`}>
                    {solfeggioOn ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SOLFEGGIO_PRESETS.map(p => (
                    <button key={p.hz} onClick={() => { setSolfeggioHz(p.hz); if (!solfeggioOn) startSolfeggio(); }}
                      className={`text-left text-[10px] rounded-lg px-2 py-1.5 border transition-colors ${solfeggioHz === p.hz ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/5 text-white/50 hover:text-white/80 hover:border-white/20"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-white/40" />
                  <input type="range" min="0" max="0.5" step="0.01" value={solfeggioVol}
                    onChange={e => setSolfeggioVol(Number(e.target.value))}
                    className="flex-1 accent-[#D4AF37]" />
                  <span className="text-[10px] text-white/40 w-8 text-right">{Math.round(solfeggioVol * 100)}%</span>
                </div>
              </div>

              {/* binaural */}
              <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Binaural Beat</h3>
                  <button onClick={binauralOn ? stopBinaural : startBinaural}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border transition-colors ${binauralOn ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10" : "border-white/20 text-white/50 hover:text-white"}`}>
                    {binauralOn ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {BINAURAL_PRESETS.map(p => (
                    <button key={p.beat} onClick={() => { setBinauralBeat(p.beat); if (!binauralOn) startBinaural(); }}
                      className={`w-full text-left text-[10px] rounded-lg px-2 py-1.5 border transition-colors ${binauralBeat === p.beat ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/5 text-white/50 hover:text-white/80 hover:border-white/20"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-white/40" />
                  <input type="range" min="0" max="0.5" step="0.01" value={binauralVol}
                    onChange={e => setBinauralVol(Number(e.target.value))}
                    className="flex-1 accent-[#D4AF37]" />
                  <span className="text-[10px] text-white/40 w-8 text-right">{Math.round(binauralVol * 100)}%</span>
                </div>
              </div>

              {/* EQ + actions */}
              <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Tonal Balance</h3>
                <div className="space-y-1.5">
                  {EQ_PRESETS.map(p => (
                    <button key={p.name} onClick={() => setEqPreset(p)}
                      className={`w-full text-left text-[10px] rounded-lg px-2 py-1.5 border transition-colors ${eqPreset?.name === p.name ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/5 text-white/50 hover:text-white/80 hover:border-white/20"}`}>
                      {p.name}
                      <span className="ml-2 text-white/30">L{p.low > 0 ? "+" : ""}{p.low} M{p.mid > 0 ? "+" : ""}{p.mid} H{p.high > 0 ? "+" : ""}{p.high}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <button onClick={analyzeTrack} disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.18em] text-white/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors disabled:opacity-50">
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isAnalyzing ? "Scanning…" : "AI Oracle Scan"}
                  </button>
                  <button onClick={exportAlchemized} disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#D4AF37] text-black text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-[#f0d26a] transition-colors disabled:opacity-50">
                    {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {isExporting ? "Rendering…" : "Export Alchemized"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── AI ANALYSIS ── */}
            {analysisText && (
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-black/50 backdrop-blur-xl p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Alchemical Oracle Reading
                </h3>
                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: analysisText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ── WAV encoder ── */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const interleaved = new Float32Array(len * numCh);
  for (let ch = 0; ch < numCh; ch++) {
    const chData = buffer.getChannelData(ch);
    for (let i = 0; i < len; i++) interleaved[i * numCh + ch] = chData[i];
  }
  const dataLen = interleaved.length * 2;
  const wavBuf = new ArrayBuffer(44 + dataLen);
  const view = new DataView(wavBuf);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, 36 + dataLen, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true); view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true); writeStr(36, "data"); view.setUint32(40, dataLen, true);
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([wavBuf], { type: "audio/wav" });
}

export default SiddhaSoundAlchemyOracle;
