import React, { useState } from 'react';
import { Eye, EyeOff, Key, Loader2, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const G = '#D4AF37';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // tab: 'change' | 'reset'
  const [tab, setTab] = useState<'change' | 'reset'>('change');

  // Change password state
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);
  const [changed, setChanged] = useState(false);

  // Forgot / send reset state
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setNewPw(''); setConfirmPw(''); setChanged(false); setSent(false);
    onOpenChange(false);
  };

  /* ── Change password (user already logged in) ─────────────── */
  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast({ title: 'Password too short', description: 'Minimum 8 characters.', variant: 'destructive' }); return;
    }
    if (newPw !== confirmPw) {
      toast({ title: 'Passwords do not match', description: 'Both fields must match.', variant: 'destructive' }); return;
    }
    setChanging(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChanging(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setChanged(true);
      setTimeout(handleClose, 2200);
    }
  };

  /* ── Send reset email ──────────────────────────────────────── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Enter your email', description: 'Email field is empty.', variant: 'destructive' }); return;
    }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 100, padding: '14px 48px 14px 18px',
    color: '#fff', fontSize: 14, outline: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: 'border-color .2s, box-shadow .2s',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,.55)' }}
      onClick={handleClose}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0a0a0a', border: '1px solid rgba(212,175,55,.18)', borderRadius: 32, padding: '36px 28px', position: 'relative', boxShadow: '0 0 60px rgba(212,175,55,.1), 0 24px 60px rgba(0,0,0,.7)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Key size={22} color={G} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.03em', color: G, margin: 0 }}>Sovereign Access</h2>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', margin: '6px 0 0', fontFamily: "'Montserrat', sans-serif" }}>
            Password Management
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', borderRadius: 100, padding: 4, marginBottom: 28 }}>
          {(['change', 'reset'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif", transition: 'all .2s',
                background: tab === t ? G : 'transparent',
                color: tab === t ? '#050505' : 'rgba(255,255,255,.4)',
                boxShadow: tab === t ? '0 0 20px rgba(212,175,55,.3)' : 'none',
              }}>
              {t === 'change' ? 'Change' : 'Forgot?'}
            </button>
          ))}
        </div>

        {/* Change Password tab */}
        {tab === 'change' && (
          changed ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 14px' }} />
              <p style={{ fontWeight: 900, fontSize: 18, color: '#4ade80' }}>Password Updated</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 6 }}>Your sacred access has been refreshed.</p>
            </div>
          ) : (
            <form onSubmit={handleChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', display: 'block', marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>New Password</label>
                <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  style={inputStyle} placeholder="Min. 8 characters" autoComplete="new-password"
                  onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,.5)'; e.target.style.boxShadow = '0 0 16px rgba(212,175,55,.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.1)'; e.target.style.boxShadow = 'none'; }} />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  style={{ position: 'absolute', right: 16, bottom: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.3)' }}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', display: 'block', marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>Confirm Password</label>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  style={{ ...inputStyle, borderColor: confirmPw && confirmPw !== newPw ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.1)' }}
                  placeholder="Repeat new password" autoComplete="new-password"
                  onFocus={e => { if (!confirmPw || confirmPw === newPw) { e.target.style.borderColor = 'rgba(212,175,55,.5)'; e.target.style.boxShadow = '0 0 16px rgba(212,175,55,.1)'; } }}
                  onBlur={e => { e.target.style.borderColor = confirmPw && confirmPw !== newPw ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.1)'; e.target.style.boxShadow = 'none'; }} />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: 16, bottom: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.3)' }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength hint */}
              {newPw.length > 0 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: newPw.length >= i * 3 ? (i <= 2 ? '#ef4444' : i === 3 ? '#f59e0b' : '#4ade80') : 'rgba(255,255,255,.08)', transition: 'background .3s' }} />
                  ))}
                </div>
              )}

              <button type="submit" disabled={changing}
                style={{ width: '100%', marginTop: 8, padding: '15px', borderRadius: 100, background: G, color: '#050505', border: 'none', fontWeight: 900, fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase', cursor: changing ? 'not-allowed' : 'pointer', opacity: changing ? .7 : 1, boxShadow: '0 0 28px rgba(212,175,55,.3)', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {changing ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</> : '⚡ Update Password'}
              </button>
            </form>
          )
        )}

        {/* Forgot / Reset tab */}
        {tab === 'reset' && (
          sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 14px' }} />
              <p style={{ fontWeight: 900, fontSize: 18, color: '#4ade80' }}>Reset Link Sent</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginTop: 6, lineHeight: 1.7 }}>
                Check your inbox at <strong style={{ color: G }}>{resetEmail}</strong> and click the link to set a new password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, margin: 0 }}>
                Enter your email and we'll send you a secure reset link.
              </p>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', display: 'block', marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>Email Address</label>
                <Mail size={15} style={{ position: 'absolute', left: 16, bottom: 15, color: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} />
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 42 }}
                  placeholder="your@email.com" autoComplete="email"
                  onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,.5)'; e.target.style.boxShadow = '0 0 16px rgba(212,175,55,.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.1)'; e.target.style.boxShadow = 'none'; }} />
              </div>

              <button type="submit" disabled={sending}
                style={{ width: '100%', marginTop: 4, padding: '15px', borderRadius: 100, background: G, color: '#050505', border: 'none', fontWeight: 900, fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? .7 : 1, boxShadow: '0 0 28px rgba(212,175,55,.3)', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {sending ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : '✉ Send Reset Link'}
              </button>
            </form>
          )
        )}

        {/* Close */}
        <button type="button" onClick={handleClose}
          style={{ display: 'block', width: '100%', marginTop: 20, textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,.22)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '.1em' }}>
          Close
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};
