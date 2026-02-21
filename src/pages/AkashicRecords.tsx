import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AkashicReveal from '@/components/vedic/AkashicReveal';
import AkashicSiddhaReading from '@/components/vedic/AkashicSiddhaReading';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';

/** Full-page Akashic Decoder — linked from palm (Multi-Planetary: Ketu + Saturn). */
const AkashicRecords: React.FC = () => {
  const navigate = useNavigate();
  const { reading } = useAIVedicReading();
  const { user } = useAuth();
  const { isPremium } = useMembership();
  const { hasAccess, isLoading: akashicLoading } = useAkashicAccess(user?.id);
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const userHouse = 12; // Default Ketu house when no reading
  const userName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Soul';

  // Admin redirect: skip this gate page entirely (only after admin check completes)
  useEffect(() => {
    if (!adminLoading && isAdmin) {
      navigate('/akashic-reading/full', { replace: true });
    }
  }, [isAdmin, adminLoading, navigate]);

  // Redirect users with access to full reading (only after access check completes)
  useEffect(() => {
    if (!akashicLoading && hasAccess && !isAdmin) {
      navigate('/akashic-reading/full', { replace: true });
    }
  }, [hasAccess, akashicLoading, isAdmin, navigate]);

  const showTeaser = !akashicLoading && !hasAccess && !isAdmin;

  const handleInitiateReveal = () => {
    navigate('/membership?product=akashic');
  };

  // Wait for access check before rendering — prevents redirect loop
  if (akashicLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
        <p className="mt-4 text-[#D4AF37]/70 text-xs uppercase tracking-widest">Consulting the Akashic Field...</p>
      </div>
    );
  }

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
          <AkashicReveal isPremium={!!isPremium} onInitiate={handleInitiateReveal} />
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
