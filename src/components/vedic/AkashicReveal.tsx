import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const AkashicReveal = ({ isPremium, onInitiate }: { isPremium: boolean; onInitiate: () => void }) => {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('ready');
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gold">
        <div className="flex flex-col items-center animate-pulse">
          <Sparkles className="w-12 h-12 mb-4 text-cyan-400" />
          <p className="tracking-[0.3em] text-sm uppercase text-cyan-400">Consulting the Akashic Field...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 text-center animate-in fade-in duration-1000">
      {/* The Full Comprehensive Header */}
      <div className="w-full max-w-2xl border border-yellow-900/30 bg-neutral-900/20 p-16 rounded-3xl mb-8 shadow-2xl">
        <Sparkles className="w-10 h-10 mx-auto mb-6 text-cyan-400" />
        <h2 className="text-2xl tracking-[0.4em] text-gold uppercase mb-4">Strength of Soul</h2>
        <p className="italic text-neutral-400 text-md">Your Full Comprehensive Manuscript is Prepared</p>
      </div>

      <div className="max-w-xl space-y-8 mb-10">
        <p className="text-neutral-300 uppercase tracking-[0.15em] text-xs leading-loose">
          The seals of your Palm Mandala have been decoded.
          To access the <span className="text-gold font-bold">Full Comprehensive Akashic Manuscript</span>,
          a sacred exchange is required to ground the energy.
        </p>
      </div>

      {/* The Action */}
      <button
        onClick={onInitiate}
        className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold py-5 px-16 rounded-full text-xl tracking-widest transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
      >
        INITIATE THE REVEAL — $49
      </button>

      <p className="mt-8 text-[10px] tracking-[0.2em] text-cyan-400 uppercase opacity-70">
        {isPremium ? 'Premium Discount Applied' : 'Premium Members receive instant access to all Deep Decodings.'}
      </p>
    </div>
  );
};

export default AkashicReveal;
