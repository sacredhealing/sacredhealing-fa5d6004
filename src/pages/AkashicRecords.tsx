import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AkashicReveal from '@/components/vedic/AkashicReveal';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

/** Full-page Akashic Decoder — linked from palm (Multi-Planetary: Ketu + Saturn). */
const AkashicRecords: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useMembership();
  const { hasAccess, isLoading } = useAkashicAccess(user?.id);

  const handleInitiateReveal = () => {
    navigate('/membership?product=akashic');
  };

  // Show loading while checking — NEVER redirect or render content until loading is complete
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
        <p className="mt-4 text-[#D4AF37]/70 text-xs uppercase tracking-widest">Consulting the Akashic Field...</p>
      </div>
    );
  }

  // If user has access (or admin — hook returns true for admins), show CTA to open reading
  // Use Link instead of navigate() to avoid redirect loop from separate hook instances
  if (hasAccess) {
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
        <div className="flex flex-col items-center justify-center gap-6 p-4 min-h-[calc(100vh-120px)]">
          <h2 className="text-2xl font-serif font-bold text-center">Your Akashic Record is Ready</h2>
          <p className="text-white/70 text-center max-w-md">
            Your soul manuscript has been decoded. View your complete 15-page Akashic reading.
          </p>
          <Link
            to="/akashic-reading/full"
            className="px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-full text-lg hover:bg-[#D4AF37]/90 transition"
          >
            Open Your Reading
          </Link>
        </div>
      </div>
    );
  }

  // No access — show gate/purchase content
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
        <AkashicReveal isPremium={!!isPremium} onInitiate={handleInitiateReveal} />
      </div>
    </div>
  );
};

export default AkashicRecords;
