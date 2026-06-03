// cache-bust: 20260603-siddha-medicine-section
import React, { useState } from 'react';
import { AyurvedaTool } from '@/components/ayurveda/AyurvedaTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import type { AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';
import { getTierRank } from '@/lib/tierAccess';
import { useNavigate } from 'react-router-dom';

// ─── SIDDHA MEDICINE CURRICULUM DATA ──────────────────────────────────────────
const SIDDHA_TIERS = [
  {
    id: 'free',
    requiredLevel: 0,
    name: 'SIDDHA AWAKENING',
    sub: 'Free Gateway',
    color: 'rgba(255,255,255,0.75)',
    glow: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.18)',
    dotColor: '#9CA3AF',
    icon: '◇',
    tagline: 'The First Transmission — Enter the Living Field',
    totalLessons: 16,
    totalHours: '14',
    modules: [
      { id: 'f1', num: '01', icon: '🔱', title: 'Origins of Siddha — The Living Science of Tamil Masters', duration: '4 Lessons · 3.5 hrs' },
      { id: 'f2', num: '02', icon: '🌿', title: 'Pancha Bhutas in Daily Life — Elemental Medicine', duration: '4 Lessons · 4 hrs' },
      { id: 'f3', num: '03', icon: '🌺', title: 'First 10 Sacred Herbs — Consciousness-Activated Plants', duration: '4 Lessons · 3.5 hrs' },
      { id: 'f4', num: '04', icon: '☀️', title: 'Siddha Lifestyle (Pathyam) — Daily Codes for Immortality', duration: '4 Lessons · 3 hrs' },
    ],
  },
  {
    id: 'prana',
    requiredLevel: 1,
    name: 'PRANA FLOW',
    sub: '€19 / month',
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.28)',
    dotColor: '#4ADE80',
    icon: '◉',
    tagline: 'Foundations of Siddha Healing Science',
    totalLessons: 42,
    totalHours: '47',
    modules: [
      { id: 'p1', num: '05', icon: '🌿', title: 'Complete Siddha Herbal Pharmacopoeia — 64 Sacred Plants', duration: '6 Lessons · 6 hrs' },
      { id: 'p2', num: '06', icon: '⚡', title: 'Varma Shastra — The 108 Vital Points of Power', duration: '6 Lessons · 7 hrs' },
      { id: 'p3', num: '07', icon: '👁', title: 'Ettavidha Pariksha — 8 Methods of Siddha Diagnosis', duration: '6 Lessons · 6 hrs' },
      { id: 'p4', num: '08', icon: '🍃', title: 'Advanced Siddha Dietary Medicine', duration: '6 Lessons · 5 hrs' },
      { id: 'p5', num: '09', icon: '📜', title: "Thirumoolar's Thirumantiram — Healing Through the 3000 Verses", duration: '6 Lessons · 7 hrs' },
      { id: 'p6', num: '10', icon: '🧘', title: 'Siddha Yoga — The Original Posture Science', duration: '6 Lessons · 6 hrs' },
      { id: 'p7', num: '11', icon: '🎵', title: 'Mantra Medicine — Sound as Healing Technology', duration: '6 Lessons · 6 hrs' },
    ],
  },
  {
    id: 'quantum',
    requiredLevel: 2,
    name: 'SIDDHA QUANTUM',
    sub: '€45 / month',
    color: '#D4AF37',
    glow: 'rgba(212,175,55,0.14)',
    border: 'rgba(212,175,55,0.32)',
    dotColor: '#D4AF37',
    icon: '⬡',
    tagline: 'Transmutation, Alchemy & Varma Mastery',
    totalLessons: 72,
    totalHours: '89',
    modules: [
      { id: 'q1', num: '12', icon: '🔮', title: 'Kayakalpa — The Science of Physical Immortality', duration: '8 Lessons · 10 hrs' },
      { id: 'q2', num: '13', icon: '⚗️', title: 'Muppu — The Three Sacred Salts of Alchemy', duration: '8 Lessons · 8 hrs' },
      { id: 'q3', num: '14', icon: '💫', title: 'Advanced Varma — 12 Lethal & 96 Healing Points', duration: '8 Lessons · 9 hrs' },
      { id: 'q4', num: '15', icon: '🜃', title: 'Rasa Vaitham — Siddha Mercury Alchemy', duration: '8 Lessons · 8 hrs' },
      { id: 'q5', num: '16', icon: '🌟', title: 'The 18 Siddhas — Individual Transmissions & Specialties', duration: '8 Lessons · 10 hrs' },
      { id: 'q6', num: '17', icon: '🔆', title: "Gnana Marga — Siddha's Path of Pure Wisdom", duration: '8 Lessons · 8 hrs' },
      { id: 'q7', num: '18', icon: '🌸', title: 'Siddha Tantra & Shakti Medicine', duration: '8 Lessons · 9 hrs' },
      { id: 'q8', num: '19', icon: '🧠', title: 'Siddha Psychiatry — Healing the Mind-Soul Interface', duration: '8 Lessons · 8 hrs' },
      { id: 'q9', num: '20', icon: '🪐', title: 'Siddha Astrology-Medicine Integration (Jyotisha-Vaidya)', duration: '8 Lessons · 8 hrs' },
    ],
  },
  {
    id: 'akasha',
    requiredLevel: 3,
    name: 'AKASHA INFINITY',
    sub: '€1,111 Lifetime',
    color: '#22D3EE',
    glow: 'rgba(34,211,238,0.12)',
    border: 'rgba(34,211,238,0.28)',
    dotColor: '#22D3EE',
    icon: '✦',
    tagline: 'Complete Immortality Codes — The Full Siddha Transmission',
    totalLessons: 144,
    totalHours: '196',
    modules: [
      { id: 'a1',  num: '21', icon: '♾️', title: 'Complete Kayakalpa Mastery — The Full 3-Year System', duration: '12 Lessons · 18 hrs' },
      { id: 'a2',  num: '22', icon: '🕉️', title: 'Siddha Deekshai — The Initiation Science', duration: '12 Lessons · 14 hrs' },
      { id: 'a3',  num: '23', icon: '✨', title: 'Complete 18 Siddhas System — Every Master, Every Gift', duration: '12 Lessons · 20 hrs' },
      { id: 'a4',  num: '24', icon: '🌠', title: 'Nadi Jyotish & Siddha Astro-Medicine', duration: '12 Lessons · 14 hrs' },
      { id: 'a5',  num: '25', icon: '🧂', title: 'Complete Muppu — All Preparations & Secrets', duration: '12 Lessons · 12 hrs' },
      { id: 'a6',  num: '26', icon: '🔔', title: 'Siddha Sound Medicine — Nada Brahman Complete System', duration: '12 Lessons · 16 hrs' },
      { id: 'a7',  num: '27', icon: '⚡', title: 'Advanced Varma — The 18 Marma & 108 Varma Master Map', duration: '12 Lessons · 18 hrs' },
      { id: 'a8',  num: '28', icon: '🌱', title: 'Living Plant Medicine — Siddha Plant Consciousness System', duration: '12 Lessons · 12 hrs' },
      { id: 'a9',  num: '29', icon: '⚗️', title: 'Complete Rasa Vaitham — Full Metal Alchemy', duration: '12 Lessons · 14 hrs' },
      { id: 'a10', num: '30', icon: '🏆', title: 'Siddha Healer Certification — Becoming a Living Instrument', duration: '12 Lessons · 20 hrs' },
      { id: 'a11', num: '31', icon: '📖', title: "Agathiyar's Complete Medical Texts — Original Translations", duration: '12 Lessons · 18 hrs' },
      { id: 'a12', num: '32', icon: '🔭', title: 'Siddha 2050 — The Future of Consciousness Medicine', duration: '12 Lessons · 16 hrs' },
    ],
  },
];

// ─── SIDDHA MEDICINE SECTION COMPONENT ────────────────────────────────────────
const SiddhaMedicineSection: React.FC<{ userLevel: number }> = ({ userLevel }) => {
  const navigate = useNavigate();
  const [openTiers, setOpenTiers] = useState<Record<string, boolean>>({ free: true });
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const toggleTier = (id: string) =>
    setOpenTiers(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleModule = (id: string) =>
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ background: '#050505', padding: '0 0 80px' }}>
      {/* ── HERO BANNER ─────────────────────────────────── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        margin: '0 16px',
        borderRadius: 40,
        border: '1px solid rgba(212,175,55,0.18)',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(5,5,5,0.98) 40%, rgba(34,211,238,0.04) 100%)',
        padding: '56px 40px 48px',
        marginBottom: 40,
      }}>
        {/* Decorative radial glow */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Bottom-right cyan accent */}
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Dotted divider line */}
        <div style={{
          position: 'absolute', top: 0, left: 40, right: 40, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.28)',
              borderRadius: 999, padding: '6px 18px',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.42em',
              textTransform: 'uppercase', color: '#D4AF37',
            }}>
              ✦ SQI 2050 · AKASHA-NEURAL ARCHIVE ✦
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #fff 0%, #D4AF37 50%, rgba(212,175,55,0.55) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Siddha Medicine Academy
          </h2>
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7,
            marginBottom: 32, maxWidth: 560, margin: '0 auto 32px',
            fontWeight: 400,
          }}>
            5,000 years of Tamil Siddha wisdom transmitted through the Akasha-Neural Archive.
            The world's most complete Siddha Medicine curriculum — from the first transmission to full immortality codes.
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 36,
          }}>
            {[
              { v: '32', l: 'MODULES' },
              { v: '274', l: 'LESSONS' },
              { v: '346+', l: 'HOURS' },
              { v: '18', l: 'SIDDHA MASTERS' },
            ].map(({ v, l }) => (
              <div key={l} style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '14px 22px',
                backdropFilter: 'blur(20px)',
                minWidth: 90,
              }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#D4AF37', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>{v}</p>
                <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0', lineHeight: 1 }}>{l}</p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/siddha-medicine-academy')}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              padding: '14px 36px',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: '#050505',
              boxShadow: '0 0 40px rgba(212,175,55,0.22)',
            }}
          >
            Enter the Academy →
          </button>
        </div>
      </div>

      {/* ── CURRICULUM HEADER ───────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.45em',
            textTransform: 'uppercase', color: 'rgba(212,175,55,0.7)',
            marginBottom: 10,
          }}>COMPLETE CURRICULUM</p>
          <h3 style={{
            fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em',
            color: 'rgba(255,255,255,0.9)', margin: 0,
          }}>All 32 Modules · 4 Initiation Tiers</h3>
        </div>

        {/* ── TIER ACCORDIONS ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SIDDHA_TIERS.map(tier => {
            const hasAccess = userLevel >= tier.requiredLevel;
            const tierOpen = openTiers[tier.id] ?? false;

            return (
              <div key={tier.id} style={{
                borderRadius: 28,
                border: `1px solid ${tierOpen ? tier.border : 'rgba(255,255,255,0.06)'}`,
                background: tierOpen ? tier.glow : 'rgba(255,255,255,0.015)',
                overflow: 'hidden',
                transition: 'border-color 0.3s, background 0.3s',
              }}>
                {/* Tier header (clickable) */}
                <button
                  onClick={() => toggleTier(tier.id)}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
                    textAlign: 'left',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: `rgba(${tier.color.startsWith('rgba') ? '255,255,255' : tier.color.replace('#','').match(/.{2}/g)!.map(h=>parseInt(h,16)).join(',')},0.12)`,
                    border: `1px solid ${tier.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: tier.color,
                  }}>
                    {tier.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em',
                        color: hasAccess ? tier.color : 'rgba(255,255,255,0.55)',
                      }}>{tier.name}</span>
                      <span style={{
                        fontSize: 8, fontWeight: 800, letterSpacing: '0.35em',
                        textTransform: 'uppercase',
                        color: hasAccess ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 999, padding: '3px 10px',
                      }}>{tier.sub}</span>
                      {!hasAccess && (
                        <span style={{
                          fontSize: 8, fontWeight: 800, letterSpacing: '0.3em',
                          textTransform: 'uppercase', color: '#D4AF37',
                          background: 'rgba(212,175,55,0.10)',
                          border: '1px solid rgba(212,175,55,0.25)',
                          borderRadius: 999, padding: '3px 10px',
                        }}>🔒 UPGRADE</span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: '4px 0 0',
                      fontWeight: 400,
                    }}>{tier.tagline}</p>
                  </div>

                  {/* Stats + chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right', display: 'none' }} className="hide-mobile">
                      <p style={{ fontSize: 14, fontWeight: 900, color: tier.color, margin: 0 }}>
                        {tier.modules.length} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>modules</span>
                      </p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{tier.totalHours} hrs</p>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.5)', fontSize: 12,
                      transform: tierOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}>▾</div>
                  </div>
                </button>

                {/* Tier body - modules */}
                {tierOpen && (
                  <div style={{ padding: '0 16px 16px' }}>
                    {/* Quick stats bar */}
                    <div style={{
                      display: 'flex', gap: 12, flexWrap: 'wrap',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 16, marginBottom: 12,
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      {[
                        { v: tier.modules.length, l: 'Modules' },
                        { v: tier.totalLessons, l: 'Lessons' },
                        { v: tier.totalHours + ' hrs', l: 'Study Time' },
                      ].map(({ v, l }) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: tier.color }}>{v}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{l}</span>
                        </div>
                      ))}
                    </div>

                    {/* Module list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tier.modules.map((mod, i) => {
                        const modOpen = openModules[mod.id] ?? false;
                        return (
                          <div key={mod.id} style={{
                            borderRadius: 16,
                            border: modOpen
                              ? `1px solid ${tier.border}`
                              : '1px solid rgba(255,255,255,0.05)',
                            background: modOpen
                              ? `linear-gradient(135deg, ${tier.glow}, rgba(255,255,255,0.01))`
                              : 'rgba(255,255,255,0.02)',
                            overflow: 'hidden',
                            transition: 'all 0.25s',
                          }}>
                            <button
                              onClick={() => hasAccess ? toggleModule(mod.id) : navigate('/upgrade')}
                              style={{
                                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                                padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12,
                                textAlign: 'left',
                              }}
                            >
                              {/* Number */}
                              <span style={{
                                fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
                                color: modOpen ? tier.color : 'rgba(255,255,255,0.2)',
                                minWidth: 28, flexShrink: 0,
                              }}>{mod.num}</span>

                              {/* Icon */}
                              <span style={{ fontSize: 16, flexShrink: 0 }}>{mod.icon}</span>

                              {/* Title */}
                              <div style={{ flex: 1 }}>
                                <p style={{
                                  fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                                  color: hasAccess
                                    ? (modOpen ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)')
                                    : 'rgba(255,255,255,0.35)',
                                  margin: 0, lineHeight: 1.35,
                                }}>{mod.title}</p>
                                <p style={{
                                  fontSize: 10, color: 'rgba(255,255,255,0.28)',
                                  margin: '3px 0 0', fontWeight: 400,
                                }}>{mod.duration}</p>
                              </div>

                              {/* Lock or chevron */}
                              <div style={{ flexShrink: 0, fontSize: 11, color: hasAccess ? 'rgba(255,255,255,0.3)' : '#D4AF37' }}>
                                {hasAccess
                                  ? (modOpen ? '▴' : '▾')
                                  : '🔒'}
                              </div>
                            </button>

                            {/* Module detail - lesson preview */}
                            {modOpen && hasAccess && (
                              <div style={{ padding: '0 16px 14px 56px' }}>
                                <div style={{
                                  padding: '12px 14px',
                                  background: 'rgba(255,255,255,0.02)',
                                  borderRadius: 12,
                                  border: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                  <p style={{
                                    fontSize: 9, fontWeight: 800, letterSpacing: '0.35em',
                                    textTransform: 'uppercase', color: tier.color,
                                    marginBottom: 8,
                                  }}>TRANSMISSION CONTENT</p>
                                  <p style={{
                                    fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
                                    margin: '0 0 12px',
                                  }}>
                                    This module contains complete Siddha transmissions with lesson overviews,
                                    four deep teaching sections, practice protocols, herbal medicine formulations,
                                    and Tamil master quotes.
                                  </p>
                                  <button
                                    onClick={() => navigate('/siddha-medicine-academy')}
                                    style={{
                                      background: `linear-gradient(135deg, ${tier.color}22, ${tier.color}11)`,
                                      border: `1px solid ${tier.border}`,
                                      borderRadius: 999, cursor: 'pointer',
                                      padding: '7px 18px',
                                      fontSize: 9, fontWeight: 800, letterSpacing: '0.3em',
                                      textTransform: 'uppercase', color: tier.color,
                                    }}
                                  >
                                    Open in Academy →
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: 40, textAlign: 'center',
          padding: '36px 24px',
          borderRadius: 28,
          background: 'rgba(212,175,55,0.03)',
          border: '1px solid rgba(212,175,55,0.12)',
        }}>
          <p style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.45em',
            textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: 12,
          }}>PATHINEN SIDDHARGAL · THE 18 MASTERS</p>
          <p style={{
            fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
            letterSpacing: '-0.02em', marginBottom: 8,
          }}>
            "Arogiyame Paramaanugraham"
          </p>
          <p style={{
            fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 24, lineHeight: 1.6,
          }}>
            "Perfect Health is the Greatest Blessing" — Agathiyar Muni
          </p>
          <button
            onClick={() => navigate('/siddha-medicine-academy')}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              padding: '13px 32px',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: '#050505',
              boxShadow: '0 0 30px rgba(212,175,55,0.20)',
            }}
          >
            Begin the Full Academy →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN AYURVEDA PAGE ────────────────────────────────────────────────────────
const Ayurveda = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { isPremium, tier, loading: membershipLoading, settled } = useMembership();

  if (authLoading || membershipLoading || adminLoading || !settled) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '2px solid rgba(212,175,55,0.15)',
          borderTop: '2px solid #D4AF37',
          borderRadius: '50%',
          animation: 'sqiSpin 1s linear infinite',
        }} />
        <style>{`@keyframes sqiSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return 'LIFETIME' as AyurvedaMembershipLevel;
    const rank = getTierRank(tier);
    if (rank >= 3) return 'LIFETIME' as AyurvedaMembershipLevel;
    if (rank >= 2) return 'SIDDHA'   as AyurvedaMembershipLevel;
    if (rank >= 1 || isPremium) return 'PREMIUM' as AyurvedaMembershipLevel;
    return 'FREE' as AyurvedaMembershipLevel;
  };

  // Numeric level for Siddha Medicine tier gating
  const getSiddhaLevel = (): number => {
    if (isAdmin) return 3;
    const rank = getTierRank(tier);
    return rank; // 0=free, 1=prana, 2=quantum, 3=akasha
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <AyurvedaTool
        membershipLevel={getAyurvedaLevel()}
        isAdmin={isAdmin}
      />
      {/* ── SIDDHA MEDICINE ACADEMY SECTION ── */}
      <SiddhaMedicineSection userLevel={getSiddhaLevel()} />
    </div>
  );
};

export default Ayurveda;
