/* SQI 2050: HAND-MOTION NADI SCANNER */
import React, { useRef, useEffect, useState } from 'react';

interface HandScannerProps {
  onComplete: () => void;
}

const HandScanner: React.FC<HandScannerProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err) {
        console.error('[HandScanner] Camera error:', err);
        setCameraError('Camera access denied. You can still begin the scan.');
      }
    }
    setupCamera();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Simulation of Motion Detection & Nadi Mapping
  useEffect(() => {
    if (isScanning && progress < 72000) {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1200, 72000));
      }, 100);
      return () => clearInterval(interval);
    } else if (progress >= 72000) {
      onComplete();
    }
  }, [isScanning, progress, onComplete]);

  return (
    <div className="relative w-full aspect-video rounded-[40px] overflow-hidden bg-black border border-[#D4AF37]/20">
      {/* 1. Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover opacity-60 grayscale"
      />

      {/* 2. Aetheric Scanner Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className={`w-48 h-48 rounded-full border-2 border-dashed ${
            isScanning ? 'border-[#D4AF37] animate-spin' : 'border-white/20'
          }`}
        />
        <p className="mt-4 text-[#D4AF37] text-[10px] font-black tracking-[0.4em] uppercase">
          {isScanning ? 'Mapping Nādī Network...' : 'Place Hands in View to Begin'}
        </p>
      </div>

      {/* 3. Progress Bar */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="flex justify-between text-[8px] text-white/40 mb-2 uppercase tracking-widest">
          <span>Alignment</span>
          <span>
            {progress.toLocaleString()} / 72,000 Channels
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-[#D4AF37] transition-all duration-300"
            style={{ width: `${(progress / 72000) * 100}%` }}
          />
        </div>
      </div>

      {/* Camera fallback message */}
      {cameraError && !isScanning && (
        <p className="absolute top-4 left-4 right-4 text-[9px] text-white/50 text-center">{cameraError}</p>
      )}

      {/* Start Button */}
      {!isScanning && (
        <button
          type="button"
          onClick={() => setIsScanning(true)}
          className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-[#D4AF37]/10 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-black uppercase hover:bg-[#D4AF37]/20 transition-colors"
        >
          Begin Scan
        </button>
      )}
    </div>
  );
};

export default HandScanner;
