import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Checkout from '@/components/Checkout';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';

/** Post-purchase transition: Breaking the Seal animation → redirect to full manuscript. */
const AkashicReadingInitiating: React.FC = () => {
  const navigate = useNavigate();
  const { setAccess } = useAkashicAccess();

  useEffect(() => {
    setAccess();
    try { sessionStorage.setItem('akashic_from_initiating', '1'); } catch {}
  }, [setAccess]);

  const handleComplete = () => {
    navigate('/akashic-reading/full', { replace: true });
  };

  return <Checkout onComplete={handleComplete} durationMs={3500} />;
};

export default AkashicReadingInitiating;
