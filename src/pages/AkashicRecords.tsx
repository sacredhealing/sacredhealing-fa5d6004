import React from 'react';
import { useNavigate } from 'react-router-dom';
import AkashicSiddhaReading from '@/components/vedic/AkashicSiddhaReading';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

/** Full-page Akashic Decoder — linked from palm (Multi-Planetary: Ketu + Saturn). */
const AkashicRecords: React.FC = () => {
  const navigate = useNavigate();
  const { reading } = useAIVedicReading();
  const { user } = useAuth();
  const { isPremium } = useMembership();
  const { hasAccess } = useAkashicAccess();
  const userHouse = 12; // Default Ketu house when no reading
  const userName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Soul';

  const showTeaser = !hasAccess;

  const handleInitiateReveal = () => {
    navigate('/membership?product=akashic');
  };

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
        {showTeaser ? (
          /* Strength of Soul — Blurred Teaser + Gate */
          <div className="max-w-lg mx-auto pt-6" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            {/* Blurred Teaser Card */}
            <div className="relative rounded-2xl border-2 border-[#D4AF37]/30 bg-gradient-to-b from-amber-950/40 via-[#0d0a06] to-amber-950/20 overflow-hidden mb-6">
              <div className="absolute inset-0 backdrop-blur-xl bg-[#0a0a0a]/80 z-10 flex items-center justify-center">
                <div className="text-center px-6">
                  <Sparkles className="w-12 h-12 text-[#D4AF37]/60 mx-auto mb-3" />
                  <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em]">Strength of Soul</p>
                  <p className="text-white/70 text-sm mt-2 italic">Your manuscript awaits</p>
                </div>
              </div>
              <div className="p-8 blur-sm select-none pointer-events-none">
                <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">Secret Manuscript</p>
                <h3 className="text-xl text-white mt-2">The Sovereign Atma</h3>
                <p className="text-white/60 mt-1 italic">Ancient Aryavarta</p>
                <p className="text-white/50 mt-4 text-sm leading-relaxed">
                  You were a sovereign ruler in Ancient Aryavarta. The Akashic Origin, Siddha Mastery, Shadow of Saturn, Transmutation Path, and Year of Karmic Climax — all contained within your 15-page Soul Manuscript.
                </p>
              </div>
            </div>

            <p className="text-white/90 text-sm leading-relaxed mb-6 text-center">
              Your Akashic Record has been located based on your Palm Mandala. To break the seal and download your 15-page Soul Manuscript, a sacred exchange (Dakshina) is required.
            </p>

            <Button
              onClick={handleInitiateReveal}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-bold text-base uppercase tracking-wider hover:opacity-95 transition-opacity shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
            >
              Initiate the Reveal — $49
            </Button>

            <p className="text-center text-[#D4AF37]/80 text-xs mt-4">
              Premium Members save 20% on all Akashic Deep Readings.
            </p>
          </div>
        ) : (
          <AkashicSiddhaReading
            userHouse={userHouse}
            vedicReading={reading}
            isModal={false}
            hasDeepReadingAccess={true}
            showCertificateDownload={true}
            userName={userName}
          />
        )}
      </div>
    </div>
  );
};

export default AkashicRecords;
