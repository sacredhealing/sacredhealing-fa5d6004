import React from 'react';
import { motion } from 'framer-motion';

interface KarmicDebtMeterProps {
  progress?: number; // Progress represents % of debt CLEARED
}

const KarmicDebtMeter: React.FC<KarmicDebtMeterProps> = ({ progress = 42 }) => {
  const strokeDasharray = 2 * Math.PI * 45;
  const offset = strokeDasharray - (progress / 100) * strokeDasharray;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-xl rounded-3xl border border-[#D4AF37]/10 mb-8">
      <div className="relative w-48 h-48">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-full blur-2xl" />
        
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
          {/* Gray Track (Remaining Debt) */}
          <circle
            cx="96"
            cy="96"
            r="45"
            stroke="#1a1a1a"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Golden Progress (Purified Karma) */}
          <motion.circle
            cx="96"
            cy="96"
            r="45"
            stroke="#D4AF37"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
            style={{ filter: "drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))" }}
          />
        </svg>

        {/* Center Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-serif text-white">{progress}%</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] opacity-60">Purified</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-[#D4AF37] font-serif tracking-widest uppercase text-sm">Karmic Weight Status</h3>
        <p className="text-white/40 text-xs mt-2 italic max-w-[200px]">
          {progress < 50 
            ? "The shadow of previous cycles is being transmuted through your current Rahu Dasha."
            : "Your vessel is holding more Light. The Akashic records are opening."}
        </p>
      </div>
    </div>
  );
};

export default KarmicDebtMeter;
