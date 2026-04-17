import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Brain,
  Search,
  RefreshCw,
  Zap,
  Target,
  Shield,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { polymarketService } from '@/services/polymarketService';

// ─── SQI 2050 tokens ──────────────────────────────────────────────────────────
const G = '#D4AF37';
const CYAN = '#22D3EE';
const GREEN = '#2ECC71';
const RED = '#FF4757';
const BG = '#050505';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Market {
  id: string;
  question: string;
  outcomes: { name: string; price: number; tokenId: string }[];
  liquidity: number;
  volume: number;
  endDate: string;
  slug: string;
}

interface Signal {
  id: string;
  market: Market;
  recommendation: 'BUY_YES' | 'BUY_NO' | 'AVOID';
  outcome: string;
  currentPrice: number;
  targetPrice: number;
  confidence: number;
  kellySize: number;
  reasoning: string;
  edge: string;
  strategy: string;
  timestamp: Date;
}

// ─── Kelly calculator ─────────────────────────────────────────────────────────
function calcKelly(balance: number, winProb: number, currentPrice: number): number {
  if (winProb <= 0 || currentPrice <= 0 || currentPrice >= 1) return 0;
  const winPayout = (1 - currentPrice) / currentPrice;
  const loseProb = 1 - winProb;
  const fullKelly = (winProb * winPayout - loseProb) / winPayout;
  if (fullKelly <= 0) return 0;
  const quarterKelly = fullKelly * 0.25;
  return Math.min(50, Math.max(0.5, parseFloat((balance * quarterKelly).toFixed(2))));
}

// ─── Fetch markets via shared polymarket-proxy (polymarketService) ────────────
async function fetchMarketsMapped(limit = 50): Promise<Market[]> {
  const fetched = await polymarketService.fetchMarkets(limit);
  return fetched.map((m) => ({
    id: m.id,
    question: m.question,
    liquidity: m.liquidity,
    volume: m.volume,
    endDate: m.endDate,
    slug: m.slug || '',
    outcomes: m.outcomes.map((o) => ({
      name: o.name,
      price: o.price,
      tokenId: o.tokenId,
    })),
  }));
}

// ─── Analyse market with Gemini (gemini-bridge edge function) ────────────────
async function analyseMarket(market: Market, balance: number): Promise<Signal | null> {
  try {
    const yes = market.outcomes.find((o) => o.name.toLowerCase() === 'yes');
    const no = market.outcomes.find((o) => o.name.toLowerCase() === 'no');
    if (!yes || !no) return null;

    const prompt = `You are a professional prediction market analyst.

Market: "${market.question}"
Current Prices: YES=${(yes.price * 100).toFixed(1)}% | NO=${(no.price * 100).toFixed(1)}%
Liquidity: $${market.liquidity.toLocaleString()}
Volume: $${market.volume.toLocaleString()}
End Date: ${market.endDate}

Analyse this market carefully:
1. Is either YES or NO mispriced relative to true probability?
2. What is the estimated true probability of YES resolving?
3. What is the edge (difference between true probability and market price)?
4. Should we trade, and if so which side?

Respond ONLY in this exact JSON format:
{
  "shouldTrade": true or false,
  "recommendation": "BUY_YES" or "BUY_NO" or "AVOID",
  "trueProb": 0.0 to 1.0,
  "confidence": 50 to 95,
  "reasoning": "1-2 sentence explanation",
  "edge": "brief description of the edge",
  "strategy": "arbitrage" or "news_edge" or "mispricing" or "momentum"
}

Only recommend trading if confidence >= 65 and edge > 4%.`;

    const { data, error } = await supabase.functions.invoke('gemini-bridge', {
      body: { prompt, model: 'gemini-2.0-flash', type: 'market-analysis' },
    });

    if (error || !data?.response) return null;

    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const analysis = JSON.parse(jsonMatch[0]);
    if (!analysis.shouldTrade || analysis.confidence < 65) return null;

    const tradeOutcome = analysis.recommendation === 'BUY_YES' ? yes : no;
    const currentPrice = tradeOutcome.price;
    const targetPrice = Math.min(0.95, analysis.trueProb);
    const kellySize = calcKelly(balance, analysis.trueProb, currentPrice);

    if (kellySize < 0.5) return null;

    return {
      id: `${market.id}-${Date.now()}`,
      market,
      recommendation: analysis.recommendation,
      outcome: analysis.recommendation === 'BUY_YES' ? 'YES' : 'NO',
      currentPrice,
      targetPrice,
      confidence: analysis.confidence,
      kellySize,
      reasoning: analysis.reasoning,
      edge: analysis.edge,
      strategy: analysis.strategy,
      timestamp: new Date(),
    };
  } catch {
    return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PredictionMarketBot() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [balance, setBalance] = useState(10);
  const [scanCount, setScanCount] = useState(0);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [expandedSig, setExpandedSig] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [stats, setStats] = useState({ total: 0, highConf: 0, avgEdge: 0 });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load paper balance from Supabase polymarket_bot_settings ────────────────
  useEffect(() => {
    if (!user?.id) return;
    void supabase
      .from('polymarket_bot_settings')
      .select('paper_balance')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.paper_balance != null) {
          setBalance(parseFloat(String(data.paper_balance)));
        }
      });
  }, [user?.id]);

  // ─── Run one scan cycle ───────────────────────────────────────────────────
  const runScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const fetched = await fetchMarketsMapped(50);
      setMarkets(fetched);

      const topMarkets = fetched
        .filter((m) => m.liquidity > 10000)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);

      const newSignals: Signal[] = [];
      for (const market of topMarkets) {
        const signal = await analyseMarket(market, balance);
        if (signal) newSignals.push(signal);
        await new Promise((r) => setTimeout(r, 300));
      }

      if (newSignals.length > 0) {
        setSignals((prev) => {
          const combined = [...newSignals, ...prev].slice(0, 20);
          const highConf = combined.filter((s) => s.confidence >= 80).length;
          const avgEdge =
            combined.reduce((sum, s) => sum + Math.abs(s.targetPrice - s.currentPrice), 0) /
            combined.length;
          setStats({
            total: combined.length,
            highConf,
            avgEdge: parseFloat((avgEdge * 100).toFixed(1)),
          });
          return combined;
        });
        toast.success(
          t('predictionMarketBot.engineToastSignals', { count: newSignals.length })
        );
      }

      setScanCount((c) => c + 1);
      setLastScan(new Date());
    } catch {
      toast.error(t('predictionMarketBot.engineToastScanFailed'));
    } finally {
      setIsScanning(false);
    }
  }, [balance, t]);

  // ─── Toggle engine ────────────────────────────────────────────────────────
  const toggleEngine = () => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      toast.info(t('predictionMarketBot.engineToastStopped'));
    } else {
      setIsRunning(true);
      void runScan();
      intervalRef.current = setInterval(() => {
        void runScan();
      }, 90000);
      toast.success(t('predictionMarketBot.engineToastStarted'));
    }
  };

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  const filteredSignals = signals.filter((s) => {
    if (filter === 'high') return s.confidence >= 80;
    if (filter === 'medium') return s.confidence >= 65 && s.confidence < 80;
    return true;
  });

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
    .pmb-root{font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;background:${BG};color:#fff;padding-bottom:100px;}
    .pmb-bg{position:fixed;inset:0;z-index:0;pointer-events:none;
      background:radial-gradient(ellipse at 20% 10%,rgba(212,175,55,0.06) 0%,transparent 55%),
                 radial-gradient(ellipse at 80% 90%,rgba(34,211,238,0.04) 0%,transparent 55%);}
    .pmb-z{position:relative;z-index:1;padding:0 16px;}
    .gc{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:16px;}
    .gc-g{border-color:rgba(212,175,55,0.22);box-shadow:0 0 24px rgba(212,175,55,0.08);}
    .gc-gr{border-color:rgba(46,204,113,0.2);background:rgba(46,204,113,0.06);}
    .gc-r{border-color:rgba(255,71,87,0.2);background:rgba(255,71,87,0.06);}
    .gc-c{border-color:rgba(34,211,238,0.2);background:rgba(34,211,238,0.06);}
    .lbl{font-size:7px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.3);}
    .pill{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:50px;font-size:7px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;}
    .pill-g{background:rgba(212,175,55,0.12);color:${G};border:1px solid rgba(212,175,55,0.25);}
    .pill-gr{background:rgba(46,204,113,0.12);color:${GREEN};border:1px solid rgba(46,204,113,0.25);}
    .pill-r{background:rgba(255,71,87,0.12);color:${RED};border:1px solid rgba(255,71,87,0.25);}
    .pill-c{background:rgba(34,211,238,0.1);color:${CYAN};border:1px solid rgba(34,211,238,0.25);}
    .btn-g{background:linear-gradient(135deg,${G},#f0c040);color:${BG};border:none;border-radius:16px;padding:12px 20px;font-weight:900;font-size:10px;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;width:100%;box-shadow:0 0 24px rgba(212,175,55,0.35);transition:all .25s;}
    .btn-r{background:linear-gradient(135deg,${RED},#c0392b);color:#fff;border:none;border-radius:16px;padding:12px 20px;font-weight:900;font-size:10px;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;width:100%;box-shadow:0 0 24px rgba(255,71,87,0.35);transition:all .25s;}
    .btn-ghost{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:8px 14px;font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:all .2s;}
    .btn-ghost:hover{background:rgba(255,255,255,0.1);color:#fff;}
    .filter-btn{background:transparent;border:1px solid rgba(255,255,255,0.08);border-radius:50px;padding:5px 12px;font-size:8px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;color:rgba(255,255,255,0.35);transition:all .2s;}
    .filter-btn.active{background:rgba(212,175,55,0.12);color:${G};border-color:rgba(212,175,55,0.3);}
    .sb{background:rgba(255,255,255,0.05);border-radius:12px;padding:10px 12px;}
    .dot-g{width:8px;height:8px;border-radius:50%;background:${GREEN};display:inline-block;vertical-align:middle;}
    .dot-a{width:8px;height:8px;border-radius:50%;background:#F59E0B;display:inline-block;vertical-align:middle;}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    .spin{animation:spin 1s linear infinite;}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .pulse{animation:pulse 2s ease-in-out infinite;}
  `;

  const strategyColor: Record<string, string> = {
    arbitrage: CYAN,
    news_edge: G,
    mispricing: GREEN,
    momentum: '#A855F7',
  };

  return (
    <>
      <style>{css}</style>
      <div className="pmb-root">
        <div className="pmb-bg" />
        <div className="pmb-z">
          <div style={{ paddingTop: 20, paddingBottom: 16 }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: 'auto', marginBottom: 16 }}
              onClick={() => navigate('/income-streams/polymarket-bot')}
              aria-label={t('common.back')}
            >
              <ArrowLeft size={13} style={{ display: 'inline', marginRight: 6 }} />
              {t('common.back')}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: isRunning ? 'rgba(34,211,238,0.1)' : 'rgba(212,175,55,0.1)',
                    border: `1px solid ${isRunning ? 'rgba(34,211,238,0.25)' : 'rgba(212,175,55,0.22)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Brain
                    size={20}
                    color={isRunning ? CYAN : G}
                    className={isRunning ? 'pulse' : ''}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 17,
                      letterSpacing: '-0.02em',
                      color: '#fff',
                    }}
                  >
                    {t('predictionMarketBot.engineTitle')}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.35em',
                      color: G,
                      textTransform: 'uppercase',
                      marginTop: 2,
                    }}
                  >
                    {t('predictionMarketBot.engineSub')}
                  </div>
                </div>
              </div>
              <span className={`pill ${isRunning ? 'pill-c' : 'pill-g'}`}>
                <span className={isRunning ? 'dot-g' : 'dot-a'} style={{ marginRight: 4 }} />
                {isRunning
                  ? isScanning
                    ? t('predictionMarketBot.engineStatusScanning')
                    : t('predictionMarketBot.engineStatusRunning')
                  : t('predictionMarketBot.engineStatusStopped')}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <div className="sb">
                <div className="lbl" style={{ marginBottom: 4 }}>
                  {t('predictionMarketBot.engineStatMarkets')}
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>
                  {markets.length}
                </div>
              </div>
              <div className="sb">
                <div className="lbl" style={{ marginBottom: 4 }}>
                  {t('predictionMarketBot.engineStatSignals')}
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, color: G }}>{stats.total}</div>
              </div>
              <div className="sb">
                <div className="lbl" style={{ marginBottom: 4 }}>
                  {t('predictionMarketBot.engineStatHighConf')}
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, color: GREEN }}>
                  {stats.highConf}
                </div>
              </div>
            </div>

            <div className="gc gc-g" style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div className="lbl" style={{ marginBottom: 4 }}>
                    {t('predictionMarketBot.enginePaperBalance')}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: G }}>
                    €{balance.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="lbl" style={{ marginBottom: 4 }}>
                    {t('predictionMarketBot.engineKellyFive')}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: CYAN }}>
                    €{(balance * 0.05).toFixed(2)}
                  </div>
                </div>
              </div>
              {lastScan && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                  {t('predictionMarketBot.engineLastScan', {
                    time: lastScan.toLocaleTimeString(),
                    scanCount,
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                className={isRunning ? 'btn-r' : 'btn-g'}
                style={{ flex: 1 }}
                onClick={toggleEngine}
                disabled={isScanning}
              >
                {isRunning ? (
                  <>
                    <Square size={13} style={{ display: 'inline', marginRight: 6 }} />
                    {t('predictionMarketBot.engineStop')}
                  </>
                ) : (
                  <>
                    <Play size={13} style={{ display: 'inline', marginRight: 6 }} />
                    {t('predictionMarketBot.engineStart')}
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => void runScan()}
                disabled={isScanning}
                style={{ opacity: isScanning ? 0.5 : 1 }}
                aria-label={t('predictionMarketBot.engineRefreshScan')}
              >
                <RefreshCw size={14} className={isScanning ? 'spin' : ''} />
              </button>
            </div>
          </div>

          <div className="gc" style={{ marginBottom: 14 }}>
            <div className="lbl" style={{ marginBottom: 12 }}>
              {t('predictionMarketBot.engineHowTitle')}
            </div>
            {(
              [
                {
                  icon: <Search size={14} />,
                  color: CYAN,
                  label: t('predictionMarketBot.engineStep1Label'),
                  desc: t('predictionMarketBot.engineStep1Desc'),
                },
                {
                  icon: <Brain size={14} />,
                  color: G,
                  label: t('predictionMarketBot.engineStep2Label'),
                  desc: t('predictionMarketBot.engineStep2Desc'),
                },
                {
                  icon: <Target size={14} />,
                  color: GREEN,
                  label: t('predictionMarketBot.engineStep3Label'),
                  desc: t('predictionMarketBot.engineStep3Desc'),
                },
                {
                  icon: <Shield size={14} />,
                  color: '#A855F7',
                  label: t('predictionMarketBot.engineStep4Label'),
                  desc: t('predictionMarketBot.engineStep4Desc'),
                },
                {
                  icon: <Zap size={14} />,
                  color: RED,
                  label: t('predictionMarketBot.engineStep5Label'),
                  desc: t('predictionMarketBot.engineStep5Desc'),
                },
              ] as const
            ).map((step, i) => (
              <div
                key={step.label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: i < 4 ? 10 : 0,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color,
                  }}
                >
                  {step.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 11,
                      color: step.color,
                      marginBottom: 2,
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.5,
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div className="lbl">{t('predictionMarketBot.engineSignalsTitle')}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'high', 'medium'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all'
                      ? t('predictionMarketBot.engineFilterAll')
                      : f === 'high'
                        ? t('predictionMarketBot.engineFilterHigh')
                        : t('predictionMarketBot.engineFilterMedium')}
                  </button>
                ))}
              </div>
            </div>

            {filteredSignals.length === 0 ? (
              <div className="gc" style={{ textAlign: 'center', padding: 40 }}>
                <BarChart3
                  size={32}
                  style={{ margin: '0 auto 12px', color: 'rgba(255,255,255,0.2)' }}
                />
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  {t('predictionMarketBot.engineNoSignals')}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                  {t('predictionMarketBot.engineNoSignalsHint')}
                </div>
              </div>
            ) : (
              filteredSignals.map((sig) => (
                <div
                  key={sig.id}
                  role="button"
                  tabIndex={0}
                  className={`gc ${sig.confidence >= 80 ? 'gc-gr' : ''}`}
                  style={{ marginBottom: 10, cursor: 'pointer' }}
                  onClick={() => setExpandedSig(expandedSig === sig.id ? null : sig.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSig(expandedSig === sig.id ? null : sig.id);
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fff',
                          lineHeight: 1.4,
                          marginBottom: 6,
                        }}
                      >
                        {sig.market.question}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`pill ${sig.outcome === 'YES' ? 'pill-gr' : 'pill-r'}`}>
                          {t('predictionMarketBot.engineBuyOutcome', { outcome: sig.outcome })}
                        </span>
                        <span className="pill pill-g">
                          {sig.strategy.replace('_', ' ')}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 50,
                            fontSize: '7px',
                            fontWeight: 800,
                            letterSpacing: '.2em',
                            textTransform: 'uppercase',
                            background: `${strategyColor[sig.strategy] || G}15`,
                            color: strategyColor[sig.strategy] || G,
                            border: `1px solid ${strategyColor[sig.strategy] || G}33`,
                          }}
                        >
                          {t('predictionMarketBot.engineConfPct', {
                            pct: sig.confidence,
                          })}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 18, color: G }}>
                        €{sig.kellySize.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                        {t('predictionMarketBot.engineKellySize')}
                      </div>
                      {expandedSig === sig.id ? (
                        <ChevronUp
                          size={14}
                          color="rgba(255,255,255,0.3)"
                          style={{ marginTop: 4 }}
                        />
                      ) : (
                        <ChevronDown
                          size={14}
                          color="rgba(255,255,255,0.3)"
                          style={{ marginTop: 4 }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div className="sb" style={{ flex: 1 }}>
                      <div className="lbl" style={{ marginBottom: 3 }}>
                        {t('predictionMarketBot.engineEntryPrice')}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>
                        {(sig.currentPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="sb" style={{ flex: 1 }}>
                      <div className="lbl" style={{ marginBottom: 3 }}>
                        {t('predictionMarketBot.engineTarget')}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 14, color: GREEN }}>
                        {(sig.targetPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="sb" style={{ flex: 1 }}>
                      <div className="lbl" style={{ marginBottom: 3 }}>
                        {t('predictionMarketBot.engineEdge')}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 14, color: CYAN }}>
                        +{((sig.targetPrice - sig.currentPrice) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {expandedSig === sig.id && (
                    <div
                      style={{
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <div className="lbl" style={{ marginBottom: 4 }}>
                          {t('predictionMarketBot.engineAiReasoning')}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.6)',
                            lineHeight: 1.6,
                          }}
                        >
                          {sig.reasoning}
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div className="lbl" style={{ marginBottom: 4 }}>
                          {t('predictionMarketBot.engineEdgeExplain')}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.6)',
                            lineHeight: 1.6,
                          }}
                        >
                          {sig.edge}
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div className="lbl" style={{ marginBottom: 4 }}>
                          {t('predictionMarketBot.engineMarketDetails')}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.4)',
                            lineHeight: 1.8,
                          }}
                        >
                          {t('predictionMarketBot.engineMarketLiquidity', {
                            amount: sig.market.liquidity.toLocaleString(),
                          })}
                          <br />
                          {t('predictionMarketBot.engineMarketVolume', {
                            amount: sig.market.volume.toLocaleString(),
                          })}
                          <br />
                          {t('predictionMarketBot.engineMarketEnds', {
                            date: new Date(sig.market.endDate).toLocaleDateString(),
                          })}
                          <br />
                          {t('predictionMarketBot.engineSignalAt', {
                            time: sig.timestamp.toLocaleTimeString(),
                          })}
                        </div>
                      </div>
                      <a
                        href={`https://polymarket.com/market/${sig.market.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 9,
                          fontWeight: 800,
                          color: G,
                          letterSpacing: '.2em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} /> {t('predictionMarketBot.engineViewPolymarket')}
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
