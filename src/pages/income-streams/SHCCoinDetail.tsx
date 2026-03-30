import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Coins, Check, ExternalLink, Copy, Wallet, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SHC_TOKEN_ADDRESS = 'GLtvJisfuAVxV9VSP8wekeAVceZMTCxvbvNJGE8KZBxm';

const G = '#D4AF37';
const BG = '#050505';
const CYAN = '#22D3EE';
const GLASS = 'rgba(255,255,255,0.02)';
const GLASS_B = 'rgba(255,255,255,0.05)';

const SQI_SHC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
.sqi-shc{font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-height:100vh;background:${BG};color:#fff;position:relative;overflow-x:hidden;padding-bottom:120px;}
.sqi-shc::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse 80% 50% at 50% -15%,rgba(212,175,55,0.07) 0%,transparent 55%),
    radial-gradient(ellipse 45% 35% at 15% 95%,rgba(34,211,238,0.05) 0%,transparent 50%);}
.sqi-shc-z{position:relative;z-index:1;}
.sqi-shc-glass{
  background:${GLASS};backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid ${GLASS_B};border-radius:40px;
}
.sqi-shc-gold-ring{
  background:${GLASS};backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid rgba(212,175,55,0.22);border-radius:40px;
  box-shadow:0 0 30px rgba(212,175,55,0.08);
}
.sqi-shc-gold-ring::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;border-radius:40px 40px 0 0;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,0.35),transparent);
}
.sqi-shc-label{font-size:8px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.32);}
.sqi-shc-title{font-weight:900;letter-spacing:-0.05em;color:${G};text-shadow:0 0 18px rgba(212,175,55,0.28);}
.sqi-shc-body{font-weight:400;line-height:1.6;color:rgba(255,255,255,0.58);font-size:13px;}
.sqi-shc-back{display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,0.38);font-size:12px;font-weight:600;transition:color .2s;}
.sqi-shc-back:hover{color:${G};}
.sqi-shc-badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;
  background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.25);color:${CYAN};margin-top:6px;}
`;

const SHCCoinDetail: React.FC = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(SHC_TOKEN_ADDRESS);
    setCopied(true);
    toast.success(t('shcCoin.addressCopied', 'Token address copied!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const phantomSteps = [
    t('shcCoin.phantomStep1', 'Download Phantom Wallet from phantom.app'),
    t('shcCoin.phantomStep2', 'Create or import your wallet'),
    t('shcCoin.phantomStep3', 'Fund your wallet with SOL'),
    t('shcCoin.phantomStep4', 'Go to the swap feature in Phantom'),
    t('shcCoin.phantomStep5', 'Paste the SHC token address'),
    t('shcCoin.phantomStep6', 'Enter amount and confirm swap'),
  ];

  const cardSteps = [
    t('shcCoin.cardStep1', 'Open Phantom Wallet'),
    t('shcCoin.cardStep2', 'Tap "Buy" and select your amount in USD'),
    t('shcCoin.cardStep3', 'Complete KYC if required'),
    t('shcCoin.cardStep4', 'Buy SOL with your card'),
    t('shcCoin.cardStep5', 'Swap SOL to SHC using the token address'),
  ];

  return (
    <>
      <style>{SQI_SHC_CSS}</style>
      <div className="sqi-shc">
        <div className="sqi-shc-z px-4 pt-5 pb-8 max-w-lg mx-auto">
          <Link to="/income-streams" className="sqi-shc-back mb-6">
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>{t('common.back', 'Back to Income Streams')}</span>
          </Link>

          <div className="flex items-start gap-4 mb-8">
            <div
              className="w-[60px] h-[60px] rounded-[22px] shrink-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.06))',
                border: '1px solid rgba(212,175,55,0.35)',
                boxShadow: '0 0 28px rgba(212,175,55,0.22)',
              }}
            >
              <Coins className="w-8 h-8" style={{ color: G }} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-1">
              <p className="sqi-shc-label mb-2">◈ Vedic Light-Code · Prema-Pulse</p>
              <h1 className="sqi-shc-title text-2xl sm:text-[1.65rem] leading-tight">
                {t('shcCoin.title', 'SHC Coin')}
              </h1>
              <span className="sqi-shc-badge">{t('shcCoin.badge', 'Investment')}</span>
            </div>
          </div>

          <div className="sqi-shc-glass p-5 mb-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 shrink-0" style={{ color: G }} />
              <h2 className="sqi-shc-title text-lg tracking-tight">
                {t('shcCoin.whatIsIt', 'What is SHC Coin?')}
              </h2>
            </div>
            <div className="space-y-3 sqi-shc-body">
              <p>{t('shcCoin.overviewP1', 'SHC (Siddha Quantum Nexus Coin) is our native utility token built on the Solana blockchain. It powers the ecosystem and rewards active community members.')}</p>
              <p>{t('shcCoin.overviewP2', 'As the platform grows, so does the value and utility of SHC. Early adopters benefit from holding and using the token.')}</p>
            </div>
          </div>

          <div className="sqi-shc-gold-ring relative p-5 mb-6 overflow-hidden">
            <p className="sqi-shc-label mb-3">{t('shcCoin.tokenAddressLabel', 'Token Address (Solana)')}</p>
            <div className="flex items-stretch gap-2">
              <code
                className="flex-1 text-[11px] sm:text-xs font-mono break-all p-4 rounded-[20px] leading-relaxed"
                style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${GLASS_B}` }}
              >
                {SHC_TOKEN_ADDRESS}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={copyAddress}
                className="shrink-0 w-12 h-auto min-h-[3rem] rounded-[18px] border self-stretch"
                style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.08)' }}
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" style={{ color: G }} />}
              </Button>
            </div>
          </div>

          <div className="sqi-shc-glass p-5 mb-6">
            <h3 className="sqi-shc-title text-base mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5" style={{ color: G }} />
              {t('shcCoin.buyWithPhantom', 'Buy with Phantom Wallet')}
            </h3>
            <ol className="space-y-4">
              {phantomSteps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
                    style={{
                      background: 'rgba(34,211,238,0.12)',
                      border: '1px solid rgba(34,211,238,0.28)',
                      color: CYAN,
                    }}
                  >
                    {index + 1}
                  </div>
                  <span className="sqi-shc-body text-[13px] pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-5 h-12 rounded-full font-extrabold border-[#22D3EE]/35 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/18"
              onClick={() => window.open('https://phantom.app', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('shcCoin.getPhantom', 'Get Phantom Wallet')}
            </Button>
          </div>

          <div className="sqi-shc-glass p-5 mb-6">
            <h3 className="sqi-shc-title text-base mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" style={{ color: G }} />
              {t('shcCoin.buyWithCard', 'Buy with Credit Card')}
            </h3>
            <ol className="space-y-4">
              {cardSteps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
                    style={{
                      background: 'rgba(212,175,55,0.12)',
                      border: '1px solid rgba(212,175,55,0.28)',
                      color: G,
                    }}
                  >
                    {index + 1}
                  </div>
                  <span className="sqi-shc-body text-[13px] pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <p
              className="text-[12px] mt-4 p-4 rounded-[20px] sqi-shc-body"
              style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }}
            >
              💡 {t('shcCoin.tip', 'Tip: Moonpay and other providers in Phantom support card purchases.')}
            </p>
          </div>

          <div
            className="sqi-shc-glass p-5 mb-8"
            style={{ borderColor: 'rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.06)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
              <div>
                <h4 className="font-bold text-white text-sm mb-2 tracking-tight">{t('shcCoin.riskTitle', 'Risk Disclaimer')}</h4>
                <p className="sqi-shc-body text-[12px]">
                  {t('shcCoin.riskDesc', 'Cryptocurrency investments carry significant risk. Only invest what you can afford to lose. Past performance does not guarantee future results. Do your own research before investing.')}
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="w-full h-14 rounded-full font-extrabold text-[#050505] text-base shadow-[0_0_32px_rgba(212,175,55,0.4)] hover:shadow-[0_0_48px_rgba(212,175,55,0.5)] border-0"
            size="lg"
            style={{ background: `linear-gradient(135deg, ${G}, #e8c547)` }}
            onClick={() => window.open(`https://raydium.io/swap/?inputMint=sol&outputMint=${SHC_TOKEN_ADDRESS}`, '_blank')}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            {t('shcCoin.tradeOnRaydium', 'Trade on Raydium DEX')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default SHCCoinDetail;
