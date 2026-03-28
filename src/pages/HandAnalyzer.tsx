import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import PalmOracle, { getHeartLineLeak, getVataPittaKapha, getPalmArchetype } from '@/components/PalmOracle';
import { setPalmScanResult } from '@/lib/palmScanStore';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { useTranslation } from '@/hooks/useTranslation';

const CAMERA_TIMEOUT_MS = 4000;

type HandAnalyzerErrorKey = 'permissionDenied' | 'notSupported' | 'timeout';

/** Neural Map — glowing Life, Head, Heart paths over the camera feed during scan */
const LIFE_PATH = 'M 22,28 Q 28,36 26,72';
const HEAD_PATH = 'M 22,48 Q 38,44 52,50';
const HEART_PATH = 'M 22,36 Q 42,30 62,38';

const NeuralMapOverlay: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <svg
        className="absolute w-full h-full text-[#D4AF37] opacity-70"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="neural-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d={LIFE_PATH}
          fill="none"
          stroke="rgba(212,175,55,0.95)"
          strokeWidth="1.2"
          strokeLinecap="round"
          filter="url(#neural-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />
        <motion.path
          d={HEAD_PATH}
          fill="none"
          stroke="rgba(212,175,55,0.9)"
          strokeWidth="1"
          strokeLinecap="round"
          filter="url(#neural-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
        />
        <motion.path
          d={HEART_PATH}
          fill="none"
          stroke="rgba(212,175,55,0.9)"
          strokeWidth="1"
          strokeLinecap="round"
          filter="url(#neural-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.6, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
};

const HandAnalyzer = () => {
  const { t } = useTranslation();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorKey, setErrorKey] = useState<HandAnalyzerErrorKey | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<boolean>(false);
  const [analysisSeed, setAnalysisSeed] = useState<string>('');
  const [analysisImageUrl, setAnalysisImageUrl] = useState<string>('');
  const [transitioningToAkasha, setTransitioningToAkasha] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraReadyRef = useRef(false);
  const navigate = useNavigate();

  const startCamera = async () => {
    setIsInitializing(true);
    setErrorKey(null);
    cameraReadyRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      cameraReadyRef.current = true;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsInitializing(false);
    } catch (err) {
      console.error('Camera Error:', err);
      setErrorKey('permissionDenied');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorKey('notSupported');
      setIsInitializing(false);
      return () => {};
    }
    startCamera();

    const timer = setTimeout(() => {
      if (!cameraReadyRef.current) {
        setIsInitializing(false);
        setErrorKey('timeout');
      }
    }, CAMERA_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // When stream becomes available, clear initializing (safety)
  useEffect(() => {
    if (stream) setIsInitializing(false);
  }, [stream]);

  const captureImage = (): string | null => {
    if (!videoRef.current || !stream) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const runAnalysis = (imageData: string) => {
    setIsScanning(true);
    setAnalysisResult(false);
    setTransitioningToAkasha(false);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t('handAnalyzer.toast.signIn'));
          setIsScanning(false);
          return;
        }
        setTimeout(() => {
          const seed = imageData.slice(0, 120);
          setIsScanning(false);
          toast.success(t('handAnalyzer.toast.analysisComplete'));
          setAnalysisSeed(seed);
          setAnalysisImageUrl(imageData);
          setAnalysisResult(true);
          const heartLineLeak = getHeartLineLeak(seed);
          const vataPittaKapha = getVataPittaKapha(seed);
          const palmArchetype = getPalmArchetype(seed);
          setPalmScanResult({
            scannedAt: new Date().toISOString(),
            heartLineLeak,
            vataPittaKapha,
            palmArchetype: palmArchetype ?? undefined,
            seed,
          });
        }, 4000);
      } catch (err: unknown) {
        setIsScanning(false);
        toast.error(err instanceof Error ? err.message : t('handAnalyzer.toast.analysisFailed'));
      }
    })();
  };

  const handleAnalysisOk = () => {
    setAnalysisResult(false);
    setTransitioningToAkasha(true);
    setTimeout(() => {
      navigate('/akashic-records');
      setTransitioningToAkasha(false);
    }, 1500);
  };

  const handleScan = () => {
    if (stream && videoRef.current) {
      const imageData = captureImage();
      if (!imageData) {
        toast.error(t('handAnalyzer.toast.captureFailed'));
        return;
      }
      runAnalysis(imageData);
      return;
    }
    toast.error(t('handAnalyzer.toast.cameraNotReady'));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) runAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasCamera = !!stream && !errorKey;
  const errorMessage = errorKey ? t(`handAnalyzer.errors.${errorKey}`) : null;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-serif">
      {/* HEADER */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-[#D4AF37] text-2xl" aria-label={t('handAnalyzer.goBack')}>
          ←
        </button>
        <h1 className="text-xl font-bold tracking-widest uppercase">{t('handAnalyzer.title')}</h1>
      </div>

      {/* CAMERA VIEWPORT */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 1. INITIALIZING STATE */}
        {isInitializing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-2 border-t-[#D4AF37] border-transparent rounded-full mb-4"
            />
            <p className="text-[#D4AF37] tracking-widest text-xs uppercase animate-pulse">{t('handAnalyzer.initializingLens')}</p>
          </div>
        )}

        {/* 2. CAMERA VIEW */}
        {!errorKey && !isInitializing && stream && (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
            {/* Neural Map overlay — glowing SVG paths (Life, Head, Heart) drawn as camera scans */}
            <NeuralMapOverlay active={isScanning} />
            {/* Golden Hand Overlay for Calibration */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
              <svg width="200" height="300" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="0.5">
                <path d="M18 11V7a2 2 0 00-4 0v3m0 0V5a2 2 0 00-4 0v5m0 0V3a2 2 0 00-4 0v9m0 0V9a2 2 0 00-4 0v7a8 8 0 0016 0v-5" />
              </svg>
            </div>
            <div className="absolute bottom-6 w-full text-center">
              <p className="text-white text-[10px] uppercase tracking-widest bg-black/50 py-2 inline-block px-4 rounded-full">
                {isScanning ? t('handAnalyzer.neuralMapActive') : t('handAnalyzer.alignPalm')}
              </p>
            </div>
          </div>
        )}

        {/* 3. ERROR / FALLBACK STATE */}
        {errorKey && (
          <div className="flex flex-col items-center p-10 text-center">
            <p className="text-white/60 text-sm mb-6">{errorMessage}</p>
            <button
              type="button"
              className="px-8 py-3 bg-[#D4AF37] text-black rounded-full font-bold uppercase text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              {t('handAnalyzer.uploadPalmPhoto')}
            </button>
            <button
              type="button"
              onClick={startCamera}
              className="mt-4 text-[#D4AF37] text-[10px] uppercase underline"
            >
              {t('handAnalyzer.tryAgain')}
            </button>
          </div>
        )}

        {/* MANDALA OVERLAY — only when camera active */}
        {hasCamera && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="w-80 h-80 border-2 border-[#D4AF37]/30 rounded-full flex items-center justify-center"
            >
              <div className="w-64 h-64 border border-[#D4AF37]/20 rounded-full" />
            </motion.div>
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ top: '20%' }}
                  animate={{ top: '80%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_15px_#D4AF37] z-40"
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS — Take Photo (camera) + Upload always visible */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 z-50 px-4">
        <div className="flex items-center gap-3">
          {hasCamera && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleScan}
              disabled={isScanning}
              className={`w-20 h-20 rounded-full border-4 ${isScanning ? 'border-white/20' : 'border-[#D4AF37]'} flex items-center justify-center bg-black/40 backdrop-blur-md`}
              aria-label={isScanning ? t('handAnalyzer.ariaScanning') : t('handAnalyzer.ariaCapture')}
            >
              <div className={`w-14 h-14 rounded-full ${isScanning ? 'bg-white/20' : 'bg-[#D4AF37] shadow-[0_0_20px_#D4AF37]'}`} />
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => cameraInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#D4AF37] text-black font-bold text-sm uppercase tracking-wider disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            {t('handAnalyzer.takePhoto')}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-[#D4AF37]/50 text-[#D4AF37] font-semibold text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {t('handAnalyzer.upload')}
          </motion.button>
        </div>
        {(!hasCamera || errorKey) && (
          <p className="text-[10px] text-[#D4AF37]/70 uppercase tracking-wider text-center">
            {errorKey ? t('handAnalyzer.hintError') : t('handAnalyzer.hintStarting')}
          </p>
        )}
      </div>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleGalleryUpload} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />

      {/* STATUS TEXT */}
      <div className="absolute bottom-36 left-0 right-0 text-center">
        <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em]">
          {isScanning
            ? t('handAnalyzer.statusDeciphering')
            : hasCamera
              ? t('handAnalyzer.statusAlign')
              : errorKey
                ? t('handAnalyzer.statusUploadOrRetry')
                : t('handAnalyzer.statusInitializing')}
        </p>
      </div>

      {/* Deep Palm Analysis modal — OK triggers transition to Akashic */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={(e) => e.target === e.currentTarget && handleAnalysisOk()}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#1a1a1a] border-2 border-[#D4AF37]/50 rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-auto shadow-[0_0_40px_rgba(212,175,55,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <PalmOracle seed={analysisSeed} handImageUrl={analysisImageUrl} className="mb-4" />
              {/* Vata-Pitta-Kapha from hand texture/color */}
              {analysisSeed && (() => {
                const vpk = getVataPittaKapha(analysisSeed);
                return (
                  <section className="mb-6 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-3">{t('handAnalyzer.vpkTitle')}</h4>
                    <p className="text-white/70 text-xs mb-2">{t('handAnalyzer.vpkSubtitle')}</p>
                    <div className="space-y-2">
                      {(['vata', 'pitta', 'kapha'] as const).map((d) => (
                        <div key={d} className="flex items-center gap-2">
                          <span className="text-white/80 text-sm w-12 capitalize">
                            {d === 'vata'
                              ? t('ayurvedaDash.dosha_vata')
                              : d === 'pitta'
                                ? t('ayurvedaDash.dosha_pitta')
                                : t('ayurvedaDash.dosha_kapha')}
                          </span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-[#D4AF37] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${vpk[d]}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                          <span className="text-[#D4AF37] text-sm font-mono w-8">{vpk[d]}%</span>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}
              <button
                type="button"
                onClick={handleAnalysisOk}
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold uppercase text-sm tracking-wider hover:bg-[#D4AF37]/90 transition-colors"
              >
                {t('handAnalyzer.continueAkashic')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning the Akasha — 1.5s then redirect to Akashic Decoder */}
      <AnimatePresence>
        {transitioningToAkasha && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] flex flex-col items-center justify-center bg-black/95"
          >
            <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-6 animate-pulse">{t('handAnalyzer.scanningAkasha')}</p>
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#D4AF37] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function HandAnalyzerGated() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();

  if (authLoading || membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <span className="text-sm uppercase tracking-[0.3em] text-white/40">{t('common.loading')}</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.palmOracle)) {
    return <Navigate to="/akasha-infinity" replace />;
  }

  return <HandAnalyzer />;
}

export default React.memo(HandAnalyzerGated);
