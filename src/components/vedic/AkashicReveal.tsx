import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface AkashicRevealProps {
  isPremium: boolean;
  discountedPrice: number;
  onStripeCheckout: () => void | Promise<void>;
  onCryptoClick: () => void;
}

const AkashicReveal = ({ isPremium, discountedPrice, onStripeCheckout, onCryptoClick }: AkashicRevealProps) => {
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

        <div className="space-y-4">
          {isPremium && (
            <div className="inline-block px-4 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-sm">
              ✨ Premium Member — 20% Discount Applied
            </div>
          )}
          {isPremium && (
            <p className="text-white/50 line-through text-lg">$49.00</p>
          )}
          <button
            onClick={onStripeCheckout}
            className="w-full max-w-md mx-auto block px-8 py-5 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black font-bold rounded-full text-lg uppercase tracking-widest hover:opacity-90 transition"
          >
            INITIATE THE REVEAL — ${discountedPrice.toFixed(2)}
          </button>
          <button
            onClick={onCryptoClick}
            className="w-full max-w-md mx-auto block px-8 py-4 border border-[#D4AF37]/50 text-[#D4AF37] font-semibold rounded-full text-base uppercase tracking-wider hover:bg-[#D4AF37]/10 transition"
          >
            PAY WITH CRYPTO — ${discountedPrice.toFixed(2)}
          </button>
        </div>

        <p className="mt-8 text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
          {isPremium ? 'Premium Discount Applied' : 'Universal Premium Membership includes all Deep Decodings'}
        </p>
      </div>
    </div>
  );
};

export default AkashicReveal;
