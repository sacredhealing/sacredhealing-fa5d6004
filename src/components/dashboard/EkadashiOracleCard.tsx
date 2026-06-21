import React, { useState, useEffect } from 'react';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';

// ── Ekadashi date engine ────────────────────────────────────────────────────
// Approximate new-moon anchors for 2026 (UTC dates).
// Shukla Ekadashi = NM + 10.8 days · Krishna Ekadashi = NM − 10.8 days
const NEW_MOONS_2026 = [
  new Date('2026-04-27'), new Date('2026-05-27'), new Date('2026-06-25'),
  new Date('2026-07-25'), new Date('2026-08-23'), new Date('2026-09-21'),
  new Date('2026-10-21'), new Date('2026-11-20'), new Date('2026-12-19'),
];
const EK_NAMES: Record<string, string[]> = {
  '2026-04': ['Varuthini Ekadashi', 'Mohini Ekadashi'],
  '2026-05': ['Apara Ekadashi', 'Nirjala Ekadashi'],
  '2026-06': ['Yogini Ekadashi', 'Devshayani Ekadashi'],
  '2026-07': ['Kamika Ekadashi', 'Putrada Ekadashi'],
  '2026-08': ['Aja Ekadashi', 'Parsva Ekadashi'],
  '2026-09': ['Indira Ekadashi', 'Papankusha Ekadashi'],
  '2026-10': ['Rama Ekadashi', 'Devutthana Ekadashi'],
  '2026-11': ['Utpanna Ekadashi', 'Mokshada Ekadashi'],
  '2026-12': ['Saphala Ekadashi', 'Putrada Ekadashi'],
};

interface EkDate { date: Date; name: string; paksha: 'Shukla' | 'Krishna' }

function getEkadashis(): EkDate[] {
  const list: EkDate[] = [];
  const offset = 10.8 * 24 * 60 * 60 * 1000;
  NEW_MOONS_2026.forEach((nm) => {
    const mk = `${nm.getFullYear()}-${String(nm.getMonth() + 1).padStart(2, '0')}`;
    const names = EK_NAMES[mk] || ['Krishna Ekadashi', 'Shukla Ekadashi'];
    list.push({ date: new Date(nm.getTime() - offset), name: names[0], paksha: 'Krishna' });
    list.push({ date: new Date(nm.getTime() + offset), name: names[1], paksha: 'Shukla' });
  });
  return list.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function daysFromNow(d: Date) {
  return Math.round((d.getTime() - Date.now()) / 86400000);
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Dosha fasting guidance ─────────────────────────────────────────────────
function doshaGuidance(dosha: string | undefined): string {
  const d = (dosha || '').toLowerCase();
  if (d.includes('vata'))
    return 'Favour warm liquids, coconut water and ripe fruits. Avoid raw or cold foods — they aggravate Vata. Break fast gently on Dwadashi with warm rice kanji or moong soup before 10 AM. Nirjala (dry) fasting is not recommended for your constitution.';
  if (d.includes('pitta'))
    return 'Cool, sweet fruits like pomegranate and grapes are ideal. Avoid sour or spicy foods during the fast. Break fast with coconut water or rice porridge. Moderate fasting suits you well — full Nirjala is best avoided in summer months.';
  if (d.includes('kapha'))
    return 'Kapha types benefit most from Ekadashi fasting. Light fruits and herbal teas are ideal. You may try a full fruit-and-water fast. Breaking the fast with light, warm food on Dwadashi morning will amplify the detox benefit.';
  return 'Favour warm, easily digestible foods. Coconut water, ripe fruits and herbal teas are ideal. Break the fast gently the following morning on Dwadashi.';
}

// ── Component ──────────────────────────────────────────────────────────────
export const EkadashiOracleCard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const jyotish = useJyotishProfile();
  const { doshaProfile } = useAyurvedaAnalysis();

  const ekDates = getEkadashis();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find current window: -1 = eve, 0 = today, 1 = after, else upcoming
  const upcoming = ekDates.filter(e => daysFromNow(e.date) >= -1).slice(0, 4);
  const next = upcoming[0];
  const daysAway = next ? daysFromNow(next.date) : null;

  const pillText =
    daysAway === -1 ? `Tomorrow — ${next?.name}` :
    daysAway === 0  ? `TODAY — ${next?.name} 🙏` :
    daysAway === 1  ? `Yesterday was Ekadashi · Break fast today` :
    next            ? `${next.name} · ${daysAway} days away` : '';

  const pillColor =
    daysAway === 0 ? 'rgba(212,175,55,0.22)' :
    daysAway === 1 ? 'rgba(34,211,238,0.1)'  :
    'rgba(212,175,55,0.08)';
  const pillBorder =
    daysAway === 0 ? 'rgba(212,175,55,0.6)' :
    daysAway === 1 ? 'rgba(34,211,238,0.3)'  :
    'rgba(212,175,55,0.22)';

  const dosha = doshaProfile?.primary || jyotish.primaryDosha || undefined;
  const moonSign = jyotish.moonSign || undefined;

  const s: Record<string, React.CSSProperties> = {
    card: {
      margin: '0 16px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
      transition: 'border-color 0.25s',
      borderColor: open ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.06)',
    },
    topBar: {
      height: 2,
      background: 'linear-gradient(90deg,transparent,#D4AF37 40%,#D4AF37 60%,transparent)',
    },
    scanLine: {
      position: 'absolute', left: 0, right: 0, height: 1, top: 0,
      background: 'linear-gradient(90deg,transparent,rgba(34,211,238,0.3),transparent)',
      animation: 'ekScan 5s linear infinite',
      pointerEvents: 'none', zIndex: 2,
    },
    inner: { padding: '14px 16px' },
    headerRow: {
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
    },
    titleGroup: { flex: 1, minWidth: 0 },
    eyebrow: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 7, fontWeight: 800, letterSpacing: '0.5em',
      textTransform: 'uppercase' as const,
      color: 'rgba(212,175,55,0.45)', marginBottom: 2,
    },
    title: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 15, fontWeight: 900, letterSpacing: '-0.04em', color: '#D4AF37',
    },
    pill: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 11px', borderRadius: 99, marginTop: 7,
      fontSize: 10, fontWeight: 700,
      background: pillColor,
      border: `1px solid ${pillBorder}`,
      color: daysAway === 1 ? '#22D3EE' : '#D4AF37',
    },
    dot: {
      width: 6, height: 6, borderRadius: '50%',
      background: 'currentColor',
      animation: 'ekBlink 1.4s ease-in-out infinite',
    },
    moonOrb: {
      width: 42, height: 42, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%,#D4AF37 0%,rgba(212,175,55,0.2) 55%,transparent 75%)',
      border: '1px solid rgba(212,175,55,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, flexShrink: 0,
      animation: 'ekMoon 3s ease-in-out infinite',
    },
    chevron: {
      fontSize: 10, fontWeight: 800, letterSpacing: '0.3em',
      color: 'rgba(212,175,55,0.35)',
      transition: 'transform 0.3s',
      transform: open ? 'rotate(180deg)' : 'none',
      userSelect: 'none' as const,
    },
    // ── expanded ──
    divider: {
      height: 1,
      background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)',
      margin: '12px 0',
    },
    lbl: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 7, fontWeight: 800, letterSpacing: '0.5em',
      textTransform: 'uppercase' as const,
      color: 'rgba(255,255,255,0.2)', marginBottom: 8,
    },
    countRow: { display: 'flex', gap: 6, marginBottom: 14 },
    countBox: {
      flex: 1, background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12, padding: '8px 4px', textAlign: 'center' as const,
    },
    countNum: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 19, fontWeight: 900, letterSpacing: '-0.05em',
      color: '#D4AF37', lineHeight: 1,
    },
    countLbl: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 7, fontWeight: 800, letterSpacing: '0.4em',
      textTransform: 'uppercase' as const,
      color: 'rgba(255,255,255,0.2)', marginTop: 3,
    },
    list: { display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 14 },
    item: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 12,
    },
    itemName: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)',
    },
    itemDate: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2,
    },
    chipRow: { display: 'flex', gap: 8, marginBottom: 8 },
    chip: {
      flex: 1, background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 12, padding: '8px 10px',
    },
    chipLbl: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 6.5, fontWeight: 800, letterSpacing: '0.5em',
      textTransform: 'uppercase' as const,
      color: 'rgba(255,255,255,0.18)', marginBottom: 4,
    },
    chipVal: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)',
    },
    chipSub: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1, lineHeight: 1.3,
    },
    reco: {
      background: 'rgba(212,175,55,0.04)',
      border: '1px solid rgba(212,175,55,0.1)',
      borderRadius: 14, padding: '12px 12px', marginBottom: 8,
    },
    recoLbl: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 7, fontWeight: 800, letterSpacing: '0.5em',
      textTransform: 'uppercase' as const,
      color: 'rgba(212,175,55,0.45)', marginBottom: 6,
    },
    recoBody: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 12, fontWeight: 400, lineHeight: 1.65,
      color: 'rgba(255,255,255,0.55)',
    },
    shakti: {
      background: 'rgba(34,211,238,0.03)',
      border: '1px solid rgba(34,211,238,0.1)',
      borderRadius: 14, padding: '10px 12px', marginBottom: 10,
    },
    shaktiLbl: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 7, fontWeight: 800, letterSpacing: '0.5em',
      textTransform: 'uppercase' as const,
      color: 'rgba(34,211,238,0.45)',
    },
    shaktiBody: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 11, fontWeight: 400, lineHeight: 1.6,
      color: 'rgba(255,255,255,0.5)', marginTop: 5,
    },
    notif: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 14,
    },
    notifTitle: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
    },
    notifSub: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2,
    },
    toggle: {
      width: 40, height: 22,
      background: 'linear-gradient(135deg,#D4AF37,#B8963E)',
      borderRadius: 99, position: 'relative' as const,
      cursor: 'pointer', flexShrink: 0,
      boxShadow: '0 0 10px rgba(212,175,55,0.3)',
    },
    learnBox: {
      marginTop: 10,
      background: 'rgba(255,255,255,0.015)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 14, padding: '12px 12px',
    },
    learnTitle: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 11, fontWeight: 800, color: '#D4AF37', marginBottom: 8,
    },
    learnBody: {
      fontFamily: 'Montserrat,sans-serif',
      fontSize: 11, fontWeight: 400, lineHeight: 1.7,
      color: 'rgba(255,255,255,0.5)',
    },
  };

  const badge = (paksha: 'Shukla' | 'Krishna') => ({
    display: 'inline-block' as const,
    fontSize: 7, fontWeight: 800 as const, letterSpacing: '0.3em',
    textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: 99,
    background: paksha === 'Shukla' ? 'rgba(212,175,55,0.1)' : 'rgba(34,211,238,0.08)',
    border: paksha === 'Shukla' ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(34,211,238,0.15)',
    color: paksha === 'Shukla' ? '#D4AF37' : '#22D3EE',
  });

  return (
    <>
      <style>{`
        @keyframes ekScan { 0%{top:0;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes ekBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes ekMoon  { 0%,100%{box-shadow:0 0 10px rgba(212,175,55,0.18)} 50%{box-shadow:0 0 24px rgba(212,175,55,0.42)} }
      `}</style>

      <div style={s.card} onClick={() => setOpen(o => !o)}>
        <div style={s.topBar} />
        {open && <div style={s.scanLine} />}
        <div style={s.inner}>

          {/* ── COLLAPSED HEADER (always visible) ── */}
          <div style={s.headerRow}>
            <div style={s.titleGroup}>
              <div style={s.eyebrow}>Lunar Fasting Oracle</div>
              <div style={s.title}>Ekadashi</div>
              <div style={s.pill}>
                <span style={s.dot} />
                {pillText}
              </div>
            </div>
            <div style={s.moonOrb}>🌙</div>
            <div style={s.chevron}>▼</div>
          </div>

          {/* ── EXPANDED CONTENT ── */}
          {open && (
            <div onClick={e => e.stopPropagation()}>
              <div style={s.divider} />

              {/* Countdown */}
              {next && (
                <>
                  <div style={s.lbl}>
                    {daysAway === 0 ? 'Today is Ekadashi' : daysAway === 1 ? 'Break Fast Today' : `Next · ${next.name}`}
                  </div>
                  <div style={s.countRow}>
                    {[
                      { num: Math.abs(daysAway ?? 0), lbl: 'Days' },
                      { num: next.date.getDate(), lbl: 'Date' },
                      { num: next.date.toLocaleString('en',{month:'short'}), lbl: 'Month' },
                      { num: next.date.getFullYear(), lbl: 'Year' },
                    ].map(({ num, lbl }) => (
                      <div key={lbl} style={s.countBox}>
                        <div style={s.countNum}>{num}</div>
                        <div style={s.countLbl}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Upcoming list */}
              <div style={s.lbl}>Upcoming</div>
              <div style={s.list}>
                {upcoming.slice(0, 3).map((e, i) => (
                  <div key={i} style={s.item}>
                    <div>
                      <div style={s.itemName}>{e.name}</div>
                      <div style={s.itemDate}>{fmtDate(e.date)} · {e.paksha === 'Shukla' ? 'Waxing' : 'Waning'} Moon</div>
                    </div>
                    <span style={badge(e.paksha)}>{e.paksha}</span>
                  </div>
                ))}
              </div>

              <div style={s.divider} />

              {/* Personal profile chips */}
              <div style={s.lbl}>Your Profile</div>
              <div style={s.chipRow}>
                <div style={s.chip}>
                  <div style={s.chipLbl}>Dosha</div>
                  <div style={s.chipVal}>{dosha || 'Not set'}</div>
                  <div style={s.chipSub}>{dosha ? 'Your constitution' : 'Complete Ayurveda scan'}</div>
                </div>
                <div style={s.chip}>
                  <div style={s.chipLbl}>Moon Sign</div>
                  <div style={s.chipVal}>{moonSign || 'Not set'}</div>
                  <div style={s.chipSub}>{moonSign ? 'Rashi active' : 'Add birth data'}</div>
                </div>
              </div>
              <div style={{ ...s.chipRow, marginBottom: 10 }}>
                <div style={s.chip}>
                  <div style={s.chipLbl}>Fast Type</div>
                  <div style={s.chipVal}>Phalahar</div>
                  <div style={s.chipSub}>Fruits & milk</div>
                </div>
                <div style={s.chip}>
                  <div style={s.chipLbl}>Shakti Cycle</div>
                  <div style={s.chipVal}>Connect</div>
                  <div style={{ ...s.chipSub, color: '#22D3EE', cursor: 'pointer' }}>+ Link cycle</div>
                </div>
              </div>

              {/* Ayurvedic guidance */}
              <div style={s.reco}>
                <div style={s.recoLbl}>Siddha Guidance · {next?.name || 'Ekadashi'}</div>
                <div style={s.recoBody}>
                  {doshaGuidance(dosha).split(/(\*\*.*?\*\*)/).map((seg, i) =>
                    seg.startsWith('**') ? (
                      <strong key={i} style={{ color: '#D4AF37', fontWeight: 700 }}>
                        {seg.replace(/\*\*/g, '')}
                      </strong>
                    ) : seg
                  )}
                </div>
              </div>

              {/* Women's panel */}
              <div style={s.shakti}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>🌸</span>
                  <span style={s.shaktiLbl}>Shakti Cycle Intelligence</span>
                </div>
                <div style={s.shaktiBody}>
                  Connect your menstrual cycle for personalised guidance.
                  During menstruation, Ekadashi fasting is{' '}
                  <strong style={{ color: '#22D3EE', fontWeight: 700 }}>traditionally optional</strong>
                  {' '}— the body is already in deep cleansing. Rest and light fruits are honoured as the fast itself.
                </div>
              </div>

              {/* Notification toggle */}
              <div style={s.notif}>
                <div>
                  <div style={s.notifTitle}>Ekadashi Reminders</div>
                  <div style={s.notifSub}>1 day before · on the day · day after</div>
                </div>
                <div style={s.toggle}>
                  <div style={{ position: 'absolute', top: 3, left: 21, width: 16, height: 16, background: '#fff', borderRadius: '50%' }} />
                </div>
              </div>

              {/* What is Ekadashi */}
              <div style={s.learnBox}>
                <div style={s.learnTitle}>🌑 What is Ekadashi?</div>
                <div style={s.learnBody}>
                  <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Ekadashi</strong> ("eleven") is the 11th lunar day of both the waxing and waning fortnights — twice per month, 24 times per year.
                  <br /><br />
                  Vedic science holds that on Ekadashi, the moon's gravitational pull draws prana upward. Fasting removes Ama (toxins), rests digestive fire and creates space for{' '}
                  <strong style={{ color: '#D4AF37' }}>higher states of consciousness</strong>.
                  <br /><br />
                  The Siddhas called it the <strong style={{ color: '#D4AF37' }}>portal of prana</strong> — mantras carry 11× power this day.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EkadashiOracleCard;
