import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const AkashicReveal = ({ isPremium, onInitiate }: { isPremium: boolean; onInitiate: () => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulating the 'Admin' / Backend handshake
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gold">
        <div className="animate-pulse flex flex-col items-center">
          <Sparkles className="w-12 h-12 mb-4 text-cyan-400" />
          <p className="text-sm uppercase tracking-widest">Consulting the Akashic Field...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 text-center">
      {/* Main Card */}
      <div className="w-full max-w-md border border-yellow-900/50 bg-neutral-900/30 p-12 rounded-2xl mb-8 shadow-2xl">
        <Sparkles className="w-10 h-10 mx-auto mb-6 text-cyan-400" />
        <h2 className="text-xl tracking-[0.3em] text-gold uppercase mb-2">Strength of Soul</h2>
        <p className="italic text-neutral-400 text-sm">Your Full Comprehensive Manuscript Awaits</p>
      </div>

      {/* Description */}
      <div className="max-w-xl space-y-6 mb-10">
        <p className="text-neutral-300 uppercase tracking-widest text-xs leading-relaxed">
          Your Akashic Record has been located based on your Palm Mandala.
          To break the seal and download your <span className="text-gold">Full Comprehensive Akashic Decoding</span>,
          a sacred exchange (Dakshina) is required.
        </p>
      </div>

      {/* Call to Action */}
      <button
        onClick={onInitiate}
        className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-4 px-12 rounded-full text-lg tracking-widest transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
      >
        INITIATE THE REVEAL — $49
      </button>

      {/* Premium Upsell */}
      <div className="mt-8">
        <p className="text-[10px] tracking-[0.2em] text-cyan-400/80 uppercase">
          {isPremium
            ? 'Premium Discount Applied'
            : 'Premium Members save 20% on all Akashic Deep Readings.'}
        </p>
      </div>
    </div>
  );
};

export default AkashicReveal;
