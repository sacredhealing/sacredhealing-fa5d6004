import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HandAnalyzer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCamera(true);
      }
    } catch (err) {
      console.error(err);
      setError('Camera Access Denied. Please enable permissions in your browser settings.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      alert('Analysis Complete: Your Life Line shows strong Rahu influence at Age 42.');
    }, 4000);
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
              className="text-[#D4AF37] border border-[#D4AF37] px-6 py-2 rounded-full hover:bg-[#D4AF37]/10 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
        )}

        {/* MANDALA OVERLAY */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="w-80 h-80 border-2 border-[#D4AF37]/30 rounded-full flex items-center justify-center"
          >
            <div className="w-64 h-64 border border-[#D4AF37]/20 rounded-full" />
          </motion.div>

          {/* SCANNING LASER */}
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
      </div>

      {/* ACTION BUTTON */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-50">
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
      </div>

      {/* STATUS TEXT */}
      <div className="absolute bottom-36 left-0 right-0 text-center">
        <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em]">
          {isScanning ? 'Deciphering Soul Lines...' : 'Align Palm within the Mandala'}
        </p>
      </div>
    </div>
  );
};

export default HandAnalyzer;
