import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import SriYantra from '@/components/sri-yantra/SriYantra';
import type { MembershipTier } from '@/features/membership/tier';

interface UserProfile {
  full_name?: string;
  dosha_type?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  current_dasha?: string;
  moon_sign?: string;
  ascendant?: string;
}

interface AbundanceOracle {
  timing: string;
  investment_guidance: string;
  avoid: string;
  mantra: string;
  favorable_sectors: string[];
  dosha_practice: string;
}

interface DoshaRow {
  strengths: string;
  ideal_investments: string[];
  avoid: string;
  practice: string;
  mantra: string;
}

interface DashaRow {
  timing: string;
  favorable: string[];
  caution: string;
}

interface PracticeRow {
  icon: string;
  title: string;
  desc: string;
  tier: string;
}

interface LibraryAbundanceProps {
  membershipTier?: MembershipTier;
}

const LibraryAbundance: React.FC<LibraryAbundanceProps> = ({ membershipTier: _membershipTier }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { t: tx } = useI18nTranslation();

  const doshaMatrix = tx('libraryAbundance.doshaMatrix', { returnObjects: true }) as Record<string, DoshaRow>;
  const dashaGuide = tx('libraryAbundance.dashaGuide', { returnObjects: true }) as Record<string, DashaRow>;
  const practices = tx('libraryAbundance.practices', { returnObjects: true }) as PracticeRow[];

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [oracle, setOracle] = useState<AbundanceOracle | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [shreem, setShreem] = useState(0);
  const [activeTab, setActiveTab] = useState<'jyotish' | 'ayurveda' | 'practices'>('jyotish');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, dosha_type, birth_date, birth_time, birth_place, current_dasha, moon_sign, ascendant')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as UserProfile);
      });
  }, [user]);

  const invokeOracle = useCallback(async () => {
    if (!profile?.birth_date || !profile?.dosha_type) return;
    setOracleLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bhrigu-oracle', {
        body: {
          mode: 'abundance',
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          birth_place: profile.birth_place,
          dosha: profile.dosha_type,
          current_dasha: profile.current_dasha,
        },
      });
      if (!error && data) setOracle(data as AbundanceOracle);
    } catch {
      /* graceful fallback */
    } finally {
      setOracleLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    invokeOracle();
  }, [invokeOracle]);

  const doshaKey = profile?.dosha_type?.toLowerCase() || '';
  const doshaData = doshaKey && doshaMatrix?.[doshaKey] ? doshaMatrix[doshaKey] : null;
  const dashaData =
    profile?.current_dasha && dashaGuide?.[profile.current_dasha]
      ? dashaGuide[profile.current_dasha]
      : null;
  const needsProfile = !profile?.dosha_type || !profile?.birth_date;

  const handleShreem = () => setShreem((p) => Math.min(p + 1, 108));

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0a0800 0%, #050505 100%)',
          paddingBottom: '3rem',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% -20%, rgba(212,175,55,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(212,175,55,0.05) 0%, transparent 70%)
          `,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '3rem 1.5rem 2rem' }}>
          <div
            style={{
              display: 'inline-block',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '100px',
              padding: '6px 24px',
              fontSize: '9px',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              marginBottom: '2rem',
              background: 'rgba(212,175,55,0.05)',
            }}
          >
            {t('libraryAbundance.hero.kicker')}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #F5E27B 0%, #D4AF37 50%, #A07820 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
              lineHeight: 1.1,
            }}
          >
            {t('libraryAbundance.hero.title')}
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              maxWidth: 560,
              margin: '0 auto 2.5rem',
            }}
          >
            {t('libraryAbundance.hero.subtitle')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto', maxWidth: 340 }}>
            <SriYantra size={320} animate />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <p
              style={{
                fontSize: '9px',
                letterSpacing: '0.4em',
                color: 'rgba(212,175,55,0.6)',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              {t('libraryAbundance.hero.mantraLabel')}
            </p>
            <button
              type="button"
              onClick={handleShreem}
              style={{
                background:
                  shreem >= 108 ? 'linear-gradient(135deg, #D4AF37, #F5E27B)' : 'rgba(212,175,55,0.08)',
                border: `1px solid ${shreem >= 108 ? '#D4AF37' : 'rgba(212,175,55,0.25)'}`,
                borderRadius: 100,
                padding: '12px 36px',
                cursor: 'pointer',
                color: shreem >= 108 ? '#050505' : '#D4AF37',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                boxShadow: shreem >= 108 ? '0 0 40px rgba(212,175,55,0.5)' : 'none',
              }}
            >
              {shreem >= 108
                ? t('libraryAbundance.hero.mantraBtnComplete')
                : t('libraryAbundance.hero.mantraBtn', { count: shreem })}
            </button>
          </div>
        </div>
      </div>

      {needsProfile && (
        <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.5rem' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 40,
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔮</div>
            <h3 style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              {t('libraryAbundance.profilePrompt.title')}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {t('libraryAbundance.profilePrompt.body')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #A07820)',
                border: 'none',
                borderRadius: 100,
                padding: '12px 32px',
                color: '#050505',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {t('libraryAbundance.profilePrompt.cta')}
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'jyotish' as const, labelKey: 'libraryAbundance.tabs.jyotish' },
              { id: 'ayurveda' as const, labelKey: 'libraryAbundance.tabs.ayurveda' },
              { id: 'practices' as const, labelKey: 'libraryAbundance.tabs.practices' },
            ] as const
          ).map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background:
                  activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))'
                    : 'rgba(255,255,255,0.02)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 100,
                padding: '10px 24px',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.02em',
                transition: 'all 0.2s ease',
              }}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {activeTab === 'jyotish' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {oracleLoading && (
              <div style={glassCard}>
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(212,175,55,0.6)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                  <p style={{ fontSize: '0.9rem' }}>{t('libraryAbundance.oracle.loadingTitle')}</p>
                </div>
              </div>
            )}

            {oracle && (
              <div style={{ ...glassCard, border: '1px solid rgba(212,175,55,0.3)' }}>
                <Label>{t('libraryAbundance.oracle.cardTitle')}</Label>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  <OracleRow icon="⏱" title={t('libraryAbundance.oracle.timing')} value={oracle.timing} />
                  <OracleRow icon="📈" title={t('libraryAbundance.oracle.investment')} value={oracle.investment_guidance} />
                  <OracleRow icon="⛔" title={t('libraryAbundance.oracle.avoid')} value={oracle.avoid} />
                  <OracleRow icon="🔊" title={t('libraryAbundance.oracle.activationMantra')} value={oracle.mantra} />
                  {oracle.favorable_sectors?.length > 0 && (
                    <div>
                      <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>
                        {t('libraryAbundance.oracle.favorableSectors')}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {oracle.favorable_sectors.map((s, i) => (
                          <span key={i} style={sectorBadge}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {dashaData && (
              <div style={glassCard}>
                <Label>
                  {t('libraryAbundance.dasha.currentPeriod', { planet: profile?.current_dasha || '' })}
                </Label>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginTop: '0.75rem', lineHeight: 1.7 }}>
                  {dashaData.timing}
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <p style={labelStyle}>{t('libraryAbundance.dasha.favorableLabel')}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {dashaData.favorable.map((s, i) => (
                      <span key={i} style={sectorBadge}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(255,80,80,0.05)',
                    borderRadius: 16,
                    border: '1px solid rgba(255,80,80,0.1)',
                  }}
                >
                  <p style={{ ...labelStyle, color: 'rgba(255,120,120,0.8)' }}>
                    {t('libraryAbundance.dasha.caution')}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 4 }}>
                    {dashaData.caution}
                  </p>
                </div>
              </div>
            )}

            {!dashaData && !oracle && dashaGuide && (
              <div style={glassCard}>
                <Label>{t('libraryAbundance.dasha.guideTitle')}</Label>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  {Object.entries(dashaGuide).map(([planet, data]) => (
                    <div
                      key={planet}
                      style={{
                        padding: '1rem',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
                        <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.9rem' }}>{planet}</span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {data.timing}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ayurveda' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {doshaData ? (
              <>
                <div style={{ ...glassCard, border: '1px solid rgba(212,175,55,0.25)' }}>
                  <Label>
                    {t('libraryAbundance.dosha.blueprintTitle', { dosha: (profile?.dosha_type || '').toUpperCase() })}
                  </Label>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.7, marginTop: '0.75rem' }}>
                    <strong style={{ color: '#D4AF37' }}>{t('libraryAbundance.dosha.strengthsLead')} </strong>
                    {doshaData.strengths}
                  </p>

                  <div style={{ marginTop: '1.25rem' }}>
                    <p style={labelStyle}>{t('libraryAbundance.dosha.idealInvestments')}</p>
                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                      {doshaData.ideal_investments.map((item, i) => (
                        <li
                          key={i}
                          style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.9rem',
                            paddingLeft: '1.2rem',
                            position: 'relative',
                          }}
                        >
                          <span style={{ position: 'absolute', left: 0, color: '#D4AF37' }}>✦</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '1rem',
                      background: 'rgba(255,80,80,0.04)',
                      borderRadius: 20,
                      border: '1px solid rgba(255,80,80,0.08)',
                    }}
                  >
                    <p style={{ ...labelStyle, color: 'rgba(255,120,120,0.8)' }}>
                      {t('libraryAbundance.dosha.avoidLabel')}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 4, lineHeight: 1.6 }}>
                      {doshaData.avoid}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '1rem',
                      background: 'rgba(212,175,55,0.04)',
                      borderRadius: 20,
                      border: '1px solid rgba(212,175,55,0.1)',
                    }}
                  >
                    <p style={labelStyle}>{t('libraryAbundance.dosha.practiceLabel')}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: 4, lineHeight: 1.7 }}>
                      {doshaData.practice}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '1.25rem',
                      textAlign: 'center',
                      padding: '1rem',
                      background: 'rgba(212,175,55,0.06)',
                      borderRadius: 20,
                    }}
                  >
                    <p style={{ ...labelStyle, marginBottom: '0.4rem' }}>{t('libraryAbundance.dosha.mantraLabel')}</p>
                    <p
                      style={{
                        color: '#D4AF37',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        textShadow: '0 0 20px rgba(212,175,55,0.4)',
                      }}
                    >
                      {doshaData.mantra}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ ...glassCard, textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  {t('libraryAbundance.dosha.empty')}
                </p>
                <button type="button" onClick={() => navigate('/profile')} style={{ ...ctaBtn, marginTop: '1rem' }}>
                  {t('libraryAbundance.dosha.discoverCta')}
                </button>
              </div>
            )}

            {!doshaData && doshaMatrix && (
              <div style={glassCard}>
                <Label>{t('libraryAbundance.dosha.matrixTitle')}</Label>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  {Object.entries(doshaMatrix).map(([dosha, data]) => (
                    <div
                      key={dosha}
                      style={{
                        padding: '1rem',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <p
                        style={{
                          color: '#D4AF37',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: '0.4rem',
                        }}
                      >
                        {dosha}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {data.strengths}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'practices' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {Array.isArray(practices) &&
              practices.map((p, i) => (
                <div key={i} style={{ ...glassCard, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{p.icon}</div>
                  <h4 style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>{p.title}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.7 }}>{p.desc}</p>
                  {p.tier !== 'free' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: 100,
                        padding: '3px 10px',
                        fontSize: '8px',
                        letterSpacing: '0.3em',
                        color: '#D4AF37',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t(`libraryAbundance.tierBadge.${p.tier}`, p.tier === 'siddha-quantum' ? 'Siddha+' : 'Prana+')}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        <div
          style={{
            ...glassCard,
            marginTop: '2rem',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 100%)',
            border: '1px solid rgba(212,175,55,0.25)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌐</div>
          <h3 style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
            {t('libraryAbundance.affiliateCta.title')}
          </h3>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem',
              maxWidth: 480,
              margin: '0 auto 1.5rem',
              lineHeight: 1.7,
            }}
          >
            {t('libraryAbundance.affiliateCta.body')}
          </p>
          <button type="button" onClick={() => navigate('/affiliate/dashboard')} style={ctaBtn}>
            {t('libraryAbundance.affiliateCta.cta')}
          </button>
        </div>

        <div style={{ height: '4rem' }} />
      </div>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <p style={labelStyle}>{children}</p>;

const OracleRow: React.FC<{ icon: string; title: string; value: string }> = ({ icon, title, value }) => (
  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.015)', borderRadius: 16 }}>
    <p style={{ ...labelStyle, marginBottom: '0.3rem' }}>
      {icon} {title}
    </p>
    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{value}</p>
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

const labelStyle: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 800,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(212,175,55,0.7)',
  margin: 0,
};

const sectorBadge: React.CSSProperties = {
  background: 'rgba(212,175,55,0.08)',
  border: '1px solid rgba(212,175,55,0.2)',
  borderRadius: 100,
  padding: '4px 14px',
  fontSize: '0.8rem',
  color: '#D4AF37',
  fontWeight: 600,
};

const ctaBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #A07820)',
  border: 'none',
  borderRadius: 100,
  padding: '14px 36px',
  color: '#050505',
  fontWeight: 800,
  fontSize: '0.9rem',
  cursor: 'pointer',
  letterSpacing: '0.02em',
  boxShadow: '0 8px 40px rgba(212,175,55,0.25)',
};

export default LibraryAbundance;
