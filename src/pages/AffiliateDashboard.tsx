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
  status: string;
  created_at: string;
}

type LangCode = 'en' | 'sv' | 'no' | 'es';
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook';

const PLATFORMS: { id: Platform; labelKey: string; icon: string }[] = [
  { id: 'instagram', labelKey: 'affiliateDashboard.platform.instagram', icon: '📸' },
  { id: 'tiktok', labelKey: 'affiliateDashboard.platform.tiktok', icon: '🎵' },
  { id: 'youtube', labelKey: 'affiliateDashboard.platform.youtube', icon: '▶️' },
  { id: 'facebook', labelKey: 'affiliateDashboard.platform.facebook', icon: '🌐' },
];

const LANGS: { id: LangCode; labelKey: string; flag: string }[] = [
  { id: 'en', labelKey: 'affiliateDashboard.lang.en', flag: '🇬🇧' },
  { id: 'sv', labelKey: 'affiliateDashboard.lang.sv', flag: '🇸🇪' },
  { id: 'no', labelKey: 'affiliateDashboard.lang.no', flag: '🇳🇴' },
  { id: 'es', labelKey: 'affiliateDashboard.lang.es', flag: '🇪🇸' },
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

  const baseUrl = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    [],
  );

  const localeTag = useMemo(() => {
    const map: Record<string, string> = { en: 'en-GB', sv: 'sv-SE', no: 'nb-NO', es: 'es-ES' };
    return map[language] || 'en-GB';
  }, [language]);

  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ iban: '', swift: '', account_holder: '' });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'earnings' | 'payout'>('overview');

  const cur = profile?.currency || 'EUR';

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profRes, commRes, payRes] = await Promise.all([
        supabase.from('affiliate_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('affiliate_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('affiliate_payout_requests')
          .select('*')
          .eq('affiliate_user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (profRes.data) setProfile(profRes.data as AffiliateProfile);
      else setProfile(null);
      if (commRes.data) setCommissions(commRes.data as Commission[]);
      if (payRes.data) setPayouts(payRes.data as PayoutRequest[]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyLink = async (link: string, key: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(''), 2500);
    } catch {
      toast({
        title: t('affiliateDashboard.copyFailedTitle', 'Could not copy'),
        description: t('affiliateDashboard.copyFailedDesc', 'Copy the link manually.'),
        variant: 'destructive',
      });
    }
  };

  const buildLink = (platform: Platform, lang: LangCode) =>
    `${baseUrl}/affiliate/${profile?.affiliate_code}?platform=${platform}&lang=${lang}`;

  const mainLink = profile ? `${baseUrl}/affiliate/${profile.affiliate_code}` : '';

  const requestPayout = async () => {
    if (!user || !profile || !payoutAmount || Number(payoutAmount) <= 0) return;
    if (Number(payoutAmount) > (profile.pending_balance || 0)) {
      toast({
        title: t('affiliateDashboard.payoutTooMuchTitle', 'Amount too high'),
        description: t('affiliateDashboard.payoutTooMuchDesc', 'Amount exceeds your pending balance.'),
        variant: 'destructive',
      });
      return;
    }
    setPayoutLoading(true);
    try {
      const { error } = await supabase.from('affiliate_payout_requests').insert({
        affiliate_user_id: user.id,
        amount: Number(payoutAmount),
        currency: profile.currency || 'EUR',
        bank_details: bankDetails,
        status: 'requested',
      });
      if (!error) {
        setPayoutSuccess(true);
        setPayoutAmount('');
        loadData();
        toast({
          title: t('affiliateDashboard.payoutSentTitle', 'Request sent'),
          description: t('affiliateDashboard.payoutSentDesc', 'Your payout request was submitted.'),
        });
      } else {
        toast({
          title: t('affiliateDashboard.payoutErrorTitle', 'Request failed'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setPayoutLoading(false);
    }
  };

  const commissionStatusLabel = (s: Commission['status']) =>
    t(`affiliateDashboard.commissionStatus.${s}`, s);

  if (loading) {
    return (
      <div
        style={{
          background: '#050505',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#D4AF37', fontSize: '0.9rem', letterSpacing: '0.2em' }}>
          {t('affiliateDashboard.loading', 'Loading Abundance Network…')}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          background: '#050505',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={glassCard}>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
            {t(
              'affiliateDashboard.signInPrompt',
              'Sign in to access your Sovereign Abundance Network.',
            )}
          </p>
          <button type="button" onClick={() => navigate('/auth')} style={primaryCta}>
            {t('affiliateDashboard.signIn', 'Sign In')}
          </button>
        </div>
      </div>
    );
  }

  const earned = profile?.total_earnings || 0;
  const pending = profile?.pending_balance || 0;
  const paidOut = profile?.paid_out || 0;

  const stats = [
    {
      label: t('affiliateDashboard.statEarnedLabel', 'Quantum Dividends'),
      value: formatMoney(earned, cur, localeTag),
      sub: t('affiliateDashboard.statEarnedSub', 'Total earned'),
      color: '#D4AF37',
    },
    {
      label: t('affiliateDashboard.statPendingLabel', 'Pending Balance'),
      value: formatMoney(pending, cur, localeTag),
      sub: t('affiliateDashboard.statPendingSub', 'Available to withdraw'),
      color: '#22D3EE',
    },
    {
      label: t('affiliateDashboard.statPaidLabel', 'Transmitted Out'),
      value: formatMoney(paidOut, cur, localeTag),
      sub: t('affiliateDashboard.statPaidSub', 'Paid to your account'),
      color: '#4ade80',
    },
  ];

  const tabs = [
    { id: 'overview' as const, label: t('affiliateDashboard.tabOverview', '✦ Overview') },
    { id: 'links' as const, label: t('affiliateDashboard.tabLinks', '🔗 All Links') },
    { id: 'earnings' as const, label: t('affiliateDashboard.tabEarnings', '📊 Quantum Dividends') },
    { id: 'payout' as const, label: t('affiliateDashboard.tabPayout', '💳 Transmit to Bank') },
  ];

  const steps: { step: string; key: string; defaultValue: string }[] = [
    {
      step: '01',
      key: 'affiliateDashboard.step1',
      defaultValue:
        'Share your unique link with any seeker across any platform in any language.',
    },
    {
      step: '02',
      key: 'affiliateDashboard.step2',
      defaultValue:
        'They visit your personalised landing page — fully translated and platform-optimised.',
    },
    {
      step: '03',
      key: 'affiliateDashboard.step3',
      defaultValue:
        'When they initiate (purchase any tier), your code is permanently encoded to their account.',
    },
    {
      step: '04',
      key: 'affiliateDashboard.step4',
      defaultValue:
        '30% Quantum Dividend appears in your Pending Balance instantly via Stripe webhook.',
    },
    {
      step: '05',
      key: 'affiliateDashboard.step5',
      defaultValue:
        'Request a payout to your bank account — processed within 3–5 sovereign days.',
    },
  ];

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div
        style={{
          padding: '3rem 1.5rem 2rem',
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.12) 0%, transparent 60%)',
          textAlign: 'center',
        }}
      >
        <p style={microLabel}>{t('affiliateDashboard.kicker', 'Sovereign Abundance Network · 2050')}</p>
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #F5E27B, #D4AF37, #A07820)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            lineHeight: 1.1,
          }}
        >
          {t('affiliateDashboard.title', 'Quantum Abundance Command')}
        </h1>
        {profile && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: '0.75rem',
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 100,
              padding: '8px 20px',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              {t('affiliateDashboard.yourCode', 'Your Code:')}
            </span>
            <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
              {profile.affiliate_code}
            </span>
            <button
              type="button"
              onClick={() => copyLink(mainLink, 'main')}
              style={{
                background: 'none',
                border: 'none',
                color: copiedLink === 'main' ? '#4ade80' : '#D4AF37',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {copiedLink === 'main'
                ? t('affiliateDashboard.copied', '✓ Copied')
                : t('affiliateDashboard.copyLink', 'Copy Link')}
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ ...glassCard, textAlign: 'center', padding: '1.5rem 1rem' }}>
              <p style={{ ...microLabel, marginBottom: '0.4rem' }}>{s.label}</p>
              <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 900, color: s.color, margin: 0 }}>
                {s.value}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 100,
                padding: '10px 24px',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={glassCard}>
              <p style={microLabel}>{t('affiliateDashboard.howItWorksTitle', 'How Your Quantum Dividends Work')}</p>
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                {steps.map((s) => (
                  <div key={s.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#D4AF37',
                      }}
                    >
                      {s.step}
                    </span>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, paddingTop: 6 }}>
                      {t(s.key, { defaultValue: s.defaultValue })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {profile && (
              <div style={{ ...glassCard, border: '1px solid rgba(212,175,55,0.2)' }}>
                <p style={microLabel}>{t('affiliateDashboard.masterLinkTitle', 'Your Master Transmission Link')}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <code
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 12,
                      padding: '10px 16px',
                      fontSize: '0.8rem',
                      color: '#D4AF37',
                      border: '1px solid rgba(255,255,255,0.06)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {mainLink}
                  </code>
                  <button type="button" onClick={() => copyLink(mainLink, 'master')} style={copyBtn}>
                    {copiedLink === 'master'
                      ? t('affiliateDashboard.copyDone', '✓')
                      : t('affiliateDashboard.copyShort', 'Copy')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && profile && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {PLATFORMS.map((platform) => (
              <div key={platform.id} style={glassCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.25rem' }} aria-hidden>
                    {platform.icon}
                  </span>
                  <p style={{ ...microLabel, margin: 0 }}>
                    {t(platform.labelKey, platform.id)}{' '}
                    {t('affiliateDashboard.linksSuffix', 'Transmission Links')}
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {LANGS.map((lang) => {
                    const link = buildLink(platform.id, lang.id);
                    const key = `${platform.id}-${lang.id}`;
                    return (
                      <div
                        key={lang.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(255,255,255,0.015)',
                          borderRadius: 16,
                          padding: '10px 14px',
                        }}
                      >
                        <span style={{ fontSize: '1rem' }} aria-hidden>
                          {lang.flag}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', minWidth: 64 }}>
                          {t(lang.labelKey, lang.id)}
                        </span>
                        <code
                          style={{
                            flex: 1,
                            color: 'rgba(212,175,55,0.7)',
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {link}
                        </code>
                        <button type="button" onClick={() => copyLink(link, key)} style={copyBtn}>
                          {copiedLink === key
                            ? t('affiliateDashboard.copyDone', '✓')
                            : t('affiliateDashboard.copyShort', 'Copy')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={glassCard}>
              <p style={microLabel}>{t('affiliateDashboard.qrTitle', 'QR Code — Master Link')}</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(mainLink)}&bgcolor=050505&color=D4AF37&qzone=1`}
                  alt={t('affiliateDashboard.qrAlt', 'Affiliate QR Code')}
                  style={{ width: 120, height: 120, borderRadius: 16, border: '1px solid rgba(212,175,55,0.2)' }}
                />
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                    {t(
                      'affiliateDashboard.qrBody',
                      'Screenshot and share in stories, print for events, or embed on websites. Every scan permanently codes the visitor with your affiliate ID.',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div style={glassCard}>
            <p style={microLabel}>{t('affiliateDashboard.earningsTitle', 'Quantum Dividend History')}</p>
            {commissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden>
                  ⚡
                </div>
                <p style={{ fontSize: '0.9rem' }}>
                  {t(
                    'affiliateDashboard.earningsEmpty',
                    'Your first transmission is on its way. Share your links to activate the flow.',
                  )}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginTop: '1rem' }}>
                {commissions.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.015)',
                      borderRadius: 16,
                      padding: '12px 16px',
                    }}
                  >
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
                        {t('affiliateDashboard.commissionRowTitle', 'Initiation Quantum Dividend')}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 2 }}>
                        {new Date(c.created_at).toLocaleDateString(localeTag, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {' · '}
                        {t('affiliateDashboard.gross', 'Gross')}:{' '}
                        {formatMoney(Number(c.gross_amount), c.currency || cur, localeTag)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
                        +{formatMoney(Number(c.commission_amount), c.currency || cur, localeTag)}
                      </p>
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color:
                            c.status === 'paid'
                              ? '#4ade80'
                              : c.status === 'approved'
                                ? '#D4AF37'
                                : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {commissionStatusLabel(c.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payout' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {payoutSuccess && (
              <div
                style={{
                  ...glassCard,
                  textAlign: 'center',
                  border: '1px solid rgba(74,222,128,0.3)',
                  background: 'rgba(74,222,128,0.05)',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }} aria-hidden>
                  ✅
                </div>
                <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {t('affiliateDashboard.payoutSuccessTitle', 'Payout Request Transmitted')}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  {t(
                    'affiliateDashboard.payoutSuccessBody',
                    'Your quantum dividend will arrive in your bank within 3–5 sovereign days.',
                  )}
                </p>
              </div>
            )}

            <div style={glassCard}>
              <p style={microLabel}>{t('affiliateDashboard.payoutFormTitle', 'Transmit Quantum Dividends to Your Bank')}</p>

              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(212,175,55,0.05)',
                  borderRadius: 20,
                  border: '1px solid rgba(212,175,55,0.1)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    {t('affiliateDashboard.availableWithdraw', 'Available to Withdraw')}
                  </span>
                  <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1.1rem' }}>
                    {formatMoney(pending, cur, localeTag)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <InputGroup
                  label={t('affiliateDashboard.amountLabel', 'Amount to Withdraw (EUR)')}
                  value={payoutAmount}
                  onChange={setPayoutAmount}
                  placeholder={t('affiliateDashboard.amountPlaceholder', {
                    defaultValue: 'Max {{amount}}',
                    amount: formatMoney(pending, cur, localeTag),
                  })}
                  type="number"
                  microLabelObj={microLabelObj}
                />
                <InputGroup
                  label={t('affiliateDashboard.holderLabel', 'Account Holder Name')}
                  value={bankDetails.account_holder}
                  onChange={(v) => setBankDetails((p) => ({ ...p, account_holder: v }))}
                  placeholder={t('affiliateDashboard.holderPlaceholder', 'Full legal name')}
                  microLabelObj={microLabelObj}
                />
                <InputGroup
                  label={t('affiliateDashboard.ibanLabel', 'IBAN')}
                  value={bankDetails.iban}
                  onChange={(v) => setBankDetails((p) => ({ ...p, iban: v }))}
                  placeholder={t('affiliateDashboard.ibanPlaceholder', 'SE12 3456 7890 1234 5678')}
                  microLabelObj={microLabelObj}
                />
                <InputGroup
                  label={t('affiliateDashboard.swiftLabel', 'SWIFT / BIC')}
                  value={bankDetails.swift}
                  onChange={(v) => setBankDetails((p) => ({ ...p, swift: v }))}
                  placeholder={t('affiliateDashboard.swiftPlaceholder', 'ESSESESS')}
                  microLabelObj={microLabelObj}
                />

                <button
                  type="button"
                  onClick={requestPayout}
                  disabled={payoutLoading || Number(payoutAmount) <= 0 || Number(payoutAmount) > pending}
                  style={{
                    ...primaryCta,
                    opacity:
                      payoutLoading || Number(payoutAmount) <= 0 || Number(payoutAmount) > pending ? 0.5 : 1,
                    cursor: payoutLoading ? 'wait' : 'pointer',
                    marginTop: '0.5rem',
                  }}
                >
                  {payoutLoading
                    ? t('affiliateDashboard.transmitting', 'Transmitting…')
                    : t('affiliateDashboard.requestTransmission', 'Request Bank Transmission →')}
                </button>

                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.6 }}>
                  {t(
                    'affiliateDashboard.payoutDisclaimer',
                    'Bank details are stored securely and used only for processing your payout. Minimum withdrawal: €10. Processing time: 3–5 business days.',
                  )}
                </p>
              </div>
            </div>

            {payouts.length > 0 && (
              <div style={glassCard}>
                <p style={microLabel}>{t('affiliateDashboard.payoutHistoryTitle', 'Transmission History')}</p>
                <div style={{ display: 'grid', gap: 8, marginTop: '1rem' }}>
                  {payouts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.015)',
                        borderRadius: 16,
                        padding: '12px 16px',
                      }}
                    >
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
                          {t('affiliateDashboard.bankTransmission', 'Bank Transmission')}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
                          {new Date(p.created_at).toLocaleDateString(localeTag, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
                          {formatMoney(Number(p.amount), cur, localeTag)}
                        </p>
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 800,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: p.status === 'completed' ? '#4ade80' : 'rgba(212,175,55,0.7)',
                          }}
                        >
                          {t(`affiliateDashboard.payoutStatus.${p.status}`, p.status)}
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

const InputGroup: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  microLabelObj: React.CSSProperties;
}> = ({ label, value, onChange, placeholder, type = 'text', microLabelObj: ml }) => (
  <div>
    <label style={{ ...ml, display: 'block', marginBottom: 6 }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
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
      }}
    />
  </div>
);

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 40,
  padding: '1.75rem',
};

const microLabelObj: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 800,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(212,175,55,0.6)',
  margin: 0,
};
const microLabel = microLabelObj;

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

export default AffiliateDashboard;
