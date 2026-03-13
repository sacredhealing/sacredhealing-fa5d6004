import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { getTierRank } from '@/lib/tierAccess';

interface AkashicRevealProps {
  tier?: string | null;
  isPremium: boolean;
  discountedPrice: number;
  onStripeCheckout: () => void | Promise<void>;
  onCryptoClick: () => void;
  onAkashaInfinityClick?: () => void;
}

function getTierLabel(tier: string | undefined | null): string {
  const rank = getTierRank(tier);
  if (rank >= 2) return 'Siddha Quantum members';
  if (rank >= 1) return 'Prana Flow members';
  return '';
}

const AkashicReveal = ({ tier, isPremium, discountedPrice, onStripeCheckout, onCryptoClick, onAkashaInfinityClick }: AkashicRevealProps) => {
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

  const tierLabel = getTierLabel(tier);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-3 sm:px-4 py-6 animate-in fade-in duration-700">
      <div className="w-full max-w-[min(100%,22rem)] sm:max-w-md border border-yellow-900/40 bg-zinc-950 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,1)]">
        <Sparkles className="w-8 h-8 mx-auto mb-6 text-cyan-400" />

        <h1 className="text-2xl sm:text-3xl tracking-[0.3em] sm:tracking-[0.5em] text-gold uppercase mb-3">
          Strength of Soul
        </h1>

        <p className="text-neutral-500 italic mb-8 tracking-widest text-xs sm:text-sm">
          FULL COMPREHENSIVE AKASHIC DECODING
        </p>

        <div className="space-y-4 mb-8">
          <p className="text-neutral-300 text-xs uppercase tracking-[0.2em] leading-relaxed max-w-lg mx-auto">
            The seals of your Palm Mandala have been successfully decoded.
            Your full spiritual manuscript is now prepared for transmission.
          </p>
        </div>

        <div className="space-y-4">
          {isPremium && tierLabel && (
            <div className="inline-block px-4 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-sm">
              ✨ {tierLabel} — 20% Discount Applied
            </div>
          )}
          {isPremium && (
            <p className="text-white/50 line-through text-lg">€49.00</p>
          )}
          <button
            onClick={onStripeCheckout}
            className="w-full max-w-md mx-auto block px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black font-bold rounded-full text-base sm:text-lg uppercase tracking-widest hover:opacity-90 transition"
          >
            INITIATE THE REVEAL — €{discountedPrice.toFixed(2)}
          </button>
          <button
            onClick={onCryptoClick}
            className="w-full max-w-md mx-auto block px-6 sm:px-8 py-3 sm:py-4 border border-[#D4AF37]/50 text-[#D4AF37] font-semibold rounded-full text-sm sm:text-base uppercase tracking-wider hover:bg-[#D4AF37]/10 transition"
          >
            PAY WITH CRYPTO — €{discountedPrice.toFixed(2)}
          </button>
          {onAkashaInfinityClick && (
            <button
              onClick={onAkashaInfinityClick}
              className="w-full max-w-md mx-auto block px-6 sm:px-8 py-3 border border-cyan-500/40 text-cyan-400 font-semibold rounded-full text-sm uppercase tracking-wider hover:bg-cyan-500/10 transition"
            >
              OR GET FULL ACCESS — Akasha Infinity ∞
            </button>
          )}
        </div>

        <p className="mt-6 text-[10px] tracking-[0.2em] sm:tracking-[0.3em] text-cyan-400 uppercase">
          {isPremium && tierLabel
            ? `${tierLabel} — 20% Discount Applied`
            : 'Prana Flow or Siddha Quantum members get 20% off — Akasha Infinity includes full access'}
        </p>
      </div>
    </div>
  );
};

export default AkashicReveal;
