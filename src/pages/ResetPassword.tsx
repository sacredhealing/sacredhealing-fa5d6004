import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * ResetPassword — handles Supabase password recovery flow.
 *
 * Supabase sends a recovery email with a link like:
 *   https://siddhaquantumnexus.com/reset-password?code=XXXX   (PKCE / newer flow)
 *   https://siddhaquantumnexus.com/reset-password#type=recovery&access_token=... (legacy)
 *
 * For the PKCE flow Supabase JS v2 automatically exchanges the ?code= param
 * and fires the PASSWORD_RECOVERY auth event. We listen for that + also accept
 * the legacy hash so both flows work.
 *
 * Critical: we call supabase.auth.exchangeCodeForSession() if ?code= is present
 * so the session is established before updateUser() is called.
 */
const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isExchanging, setIsExchanging] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. PKCE flow — ?code= in URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          const { error: exchError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchError) {
            if (mounted) setError('This reset link is invalid or has expired. Please request a new one.');
          } else {
            if (mounted) { setIsReady(true); setIsExchanging(false); }
          }
        } catch {
          if (mounted) setError('Something went wrong. Please request a new reset link.');
        }
        return;
      }

      // 2. Legacy hash flow — #type=recovery
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        if (mounted) { setIsReady(true); setIsExchanging(false); }
        return;
      }

      // 3. Listen for PASSWORD_RECOVERY event (Supabase fires this after redirect)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' && mounted) {
          setIsReady(true);
          setIsExchanging(false);
        }
      });

      // Give the auth state listener 3s to fire before showing error
      const timeout = setTimeout(() => {
        if (mounted && !isReady) {
          setIsExchanging(false);
          setError('This reset link is invalid or has expired. Please request a new one.');
        }
      }, 3000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    };

    init();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Both fields must be identical.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        toast({ title: 'Error', description: updateError.message, variant: 'destructive' });
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/auth'), 2500);
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── States ──────────────────────────────────────────────

  if (isExchanging) {
    return (
      <div style={styles.page}>
        <Loader2 style={{ width: 40, height: 40, color: '#D4AF37', animation: 'spin 1s linear infinite' }} />
        <p style={styles.subText}>Verifying your reset link…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.page}>
        <CheckCircle style={{ width: 52, height: 52, color: '#4ade80', marginBottom: 16 }} />
        <h1 style={styles.title}>Password Updated</h1>
        <p style={styles.subText}>Redirecting you to login…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <LotusIcon size={56} />
        <h1 style={{ ...styles.title, marginTop: 20 }}>Link Expired</h1>
        <p style={{ ...styles.subText, marginBottom: 28 }}>{error}</p>
        <button style={styles.goldBtn} onClick={() => navigate('/auth')}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* BG glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'rgba(212,175,55,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 360, height: 360, background: 'rgba(212,175,55,0.04)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LotusIcon size={52} />
          <h1 style={styles.title}>Set New Password</h1>
          <p style={styles.subText}>Choose a strong password for your sacred account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldWrap}>
            <Lock size={16} style={styles.fieldIcon} />
            <Input
              type="password"
              placeholder="New password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              className="auth-input"
            />
          </div>

          <div style={{ ...styles.fieldWrap, marginBottom: 28 }}>
            <Lock size={16} style={styles.fieldIcon} />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              className="auth-input"
            />
          </div>

          <button type="submit" style={styles.goldBtn} disabled={isSubmitting}>
            {isSubmitting
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              : <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  Reset Password <ArrowRight size={16} />
                </span>
            }
          </button>
        </form>

        <button
          onClick={() => navigate('/auth')}
          style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Back to login
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-input { background: rgba(255,255,255,0.03) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 100px !important; color: white !important; padding-left: 48px !important; height: 52px !important; font-size: 14px !important; }
        .auth-input:focus { border-color: rgba(212,175,55,0.5) !important; box-shadow: 0 0 20px rgba(212,175,55,0.1) !important; outline: none !important; }
        .auth-input::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#050505',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: '40px 32px',
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: '#D4AF37',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center' as const,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  fieldWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  fieldIcon: {
    position: 'absolute',
    left: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.25)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
  },
  goldBtn: {
    width: '100%',
    background: '#D4AF37',
    color: '#050505',
    border: 'none',
    borderRadius: 100,
    padding: '15px 24px',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    boxShadow: '0 0 30px rgba(212,175,55,0.25)',
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  },
};

export default ResetPassword;
