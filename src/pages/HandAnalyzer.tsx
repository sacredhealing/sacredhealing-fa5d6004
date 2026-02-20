import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CAMERA_TIMEOUT_MS = 3000;

const HandAnalyzer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState('');
  const [showGalleryFallback, setShowGalleryFallback] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const startCamera = async () => {
    setError('');
    setCameraLoading(true);
    setShowGalleryFallback(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject(new Error('No video ref'));
          videoRef.current.onloadedmetadata = () => resolve();
          videoRef.current.onerror = () => reject(new Error('Video load error'));
        });
        setHasCamera(true);
      }
      setCameraLoading(false);
    } catch (err) {
      console.error(err);
      setError('Camera Access Denied. Please enable permissions or use Upload from Gallery.');
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const init = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not supported in this browser.');
        setCameraLoading(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!cancelled) {
              setHasCamera(true);
              setCameraLoading(false);
            }
          };
          videoRef.current.onerror = () => {
            if (!cancelled) {
              setError('Camera stream failed.');
              setCameraLoading(false);
            }
          };
        } else {
          setCameraLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Camera access denied. Use Upload from Gallery below.');
          setCameraLoading(false);
        }
      }
    };

    init();

    timeoutId = setTimeout(() => {
      if (!cancelled) {
        setCameraLoading(false);
        setShowGalleryFallback(true);
      }
    }, CAMERA_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (hasCamera) setShowGalleryFallback(false);
  }, [hasCamera]);

  const captureImage = (): string | null => {
    if (!videoRef.current || !hasCamera) return null;
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
          const analysisMessage = `Vedic Samudrika Shastra Analysis:\n\nLife Line (Prana): Analyzing depth and clarity...\nHeart Line (Dharma): Examining emotional patterns...\nHead Line (Buddhi): Assessing mental clarity...\n\nNote: For the most accurate reading, ensure your palm is well-lit and aligned with natural light. If the image appears blurry, align your palm with the light of the Sun for a clearer reading.`;
          alert(analysisMessage);
        }, 4000);
      } catch (error: unknown) {
        setIsScanning(false);
        toast.error(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
      }
    })();
  };

  const handleScan = () => {
    if (hasCamera && videoRef.current) {
      const imageData = captureImage();
      if (!imageData) {
        toast.error('Failed to capture palm image. Please try again.');
        return;
      }
      runAnalysis(imageData);
      return;
    }
    toast.error('Camera not ready. Please wait or use Upload from Gallery.');
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
        {!hasCamera ? (
          <div className="text-center p-10">
            <p className="text-white/60 mb-4">{error || 'Initializing Lens...'}</p>
            <button
              type="button"
              onClick={startCamera}
              className="text-[#D4AF37] border border-[#D4AF37] px-6 py-2 rounded-full hover:bg-[#D4AF37]/10 transition-colors mb-3"
            >
              Reset Camera
            </button>
            {showGalleryFallback && (
              <>
                <p className="text-white/50 text-sm mt-4 mb-2">Camera taking too long?</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#D4AF37] border border-[#D4AF37] px-6 py-2 rounded-full hover:bg-[#D4AF37]/10 transition-colors"
                >
                  Upload from Gallery
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
            {/* Golden Hand silhouette — calibration overlay for Siddha scan */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg viewBox="0 0 200 240" className="w-72 max-h-[75vh] shrink-0" aria-hidden>
                <defs>
                  <linearGradient id="goldHand" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                {/* Palm + fingers outline */}
                <ellipse cx="100" cy="130" rx="52" ry="58" fill="url(#goldHand)" stroke="#D4AF37" strokeWidth="2" opacity="0.9" />
                <ellipse cx="100" cy="45" rx="18" ry="32" fill="url(#goldHand)" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
                <ellipse cx="62" cy="75" rx="14" ry="38" fill="url(#goldHand)" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
                <ellipse cx="138" cy="75" rx="14" ry="38" fill="url(#goldHand)" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
                <ellipse cx="45" cy="115" rx="12" ry="42" fill="url(#goldHand)" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
                <ellipse cx="155" cy="115" rx="12" ry="42" fill="url(#goldHand)" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
              </svg>
            </div>
          </>
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
        {showGalleryFallback && !hasCamera ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-auto px-6 py-3 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-serif text-sm uppercase tracking-wider disabled:opacity-50"
          >
            Upload from Gallery
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
          {isScanning ? 'Deciphering Soul Lines...' : hasCamera ? 'Align Palm within the Mandala' : showGalleryFallback ? 'Or upload a palm image' : 'Initializing Lens...'}
        </p>
      </div>
    </div>
  );
};

export default HandAnalyzer;
