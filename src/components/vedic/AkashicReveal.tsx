import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const AkashicReveal = ({ isPremium, onInitiate }: { isPremium: boolean; onInitiate: () => void }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
        <div className="flex flex-col items-center animate-pulse">
          <Sparkles className="w-16 h-16 mb-6 text-cyan-400" />
          <p className="tracking-[0.4em] text-xs uppercase text-cyan-400">
            Consulting the Akashic Field...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 animate-in fade-in duration-700">
      <div className="w-full max-w-3xl border border-yellow-900/40 bg-zinc-950 p-12 rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,1)]">
        <Sparkles className="w-8 h-8 mx-auto mb-8 text-cyan-400" />

        <h1 className="text-3xl tracking-[0.5em] text-gold uppercase mb-4">
          Strength of Soul
        </h1>

        <p className="text-neutral-500 italic mb-12 tracking-widest text-sm">
          FULL COMPREHENSIVE AKASHIC DECODING
        </p>

        <div className="space-y-6 mb-12">
          <p className="text-neutral-300 text-xs uppercase tracking-[0.2em] leading-relaxed max-w-lg mx-auto">
            The seals of your Palm Mandala have been successfully decoded.
            Your full spiritual manuscript is now prepared for transmission.
          </p>
        </div>

        <button
          onClick={onInitiate}
          className="w-full max-w-md bg-cyan-400 hover:bg-cyan-300 text-black font-black py-5 rounded-full text-lg tracking-[0.2em] transition-all transform hover:scale-105 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
        >
          INITIATE THE REVEAL — $49
        </button>

        <p className="mt-8 text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
          {isPremium ? 'Premium Discount Applied' : 'Universal Premium Membership includes all Deep Decodings'}
        </p>
      </div>
    </div>
  );
};

export default AkashicReveal;
