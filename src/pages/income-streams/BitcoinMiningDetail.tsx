import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Cpu, ExternalLink, AlertTriangle, Percent, Zap, Clock, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteContent } from '@/hooks/useSiteContent';

const G = '#D4AF37';
const GLASS = 'rgba(255,255,255,0.02)';
const GLASS_B = 'rgba(255,255,255,0.05)';
const CYAN = '#22D3EE';

const SQI_BTC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
.sqi-btc{font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-height:100vh;background:#050505;color:#fff;position:relative;overflow-x:hidden;padding-bottom:120px;}
.sqi-btc::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse 78% 48% at 50% -12%,rgba(212,175,55,0.08) 0%,transparent 54%),
    radial-gradient(ellipse 40% 32% at 92% 88%,rgba(245,158,11,0.05) 0%,transparent 48%);}
.sqi-btc-z{position:relative;z-index:1;}
.sqi-btc-glass{
  background:${GLASS};backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid ${GLASS_B};border-radius:40px;
}
.sqi-btc-gold-ring{
  background:${GLASS};backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid rgba(212,175,55,0.22);border-radius:40px;
  box-shadow:0 0 28px rgba(212,175,55,0.08);
}
.sqi-btc-gold-ring::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;border-radius:40px 40px 0 0;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,0.35),transparent);
}
.sqi-btc-label{font-size:8px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.32);}
.sqi-btc-title{font-weight:900;letter-spacing:-0.05em;color:${G};text-shadow:0 0 16px rgba(212,175,55,0.26);}
.sqi-btc-body{font-weight:400;line-height:1.6;color:rgba(255,255,255,0.58);font-size:13px;}
.sqi-btc-back{display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,0.38);font-size:12px;font-weight:600;transition:color .2s;}
.sqi-btc-back:hover{color:${G};}
`;

const BitcoinMiningDetail: React.FC = () => {
  const { t } = useTranslation();

  const { content } = useSiteContent([
    'bitcoin_mining_title',
    'bitcoin_mining_subtitle',
    'bitcoin_mining_description',
    'bitcoin_mining_step1',
    'bitcoin_mining_step2',
    'bitcoin_mining_step3',
    'bitcoin_mining_returns',
    'bitcoin_mining_min_investment',
    'bitcoin_mining_link',
  ]);

  const miningLink = content['bitcoin_mining_link'] || 'https://example.com/bitcoin-mining';

  const pill = (label: string, gold?: boolean) => (
    <span
      className="text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
      style={
        gold
          ? { background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)', color: G }
          : { background: 'rgba(255,255,255,0.06)', border: `1px solid ${GLASS_B}`, color: 'rgba(255,255,255,0.65)' }
      }
    >
      {label}
    </span>
  );

  return (
    <>
      <style>{SQI_BTC_CSS}</style>
      <div className="sqi-btc">
        <div className="sqi-btc-z px-4 pt-5 pb-8 max-w-lg mx-auto">
          <Link to="/income-streams" className="sqi-btc-back mb-6">
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>{t('common.back', 'Back to Income Streams')}</span>
          </Link>

          <div className="flex items-start gap-4 mb-8">
            <div
              className="w-[60px] h-[60px] rounded-[22px] shrink-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(245,158,11,0.08))',
                border: '1px solid rgba(212,175,55,0.32)',
                boxShadow: '0 0 26px rgba(212,175,55,0.2)',
              }}
            >
              <Cpu className="w-8 h-8" style={{ color: G }} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-1">
              <p className="sqi-btc-label mb-2">◈ Bhakti-Algorithm · Hash-Field</p>
              <h1 className="sqi-btc-title text-2xl sm:text-[1.65rem] leading-tight">
                ₿ {content['bitcoin_mining_title'] || t('bitcoinMining.title', 'Bitcoin Mining')}
              </h1>
              <p className="sqi-btc-body mt-2 text-sm">
                {content['bitcoin_mining_subtitle'] || t('bitcoinMining.subtitle', 'Passive Crypto Income')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Percent, label: t('bitcoinMining.returns', 'Returns'), main: '14%', sub: t('bitcoinMining.perCard', 'per card'), accent: G },
              { icon: Zap, label: t('bitcoinMining.effort', 'Effort'), main: t('bitcoinMining.passive', 'Passive'), sub: t('bitcoinMining.automated', 'Automated'), accent: CYAN },
              { icon: Clock, label: t('bitcoinMining.cycle', 'Cycle'), main: '~90', sub: t('bitcoinMining.days', 'days'), accent: G },
            ].map((s, i) => (
              <div key={i} className="sqi-btc-glass p-3 text-center relative overflow-hidden" style={{ borderRadius: '28px' }}>
                <div
                  className="w-11 h-11 rounded-[16px] mx-auto mb-2 flex items-center justify-center"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.accent }} />
                </div>
                <p className="sqi-btc-label !text-[7px] !tracking-[0.35em] mb-1">{s.label}</p>
                <p className="font-black text-sm text-white tracking-tight">{s.main}</p>
                <p className="text-[10px] text-white/45 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="sqi-btc-glass p-5 mb-6" style={{ borderRadius: '40px' }}>
            <p className="sqi-btc-body">
              {content['bitcoin_mining_description'] || t('bitcoinMining.description', 'Invest in a license that mines bitcoin through mining cards. The cards create bitcoin mining through an advanced computer algorithm that gives 14% back per card. It takes approximately 90 days until your 114% is mined.')}
            </p>
          </div>

          <div className="sqi-btc-glass p-5 mb-6 relative overflow-hidden">
            <h2 className="sqi-btc-title text-lg mb-4 flex items-center gap-2">
              💳 {t('bitcoinMining.licenseOptions', 'License Options')}
            </h2>
            <div className="space-y-3">
              {[
                { price: '$300', badge: t('bitcoinMining.starter', 'Starter'), count: 9, gold: false },
                { price: '$1,000', badge: t('bitcoinMining.growth', 'Growth'), count: 30, gold: false },
                { price: '$1,500', badge: t('bitcoinMining.premium', 'Premium'), count: 50, gold: true },
              ].map((row) => (
                <div
                  key={row.price}
                  className="p-4 rounded-[24px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  style={
                    row.gold
                      ? { background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.28)' }
                      : { background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }
                  }
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-white">{row.price} {t('bitcoinMining.license', 'License')}</span>
                    {pill(row.badge, row.gold)}
                  </div>
                  <p className="sqi-btc-body text-[12px] sm:text-right">
                    {t('bitcoinMining.upTo', 'Up to')} {row.count} {t('bitcoinMining.miningCards', 'mining cards')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="sqi-btc-glass p-5 mb-6">
            <h2 className="sqi-btc-title text-lg mb-5 flex items-center gap-2">
              ⚡ {t('bitcoinMining.howItWorks', 'How It Works')}
            </h2>
            <div className="space-y-5">
              {[
                { n: 1, title: t('bitcoinMining.buyCards', 'Buy Mining Cards'), desc: t('bitcoinMining.cardCost', 'Each card costs ~$300 and generates approximately $4/day in mining rewards.'), ring: G },
                { n: 2, title: t('bitcoinMining.autoCompound', 'Auto-Compound Growth'), desc: t('bitcoinMining.autoCompoundDesc', 'Earnings automatically purchase new cards. 4 cards become 10 cards in ~90 days!'), ring: CYAN },
                { n: 3, title: t('bitcoinMining.scaleUp', 'Scale Your Income'), desc: t('bitcoinMining.scaleUpDesc', '30 cards = ~$3,000/month • 50 cards = ~$6,000/month in Bitcoin!'), ring: G },
              ].map((row) => (
                <div key={row.n} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-black text-sm"
                    style={{
                      background: row.n === 2 ? 'rgba(34,211,238,0.12)' : 'rgba(212,175,55,0.12)',
                      border: `1px solid ${row.n === 2 ? 'rgba(34,211,238,0.3)' : 'rgba(212,175,55,0.28)'}`,
                      color: row.ring,
                    }}
                  >
                    {row.n}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm tracking-tight">{row.title}</h4>
                    <p className="sqi-btc-body text-[12px] mt-1">{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sqi-btc-gold-ring relative p-5 mb-6 overflow-hidden">
            <h2 className="sqi-btc-title text-lg mb-4 flex items-center gap-2">
              💰 {t('bitcoinMining.earningsExample', 'Earnings Example')}
            </h2>
            <div className="space-y-3">
              {[
                { k: `4 ${t('bitcoinMining.cards', 'cards')}`, v: `$16/${t('bitcoinMining.day', 'day')} → $400/${t('bitcoinMining.month', 'month')}`, hi: false },
                { k: `10 ${t('bitcoinMining.cards', 'cards')}`, v: `$40/${t('bitcoinMining.day', 'day')} → $1,000/${t('bitcoinMining.month', 'month')}`, hi: false },
                { k: `30 ${t('bitcoinMining.cards', 'cards')}`, v: `$120/${t('bitcoinMining.day', 'day')} → $3,000/${t('bitcoinMining.month', 'month')}`, hi: true },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between p-4 rounded-[22px] gap-2 flex-wrap"
                  style={
                    row.hi
                      ? { background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }
                      : { background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }
                  }
                >
                  <span className="sqi-btc-body text-white/75 text-[13px] font-medium">{row.k}</span>
                  <span className={`font-black text-[12px] sm:text-sm ${row.hi ? '' : 'text-white'}`} style={row.hi ? { color: G } : undefined}>
                    {row.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="sqi-btc-glass p-5 mb-6">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" style={{ color: G }} />
              <div>
                <p className="font-bold text-white text-sm mb-1">📈 {t('bitcoinMining.futurePotential', 'Future Potential')}</p>
                <p className="sqi-btc-body text-[12px]">
                  {t('bitcoinMining.futurePotentialDesc', 'Bitcoin is predicted to reach $1.5 million within 5 years. What you mine today could be worth 10x — holding your Bitcoin creates enormous future opportunity!')}
                </p>
              </div>
            </div>
          </div>

          <div className="sqi-btc-glass p-5 mb-6">
            <h2 className="sqi-btc-title text-lg mb-4 flex items-center gap-2">
              ✨ {t('bitcoinMining.benefits', 'Benefits')}
            </h2>
            <div className="space-y-3">
              {[
                { icon: Shield, label: t('bitcoinMining.noHardware', 'No Hardware Required'), badge: t('bitcoinMining.cloudBased', 'Cloud-based') },
                { icon: TrendingUp, label: t('bitcoinMining.compound', 'Compound Earnings'), badge: t('bitcoinMining.reinvest', 'Auto-reinvest') },
                { icon: Zap, label: t('bitcoinMining.instantStart', 'Instant Start'), badge: t('bitcoinMining.noWait', 'No waiting') },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-[22px] gap-2 flex-wrap"
                  style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }}
                >
                  <div className="flex items-center gap-3">
                    <row.icon className="w-5 h-5" style={{ color: i === 0 ? CYAN : G }} />
                    <span className="text-white text-sm font-medium">{row.label}</span>
                  </div>
                  {pill(row.badge)}
                </div>
              ))}
            </div>
          </div>

          <div
            className="sqi-btc-glass p-5 mb-6"
            style={{ borderColor: 'rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.06)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
              <div>
                <p className="font-bold text-white text-sm mb-1">⚠️ {t('bitcoinMining.riskTitle', 'Cryptocurrency investments involve risk.')}</p>
                <p className="sqi-btc-body text-[12px]">
                  {t('bitcoinMining.riskDesc', 'Mining returns vary based on Bitcoin price and network difficulty. Only invest what you can afford to lose.')}
                </p>
              </div>
            </div>
          </div>

          <div className="sqi-btc-gold-ring relative p-5 mb-8 text-center overflow-hidden">
            <p className="font-bold text-white text-sm mb-2">
              🚀 {t('bitcoinMining.interested', 'Interested in Getting Started?')}
            </p>
            <p className="sqi-btc-body text-[12px] mb-4">
              {t('bitcoinMining.zoomDesc', "Book a Zoom call with our team. We'll explain everything in depth, answer your questions, and help you get started.")}
            </p>
            <p className="sqi-btc-body text-[12px]">
              {t('bitcoinMining.closing', 'Start your crypto journey today.')}<br />
              <span className="font-extrabold sqi-btc-title !text-base">Shreem Brzee</span>
            </p>
          </div>

          <Button
            type="button"
            className="w-full h-14 rounded-full font-extrabold text-[#050505] border-0 shadow-[0_0_32px_rgba(212,175,55,0.38)]"
            size="lg"
            style={{ background: `linear-gradient(135deg, ${G}, #e8c547)` }}
            onClick={() => window.open(miningLink, '_blank')}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {t('bitcoinMining.bookZoom', 'Book a Zoom Meeting')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default BitcoinMiningDetail;
