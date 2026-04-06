import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SYSTEM_PROMPT = `You are an AI-powered Prediction Market Trading Bot built on Claude Skills architecture. You analyze prediction markets on Polymarket and Kalshi, estimate true event probabilities, calculate Kelly Criterion position sizes, and provide actionable trade signals.

You have five core skills:

1. SCAN: Analyze markets for liquidity (min 200 contracts), volume, time to resolution (max 30 days), and anomalies (price moves >10%, spreads >5¢, volume spikes vs 7-day avg).

2. RESEARCH: Synthesize news, sentiment, and information to estimate true probability. Identify narrative vs market price gaps.

3. PREDICT: Calculate edge = p_model - p_market. Only signal trades when edge > 4%. Use ensemble reasoning. Report confidence and Brier calibration notes.

4. RISK: Apply Kelly Criterion: f* = (p*b - q) / b. Always use Quarter-Kelly (multiply by 0.25). Enforce: max 5% bankroll per trade, max 15 concurrent positions, max 15% daily loss limit, max $50/day API costs. Run all 5 risk checks before any signal.

5. COMPOUND: After each trade analysis, log lessons, classify failure modes, update knowledge.

RESPONSE FORMAT — always structure your output with these labeled sections:
📡 SCAN — market details, liquidity, volume, flags
🔬 RESEARCH — information sources, sentiment, narrative summary  
🎯 PREDICT — p_model, p_market, edge%, EV, mispricing Z-score, confidence level
⚖️ RISK — Kelly calculation, recommended position size, all 5 risk checks (PASS/FAIL)
✅ SIGNAL — BUY YES / BUY NO / NO TRADE with reasoning
📚 LESSON — what to track or watch for on this trade

FORMULAS to use:
- Edge: p_model - p_market (trade only if > 0.04)
- EV: p * b - (1 - p) where b = decimal odds - 1
- Kelly: f* = (p*b - q) / b, then multiply by 0.25 for Quarter-Kelly
- Brier Score target: < 0.25
- Mispricing Score: (p_model - p_market) / 0.1 as estimated std dev

RISK CHECKS (all must pass):
1. Edge Check: edge > 4% ✓/✗
2. Position Size: within Quarter-Kelly ✓/✗
3. Exposure Check: total exposure < 15% bankroll ✓/✗
4. VaR Check: 95% confidence daily VaR within limits ✓/✗
5. Drawdown Check: current drawdown < 8% ✓/✗

Be precise, numerical, and decisive. If data is insufficient, say what information would change the signal. Never generate a BUY signal unless all 5 risk checks pass. This is for educational purposes — always include a brief disclaimer on speculative risk.`;

const STARTER_PROMPTS: { labelKey: string; prompt: string }[] = [
  {
    labelKey: 'predictionMarketBot.starterFedLabel',
    prompt:
      'Analyze this market: Will the Fed cut rates at the December 2025 meeting? Current market price: YES at 52¢. My bankroll is $5,000.',
  },
  {
    labelKey: 'predictionMarketBot.starterBtcLabel',
    prompt:
      'Analyze: Will Bitcoin close above $100,000 on December 31, 2025? Market is pricing YES at 61¢. Bankroll: $2,000.',
  },
  {
    labelKey: 'predictionMarketBot.starterWeatherLabel',
    prompt:
      'Analyze a weather market: Will it rain more than 0.1 inches in NYC on Friday? Market: YES at 34¢. Bankroll: $1,000.',
  },
  {
    labelKey: 'predictionMarketBot.starterKellyLabel',
    prompt:
      'Explain the Kelly Criterion formula with a worked example. I have $10,000 bankroll, 68% win probability, and 1.8:1 reward/risk ratio. What\'s my Quarter-Kelly position size?',
  },
];

type Role = 'user' | 'assistant';
interface ChatMessage {
  role: Role;
  content: string;
}

const GOLD = '#D4AF37';
const BG = '#050505';

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        const isSectionHeader = /^[📡🔬🎯⚖️✅📚]/.test(line);
        const isCheckLine =
          line.includes('✓') || line.includes('✗') || line.includes('PASS') || line.includes('FAIL');
        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•');

        let processed = line
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff">$1</strong>')
          .replace(
            /`(.*?)`/g,
            '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;color:#22d3ee">$1</code>'
          );

        if (isSectionHeader) {
          return (
            <div
              key={i}
              className="my-4 mb-2 rounded-r-lg border-l-[3px] py-2 pl-3.5 pr-3 text-[13px] font-bold tracking-wide"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderLeftColor: GOLD,
                color: GOLD,
              }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: processed }}
            />
          );
        }

        if (isCheckLine) {
          const passed = line.includes('✓') || line.includes('PASS');
          return (
            <div
              key={i}
              className="flex items-center gap-2 py-0.5 text-[13px]"
              style={{ color: passed ? '#4ade80' : '#f87171' }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: processed }}
            />
          );
        }

        if (isBullet) {
          return (
            <div
              key={i}
              className="mb-0.5 pl-4 text-[13px] text-white/[0.75]"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `• ${processed.replace(/^[-•]\s*/, '')}`,
              }}
            />
          );
        }

        return (
          <div
            key={i}
            className="mb-0.5 text-[13px] text-white/[0.8]"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: processed }}
          />
        );
      })}
    </div>
  );
}

export default function PredictionMarketBot() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bankroll, setBankroll] = useState('5000');
  const [stats, setStats] = useState({ signals: 0, buys: 0, noTrade: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;
      setInput('');

      const userMsg: ChatMessage = { role: 'user', content: msg };
      const history = [...messages, userMsg];
      setMessages(history);
      setLoading(true);

      const bankrollClean = bankroll.replace(/\D/g, '') || '0';
      const baseInstruction = `${SYSTEM_PROMPT}\n\nUser's current bankroll: $${bankrollClean}. Every response must follow the RESPONSE FORMAT sections.`;

      const recent = history.slice(-28);
      const apiMessages = [
        { role: 'user' as const, content: baseInstruction },
        {
          role: 'assistant' as const,
          content:
            'Understood. I will apply the five core skills, Quarter-Kelly sizing, and all five risk checks on each analysis.',
        },
        ...recent.map((m) => ({ role: m.role, content: m.content })),
      ];

      try {
        const { data, error } = await supabase.functions.invoke<{ response?: string }>('gemini-bridge', {
          body: {
            messages: apiMessages,
            feature: 'prediction_market_bot',
            model: 'gemini-2.0-flash',
          },
        });

        if (error) throw error;

        const reply =
          data?.response?.trim() || t('predictionMarketBot.errorNoResponse');

        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

        setStats((prev) => ({
          signals: prev.signals + 1,
          buys:
            prev.buys +
            (reply.includes('BUY YES') || reply.includes('BUY NO') ? 1 : 0),
          noTrade: prev.noTrade + (reply.includes('NO TRADE') ? 1 : 0),
        }));
      } catch (e) {
        console.error(e);
        toast.error(t('predictionMarketBot.toastErrorTitle'), {
          description: t('predictionMarketBot.toastErrorDesc'),
        });
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: t('predictionMarketBot.errorApi') },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, bankroll, t]
  );

  const pipelineSteps = [
    { icon: '📡', labelKey: 'predictionMarketBot.pipeScan', subKey: 'predictionMarketBot.pipeScanSub' },
    { icon: '🔬', labelKey: 'predictionMarketBot.pipeResearch', subKey: 'predictionMarketBot.pipeResearchSub' },
    { icon: '🎯', labelKey: 'predictionMarketBot.pipePredict', subKey: 'predictionMarketBot.pipePredictSub' },
    { icon: '⚖️', labelKey: 'predictionMarketBot.pipeRisk', subKey: 'predictionMarketBot.pipeRiskSub' },
    { icon: '✅', labelKey: 'predictionMarketBot.pipeSignal', subKey: 'predictionMarketBot.pipeSignalSub' },
  ];

  const metrics = [
    { labelKey: 'predictionMarketBot.metricWin', valKey: 'predictionMarketBot.metricWinVal' },
    { labelKey: 'predictionMarketBot.metricSharpe', valKey: 'predictionMarketBot.metricSharpeVal' },
    { labelKey: 'predictionMarketBot.metricDd', valKey: 'predictionMarketBot.metricDdVal' },
    { labelKey: 'predictionMarketBot.metricEdge', valKey: 'predictionMarketBot.metricEdgeVal' },
  ];

  const loadingLines = [
    'predictionMarketBot.loadingScan',
    'predictionMarketBot.loadingResearch',
    'predictionMarketBot.loadingPredict',
    'predictionMarketBot.loadingRisk',
    'predictionMarketBot.loadingSignal',
  ];

  return (
    <div
      className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden text-white"
      style={{
        background: BG,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 55%)',
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 backdrop-blur-xl"
        style={{ background: 'rgba(5,5,5,0.85)' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/polymarket-bot')}
            className="shrink-0 rounded-xl border border-white/[0.08] p-2 hover:bg-white/[0.04]"
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: GOLD }} />
          </button>
          <div className="relative h-2 w-2 shrink-0 rounded-full bg-[#D4AF37]">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#D4AF37] opacity-60" />
          </div>
          <div className="min-w-0">
            <div
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: GOLD }}
            >
              {t('predictionMarketBot.headerTitle')}
            </div>
            <div className="truncate text-[9px] tracking-widest text-white/30">
              {t('predictionMarketBot.headerSub')}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex gap-4">
            {[
              { labelKey: 'predictionMarketBot.statSignals', val: stats.signals, color: '#fff' },
              { labelKey: 'predictionMarketBot.statBuy', val: stats.buys, color: GOLD },
              { labelKey: 'predictionMarketBot.statNoTrade', val: stats.noTrade, color: '#fb923c' },
            ].map((s) => (
              <div key={s.labelKey} className="text-center">
                <div className="text-[15px] font-bold" style={{ color: s.color }}>
                  {s.val}
                </div>
                <div className="text-[8px] tracking-widest text-white/30 uppercase">
                  {t(s.labelKey)}
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <span className="text-[10px] text-white/40">{t('predictionMarketBot.bankroll')}</span>
            <input
              value={bankroll}
              onChange={(e) => setBankroll(e.target.value.replace(/\D/g, ''))}
              className="w-20 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-center text-xs font-bold outline-none focus:border-[#D4AF37]/40"
              style={{ color: GOLD }}
              inputMode="numeric"
              aria-label={t('predictionMarketBot.bankroll')}
            />
          </label>
        </div>
      </header>

      {/* Pipeline strip */}
      <div
        className="z-10 flex gap-0 overflow-x-auto border-b border-white/[0.04] scrollbar-thin"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      >
        {pipelineSteps.map((step, i) => (
          <div
            key={step.labelKey}
            className="flex min-w-[76px] flex-1 items-center gap-1.5 border-r border-white/[0.04] px-2 py-2 last:border-r-0 sm:px-3"
          >
            <span className="text-xs">{step.icon}</span>
            <div className="min-w-0">
              <div className="text-[8px] font-bold tracking-[0.12em] text-white/50 uppercase">
                {t(step.labelKey)}
              </div>
              <div className="text-[8px] text-white/25">{t(step.subKey)}</div>
            </div>
            {i < 4 && <span className="ml-auto text-white/15 sm:inline hidden">→</span>}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-[640px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className="mb-7 rounded-xl border p-5"
              style={{
                borderColor: 'rgba(212,175,55,0.2)',
                background: 'rgba(212,175,55,0.03)',
              }}
            >
              <div
                className="mb-2 text-[11px] font-bold tracking-[0.15em] uppercase"
                style={{ color: GOLD }}
              >
                {t('predictionMarketBot.systemReady')}
              </div>
              <p className="mb-3 text-[13px] leading-relaxed text-white/60">
                {t('predictionMarketBot.systemReadyBody')}
              </p>
              <div className="flex flex-wrap gap-4">
                {metrics.map((m) => (
                  <div key={m.labelKey}>
                    <div className="text-sm font-bold text-white">{t(m.valKey)}</div>
                    <div className="text-[9px] tracking-widest text-white/30 uppercase">
                      {t(m.labelKey)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-2 text-[10px] tracking-widest text-white/25 uppercase">
              {t('predictionMarketBot.quickStart')}
            </div>
            <div className="flex flex-col gap-2">
              {STARTER_PROMPTS.map((s) => (
                <button
                  key={s.labelKey}
                  type="button"
                  onClick={() => void send(s.prompt)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-left text-xs text-white/70 transition-colors hover:border-[#D4AF37]/25 hover:bg-[#D4AF37]/[0.06] hover:text-white"
                >
                  <span>{t(s.labelKey)}</span>
                  <span className="text-white/20">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="mx-auto mb-4 max-w-[700px] animate-in fade-in slide-in-from-bottom-1 duration-200">
            {m.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-br-sm border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85">
                  {m.content}
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl rounded-bl-sm border border-white/[0.06] border-l-2 bg-black/30 py-4 pr-4 pl-[18px]"
                style={{ borderLeftColor: GOLD }}
              >
                <div
                  className="mb-2.5 text-[9px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: GOLD }}
                >
                  {t('predictionMarketBot.botAnalysis')}
                </div>
                <MarkdownRenderer text={m.content} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="mx-auto mb-4 max-w-[700px] animate-in fade-in duration-200">
            <div
              className="rounded-xl rounded-bl-sm border border-white/[0.06] border-l-2 bg-black/30 py-4 pr-4 pl-[18px]"
              style={{ borderLeftColor: GOLD }}
            >
              <div
                className="mb-3 text-[9px] font-bold tracking-[0.15em] uppercase"
                style={{ color: GOLD }}
              >
                {t('predictionMarketBot.runningPipeline')}
              </div>
              <div className="flex flex-col gap-1.5">
                {loadingLines.map((key, idx) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 text-[11px] text-white/40"
                    style={{ animationDelay: `${idx * 0.12}s` }}
                  >
                    <span className="relative flex h-1 w-1">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-70" />
                      <span className="relative inline-flex h-1 w-1 rounded-full bg-[#D4AF37]" />
                    </span>
                    {t(key)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="sticky bottom-0 z-20 border-t border-white/[0.06] px-3 py-3 backdrop-blur-xl sm:px-4"
        style={{ background: 'rgba(5,5,5,0.92)' }}
      >
        <div className="mx-auto flex max-w-[700px] flex-col gap-2 sm:flex-row sm:items-end sm:gap-2.5">
          <div className="relative min-w-0 flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t('predictionMarketBot.inputPlaceholder')}
              rows={2}
              className="w-full resize-none rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/35"
            />
          </div>
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="w-full shrink-0 rounded-[10px] px-4 py-2.5 text-xs font-bold tracking-widest uppercase transition-opacity disabled:cursor-not-allowed sm:w-auto sm:min-w-[120px]"
            style={{
              background:
                loading || !input.trim() ? 'rgba(255,255,255,0.06)' : GOLD,
              color: loading || !input.trim() ? 'rgba(255,255,255,0.25)' : '#050505',
            }}
          >
            {loading ? '…' : t('predictionMarketBot.analyze')}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-[700px] text-center text-[8px] tracking-widest text-white/25 uppercase">
          {t('predictionMarketBot.disclaimer')}
        </p>
      </div>
    </div>
  );
}
