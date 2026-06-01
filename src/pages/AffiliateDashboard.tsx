import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';

interface AffiliateProfile {
  affiliate_code: string;
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

function formatMoney(amount: number, currency: string, locale: string): string {
  const cur = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}

const AffiliateDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
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
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'earnings' | 'payout'>('overview');

  const cur = profile?.currency || 'EUR';

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

  // Check Stripe Connect status
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
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(''), 2500);
    } catch {
      toast({ title: 'Could not copy', description: 'Copy the link manually.', variant: 'destructive' });
    }
  };

  const buildLink = (platform: Platform, lang: LangCode) =>
    `${baseUrl}/affiliate/r/${profile?.affiliate_code}?platform=${platform}&lang=${lang}`;
  const mainLink = profile ? `${baseUrl}/affiliate/r/${profile.affiliate_code}` : '';

  // ── Connect Stripe account ─────────────────────────────────────────────────
  const handleConnectStripe = async () => {
    if (!user) return;
    setConnectLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { country: selectedCountry },
      });
      if (error) throw new Error(error.message || 'Connect setup failed');
      if (data?.url) {
        window.location.href = data.url; // Redirect to Stripe onboarding
      }
    } catch (err) {
      toast({ title: 'Setup failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setConnectLoading(false);
    }
  };

  // ── Request payout ─────────────────────────────────────────────────────────
  const requestPayout = async () => {
    if (!user || !profile || !payoutAmount || Number(payoutAmount) <= 0) return;
    const amount = Number(payoutAmount);

    if (amount < 20) {
      toast({ title: 'Minimum €20', description: 'Minimum payout amount is €20.', variant: 'destructive' });
      return;
    }
    if (amount > (profile.pending_balance || 0)) {
      toast({ title: 'Insufficient balance', description: `Max: ${formatMoney(profile.pending_balance, cur, localeTag)}`, variant: 'destructive' });
      return;
    }

    // Check if they have Stripe Connect set up
    if (!connectStatus?.payoutsEnabled) {
      toast({
        title: 'Set up bank account first',
        description: 'Connect your bank account via Stripe to receive payouts.',
        variant: 'destructive',
      });
      setActiveTab('payout');
      return;
    }

    setPayoutLoading(true);
    try {
      // Insert payout request — will be admin-approved and processed via process-payout-request
      const { error } = await supabase.from('affiliate_payout_requests').insert({
        affiliate_user_id: user.id,
        amount,
        currency: profile.currency || 'EUR',
        status: 'requested',
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
      <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={glassCard}>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>Sign in to access your Sovereign Abundance Network.</p>
          <button type="button" onClick={() => navigate('/auth')} style={primaryCta}>Sign In</button>
        </div>
      </div>
    );
  }

  const earned = profile?.total_earnings || 0;
  const pending = profile?.pending_balance || 0;
  const paidOut = profile?.paid_out || 0;

  const stats = [
    { label: 'Quantum Dividends', value: formatMoney(earned, cur, localeTag), sub: 'Total earned', color: '#D4AF37' },
    { label: 'Pending Balance', value: formatMoney(pending, cur, localeTag), sub: 'Available to withdraw', color: '#22D3EE' },
    { label: 'Transmitted Out', value: formatMoney(paidOut, cur, localeTag), sub: 'Paid to your account', color: '#4ade80' },
  ];

  const tabs = [
    { id: 'overview' as const, label: '✦ Overview' },
    { id: 'links' as const, label: '🔗 All Links' },
    { id: 'earnings' as const, label: '📊 Dividends' },
    { id: 'payout' as const, label: '💳 Withdraw' },
  ];

  // ── Connect status badge ───────────────────────────────────────────────────
  const renderConnectBadge = () => {
    if (!connectStatus) return null;
    const isActive = connectStatus.hasAccount && connectStatus.payoutsEnabled;
    const isPending = connectStatus.hasAccount && !connectStatus.payoutsEnabled;
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 14px',
        borderRadius: 100,
        background: isActive ? 'rgba(34,197,94,0.1)' : isPending ? 'rgba(212,175,55,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : isPending ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)'}`,
        fontSize: '9px',
        fontWeight: 800,
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        color: isActive ? '#22c55e' : isPending ? '#D4AF37' : '#ef4444',
      }}>
        {isActive ? '✓ BANK CONNECTED' : isPending ? '⟳ SETUP PENDING' : '⚠ NO BANK ACCOUNT'}
      </div>
    );
  };

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{
        padding: '3rem 1.5rem 2rem',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.12) 0%, transparent 60%)',
        textAlign: 'center',
      }}>
        <p style={microLabel}>Sovereign Abundance Network · 2050</p>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #F5E27B, #D4AF37, #A07820)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          lineHeight: 1.1,
        }}>
          Quantum Abundance Command
        </h1>

        {profile && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: '0.75rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 100, padding: '8px 20px',
            }}>
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

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ ...glassCard, textAlign: 'center', padding: '1.5rem 1rem' }}>
              <p style={{ ...microLabel, marginBottom: '0.4rem' }}>{s.label}</p>
              <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${activeTab === tab.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 100, padding: '10px 24px', cursor: 'pointer',
              color: activeTab === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.5)',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s ease',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={glassCard}>
              <p style={microLabel}>How Your Quantum Dividends Work</p>
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                {[
                  'Share your unique link across any platform in any language.',
                  'Seekers land on your personalised, translated landing page.',
                  'When they purchase any tier, your affiliate code is permanently encoded.',
                  '30% Quantum Dividend lands in your Pending Balance instantly via Stripe webhook.',
                  'Connect your bank account via Stripe and request a payout — processed within 3-5 days.',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{
                      minWidth: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', flexShrink: 0,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, paddingTop: 6 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {profile && (
              <div style={{ ...glassCard, border: '1px solid rgba(212,175,55,0.2)' }}>
                <p style={microLabel}>Your Master Transmission Link</p>
                <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <code style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 16px', fontSize: '0.8rem', color: '#D4AF37', border: '1px solid rgba(255,255,255,0.06)', wordBreak: 'break-all' as const }}>
                    {mainLink}
                  </code>
                  <button type="button" onClick={() => copyLink(mainLink, 'master')} style={copyBtn}>
                    {copiedLink === 'master' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Commission rate callout */}
            <div style={{ ...glassCard, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', margin: '0 0 4px' }}>30%</div>
              <p style={{ ...microLabel, color: 'rgba(212,175,55,0.7)' }}>Quantum Dividend on every purchase</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 8, lineHeight: 1.6 }}>
                Memberships · One-time purchases · Sessions · Courses · All products
              </p>
            </div>
          </div>
        )}

        {/* ── Links tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'links' && profile && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {PLATFORMS.map((platform) => (
              <div key={platform.id} style={glassCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{platform.icon}</span>
                  <p style={{ ...microLabel, margin: 0 }}>{platform.label} Transmission Links</p>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {LANGS.map((lang) => {
                    const link = buildLink(platform.id, lang.id);
                    const key = `${platform.id}-${lang.id}`;
                    return (
                      <div key={lang.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.015)', borderRadius: 16, padding: '10px 14px' }}>
                        <span style={{ fontSize: '1rem' }}>{lang.flag}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', minWidth: 64 }}>{lang.label}</span>
                        <code style={{ flex: 1, color: 'rgba(212,175,55,0.7)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{link}</code>
                        <button type="button" onClick={() => copyLink(link, key)} style={copyBtn}>
                          {copiedLink === key ? '✓' : 'Copy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={glassCard}>
              <p style={microLabel}>QR Code — Master Link</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(mainLink)}&bgcolor=050505&color=D4AF37&qzone=1`}
                  alt="Affiliate QR Code"
                  style={{ width: 120, height: 120, borderRadius: 16, border: '1px solid rgba(212,175,55,0.2)' }}
                />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                  Screenshot and share in stories, print for events, or embed on websites. Every scan permanently codes the visitor with your affiliate ID.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Earnings tab ──────────────────────────────────────────────────── */}
        {activeTab === 'earnings' && (
          <div style={glassCard}>
            <p style={microLabel}>Quantum Dividend History</p>
            {commissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
                <p style={{ fontSize: '0.9rem' }}>Your first transmission is on its way. Share your links to activate the flow.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginTop: '1rem' }}>
                {commissions.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.015)', borderRadius: 16, padding: '12px 16px' }}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>Initiation Quantum Dividend</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 2 }}>
                        {new Date(c.created_at).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · Gross: '}{formatMoney(Number(c.gross_amount), c.currency || cur, localeTag)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
                        +{formatMoney(Number(c.commission_amount), c.currency || cur, localeTag)}
                      </p>
                      <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: c.status === 'approved' || c.status === 'paid' ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Payout tab ────────────────────────────────────────────────────── */}
        {activeTab === 'payout' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>

            {/* Stripe Connect Setup */}
            <div style={{ ...glassCard, border: connectStatus?.payoutsEnabled ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <p style={microLabel}>Bank Account Setup · Stripe Connect</p>
                {renderConnectBadge()}
              </div>

              {connectStatus?.payoutsEnabled ? (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    ✓ Your bank account is connected and active. Payouts will be transferred directly via Stripe.
                  </p>
                  <button type="button" onClick={handleConnectStripe} disabled={connectLoading} style={{ ...secondaryCta, marginTop: '1rem' }}>
                    {connectLoading ? 'Opening…' : 'Manage Bank Account →'}
                  </button>
                </div>
              ) : connectStatus?.hasAccount ? (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    Your Stripe account is created but setup is incomplete. Please finish the onboarding to enable payouts.
                  </p>
                  <button type="button" onClick={handleConnectStripe} disabled={connectLoading} style={primaryCta}>
                    {connectLoading ? 'Opening Stripe…' : '◈ Complete Bank Setup →'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Connect your bank account via Stripe to receive payouts directly. Takes ~5 minutes. Stripe handles all regulatory compliance.
                  </p>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ ...microLabel, display: 'block', marginBottom: 8 }}>Your Country</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 16px', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code} style={{ background: '#050505' }}>{c.label}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={handleConnectStripe} disabled={connectLoading} style={primaryCta}>
                    {connectLoading ? 'Opening Stripe…' : '◈ Connect Bank Account via Stripe →'}
                  </button>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5 }}>
                    Powered by Stripe Express. Your banking details are stored securely with Stripe — never on our servers.
                  </p>
                </div>
              )}
            </div>

            {/* Payout Request Form — only show when bank connected */}
            {connectStatus?.payoutsEnabled && (
              <div style={glassCard}>
                <p style={microLabel}>Request Payout</p>

                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(212,175,55,0.05)', borderRadius: 20, border: '1px solid rgba(212,175,55,0.1)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Available to Withdraw</span>
                    <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1.1rem' }}>{formatMoney(pending, cur, localeTag)}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ ...microLabel, display: 'block', marginBottom: 6 }}>Amount (EUR) · Min €20</label>
                    <input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      min={20}
                      max={pending}
                      placeholder={`Max ${formatMoney(pending, cur, localeTag)}`}
                      style={inputStyle}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={requestPayout}
                    disabled={payoutLoading || Number(payoutAmount) < 20 || Number(payoutAmount) > pending}
                    style={{ ...primaryCta, opacity: payoutLoading || Number(payoutAmount) < 20 || Number(payoutAmount) > pending ? 0.5 : 1, cursor: payoutLoading ? 'wait' : 'pointer' }}
                  >
                    {payoutLoading ? 'Submitting…' : 'Request Bank Transmission →'}
                  </button>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.6 }}>
                    Minimum €20. Processed within 3-5 business days via Stripe Connect.
                  </p>
                </div>
              </div>
            )}

            {/* Payout history */}
            {payouts.length > 0 && (
              <div style={glassCard}>
                <p style={microLabel}>Transmission History</p>
                <div style={{ display: 'grid', gap: 8, marginTop: '1rem' }}>
                  {payouts.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.015)', borderRadius: 16, padding: '12px 16px' }}>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>Bank Transmission</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
                          {new Date(p.created_at).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{formatMoney(Number(p.amount), p.currency || cur, localeTag)}</p>
                        <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: p.status === 'completed' ? '#4ade80' : 'rgba(212,175,55,0.7)' }}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ height: '4rem' }} />
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
