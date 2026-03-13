import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AkashicReveal from '@/components/vedic/AkashicReveal';
import { AkashicCryptoModal } from '@/components/vedic/AkashicCryptoModal';
import AkashicReadingFull from '@/pages/AkashicReadingFull';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess } from '@/lib/tierAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Full-page Akashic Decoder — linked from palm (Multi-Planetary: Ketu + Saturn). */
const AkashicRecords: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, isPremium } = useMembership();
  const { hasAccess, isLoading } = useAkashicAccess(user?.id);
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const hasAkashaInfinity = hasFeatureAccess(isAdmin, tier, 3);
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);

  const originalPrice = 49;
  const discountedPrice = isPremium ? 39.2 : originalPrice;

  const handleStripeCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-akashic-checkout', {
        body: {
          isPremium,
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Checkout failed. Please try again.');
    }
  };

  // Admin or Akasha Infinity: full access (no €49 purchase required)
  if (!adminLoading && (isAdmin || hasAkashaInfinity)) {
    return <AkashicReadingFull />;
  }

  // Show loading while checking — NEVER redirect or render content until loading is complete
  if (isLoading || adminLoading) {
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
        <AkashicReveal
          tier={tier}
          isPremium={!!isPremium}
          discountedPrice={discountedPrice}
          onStripeCheckout={handleStripeCheckout}
          onCryptoClick={() => setCryptoModalOpen(true)}
          onAkashaInfinityClick={() => navigate('/akasha-infinity')}
        />
        <AkashicCryptoModal
          open={cryptoModalOpen}
          onOpenChange={setCryptoModalOpen}
          amount={discountedPrice}
          userId={user?.id ?? ''}
        />
      </div>
    </div>
  );
};

export default AkashicRecords;
