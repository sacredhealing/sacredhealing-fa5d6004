import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bot } from 'lucide-react';

const GOLD = '#D4AF37';
const BG = '#050505';

const GLASS =
  'rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

export default function PolymarketBot() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bankroll, setBankroll] = useState('');
  const [winProb, setWinProb] = useState('');
  const [kellyMessage, setKellyMessage] = useState<string | null>(null);

  const pipeline = useMemo(
    () =>
      [
        { emoji: '🔭', titleKey: 'polymarketBot.pipeScanTitle', descKey: 'polymarketBot.pipeScanDesc' },
        { emoji: '📊', titleKey: 'polymarketBot.pipeResearchTitle', descKey: 'polymarketBot.pipeResearchDesc' },
        { emoji: '🔮', titleKey: 'polymarketBot.pipePredictTitle', descKey: 'polymarketBot.pipePredictDesc' },
        { emoji: '🛡️', titleKey: 'polymarketBot.pipeRiskTitle', descKey: 'polymarketBot.pipeRiskDesc' },
        { emoji: '📡', titleKey: 'polymarketBot.pipeSignalTitle', descKey: 'polymarketBot.pipeSignalDesc' },
      ] as const,
    []
  );

  const calculateKelly = () => {
    const b = parseFloat(String(bankroll).replace(/,/g, ''));
    const pPct = parseFloat(String(winProb).replace(/,/g, ''));
    if (!Number.isFinite(b) || b < 0 || !Number.isFinite(pPct)) {
      setKellyMessage(null);
      return;
    }
    const p = Math.min(1, Math.max(0, pPct / 100));
    // Quarter-Kelly: bankroll * ((p*1 - (1-p))/1) * 0.25
    const quarterKelly = b * (p * 1 - (1 - p)) * 0.25;
    if (quarterKelly <= 0) {
      setKellyMessage(t('polymarketBot.recommendedPositionZero'));
      return;
    }
    setKellyMessage(
      t('polymarketBot.recommendedPosition', { amount: formatUsd(quarterKelly) })
    );
  };

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden pb-32 text-white"
      style={{ background: BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 px-4 pt-4">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/income-streams')}
            className="shrink-0 rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04]"
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: GOLD }} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: 'rgba(212,175,55,0.25)',
                  background: 'rgba(212,175,55,0.08)',
                }}
              >
                <Bot className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <h1
                className="font-black tracking-tight text-xl sm:text-2xl"
                style={{ color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.25)' }}
              >
                {t('polymarketBot.title')}
              </h1>
            </div>
            <span
              className="inline-block rounded-full border px-3 py-1 text-[9px] font-extrabold tracking-[0.25em] uppercase"
              style={{
                borderColor: 'rgba(212,175,55,0.35)',
                color: GOLD,
                background: 'rgba(212,175,55,0.06)',
              }}
            >
              {t('polymarketBot.headerBadge')}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className={`${GLASS} mb-4 p-5`}>
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <span className="text-[10px] font-extrabold tracking-[0.35em] text-amber-400/90 uppercase">
              {t('polymarketBot.statusTitle')}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">{t('polymarketBot.statusLine')}</p>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            t('polymarketBot.statWinRate'),
            t('polymarketBot.statSharpe'),
            t('polymarketBot.statMaxDd'),
          ].map((label) => (
            <div key={label} className={`${GLASS} px-4 py-4 text-center`}>
              <p className="text-xs font-black tracking-tight text-white/90">{label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="mb-4">
          <p
            className="mb-3 text-[10px] font-extrabold tracking-[0.45em] uppercase"
            style={{ color: `${GOLD}99` }}
          >
            {t('polymarketBot.pipelineTitle')}
          </p>
          <div className="flex flex-col gap-2">
            {pipeline.map((step) => (
              <div
                key={step.titleKey}
                className={`${GLASS} flex gap-3 p-4`}
              >
                <span className="text-2xl shrink-0" aria-hidden>
                  {step.emoji}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-black tracking-wide text-[#D4AF37]">
                    {t(step.titleKey)}
                  </div>
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kelly */}
        <div className={`${GLASS} mb-6 p-5`}>
          <p
            className="mb-4 text-[10px] font-extrabold tracking-[0.45em] uppercase"
            style={{ color: `${GOLD}99` }}
          >
            {t('polymarketBot.kellyTitle')}
          </p>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">
              {t('polymarketBot.bankrollLabel')}
            </span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={bankroll}
              onChange={(e) => setBankroll(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.08] bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
              placeholder="10000"
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">
              {t('polymarketBot.winProbLabel')}
            </span>
            <input
              type="number"
              min={0}
              max={100}
              inputMode="decimal"
              value={winProb}
              onChange={(e) => setWinProb(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.08] bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
              placeholder="68.4"
            />
          </label>
          <button
            type="button"
            onClick={calculateKelly}
            className="mb-4 w-full rounded-2xl py-4 text-[11px] font-black tracking-[0.2em] uppercase text-[#050505]"
            style={{
              background: 'linear-gradient(135deg,#D4AF37,#F0C040,#D4AF37)',
              boxShadow: '0 0 28px rgba(212,175,55,0.35)',
            }}
          >
            {t('polymarketBot.calculatePosition')}
          </button>
          {kellyMessage && (
            <p className="text-center text-sm font-semibold text-white/80">{kellyMessage}</p>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate('/sqi-chat')}
          className="w-full rounded-[24px] py-4 text-[11px] font-black tracking-[0.25em] uppercase text-[#050505]"
          style={{
            background: 'linear-gradient(135deg,#D4AF37,#F0C040,#D4AF37)',
            boxShadow: '0 0 32px rgba(212,175,55,0.4)',
          }}
        >
          {t('polymarketBot.launchCta')}
        </button>
      </div>
    </div>
  );
}
