import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const HORMONE_CURVES = {
  prog: [5, 4, 3, 2, 1, 3, 6, 10, 12, 14, 16, 18, 20, 22, 20, 30, 50, 70, 85, 90, 88, 82, 75, 65, 50, 35, 20, 8],
  ostr: [10, 12, 14, 16, 20, 28, 38, 52, 65, 75, 80, 85, 90, 95, 85, 70, 60, 55, 55, 58, 55, 52, 48, 45, 42, 38, 28, 15],
  fsh: [8, 12, 18, 25, 30, 35, 40, 45, 40, 35, 30, 25, 20, 18, 15, 12, 10, 8, 8, 9, 9, 8, 8, 9, 12, 18, 25, 12],
  lh: [3, 3, 4, 4, 5, 6, 7, 8, 9, 10, 12, 14, 18, 95, 20, 8, 5, 4, 4, 4, 5, 5, 4, 4, 4, 4, 5, 3],
  test: [20, 20, 22, 24, 26, 30, 36, 44, 52, 60, 68, 76, 82, 88, 78, 68, 58, 50, 44, 40, 38, 36, 34, 32, 30, 28, 24, 20],
} as const;

type HormoneKey = keyof typeof HORMONE_CURVES;

const HORMONE_ORDER: HormoneKey[] = ['prog', 'ostr', 'fsh', 'lh', 'test'];

type WcMineral = {
  icon: string;
  mineral: string;
  food: string;
  amount: string;
  fn: string;
  tags: string[];
  bio: string;
};

type WcPhase = {
  name: string;
  season: string;
  dosha: string;
  icon: string;
  color: string;
  days: string;
  minHeader: string;
  minIntro: string;
  minerals: WcMineral[];
  career: { t: string; d: string }[];
  vedic: { icon: string; t: string; s: string }[];
  chakraText: string;
  chakras: { n: string; c: string }[];
  herb: { name: string; tl: string; steps: string[] };
};

type WcHormone = {
  label: string;
  color: string;
  cls: string;
  title: string;
  sub: string;
  body: { h: string; t: string }[];
  tags: string[];
};

type WomanCodeBundle = {
  ui: {
    badge: string;
    titleLine1: string;
    titleGold: string;
    titleLine2: string;
    subtitle: string;
    sliderLabel: string;
    chartLabel: string;
    careerSectionLabel: string;
    chakraSectionLabel: string;
    moonMilkLabelPrefix: string;
    modalCloseAria: string;
    mineralModalRoleToday: string;
    mineralModalBio: string;
    hormoneLevelDay: string;
    vedicModalSubtitle: string;
    chakraModalSubtitle: string;
    chakraFallback: string;
    tabs: { minerals: string; career: string; vedic: string; moonmilk: string };
    pips: string[];
  };
  phases: WcPhase[];
  hormones: Record<HormoneKey, WcHormone>;
  chakras: Record<string, string>;
  chartLabels: Record<HormoneKey, string>;
};

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ''));
}

function getPhaseIndex(day: number): number {
  if (day <= 5) return 0;
  if (day <= 13) return 1;
  if (day <= 15) return 2;
  return 3;
}

declare global {
  interface Window {
    Chart?: {
      new (
        ctx: CanvasRenderingContext2D,
        config: Record<string, unknown>
      ): { destroy: () => void; data: { datasets: unknown[] }; update: (mode?: string) => void };
    };
  }
}

type HormoneChartProps = {
  currentDay: number;
  chartDatasetLabels: string[];
};

function HormoneChart({ currentDay, chartDatasetLabels }: HormoneChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ReturnType<NonNullable<typeof window.Chart>> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (typeof window === 'undefined') return;

    const buildChart = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !window.Chart) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: 28 }, (_, i) => i + 1),
          datasets: [
            {
              label: chartDatasetLabels[0],
              data: [...HORMONE_CURVES.prog],
              borderColor: '#A78BFA',
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 0,
            },
            {
              label: chartDatasetLabels[1],
              data: [...HORMONE_CURVES.ostr],
              borderColor: '#F472B6',
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 0,
            },
            {
              label: chartDatasetLabels[2],
              data: [...HORMONE_CURVES.fsh],
              borderColor: '#60A5FA',
              borderWidth: 1.5,
              fill: false,
              tension: 0.4,
              pointRadius: 0,
              borderDash: [5, 4],
            },
            {
              label: chartDatasetLabels[3],
              data: [...HORMONE_CURVES.lh],
              borderColor: '#34D399',
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 0,
            },
            {
              label: chartDatasetLabels[4],
              data: [...HORMONE_CURVES.test],
              borderColor: '#FBBF24',
              borderWidth: 1.5,
              fill: false,
              tension: 0.4,
              pointRadius: 0,
              borderDash: [3, 3],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 200 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 }, maxTicksLimit: 8 },
              border: { color: 'transparent' },
            },
            y: { display: false, min: 0, max: 110 },
          },
        },
      });
    };

    if (window.Chart) {
      buildChart();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = buildChart;
      document.head.appendChild(script);
    }

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [chartDatasetLabels]);

  useEffect(() => {
    if (!chartRef.current) return;
    const colors = ['#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FBBF24'];
    const ds = chartRef.current.data.datasets as Array<{
      pointRadius: number | number[];
      pointBackgroundColor: string | string[];
      pointBorderColor: string | string[];
      pointBorderWidth: number;
    }>;
    ds.forEach((d, i) => {
      const radii = Array(28).fill(0);
      radii[currentDay - 1] = 5;
      d.pointRadius = radii;
      d.pointBackgroundColor = colors[i];
      d.pointBorderColor = '#050505';
      d.pointBorderWidth = 2;
    });
    chartRef.current.update('none');
  }, [currentDay]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '140px' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '140px' }} />
    </div>
  );
}

function Modal({
  content,
  onClose,
  closeLabel,
}: {
  content: React.ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#0D0D14',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px',
          padding: '28px 24px',
          maxWidth: '440px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            width: 30,
            height: 30,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
        {content}
      </div>
    </div>
  );
}

export default function WomanCodeDashboard() {
  const { t, i18n } = useTranslation();
  const bundle = useMemo(() => t('womanCode', { returnObjects: true }) as WomanCodeBundle, [t, i18n.language]);

  const [day, setDay] = useState(14);
  const [tab, setTab] = useState<'minerals' | 'career' | 'vedic' | 'moonmilk'>('minerals');
  const [modal, setModal] = useState<React.ReactNode>(null);

  const phaseIdx = getPhaseIndex(day);
  const phase = bundle.phases[phaseIdx];

  const chartDatasetLabels = useMemo(
    () => HORMONE_ORDER.map((k) => bundle.chartLabels[k]),
    [bundle.chartLabels]
  );

  const openModal = (content: React.ReactNode) => setModal(content);
  const closeModal = () => setModal(null);

  const s = {
    gold: '#D4AF37',
    glass: {
      background: 'rgba(255,255,255,0.025)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '28px',
      padding: '20px',
      marginBottom: '12px',
    },
    glassSm: {
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      padding: '16px',
    },
    label: {
      fontSize: '7px',
      fontWeight: 800,
      letterSpacing: '0.45em',
      textTransform: 'uppercase' as const,
      color: '#D4AF37',
      display: 'block',
      marginBottom: '10px',
    },
    bodySm: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 },
    tag: {
      display: 'inline-block',
      fontSize: '9px',
      fontWeight: 700,
      padding: '2px 9px',
      borderRadius: '20px',
      margin: '2px',
      background: 'rgba(212,175,55,0.1)',
      color: '#D4AF37',
      border: '1px solid rgba(212,175,55,0.2)',
    },
  };

  const openMineral = (m: WcMineral) =>
    openModal(
      <div>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{m.icon}</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: s.gold,
            letterSpacing: '-0.03em',
            marginBottom: 4,
          }}
        >
          {m.food}
        </div>
        <div
          style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 16,
          }}
        >
          {m.mineral}
        </div>
        <div
          style={{
            background: 'rgba(212,175,55,0.07)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: s.gold,
              marginBottom: 6,
            }}
          >
            {bundle.ui.mineralModalRoleToday}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{m.fn}</div>
        </div>
        <div
          style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 10,
          }}
        >
          {bundle.ui.mineralModalBio}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 14 }}>{m.bio}</p>
        <div>
          {m.tags.map((tag) => (
            <span key={tag} style={s.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );

  const openHormone = (key: HormoneKey) => {
    const h = bundle.hormones[key];
    const val = Math.round(HORMONE_CURVES[key][day - 1]);
    openModal(
      <div>
        <div
          style={{ fontSize: 22, fontWeight: 900, color: h.color, letterSpacing: '-0.03em', marginBottom: 4 }}
        >
          {h.label}
        </div>
        <div
          style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 16,
          }}
        >
          {h.sub}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: h.color }}>
              {interpolate(bundle.ui.hormoneLevelDay, { day })}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: h.color }}>{val}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 7, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 7,
                background: h.color,
                width: `${val}%`,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
        {h.body.map((b, i) => (
          <p key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 10 }}>
            <strong style={{ color: 'rgba(255,255,255,0.88)' }}>{b.h}: </strong>
            {b.t}
          </p>
        ))}
        <div style={{ marginTop: 12 }}>
          {h.tags.map((tag) => (
            <span key={tag} style={s.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const openVedic = (v: { icon: string; t: string; s: string }) =>
    openModal(
      <div>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{v.icon}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: s.gold, letterSpacing: '-0.03em', marginBottom: 4 }}>
          {v.t}
        </div>
        <div
          style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 16,
          }}
        >
          {interpolate(bundle.ui.vedicModalSubtitle, { phase: phase.name })}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75 }}>{v.s}</p>
      </div>
    );

  const openChakra = (name: string, color: string) =>
    openModal(
      <div>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔮</div>
        <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.03em', marginBottom: 4 }}>{name}</div>
        <div
          style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 16,
          }}
        >
          {bundle.ui.chakraModalSubtitle}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75 }}>
          {bundle.chakras[name] || bundle.ui.chakraFallback}
        </p>
      </div>
    );

  const TABS = useMemo(
    () =>
      [
        { id: 'minerals' as const, label: bundle.ui.tabs.minerals },
        { id: 'career' as const, label: bundle.ui.tabs.career },
        { id: 'vedic' as const, label: bundle.ui.tabs.vedic },
        { id: 'moonmilk' as const, label: bundle.ui.tabs.moonmilk },
      ],
    [bundle.ui.tabs]
  );

  const pipLabels = bundle.ui.pips;

  return (
    <div
      style={{
        background: '#050505',
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        color: '#fff',
        padding: '0 0 80px',
      }}
    >
      <div style={{ textAlign: 'center', padding: '28px 16px 20px' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: '7px',
            fontWeight: 800,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: s.gold,
            border: '1px solid rgba(212,175,55,0.25)',
            padding: '5px 16px',
            borderRadius: 40,
            background: 'rgba(212,175,55,0.1)',
            marginBottom: 14,
          }}
        >
          {bundle.ui.badge}
        </div>
        <h1 style={{ fontSize: 'clamp(22px,5vw,36px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 10 }}>
          {bundle.ui.titleLine1}
          <span style={{ color: s.gold }}>{bundle.ui.titleGold}</span>
          <br />
          {bundle.ui.titleLine2}
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
          {bundle.ui.subtitle}
        </p>
      </div>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: '0 14px' }}>
        <div style={s.glass}>
          <span style={s.label}>{bundle.ui.sliderLabel}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: s.gold,
                lineHeight: 1,
                minWidth: 72,
              }}
            >
              {day}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>{phase.name}</div>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.38)',
                }}
              >
                {phase.dosha}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22 }}>{phase.icon}</div>
              <div
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: phase.color,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                {phase.season}
              </div>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={28}
            value={day}
            aria-label={bundle.ui.sliderLabel}
            onChange={(e) => setDay(+e.target.value)}
            style={{ width: '100%', accentColor: s.gold, cursor: 'pointer', height: 4 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {pipLabels.map((l, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setDay(i === 0 ? 3 : i === 1 ? 9 : i === 2 ? 14 : 22)}
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: phaseIdx === i ? s.gold : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'color 0.3s',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={s.glass}>
          <span style={s.label}>{bundle.ui.chartLabel}</span>
          <HormoneChart currentDay={day} chartDatasetLabels={chartDatasetLabels} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {HORMONE_ORDER.map((key) => {
              const h = bundle.hormones[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openHormone(key)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 40,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    background: `${h.color}18`,
                    color: h.color,
                    border: `1px solid ${h.color}44`,
                    fontFamily: 'inherit',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {TABS.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              style={{
                flex: 1,
                minWidth: 70,
                padding: '10px 8px',
                border:
                  tab === tb.id ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 40,
                background: tab === tb.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: tab === tb.id ? s.gold : 'rgba(255,255,255,0.55)',
                fontFamily: 'inherit',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {tab === 'minerals' && (
          <div>
            <div style={{ ...s.glassSm, marginBottom: 12 }}>
              <span style={s.label}>⟁ {phase.minHeader}</span>
              <p style={s.bodySm}>{phase.minIntro}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {phase.minerals.map((m, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => openMineral(m)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') openMineral(m);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 22,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                    e.currentTarget.style.background = 'rgba(212,175,55,0.07)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>
                    ›
                  </span>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{m.icon}</div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: s.gold,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {m.mineral}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{m.food}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginBottom: 8 }}>{m.amount}</div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 8 }}>{m.fn}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {m.tags.map((tg) => (
                      <span
                        key={tg}
                        style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.5)',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'career' && (
          <div style={s.glass}>
            <span style={s.label}>{bundle.ui.careerSectionLabel}</span>
            {phase.career.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 0',
                  borderBottom: i < phase.career.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: s.gold,
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{c.t}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{c.d}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'vedic' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10, marginBottom: 12 }}>
              {phase.vedic.map((v, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => openVedic(v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') openVedic(v);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 22,
                    padding: 18,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{v.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{v.t}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{v.s}</div>
                </div>
              ))}
            </div>
            <div style={s.glassSm}>
              <span style={s.label}>{bundle.ui.chakraSectionLabel}</span>
              <p style={{ ...s.bodySm, marginBottom: 12 }}>{phase.chakraText}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {phase.chakras.map((c) => (
                  <button
                    type="button"
                    key={c.n}
                    onClick={() => openChakra(c.n, c.c)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 40,
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      background: `${c.c}18`,
                      color: c.c,
                      border: `1px solid ${c.c}44`,
                      transition: 'transform 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {c.n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'moonmilk' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02))',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 28,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: '7px',
                fontWeight: 800,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: s.gold,
                marginBottom: 14,
              }}
            >
              {bundle.ui.moonMilkLabelPrefix}
              {phase.name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: s.gold, marginBottom: 4 }}>
              {phase.herb.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>{phase.herb.tl}</div>
            {phase.herb.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(212,175,55,0.12)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 800,
                    color: s.gold,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, paddingTop: 3 }}>{step}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal ? <Modal content={modal} onClose={closeModal} closeLabel={bundle.ui.modalCloseAria} /> : null}
    </div>
  );
}
