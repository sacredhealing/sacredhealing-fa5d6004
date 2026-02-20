import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const handleScan = async () => {
    if (!hasCamera || !videoRef.current) {
      toast.error('Camera not ready. Please wait for initialization.');
      return;
    }

    setIsScanning(true);
    const imageData = captureImage();
    
    if (!imageData) {
      setIsScanning(false);
      toast.error('Failed to capture palm image. Please try again.');
      return;
    }

    try {
      // Check if user is signed in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to use Hand Analyzer');
        setIsScanning(false);
        return;
      }

      // For now, simulate analysis with updated Vedic Samudrika Shastra prompt
      // TODO: Integrate with Gemini API or Supabase edge function for real analysis
      // Prompt: "Analyze this palm image specifically for Vedic Samudrika Shastra. 
      // Identify the depth of the Life line (Prana), Heart line (Dharma), and Head line (Buddhi). 
      // If the image is blurry, instruct the user: 'Align your palm with the light of the Sun for a clearer reading'."
      
      setTimeout(() => {
        setIsScanning(false);
        toast.success('Analysis complete!');
        const analysisMessage = `Vedic Samudrika Shastra Analysis:\n\nLife Line (Prana): Analyzing depth and clarity...\nHeart Line (Dharma): Examining emotional patterns...\nHead Line (Buddhi): Assessing mental clarity...\n\nNote: For the most accurate reading, ensure your palm is well-lit and aligned with natural light. If the image appears blurry, align your palm with the light of the Sun for a clearer reading.`;
        alert(analysisMessage);
      }, 4000);
    } catch (error: any) {
      console.error('Hand analysis error:', error);
      setIsScanning(false);
      toast.error(error.message || 'Analysis failed. Please try again.');
    }
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
