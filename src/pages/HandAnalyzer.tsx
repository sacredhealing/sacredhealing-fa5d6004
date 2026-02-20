import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PalmOracle from '@/components/PalmOracle';

const CAMERA_TIMEOUT_MS = 4000;

const HandAnalyzer = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<boolean>(false);
  const [analysisSeed, setAnalysisSeed] = useState<string>('');
  const [analysisImageUrl, setAnalysisImageUrl] = useState<string>('');
  const [transitioningToAkasha, setTransitioningToAkasha] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraReadyRef = useRef(false);
  const navigate = useNavigate();

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
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
      setError('Permission denied or camera in use.');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser.');
      setIsInitializing(false);
      return () => {};
    }
    startCamera();

    const timer = setTimeout(() => {
      if (!cameraReadyRef.current) {
        setIsInitializing(false);
        setError('Camera bridge timed out. Please upload a clear photo of your palm.');
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
          toast.error('Please sign in to use Hand Analyzer');
          setIsScanning(false);
          return;
        }
        setTimeout(() => {
          setIsScanning(false);
          toast.success('Analysis complete!');
          setAnalysisSeed(imageData.slice(0, 120));
          setAnalysisImageUrl(imageData);
          setAnalysisResult(true);
        }, 4000);
      } catch (err: unknown) {
        setIsScanning(false);
        toast.error(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
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
        toast.error('Failed to capture palm image. Please try again.');
        return;
      }
      runAnalysis(imageData);
      return;
    }
    toast.error('Camera not ready. Please wait or upload a photo.');
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

  const hasCamera = !!stream && !error;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-serif">
      {/* HEADER */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-[#D4AF37] text-2xl" aria-label="Go back">
          ←
        </button>
        <h1 className="text-xl font-bold tracking-widest uppercase">Palm Oracle</h1>
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
            <p className="text-[#D4AF37] tracking-widest text-xs uppercase animate-pulse">Initializing Siddha Lens...</p>
          </div>
        )}

        {/* 2. CAMERA VIEW */}
        {!error && !isInitializing && stream && (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
            {/* Golden Hand Overlay for Calibration */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
              <svg width="200" height="300" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="0.5">
                <path d="M18 11V7a2 2 0 00-4 0v3m0 0V5a2 2 0 00-4 0v5m0 0V3a2 2 0 00-4 0v9m0 0V9a2 2 0 00-4 0v7a8 8 0 0016 0v-5" />
              </svg>
            </div>
            <div className="absolute bottom-6 w-full text-center">
              <p className="text-white text-[10px] uppercase tracking-widest bg-black/50 py-2 inline-block px-4 rounded-full">
                Align Palm with Golden Outline
              </p>
            </div>
          </div>
        )}

        {/* 3. ERROR / FALLBACK STATE */}
        {error && (
          <div className="flex flex-col items-center p-10 text-center">
            <p className="text-white/60 text-sm mb-6">{error}</p>
            <button
              type="button"
              className="px-8 py-3 bg-[#D4AF37] text-black rounded-full font-bold uppercase text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Palm Photo
            </button>
            <button
              type="button"
              onClick={startCamera}
              className="mt-4 text-[#D4AF37] text-[10px] uppercase underline"
            >
              Try Again
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

      {/* ACTION BUTTON */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-50">
        {error ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-auto px-6 py-3 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-serif text-sm uppercase tracking-wider disabled:opacity-50"
          >
            Upload Palm Photo
          </motion.button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleScan}
            disabled={isScanning || !hasCamera}
            className={`w-20 h-20 rounded-full border-4 ${isScanning ? 'border-white/20' : 'border-[#D4AF37]'} flex items-center justify-center bg-black/40 backdrop-blur-md`}
            aria-label={isScanning ? 'Scanning' : 'Scan palm'}
          >
            <div className={`w-14 h-14 rounded-full ${isScanning ? 'bg-white/20' : 'bg-[#D4AF37] shadow-[0_0_20px_#D4AF37]'}`} />
          </motion.button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />

      {/* STATUS TEXT */}
      <div className="absolute bottom-36 left-0 right-0 text-center">
        <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em]">
          {isScanning ? 'Deciphering Soul Lines...' : hasCamera ? 'Align Palm with Golden Outline' : error ? 'Upload a palm photo or try again' : 'Initializing Siddha Lens...'}
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
              <PalmOracle seed={analysisSeed} handImageUrl={analysisImageUrl} className="mb-6" />
              <button
                type="button"
                onClick={handleAnalysisOk}
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold uppercase text-sm tracking-wider hover:bg-[#D4AF37]/90 transition-colors"
              >
                OK — Continue to Akashic Decoder
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
            <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-6 animate-pulse">Scanning the Akasha...</p>
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

export default React.memo(HandAnalyzer);
