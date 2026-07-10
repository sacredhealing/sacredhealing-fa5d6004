import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ConfirmStatus = 'checking' | 'ready' | 'confirming' | 'done' | 'error';

const PairConfirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<ConfirmStatus>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus('error');
      setErrorMsg('This link is missing a code. Please scan the QR code again.');
      return;
    }
    if (!isAuthenticated) {
      // Send them to sign in first, then bounce back here to finish pairing.
      navigate(`/auth?redirect=${encodeURIComponent(`/pair?token=${token}`)}`);
      return;
    }
    setStatus('ready');
  }, [authLoading, isAuthenticated, token, navigate]);

  const approve = async () => {
    if (!token) return;
    setStatus('confirming');

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setStatus('error');
      setErrorMsg('Your session expired. Please sign in again and rescan the code.');
      return;
    }

    const { data, error } = await supabase.functions.invoke('qr-pairing', {
      body: { action: 'confirm', token },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (error || data?.error) {
      setStatus('error');
      setErrorMsg(data?.error || 'Could not approve sign-in. Please try again.');
      return;
    }

    setStatus('done');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505] px-6 py-12">
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#D4AF3715_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        {(status === 'checking' || authLoading) && (
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mx-auto" />
        )}

        {status === 'ready' && (
          <>
            <ShieldCheck className="w-12 h-12 text-[#D4AF37] mx-auto mb-5" />
            <h1 className="text-white font-[300] italic text-[1.6rem] leading-tight mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Sign in on your other screen?
            </h1>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              Someone scanned this code to sign in on another device using your account. Only approve this if it was you.
            </p>
            <button
              type="button"
              onClick={approve}
              className="w-full py-4 rounded-full bg-[#D4AF37] text-black font-black text-xs tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.3)] mb-3"
            >
              Yes, Sign Me In
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 text-white/40 text-[10px] font-extrabold tracking-[0.3em] uppercase"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Not Me — Cancel
            </button>
          </>
        )}

        {status === 'confirming' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mx-auto mb-4" />
            <p className="text-white/60 text-sm">Approving…</p>
          </>
        )}

        {status === 'done' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-[#D4AF37] mx-auto mb-5" />
            <h1 className="text-white font-[300] italic text-[1.6rem] mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              You're signed in
            </h1>
            <p className="text-white/50 text-sm">Your other screen should sign in automatically now. You can close this tab.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-white/40 mx-auto mb-5" />
            <h1 className="text-white font-[300] italic text-[1.6rem] mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Something went wrong
            </h1>
            <p className="text-white/50 text-sm">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PairConfirm;
