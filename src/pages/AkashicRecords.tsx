import React from 'react';
import { useNavigate } from 'react-router-dom';
import AkashicSiddhaReading from '@/components/vedic/AkashicSiddhaReading';

/** Full-page Akashic Decoder — linked from Your Space (palm → Archetype record). */
const AkashicRecords: React.FC = () => {
  const navigate = useNavigate();
  const userHouse = 12; // Default Ketu's house; can derive from useAIVedicReading().reading later if needed

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#D4AF37]">
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-[#D4AF37]/20 bg-[#0a0a0a]/95 backdrop-blur px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-[#D4AF37] text-xl font-serif"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-lg font-serif font-semibold tracking-wide">Akashic Decoder</h1>
      </div>
      <div className="p-4 pb-24">
        <p className="text-sm text-white/70 mb-4 font-serif italic">
          Lines detected on your palm match the Archetype record in the Akasha.
        </p>
        <AkashicSiddhaReading userHouse={userHouse} isModal={false} />
      </div>
    </div>
  );
};

export default AkashicRecords;
