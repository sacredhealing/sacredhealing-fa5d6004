import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';

interface AffiliateProfile {
  affiliate_code: string;
  link_label?: string | null;
  payout_bank_details?: PayoutBankDetails | null;
  total_earnings: number;
  pending_balance: number;
  paid_out: number;
  currency: string;
  stripe_connect_id?: string;
}

interface Commission {
  id: string;
  gross_amount: number;
  commission_amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  source?: string;
  level?: number;
}

interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface ConnectStatus {
  hasAccount: boolean;
  status: 'pending' | 'active' | 'restricted' | null;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  country?: string;
}

interface AffiliateFit {
  verdict: 'strongly_yes' | 'yes' | 'neutral' | 'not_now' | 'no';
  reason: string;
  how: string[];
}

interface AbundanceOracle {
  timing: string;
  investment_guidance: string;
  quick_invest: string;
  long_term_invest: string;
  do_not_invest: string;
  avoid: string;
  mantra: string;
  favorable_sectors: string[];
  dosha_practice: string;
  affiliate_fit: AffiliateFit;
}

type LangCode = 'en' | 'sv' | 'no' | 'es';
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook';

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'facebook', label: 'Facebook', icon: '🌐' },
];

const LANGS: { id: LangCode; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { id: 'no', label: 'Norsk', flag: '🇳🇴' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
];

const COUNTRY_OPTIONS = [
  { code: 'SE', label: '🇸🇪 Sweden' },
  { code: 'NO', label: '🇳🇴 Norway' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'NL', label: '🇳🇱 Netherlands' },
  { code: 'ES', label: '🇪🇸 Spain' },
  { code: 'IT', label: '🇮🇹 Italy' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'CA', label: '🇨🇦 Canada' },
];

interface PayoutBankDetails {
  method_type: 'iban' | 'wise' | 'other';
  account_holder_name: string;
  country: string;
  iban: string;
  bic_swift: string;
  wise_email: string;
  account_number: string;
  bank_name: string;
}

const EMPTY_BANK_FORM: PayoutBankDetails = {
  method_type: 'iban', account_holder_name: '', country: 'SE',
  iban: '', bic_swift: '', wise_email: '', account_number: '', bank_name: '',
};

// Commissions clear this many days after purchase before becoming withdrawable,
// mirroring the refund window. This is a starting default — Kritagya/Laila should
// confirm the exact number and adjust it here.
const PAYOUT_HOLD_DAYS = 14;

const VERDICT_COLOR: Record<AffiliateFit['verdict'], string> = {
  strongly_yes: '#4ade80',
  yes: '#4ade80',
  neutral: '#D4AF37',
  not_now: '#f59e0b',
  no: 'rgba(255,255,255,0.4)',
};
const VERDICT_LABEL: Record<AffiliateFit['verdict'], string> = {
  strongly_yes: 'Strongly Favorable',
  yes: 'Favorable',
  neutral: 'Neutral',
  not_now: 'Not Now',
  no: 'Sit This Out',
};

function formatMoney(amount: number, currency: string, locale: string): string {
  const cur = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}

// ── Accordion primitive — one glowing card, collapsed by default, expands in place ──
const AccordionCard: React.FC<{
  id: string;
  icon: string;
  title: string;
  teaser: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  accent?: string;
  children: React.ReactNode;
}> = ({ icon, title, teaser, open, onToggle, accent = '#D4AF37', children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: `1px solid ${open ? `${accent}55` : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 32,
    overflow: 'hidden',
    boxShadow: open ? `0 0 50px ${accent}18` : 'none',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  }}>
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '1.25rem 1.5rem', color: '#fff',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 14, flexShrink: 0,
        background: `${accent}18`, border: `1px solid ${accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', letterSpacing: '-0.01em', color: '#fff' }}>{title}</p>
        {!open && <div style={{ marginTop: 3 }}>{teaser}</div>}
      </div>
      <span style={{
        color: accent, fontSize: 14, flexShrink: 0, transition: 'transform 0.25s ease',
        transform: open ? 'rotate(180deg)' : 'none',
      }}>▾</span>
    </button>
    {open && (
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        {children}
      </div>
    )}
  </div>
);

const ADMIN_UUIDS = ['bd0b21c9-577a-450b-bb1e-21c9d0423f17', 'a711f099-3d34-456f-8473-8a65eab056d5'];

const AffiliateDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { toast } = useToast();

  const baseUrl = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);
  const localeTag = useMemo(() => {
    const map: Record<string, string> = { en: 'en-GB', sv: 'sv-SE', no: 'nb-NO', es: 'es-ES' };
    return map[language] || 'en-GB';
  }, [language]);

  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('SE');
  const [labelInput, setLabelInput] = useState('');
  const [labelSaving, setLabelSaving] = useState(false);
  const [labelEditing, setLabelEditing] = useState(false);
  const [bankForm, setBankForm] = useState<PayoutBankDetails>(EMPTY_BANK_FORM);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);

  // Accordion state — "link" open by default since sharing is the primary action
  const [openSection, setOpenSection] = useState<string>('link');
  const toggle = (id: string) => setOpenSection(cur => (cur === id ? '' : id));

  // ── Monthly Abundance Reading (Jyotish) ──────────────────────────────────
  // Sourced from the SAME useJyotishProfile hook that powers the Jyotish
  // Chamber itself, so this reflects whatever chart the user already entered
  // there — no separate/duplicate birth-data entry.
  const jyotish = useJyotishProfile();
  const [oracle, setOracle] = useState<AbundanceOracle | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);

  const fetchOracle = useCallback(async () => {
    if (jyotish.isLoading) return;
    if (!jyotish.nakshatra && !jyotish.primaryDosha && !jyotish.mahadasha) return;
    setOracleLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('abundance-oracle', {
        body: {
          moon_nakshatra: jyotish.nakshatra,
          current_dasha: jyotish.mahadasha,
          dosha: jyotish.primaryDosha,
        },
      });
      if (!error && data && !data.error) setOracle(data as AbundanceOracle);
    } catch {
      /* graceful fallback — card just shows the "complete your chart" prompt */
    } finally {
      setOracleLoading(false);
    }
  }, [jyotish.isLoading, jyotish.nakshatra, jyotish.primaryDosha, jyotish.mahadasha]);

  useEffect(() => { fetchOracle(); }, [fetchOracle]);

  const monthLabel = useMemo(
    () => new Date().toLocaleDateString(localeTag, { month: 'long', year: 'numeric' }),
    [localeTag]
  );

  // ── Link name ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile?.link_label) setLabelInput(profile.link_label);
  }, [profile?.link_label]);

  // ── Payout bank details ──────────────────────────────────────────────────
  useEffect(() => {
    const saved = profile?.payout_bank_details;
    if (saved && saved.account_holder_name) {
      setBankForm({ ...EMPTY_BANK_FORM, ...saved });
    }
  }, [profile]);

  const hasPayoutMethod = !!bankForm.account_holder_name && (
    (bankForm.method_type === 'wise' && !!bankForm.wise_email) ||
    (bankForm.method_type === 'iban' && !!bankForm.iban) ||
    (bankForm.method_type === 'other' && !!bankForm.account_number)
  );

  const saveBankDetails = async () => {
    if (!user) return;
    if (!bankForm.account_holder_name.trim()) {
      toast({ title: 'Account holder name required', variant: 'destructive' });
      return;
    }
    if (bankForm.method_type === 'wise' && !bankForm.wise_email.trim()) {
      toast({ title: 'Wise email or tag required', variant: 'destructive' });
      return;
    }
    if (bankForm.method_type === 'iban' && !bankForm.iban.trim()) {
      toast({ title: 'IBAN required', variant: 'destructive' });
      return;
    }
    if (bankForm.method_type === 'other' && !bankForm.account_number.trim()) {
      toast({ title: 'Account details required', variant: 'destructive' });
      return;
    }
    setBankSaving(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .update({ payout_bank_details: bankForm as any })
        .eq('user_id', user.id)
        .select('payout_bank_details');
      if (error) throw error;

      if (!data || data.length === 0) {
        if (!profile?.affiliate_code) throw new Error('No affiliate profile found yet.');
        const { error: upsertError } = await supabase
          .from('affiliate_profiles')
          .upsert({ user_id: user.id, affiliate_code: profile.affiliate_code, payout_bank_details: bankForm as any }, { onConflict: 'user_id' });
        if (upsertError) throw upsertError;
      }

      setBankEditing(false);
      toast({ title: 'Payout details saved' });
    } catch (err) {
      toast({ title: 'Could not save payout details', description: err instanceof Error ? err.message : 'Try again in a moment.', variant: 'destructive' });
    } finally {
      setBankSaving(false);
    }
  };


  const saveLabel = async () => {
    if (!user) return;
    const trimmed = labelInput.trim().slice(0, 40);
    setLabelSaving(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .update({ link_label: trimmed || null })
        .eq('user_id', user.id)
        .select('link_label');
      if (error) throw error;

      // .update() with RLS can silently match 0 rows instead of erroring —
      // fall back to an upsert keyed on user_id so the name always lands.
      if (!data || data.length === 0) {
        if (!profile?.affiliate_code) throw new Error('No affiliate profile found yet.');
        const { error: upsertError } = await supabase
          .from('affiliate_profiles')
          .upsert({ user_id: user.id, affiliate_code: profile.affiliate_code, link_label: trimmed || null }, { onConflict: 'user_id' });
        if (upsertError) throw upsertError;
      }

      setProfile(p => (p ? { ...p, link_label: trimmed || null } : p));
      setLabelEditing(false);
      toast({ title: 'Link name updated' });
    } catch (err) {
      toast({ title: 'Could not save name', description: err instanceof Error ? err.message : 'Try again in a moment.', variant: 'destructive' });
    } finally {
      setLabelSaving(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profRes, commRes, payRes] = await Promise.all([
        supabase.from('affiliate_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('affiliate_commissions').select('*').eq('affiliate_user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('affiliate_payout_requests').select('*').eq('affiliate_user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (profRes.data) setProfile(profRes.data as AffiliateProfile);
      if (commRes.data) setCommissions(commRes.data as Commission[]);
      if (payRes.data) setPayouts(payRes.data as PayoutRequest[]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadConnectStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke('check-stripe-connect-status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.error && res.data) {
        setConnectStatus(res.data as ConnectStatus);
      } else {
        setConnectStatus({ hasAccount: false, status: null, payoutsEnabled: false, detailsSubmitted: false });
      }
    } catch {
      setConnectStatus({ hasAccount: false, status: null, payoutsEnabled: false, detailsSubmitted: false });
    }
  }, [user]);

  useEffect(() => {
    loadData();
    loadConnectStatus();
  }, [loadData, loadConnectStatus]);

  const copyLink = async (link: string, key: string) => {
    let copied = false;
    // Primary: modern Clipboard API (requires secure context + permission)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        copied = true;
      }
    } catch {
      copied = false;
    }
    // Fallback: legacy hidden-textarea + execCommand — works in Android
    // in-app/webview browsers that block the Clipboard API outright.
    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = link;
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, link.length);
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }
    if (copied) {
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(''), 2500);
    } else {
      toast({ title: 'Could not copy', description: 'Press and hold the link to copy it manually.', variant: 'destructive' });
    }
  };

  const buildLink = (platform: Platform, lang: LangCode) =>
    `${baseUrl}/affiliate/r/${profile?.affiliate_code}?platform=${platform}&lang=${lang}`;
  const mainLink = profile ? `${baseUrl}/affiliate/r/${profile.affiliate_code}` : '';

  const handleConnectStripe = async () => {
    if (!user) return;
    setConnectLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { country: bankForm.country || selectedCountry },
      });
      if (error) throw new Error(error.message || 'Connect setup failed');
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      toast({ title: 'Setup failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setConnectLoading(false);
    }
  };

  const requestPayout = async () => {
    if (!user || !profile || !payoutAmount || Number(payoutAmount) <= 0) return;
    const amount = Number(payoutAmount);

    if (amount < 20) {
      toast({ title: 'Minimum €20', description: 'Minimum payout amount is €20.', variant: 'destructive' });
      return;
    }
    if (amount > availableNow) {
      toast({ title: 'Insufficient available balance', description: `Max: ${formatMoney(availableNow, profile.currency || 'EUR', localeTag)} (the rest is still in its ${PAYOUT_HOLD_DAYS}-day hold)`, variant: 'destructive' });
      return;
    }
    if (!hasPayoutMethod) {
      toast({ title: 'Add your payout details first', description: 'Add a bank account, Wise, or other transfer method to receive payouts.', variant: 'destructive' });
      setOpenSection('withdraw');
      return;
    }

    setPayoutLoading(true);
    try {
      const { error } = await supabase.from('affiliate_payout_requests').insert({
        affiliate_user_id: user.id,
        amount,
        currency: profile.currency || 'EUR',
        status: 'requested',
        bank_details: bankForm as any,
      });
      if (error) throw new Error(error.message);
      toast({ title: 'Payout requested ✓', description: 'Your request will be processed within 3-5 business days.' });
      setPayoutAmount('');
      loadData();
    } catch (err) {
      toast({ title: 'Request failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#D4AF37', fontSize: '0.9rem', letterSpacing: '0.2em' }}>Loading Sovereign Abundance Network…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem' }}>
        <div style={glassCard}>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>Sign in to access your Sovereign Abundance Network.</p>
          <button type="button" onClick={() => navigate('/auth')} style={primaryCta}>Sign In</button>
        </div>
      </div>
    );
  }

  const isAdmin = !!user && ADMIN_UUIDS.includes(user.id);
  const cur = profile?.currency || 'EUR';
  const earned = profile?.total_earnings || 0;
  const pending = profile?.pending_balance || 0;
  const paidOut = profile?.paid_out || 0;
  const downlineEarned = commissions.filter((c) => c.level === 2).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const tradingEarned = commissions.filter(c => c.source?.startsWith('trading')).reduce((s, c) => s + Number(c.commission_amount), 0);

  // Estimate how much of the pending balance is still inside the refund-hold
  // window, using the fetched commission history. This is a display estimate
  // only (fetched history is capped at 50 rows) — the true balance is always
  // profile.pending_balance, and every payout is reviewed by an admin before
  // it goes out, so that review is the real enforcement point for the hold.
  const holdCutoff = Date.now() - PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000;
  const recentHold = commissions
    .filter(c => (c.status === 'approved' || c.status === 'pending') && new Date(c.created_at).getTime() > holdCutoff)
    .reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const processingHold = Math.min(recentHold, pending);
  const availableNow = Math.max(0, pending - processingHold);

  const renderConnectBadge = () => {
    if (!connectStatus) return null;
    const isActive = connectStatus.hasAccount && connectStatus.payoutsEnabled;
    const isPending = connectStatus.hasAccount && !connectStatus.payoutsEnabled;
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 100,
        background: isActive ? 'rgba(34,197,94,0.1)' : isPending ? 'rgba(212,175,55,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : isPending ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)'}`,
        fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
        color: isActive ? '#22c55e' : isPending ? '#D4AF37' : '#ef4444',
      }}>
        {isActive ? '✓ BANK CONNECTED' : isPending ? '⟳ SETUP PENDING' : '⚠ NO BANK ACCOUNT'}
      </div>
    );
  };

  const teaserText = (s: string): React.ReactNode => (
    <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{s}</p>
  );

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {user && ADMIN_UUIDS.includes(user.id) && (
        <div style={{ padding: '16px 16px 0', maxWidth: 720, margin: '0 auto' }}>
          <button
            onClick={() => navigate('/admin/delta-arb')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 22, padding: '14px 18px', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
              cursor: 'pointer', textAlign: 'left', color: '#fff',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#D4AF37' }}>Delta-Arb Bot</span>
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', color: '#22D3EE', border: '1px solid rgba(34,211,238,0.4)', borderRadius: 99, padding: '1px 6px' }}>ADMIN</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Live balance & trade feed</div>
            </div>
            <span style={{ color: '#D4AF37', fontSize: 18, fontWeight: 700 }}>→</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '3rem 1.5rem 2rem', background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.12) 0%, transparent 60%)', textAlign: 'center' }}>
        <p style={microLabel}>Sovereign Abundance Network · 2050</p>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #F5E27B, #D4AF37, #A07820)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem', lineHeight: 1.1,
        }}>
          Quantum Abundance Command
        </h1>

        {profile && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: '0.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 100, padding: '8px 20px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Your Code:</span>
              <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>{profile.affiliate_code}</span>
              <button type="button" onClick={() => copyLink(mainLink, 'main')} style={{ background: 'none', border: 'none', color: copiedLink === 'main' ? '#4ade80' : '#D4AF37', cursor: 'pointer', fontSize: '0.75rem' }}>
                {copiedLink === 'main' ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
            {renderConnectBadge()}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.25rem 4rem', display: 'grid', gap: '0.9rem' }}>

        {/* ── Your Sovereign Link ─────────────────────────────────────────── */}
        {profile && (
          <AccordionCard
            id="link" icon="🔗" title="Your Sovereign Link" accent="#D4AF37"
            open={openSection === 'link'} onToggle={() => toggle('link')}
            teaser={teaserText(profile.link_label ? `Shown as "${profile.link_label}"` : 'One link, every platform, every language — tap to view')}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <code style={{ flex: 1, fontSize: '0.78rem', color: '#D4AF37', wordBreak: 'break-all' as const }}>{mainLink}</code>
              <button type="button" onClick={() => copyLink(mainLink, 'master')} style={copyBtn}>{copiedLink === 'master' ? '✓' : 'Copy'}</button>
            </div>

            <div style={{ marginTop: 14 }}>
              {labelEditing ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                  <input
                    value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
                    placeholder="Give your link a name" maxLength={40}
                    style={{ ...inputStyle, flex: 1, minWidth: 160 }}
                  />
                  <button type="button" disabled={labelSaving} onClick={saveLabel} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                    {labelSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => { setLabelEditing(false); setLabelInput(profile.link_label || ''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setLabelEditing(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                  {profile.link_label ? `Shown as "${profile.link_label}" · edit` : 'Give your link a name →'}
                </button>
              )}
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ ...microLabel, marginBottom: 10 }}>Links by Platform &amp; Language</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {PLATFORMS.map((platform) => (
                  <details key={platform.id} style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 16, padding: '10px 14px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{platform.icon}</span> {platform.label}
                    </summary>
                    <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                      {LANGS.map((lang) => {
                        const link = buildLink(platform.id, lang.id);
                        const key = `${platform.id}-${lang.id}`;
                        return (
                          <div key={lang.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.9rem' }}>{lang.flag}</span>
                            <code style={{ flex: 1, color: 'rgba(212,175,55,0.7)', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{link}</code>
                            <button type="button" onClick={() => copyLink(link, key)} style={copyBtn}>{copiedLink === key ? '✓' : 'Copy'}</button>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mainLink)}&bgcolor=050505&color=D4AF37&qzone=1`}
                alt="Your unique signup QR code"
                style={{ width: 100, height: 100, borderRadius: 16, border: '1px solid rgba(212,175,55,0.2)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
                  Screenshot, print, or share — every scan permanently codes the visitor to you.
                </p>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(mainLink)}&bgcolor=050505&color=D4AF37&qzone=1`}
                  download="my-signup-qr-code.png" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 10, color: '#D4AF37', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textDecoration: 'none', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: '8px 14px' }}
                >
                  ⬇ Download QR
                </a>
              </div>
            </div>
          </AccordionCard>
        )}

        {/* ── Quantum Dividends ────────────────────────────────────────────── */}
        <AccordionCard
          id="dividends" icon="◈" title="Quantum Dividends" accent="#D4AF37"
          open={openSection === 'dividends'} onToggle={() => toggle('dividends')}
          teaser={teaserText(`${formatMoney(pending, cur, localeTag)} available to withdraw`)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Earned', value: earned, color: '#D4AF37' },
              { label: 'Pending', value: pending, color: '#22D3EE' },
              { label: 'Paid Out', value: paidOut, color: '#4ade80' },
              { label: 'Downline', value: downlineEarned, color: '#8b5cf6' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '12px', textAlign: 'center' }}>
                <p style={{ ...microLabel, marginBottom: 4, fontSize: 7 }}>{s.label}</p>
                <p style={{ fontSize: '1.05rem', fontWeight: 900, color: s.color, margin: 0 }}>{formatMoney(s.value, cur, localeTag)}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 16, padding: '12px 16px', textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#D4AF37' }}>30%</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginLeft: 8 }}>on every membership, session, and purchase</span>
          </div>

          <p style={{ ...microLabel, marginBottom: 8 }}>Dividend History</p>
          {commissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize: '0.85rem' }}>Your first transmission is on its way. Share your link to activate the flow.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {commissions.slice(0, 8).map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.015)', borderRadius: 14, padding: '10px 14px' }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: 0 }}>
                      {c.source === 'trading_l1' ? '⚡ Trading L1' : c.source === 'trading_l2' ? '🔗 Trading L2' : 'Initiation Dividend'}
                      {c.level === 2 && <span style={{ marginLeft: 6, fontSize: 7, fontWeight: 800, color: '#8b5cf6' }}>DOWNLINE</span>}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', margin: 0 }}>
                      {new Date(c.created_at).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.85rem', margin: 0 }}>
                    +{formatMoney(Number(c.commission_amount), c.currency || cur, localeTag)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </AccordionCard>

        {/* ── Monthly Abundance Reading (Jyotish) ─────────────────────────── */}
        <AccordionCard
          id="reading" icon="✦" title={`${monthLabel} Abundance Reading`} accent="#A855F7"
          open={openSection === 'reading'} onToggle={() => toggle('reading')}
          teaser={teaserText(oracle ? oracle.timing : 'Your personal Jyotish + Ayurveda wealth timing for this month')}
        >
          {oracleLoading ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Reading your chart…</p>
          ) : !oracle ? (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 14 }}>
                Complete your birth chart to unlock a personal wealth-timing reading, refreshed as your planetary period moves.
              </p>
              <button type="button" onClick={() => navigate('/vedic-astrology')} style={secondaryCta}>Complete Your Chart →</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <p style={{ ...microLabel, color: 'rgba(168,85,247,0.7)', marginBottom: 6 }}>Timing</p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{oracle.timing}</p>
              </div>
              <div>
                <p style={{ ...microLabel, color: 'rgba(168,85,247,0.7)', marginBottom: 6 }}>Investment Posture</p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{oracle.investment_guidance}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 14, padding: 12 }}>
                  <p style={{ ...microLabel, color: 'rgba(74,222,128,0.8)', marginBottom: 4, fontSize: 7 }}>Quick Plays Suit You</p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>{oracle.quick_invest}</p>
                </div>
                <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 14, padding: 12 }}>
                  <p style={{ ...microLabel, color: 'rgba(212,175,55,0.8)', marginBottom: 4, fontSize: 7 }}>Long-Term Vehicles</p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>{oracle.long_term_invest}</p>
                </div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: 12 }}>
                <p style={{ ...microLabel, color: 'rgba(239,68,68,0.75)', marginBottom: 4, fontSize: 7 }}>Sit This Out If…</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>{oracle.do_not_invest}</p>
              </div>
              {oracle.favorable_sectors?.length > 0 && (
                <div>
                  <p style={{ ...microLabel, marginBottom: 6 }}>Favorable Sectors</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {oracle.favorable_sectors.map((s) => (
                      <span key={s} style={{ fontSize: '0.72rem', color: '#A855F7', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 100, padding: '4px 12px' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p style={{ ...microLabel, marginBottom: 6 }}>Wealth Mantra</p>
                <p style={{ color: '#D4AF37', fontStyle: 'italic', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{oracle.mantra}</p>
              </div>

              {oracle.affiliate_fit && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${VERDICT_COLOR[oracle.affiliate_fit.verdict]}33`, borderRadius: 16, padding: 14, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ ...microLabel, margin: 0 }}>Affiliate Timing This Month</p>
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', color: VERDICT_COLOR[oracle.affiliate_fit.verdict], border: `1px solid ${VERDICT_COLOR[oracle.affiliate_fit.verdict]}55`, borderRadius: 99, padding: '3px 10px' }}>
                      {VERDICT_LABEL[oracle.affiliate_fit.verdict]}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 8px' }}>{oracle.affiliate_fit.reason}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                    {oracle.affiliate_fit.how.map((step, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', lineHeight: 1.5 }}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </AccordionCard>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <AccordionCard
          id="how" icon="?" title="How Your Dividends Work" accent="#D4AF37"
          open={openSection === 'how'} onToggle={() => toggle('how')}
          teaser={teaserText('5 steps, from your first share to money in your bank')}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              'Share your unique link across any platform in any language.',
              'Seekers land on your personalised, translated landing page.',
              'When they purchase any tier, your affiliate code is permanently encoded.',
              '30% Quantum Dividend lands in your Pending Balance instantly via Stripe webhook.',
              'Connect your bank account via Stripe and request a payout — processed within 3-5 days.',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ minWidth: 26, height: 26, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#D4AF37', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, paddingTop: 4 }}>{step}</p>
              </div>
            ))}
          </div>
        </AccordionCard>

        {/* ── Withdraw ─────────────────────────────────────────────────────── */}
        <AccordionCard
          id="withdraw" icon="💳" title="Withdraw" accent="#4ade80"
          open={openSection === 'withdraw'} onToggle={() => toggle('withdraw')}
          teaser={teaserText(connectStatus?.payoutsEnabled ? `${formatMoney(availableNow, cur, localeTag)} · auto-pays daily` : hasPayoutMethod ? `${formatMoney(availableNow, cur, localeTag)} available now` : 'Connect a payout method to get paid')}
        >
          <div style={{ display: 'grid', gap: 16 }}>

            <div style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 16, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Available Now</span>
                <span style={{ color: '#4ade80', fontWeight: 800 }}>{formatMoney(availableNow, cur, localeTag)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>Processing (within {PAYOUT_HOLD_DAYS}-day window)</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{formatMoney(processingHold, cur, localeTag)}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', lineHeight: 1.5, marginTop: 8, marginBottom: 0 }}>
                New dividends clear {PAYOUT_HOLD_DAYS} days after the purchase, matching our refund window, before they're withdrawable.
              </p>
            </div>

            {/* ── Primary path: Stripe Connect (automatic, no request needed) ── */}
            <div style={{ background: connectStatus?.payoutsEnabled ? 'rgba(34,197,94,0.05)' : 'rgba(212,175,55,0.04)', border: `1px solid ${connectStatus?.payoutsEnabled ? 'rgba(34,197,94,0.25)' : 'rgba(212,175,55,0.2)'}`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ ...microLabel, margin: 0 }}>⚡ Automatic Payouts · Stripe</p>
                {renderConnectBadge()}
              </div>

              {connectStatus?.payoutsEnabled ? (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                  ✓ Connected. Your available balance pays out automatically — no request needed, nothing for you or us to click.
                </p>
              ) : connectStatus?.hasAccount ? (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12 }}>
                    Your Stripe setup is incomplete — finish it to switch on automatic payouts.
                  </p>
                  <button type="button" onClick={handleConnectStripe} disabled={connectLoading} style={primaryCta}>
                    {connectLoading ? 'Opening…' : 'Complete Stripe Setup →'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12 }}>
                    Recommended: connect a bank account via Stripe (~5 min) and your dividends pay out automatically once they clear the {PAYOUT_HOLD_DAYS}-day hold. Available in most countries; not required.
                  </p>
                  <button type="button" onClick={handleConnectStripe} disabled={connectLoading} style={primaryCta}>
                    {connectLoading ? 'Opening Stripe…' : 'Connect Bank via Stripe →'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Fallback path: manual bank details for anyone who can't/won't use Stripe ── */}
            <details style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }} open={!connectStatus?.payoutsEnabled && hasPayoutMethod}>
              <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', fontWeight: 700 }}>
                Can't use Stripe? Add manual bank/Wise details instead
              </summary>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ ...microLabel, margin: 0 }}>Payout Details</p>
                  {hasPayoutMethod && !bankEditing && (
                    <button type="button" onClick={() => setBankEditing(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                  )}
                </div>

                {hasPayoutMethod && !bankEditing ? (
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 12 }}>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', margin: 0 }}>
                      {bankForm.method_type === 'wise' ? '🟢 Wise' : bankForm.method_type === 'iban' ? '🏦 Bank Transfer (IBAN)' : '🏦 Bank Transfer'} · {bankForm.account_holder_name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', margin: '4px 0 0' }}>
                      {bankForm.method_type === 'wise' ? bankForm.wise_email : (bankForm.iban || bankForm.account_number)} · {COUNTRY_OPTIONS.find(c => c.code === bankForm.country)?.label || bankForm.country}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Payout Method</label>
                      <select value={bankForm.method_type} onChange={(e) => setBankForm(f => ({ ...f, method_type: e.target.value as PayoutBankDetails['method_type'] }))} style={inputStyle}>
                        <option value="iban" style={{ background: '#050505' }}>Bank Transfer (IBAN — EU/UK)</option>
                        <option value="wise" style={{ background: '#050505' }}>Wise</option>
                        <option value="other" style={{ background: '#050505' }}>Other Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Account Holder Name</label>
                      <input value={bankForm.account_holder_name} onChange={(e) => setBankForm(f => ({ ...f, account_holder_name: e.target.value }))} placeholder="Full name on the account" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Country</label>
                      <select value={bankForm.country} onChange={(e) => setBankForm(f => ({ ...f, country: e.target.value }))} style={inputStyle}>
                        {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code} style={{ background: '#050505' }}>{c.label}</option>)}
                      </select>
                    </div>

                    {bankForm.method_type === 'wise' ? (
                      <div>
                        <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Wise Email or @wisetag</label>
                        <input value={bankForm.wise_email} onChange={(e) => setBankForm(f => ({ ...f, wise_email: e.target.value }))} placeholder="you@example.com or @yourtag" style={inputStyle} />
                      </div>
                    ) : bankForm.method_type === 'iban' ? (
                      <>
                        <div>
                          <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>IBAN</label>
                          <input value={bankForm.iban} onChange={(e) => setBankForm(f => ({ ...f, iban: e.target.value.toUpperCase() }))} placeholder="BE00 0000 0000 0000" style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>BIC / SWIFT</label>
                          <input value={bankForm.bic_swift} onChange={(e) => setBankForm(f => ({ ...f, bic_swift: e.target.value.toUpperCase() }))} placeholder="e.g. NDEASESS" style={inputStyle} />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Account Number / Routing Details</label>
                        <input value={bankForm.account_number} onChange={(e) => setBankForm(f => ({ ...f, account_number: e.target.value }))} placeholder="Account number, sort code, routing number — whatever your bank needs" style={inputStyle} />
                      </div>
                    )}
                    <div>
                      <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Bank Name (optional)</label>
                      <input value={bankForm.bank_name} onChange={(e) => setBankForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="e.g. Nordea, Swedbank, Wise" style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={saveBankDetails} disabled={bankSaving} style={{ ...primaryCta, opacity: bankSaving ? 0.6 : 1 }}>
                        {bankSaving ? 'Saving…' : 'Save Payout Details'}
                      </button>
                      {hasPayoutMethod && (
                        <button type="button" onClick={() => { setBankEditing(false); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '14px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      )}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                      Manual route — a request is queued and the team sends it by hand within 3-5 business days, not automatic like Stripe above.
                    </p>
                  </div>
                )}

                {hasPayoutMethod && !connectStatus?.payoutsEnabled && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 16 }}>
                    <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Amount · Min €20</label>
                    <input
                      type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)}
                      min={20} max={availableNow} placeholder={`Max ${formatMoney(availableNow, cur, localeTag)}`}
                      style={{ ...inputStyle, marginBottom: 12 }}
                    />
                    <button
                      type="button" onClick={requestPayout}
                      disabled={payoutLoading || Number(payoutAmount) < 20 || Number(payoutAmount) > availableNow}
                      style={{ ...primaryCta, opacity: payoutLoading || Number(payoutAmount) < 20 || Number(payoutAmount) > availableNow ? 0.5 : 1 }}
                    >
                      {payoutLoading ? 'Submitting…' : 'Request Payout →'}
                    </button>
                  </div>
                )}
              </div>
            </details>

            {payouts.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ ...microLabel, marginBottom: 8 }}>Payout History</p>
                <div style={{ display: 'grid', gap: 6 }}>
                  {payouts.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.015)', borderRadius: 14, padding: '10px 14px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>{new Date(p.created_at).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}</span>
                      <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.85rem' }}>{formatMoney(Number(p.amount), p.currency || cur, localeTag)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AccordionCard>

        {/* ── More Ways to Earn (bots, tucked away — not competing for attention) ── */}
        <AccordionCard
          id="more" icon="⚡" title="More Ways to Earn" accent="#22D3EE"
          open={openSection === 'more'} onToggle={() => toggle('more')}
          teaser={teaserText(isAdmin ? `Trading commissions, bots & airdrops · $${tradingEarned.toFixed(2)} earned so far` : 'Coming soon')}
        >
          {!isAdmin ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>✦</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Coming Soon</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: 6, lineHeight: 1.6 }}>
                New ways to earn are being prepared for the network. You'll see them here first.
              </p>
            </div>
          ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 16, padding: 14 }}>
              <p style={{ ...microLabel, color: 'rgba(34,197,94,0.7)', marginBottom: 8 }}>⚡ CLAWBOT Trading Commissions</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { tier: 'Free', l1: '10%', l2: '3%' },
                  { tier: 'Prana-Flow', l1: '8%', l2: '2%' },
                  { tier: 'Siddha-Quantum', l1: '5%', l2: '1%' },
                  { tier: 'Akasha-∞', l1: '3%', l2: '1%' },
                ].map(r => (
                  <div key={r.tier} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '6px 8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{r.tier}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#22c55e' }}>L1 {r.l1} · L2 {r.l2}</div>
                  </div>
                ))}
              </div>
            </div>

            {[
              { to: '/income-streams/airdrop-farming', icon: '🌱', color: '#10B981', title: 'Airdrop Farming', tag: 'ZERO CAPITAL', desc: 'Manual weekly routine · Meteora, Monad, Polymarket' },
              { to: '/income-streams/delta-arb-bot', icon: '⚡', color: '#22D3EE', title: 'Delta-Arb Bot', tag: 'INCOME STREAM', desc: 'Polymarket oracle-lag arbitrage · passive returns' },
              { to: '/income-streams/shreem-brzee-performance', icon: '🔱', color: '#D4AF37', title: 'Shreem Brzee Bot', tag: 'COPY TRADING · LIVE', desc: 'Solana meme coin copy trading · 21 whale wallets' },
              { to: '/income-streams/clawbot-hetzner', icon: '🦅', color: '#D4AF37', title: 'CLAWBOT', tag: 'WHALE MIRROR · LIVE', desc: 'Polymarket elite whale copy-trading · 9 signals' },
              { to: '/income-streams/sniper-bot', icon: '🎯', color: '#A855F7', title: 'Sovereign Sniper', tag: 'SOLANA · LIVE', desc: 'Pump.fun sniper · 12-signal AI · Jito MEV' },
            ].map((b) => (
              <div key={b.to} onClick={() => navigate(b.to)} style={{ background: `${b.color}0A`, border: `1px solid ${b.color}30`, borderRadius: 16, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: b.color }}>{b.title}</span>
                    <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.1em', color: b.color, border: `1px solid ${b.color}55`, borderRadius: 99, padding: '2px 6px' }}>{b.tag}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>{b.desc}</p>
                </div>
                <span style={{ color: b.color, fontSize: 16 }}>→</span>
              </div>
            ))}
          </div>
          )}
        </AccordionCard>

      </div>
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 40,
  padding: '1.75rem',
};

const microLabel: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 800,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(212,175,55,0.6)',
  margin: 0,
};

const primaryCta: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #A07820)',
  border: 'none',
  borderRadius: 100,
  padding: '14px 36px',
  color: '#050505',
  fontWeight: 800,
  fontSize: '0.9rem',
  cursor: 'pointer',
  width: '100%',
  boxShadow: '0 8px 40px rgba(212,175,55,0.25)',
};

const secondaryCta: React.CSSProperties = {
  background: 'rgba(212,175,55,0.08)',
  border: '1px solid rgba(212,175,55,0.25)',
  borderRadius: 100,
  padding: '12px 28px',
  color: '#D4AF37',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
  width: '100%',
};

const copyBtn: React.CSSProperties = {
  background: 'rgba(212,175,55,0.08)',
  border: '1px solid rgba(212,175,55,0.2)',
  borderRadius: 100,
  padding: '6px 14px',
  color: '#D4AF37',
  fontSize: '0.75rem',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: '12px 16px',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

export default AffiliateDashboard;
