import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type PairStatus = 'loading' | 'pending' | 'confirmed' | 'expired' | 'error';

const POLL_INTERVAL_MS = 2500;
const TOKEN_LIFETIME_MS = 5 * 60 * 1000;

const QRSignIn: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<PairStatus>('loading');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const expiryTimeoutRef = useRef<number | null>(null);

  // Already signed in on this device — nothing to pair.
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const stopPolling = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (expiryTimeoutRef.current) window.clearTimeout(expiryTimeoutRef.current);
  };

  const completeSignIn = useCallback(async (token: string) => {
    const { data, error } = await supabase.functions.invoke('qr-pairing', {
      body: { action: 'consume', token },
    });
    if (error || !data?.token_hash) {
      setStatus('error');
      setErrorMsg('Could not complete sign-in. Please try again.');
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: 'magiclink',
    });

    if (verifyError) {
      setStatus('error');
      setErrorMsg('Could not complete sign-in. Please try again.');
      return;
    }

    navigate('/dashboard');
  }, [navigate]);

  const createToken = useCallback(async () => {
    stopPolling();
    setStatus('loading');
    setErrorMsg('');

    const { data, error } = await supabase.functions.invoke('qr-pairing', {
      body: { action: 'create' },
    });

    if (error || !data?.token) {
      setStatus('error');
      setErrorMsg('Could not generate a QR code right now. Please try again.');
      return;
    }

    tokenRef.current = data.token;
    setStatus('pending');

    const pairUrl = `${window.location.origin}/pair?token=${data.token}`;
    const dataUrl = await QRCode.toDataURL(pairUrl, {
      width: 320,
      margin: 1,
      color: { dark: '#0A0806', light: '#FFFFFF' },
    });
    setQrDataUrl(dataUrl);

    pollRef.current = window.setInterval(async () => {
      if (!tokenRef.current) return;
      const { data: statusData } = await supabase.functions.invoke('qr-pairing', {
        body: { action: 'status', token: tokenRef.current },
      });
      if (statusData?.status === 'confirmed') {
        stopPolling();
        setStatus('confirmed');
        completeSignIn(tokenRef.current);
      } else if (statusData?.status === 'expired') {
        stopPolling();
        setStatus('expired');
      }
    }, POLL_INTERVAL_MS);

    expiryTimeoutRef.current = window.setTimeout(() => {
      stopPolling();
      setStatus((current) => (current === 'pending' ? 'expired' : current));
    }, TOKEN_LIFETIME_MS);
  }, [completeSignIn]);

  useEffect(() => {
    createToken();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#050505] px-6 py-12 overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#D4AF3715_0%,_transparent_70%)]" />
      </div>

      <button
        type="button"
        onClick={() => navigate('/auth')}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/40 hover:text-[#D4AF37] text-[10px] font-extrabold tracking-[0.3em] uppercase transition-colors"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="relative z-10 w-full max-w-sm text-center">
        <p className="text-[#D4AF37]/60 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          ◈ Sign In With QR Code
        </p>
        <h1 className="text-white font-[300] italic text-[1.8rem] leading-tight mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Scan with your phone
        </h1>

        <div className="relative w-[240px] h-[240px] mx-auto mb-6 rounded-[28px] bg-white p-3 flex items-center justify-center overflow-hidden">
          {status === 'loading' && <Loader2 className="w-8 h-8 animate-spin text-[#0A0806]" />}

          {status === 'pending' && qrDataUrl && (
            <img src={qrDataUrl} alt="Scan to sign in" className="w-full h-full object-contain" />
          )}

          {status === 'confirmed' && (
            <div className="flex flex-col items-center gap-2 text-[#0A0806]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-semibold">Signing you in…</p>
            </div>
          )}

          {(status === 'expired' || status === 'error') && (
            <div className="flex flex-col items-center gap-3 text-[#0A0806] px-4">
              <p className="text-xs font-semibold text-center">
                {status === 'expired' ? 'This code expired.' : errorMsg}
              </p>
              <button
                type="button"
                onClick={createToken}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full bg-[#0A0806] text-white"
              >
                <RefreshCw size={14} /> New Code
              </button>
            </div>
          )}
        </div>

        <p className="text-white/50 text-sm leading-relaxed mb-2">
          Open your phone's camera and point it at this code. If you're already signed in there, this screen signs in automatically.
        </p>
        <p className="text-white/30 text-xs">Code refreshes automatically every 5 minutes.</p>

        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="mt-8 text-[#D4AF37]/70 hover:text-[#D4AF37] text-[10px] font-extrabold tracking-[0.3em] uppercase transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Use email instead
        </button>
      </div>
    </div>
  );
};

export default QRSignIn;
