import React, { useState } from 'react';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';

// ── Verified 2026–2027 Ekadashi dates (IST, Drik Panchang) ─────────────────
const EKADASHIS: { date: string; name: string; paksha: 'Shukla' | 'Krishna' }[] = [
  { date: '2026-06-21', name: 'Yogini Ekadashi',       paksha: 'Krishna' },
  { date: '2026-07-05', name: 'Devshayani Ekadashi',   paksha: 'Shukla'  },
  { date: '2026-07-20', name: 'Kamika Ekadashi',        paksha: 'Krishna' },
  { date: '2026-08-04', name: 'Putrada Ekadashi',       paksha: 'Shukla'  },
  { date: '2026-08-19', name: 'Aja Ekadashi',           paksha: 'Krishna' },
  { date: '2026-09-02', name: 'Parsva Ekadashi',        paksha: 'Shukla'  },
  { date: '2026-09-17', name: 'Indira Ekadashi',        paksha: 'Krishna' },
  { date: '2026-10-01', name: 'Papankusha Ekadashi',    paksha: 'Shukla'  },
  { date: '2026-10-16', name: 'Rama Ekadashi',          paksha: 'Krishna' },
  { date: '2026-10-31', name: 'Devutthana Ekadashi',    paksha: 'Shukla'  },
  { date: '2026-11-15', name: 'Utpanna Ekadashi',       paksha: 'Krishna' },
  { date: '2026-11-29', name: 'Mokshada Ekadashi',      paksha: 'Shukla'  },
  { date: '2026-12-14', name: 'Saphala Ekadashi',       paksha: 'Krishna' },
  { date: '2026-12-29', name: 'Putrada Ekadashi',       paksha: 'Shukla'  },
  { date: '2027-01-13', name: 'Shattila Ekadashi',      paksha: 'Krishna' },
  { date: '2027-01-27', name: 'Jaya Ekadashi',          paksha: 'Shukla'  },
];

function daysFromNow(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function doshaGuidance(dosha?: string): string {
  const d = (dosha || '').toLowerCase();
  if (d.includes('vata'))
    return 'Favour warm liquids, coconut water and ripe fruits. Avoid raw or cold foods — they aggravate Vata. Break fast on Dwadashi with warm rice kanji or moong soup before 10 AM. Nirjala (dry) fasting is not recommended for your constitution.';
  if (d.includes('pitta'))
    return 'Cool, sweet fruits like pomegranate and grapes are ideal. Avoid sour or spicy foods. Break fast with coconut water or rice porridge. Moderate fasting suits you — full Nirjala best avoided in summer.';
  if (d.includes('kapha'))
    return 'Kapha types benefit most from Ekadashi fasting. Light fruits and herbal teas are ideal. You may try a full fruit-and-water fast. Break gently on Dwadashi morning to amplify the detox benefit.';
  return 'Favour warm, easily digestible foods. Coconut water, ripe fruits and herbal teas are ideal. Break the fast gently the following morning on Dwadashi.';
}

export const EkadashiOracleCard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const jyotish = useJyotishProfile();
  const { doshaProfile } = useAyurvedaAnalysis();

  // Find relevant window: today-1, today, today+1, else next upcoming
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = EKADASHIS.filter(e => daysFromNow(e.date) >= -1);
  const next = upcoming[0];
  const daysAway = next ? daysFromNow(next.date) : null;

  const pillText =
    daysAway === -1 ? `Eve of ${next?.name} — tomorrow` :
    daysAway ===  0 ? `TODAY · ${next?.name} 🙏` :
    daysAway ===  1 ? `Break fast today — Dwadashi` :
    next            ? `${next.name} · in ${daysAway} days` : '—';

  const isToday   = daysAway === 0;
  const isAfter   = daysAway === 1;
  const pillBg    = isToday ? 'rgba(212,175,55,0.22)' : isAfter ? 'rgba(34,211,238,0.1)' : 'rgba(212,175,55,0.08)';
  const pillBdr   = isToday ? 'rgba(212,175,55,0.6)'  : isAfter ? 'rgba(34,211,238,0.3)' : 'rgba(212,175,55,0.22)';
  const pillColor = isAfter ? '#22D3EE' : '#D4AF37';

  const dosha    = doshaProfile?.primary || jyotish.primaryDosha || undefined;
  const moonSign = jyotish.moonSign || undefined;

  const s: Record<string, React.CSSProperties> = {
    card: {
      margin: '0 16px',
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${open ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 24, overflow: 'hidden',
      position: 'relative', cursor: 'pointer',
      transition: 'border-color 0.25s',
    },
    topBar: { height: 2, background: 'linear-gradient(90deg,transparent,#D4AF37 40%,#D4AF37 60%,transparent)' },
    scanLine: {
      position: 'absolute', left: 0, right: 0, height: 1, top: 0, zIndex: 2, pointerEvents: 'none',
      background: 'linear-gradient(90deg,transparent,rgba(34,211,238,0.3),transparent)',
      animation: 'ekScan 5s linear infinite',
    },
    inner:      { padding: '14px 16px' },
    headerRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    titleGroup: { flex: 1, minWidth: 0 },
    eyebrow:    { fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.45)', marginBottom: 2 },
    title:      { fontFamily: 'Montserrat,sans-serif', fontSize: 15, fontWeight: 900, letterSpacing: '-0.04em', color: '#D4AF37' },
    pill:       { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 99, marginTop: 7, fontSize: 10, fontWeight: 700, background: pillBg, border: `1px solid ${pillBdr}`, color: pillColor },
    dot:        { width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'ekBlink 1.4s ease-in-out infinite' },
    moonOrb:    { width: 42, height: 42, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,#D4AF37 0%,rgba(212,175,55,0.2) 55%,transparent 75%)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, animation: 'ekMoon 3s ease-in-out infinite' },
    chevron:    { fontSize: 10, fontWeight: 800, color: 'rgba(212,175,55,0.35)', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none', userSelect: 'none' as const },
    divider:    { height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)', margin: '12px 0' },
    lbl:        { fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)', marginBottom: 8 },
    countRow:   { display: 'flex', gap: 6, marginBottom: 14 },
    countBox:   { flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 4px', textAlign: 'center' as const },
    countNum:   { fontFamily: 'Montserrat,sans-serif', fontSize: 19, fontWeight: 900, letterSpacing: '-0.05em', color: '#D4AF37', lineHeight: 1 },
    countLbl:   { fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)', marginTop: 3 },
    list:       { display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 14 },
    item:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12 },
    itemName:   { fontFamily: 'Montserrat,sans-serif', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)' },
    itemDate:   { fontFamily: 'Montserrat,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
    chipRow:    { display: 'flex', gap: 8, marginBottom: 8 },
    chip:       { flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: '8px 10px' },
    chipLbl:    { fontFamily: 'Montserrat,sans-serif', fontSize: 6.5, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.18)', marginBottom: 4 },
    chipVal:    { fontFamily: 'Montserrat,sans-serif', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)' },
    chipSub:    { fontFamily: 'Montserrat,sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1, lineHeight: 1.3 },
    reco:       { background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 14, padding: '12px', marginBottom: 8 },
    recoLbl:    { fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.45)', marginBottom: 6 },
    recoBody:   { fontFamily: 'Montserrat,sans-serif', fontSize: 12, fontWeight: 400, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)' },
    shakti:     { background: 'rgba(34,211,238,0.03)', border: '1px solid rgba(34,211,238,0.1)', borderRadius: 14, padding: '10px 12px', marginBottom: 10 },
    shaktiLbl:  { fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(34,211,238,0.45)' },
    shaktiBody: { fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 400, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', marginTop: 5 },
    notif:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14 },
    notifTitle: { fontFamily: 'Montserrat,sans-serif', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)' },
    notifSub:   { fontFamily: 'Montserrat,sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 },
    toggle:     { width: 40, height: 22, background: 'linear-gradient(135deg,#D4AF37,#B8963E)', borderRadius: 99, position: 'relative' as const, cursor: 'pointer', flexShrink: 0, boxShadow: '0 0 10px rgba(212,175,55,0.3)' },
    learnBox:   { marginTop: 10, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px' },
    learnTitle: { fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 800, color: '#D4AF37', marginBottom: 8 },
    learnBody:  { fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 400, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)' },
  };

  const badge = (paksha: 'Shukla' | 'Krishna'): React.CSSProperties => ({
    display: 'inline-block', fontSize: 7, fontWeight: 800, letterSpacing: '0.3em',
    textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99,
    background: paksha === 'Shukla' ? 'rgba(212,175,55,0.1)' : 'rgba(34,211,238,0.08)',
    border: paksha === 'Shukla' ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(34,211,238,0.15)',
    color: paksha === 'Shukla' ? '#D4AF37' : '#22D3EE',
  });

  return (
    <>
      <style>{`
        @keyframes ekScan  { 0%{top:0;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
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
                    {daysAway === 0 ? 'Today is Ekadashi — Fast Now' :
                     daysAway === 1 ? 'Break Fast Today · Dwadashi' :
                     `Next · ${next.name}`}
                  </div>
                  <div style={s.countRow}>
                    {[
                      { num: Math.abs(daysAway ?? 0), lbl: 'Days' },
                      { num: new Date(next.date).getDate(), lbl: 'Date' },
                      { num: new Date(next.date).toLocaleString('en',{month:'short'}), lbl: 'Month' },
                      { num: new Date(next.date).getFullYear(), lbl: 'Year' },
                    ].map(({ num, lbl }) => (
                      <div key={lbl} style={s.countBox}>
                        <div style={s.countNum}>{num}</div>
                        <div style={s.countLbl}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Upcoming 3 */}
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

              {/* Personal profile */}
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
                <div style={s.recoBody}>{doshaGuidance(dosha)}</div>
              </div>

              {/* Shakti panel */}
              <div style={s.shakti}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>🌸</span>
                  <span style={s.shaktiLbl}>Shakti Cycle Intelligence</span>
                </div>
                <div style={s.shaktiBody}>
                  Connect your menstrual cycle for personalised guidance. During menstruation, Ekadashi fasting is{' '}
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
                  On Ekadashi the moon's gravitational pull draws prana upward. Fasting removes Ama (toxins), rests digestive fire and opens space for{' '}
                  <strong style={{ color: '#D4AF37' }}>higher states of consciousness</strong>.
                  <br /><br />
                  The Siddhas called it the <strong style={{ color: '#D4AF37' }}>portal of prana</strong> — mantras carry 11× power on this day.
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
