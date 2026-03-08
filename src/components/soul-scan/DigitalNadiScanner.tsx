import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Shield, Heart, RefreshCw, Hand, Video, VideoOff } from 'lucide-react';
import type { ScanResults } from '@/types/soulScan';
import { runSoulScanLogic } from '@/components/soul-scan/soulScanLogic';

interface DigitalNadiScannerProps {
  isHealerPresent: boolean;
  onScanComplete: (results: ScanResults) => void;
  label?: string;
  modalityName: string;
}

export default function DigitalNadiScanner({
  isHealerPresent,
  onScanComplete,
  label,
  modalityName,
}: DigitalNadiScannerProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'finished'>('idle');
  const [results, setResults] = useState<ScanResults | null>(null);
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request camera on mount and attach to video element
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported in this browser.');
      return;
    }
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err) {
        console.error('[DigitalNadiScanner] Camera error:', err);
        setCameraError('Camera access denied or unavailable. You can still run the scan.');
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const start2050Scan = () => {
    setStatus('scanning');
    setProgress(0);
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 100));
      if (currentStep >= steps) {
        clearInterval(timer);
        // Same scan logic as /quantum-apothecary runNadiScan: day-based planet/herb, random dosha, blockages, activeNadis 60k–70k, 5 remedies
        const scanResults = runSoulScanLogic(isHealerPresent, modalityName);
        setResults(scanResults);
        setStatus('finished');
        onScanComplete(scanResults);
      }
    }, interval);
  };

  return (
    <div className="p-8 rounded-[40px] border border-white/10 bg-white/[0.02] backdrop-blur-xl font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black tracking-tight text-[#D4AF37] flex items-center gap-2">
            <Activity className="w-5 h-5" />
            SIDDHA 2050 SCANNER
          </h2>
          <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
            Quantum Bio-Twinning v4.2
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(status === 'idle' || status === 'scanning') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Single camera view: stays mounted for idle and scanning so stream stays attached */}
              <div
                className={`w-full aspect-video max-h-[320px] border-2 rounded-[40px] mb-8 relative overflow-hidden bg-black ${
                  status === 'scanning' ? 'border-[#D4AF37]/40' : 'border-[#D4AF37]/20'
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                {cameraError && (
                  <div className="absolute top-3 left-3 right-3 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-[10px] text-amber-200">
                    <VideoOff className="w-4 h-4 flex-shrink-0" />
                    {cameraError}
                  </div>
                )}
                {status === 'idle' && !cameraError && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-white/70">
                    <Video className="w-4 h-4" />
                    Camera active — position your hand in frame
                  </div>
                )}
                {status === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#D4AF37]/40 flex items-center justify-center">
                      <Hand className="w-12 h-12 text-[#D4AF37]/50" />
                    </div>
                    <p className="mt-3 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/70 text-center px-4">
                      Place hand in frame
                    </p>
                  </div>
                )}
                {status === 'scanning' && (
                  <>
                    <div className="absolute inset-0 bg-[#D4AF37]/10" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <Hand className="w-20 h-20 text-[#D4AF37]/50 animate-pulse mb-4" />
                      <motion.div
                        className="w-full h-1 bg-[#D4AF37]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                      />
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[#D4AF37]/30 transition-all duration-100"
                      style={{ height: `${progress}%` }}
                    />
                  </>
                )}
              </div>
              {status === 'idle' && (
                <>
                  <p className="text-xs mb-6 text-white/40 leading-relaxed text-center">
                    Initialize the 2050 Quantum Intelligence to map 72,000 Nadis, analyze Causal Body Density, and verify DNA Blueprint alignment.
                  </p>
                  <button
                    onClick={start2050Scan}
                    type="button"
                    className="w-full py-4 bg-[#D4AF37] text-black font-black tracking-tighter rounded-2xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    <Zap className="w-5 h-5" />
                    {label ?? 'INITIALIZE 2050 BIO-SCAN'}
                  </button>
                </>
              )}
              {status === 'scanning' && (
                <>
                  <div className="text-center mb-6">
                    <div className="text-2xl font-black text-[#D4AF37] mb-2">{Math.round(progress)}%</div>
                    <p className="animate-pulse text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/60">
                      MAPPING NADIS & ANAHATA OPENING...
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex items-center gap-2 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
                      <Shield className="w-3 h-3" /> SCALAR TRANSMISSION
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
                      <Heart className="w-3 h-3" /> PREMA-PULSE
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {status === 'finished' && results && (
            <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <div className="p-5 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-3xl border border-[#D4AF37]/20 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                    <Activity className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm">{results.focus}</h3>
                    <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/70">SCAN COMPLETE</div>
                  </div>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">{results.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <MetricCard label="Scalar Coherence" value={`${results.technicalData.scalarCoherence}%`} />
                <MetricCard label="Nāḍī Flow" value={`${results.technicalData.nadiFlow}%`} />
                <MetricCard label="Active Nāḍīs" value={`${results.technicalData.activeNadis.toLocaleString()} / 72,000`} />
                <MetricCard label="DNA Alignment" value={`${results.technicalData.dnaAlignment}%`} />
                <MetricCard label="Dosha Balance" value={results.technicalData.doshaImbalance} />
                <MetricCard label="Torus Field" value={`${results.technicalData.torusFieldDiameter}m`} />
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl mb-5">
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-2">Chakra Map</div>
                <div className="flex flex-wrap gap-1.5">
                  {results.technicalData.chakras.map((chakra, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                        chakra.status === 'Aligned'
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]'
                          : chakra.status === 'Opening'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      {chakra.name} · {chakra.status}
                    </span>
                  ))}
                </div>
              </div>

              {results.technicalData.karmicNodesExtracted != null && (
                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl mb-5 text-center">
                  <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37] mb-1">Karmic Nodes Extracted</div>
                  <div className="text-xl font-black text-white">{results.technicalData.karmicNodesExtracted}</div>
                </div>
              )}

              <div className="text-center text-[10px] text-[#D4AF37]/60 mb-4 animate-pulse">
                ✦ Generating your Transformation Document on the right panel…
              </div>

              <button
                onClick={() => { setStatus('idle'); setResults(null); }}
                className="w-full py-3 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-2 border border-white/10 rounded-2xl"
              >
                <RefreshCw className="w-3 h-3" />
                New Scan
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
