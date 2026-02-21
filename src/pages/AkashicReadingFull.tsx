import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AkashicSiddhaReading from '@/components/vedic/AkashicSiddhaReading';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useAuth } from '@/hooks/useAuth';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { supabase } from '@/integrations/supabase/client';

const AKASHIC_RECORDS: Record<number, { title: string; remedy: string }> = {
  1: { title: 'The Sovereign Atma', remedy: 'Sun Mantra' },
  4: { title: 'The Heart Guardian', remedy: 'Moon Mantra' },
  9: { title: 'The Vedic Scholar', remedy: 'Jupiter Mantra' },
  12: { title: 'The Himalayan Mystic', remedy: 'Ketu Mantra' },
};

const DEFAULT_RECORD = { title: 'The Wandering Gandharva', remedy: 'Saraswati Mantra' };

/** Full 15-page manuscript after purchase — Deep Siddha Logic + Certificate of Origin PDF. */
const AkashicReadingFull: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reading } = useAIVedicReading();
  const { hasAccess, isLoading } = useAkashicAccess(user?.id);
  const userHouse = 12;
  const userName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Soul';
  const emailSentRef = useRef(false);
  const record = AKASHIC_RECORDS[userHouse] || DEFAULT_RECORD;

  // Save to My Records for permanent access (idempotent)
  useEffect(() => {
    if (!user?.id || !hasAccess) return;
    const saveRecord = async () => {
      const { error } = await (supabase as any).from('akashic_readings').upsert(
        {
          user_id: user.id,
          user_house: userHouse,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );
      if (error) console.warn('Could not save Akashic record:', error);
    };
    saveRecord();
  }, [user?.id, hasAccess, userHouse]);

  // Trigger purchase confirmation email (once per session when coming from initiating)
  useEffect(() => {
    if (!user?.email || !hasAccess || emailSentRef.current) return;
    const fromInitiating = sessionStorage.getItem('akashic_from_initiating') === '1';
    if (!fromInitiating) return;
    sessionStorage.removeItem('akashic_from_initiating');
    emailSentRef.current = true;
    supabase.functions.invoke('send-akashic-purchase-email', {
      body: {
        userEmail: user.email,
        userName,
        remedy: record.remedy,
        archetype: record.title,
        appOrigin: window.location.origin,
      },
    }).catch((e) => console.warn('Could not send Akashic email:', e));
  }, [user?.email, userName, hasAccess, record.remedy, record.title]);

  // If no access, redirect to gate (only after loading completes)
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate('/akashic-records', { replace: true });
    }
  }, [hasAccess, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
      </div>
    );
  }
  if (!hasAccess) return null;

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
        <h1 className="text-lg font-serif font-semibold tracking-wide">Your Akashic Record</h1>
      </div>
      <div className="p-4 pb-24">
        <AkashicSiddhaReading
          userHouse={userHouse}
          vedicReading={reading}
          isModal={false}
          hasDeepReadingAccess={true}
          showCertificateDownload={true}
          userName={userName}
        />
      </div>
    </div>
  );
};

export default AkashicReadingFull;
