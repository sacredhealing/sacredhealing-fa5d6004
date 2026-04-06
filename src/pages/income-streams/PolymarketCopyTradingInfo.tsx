import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bot,
  Server,
  Shield,
  Terminal,
  Wallet,
  Zap,
} from 'lucide-react';

const GOLD = '#D4AF37';
const BG = '#050505';

const glass =
  'rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl';

export default function PolymarketCopyTradingInfo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#sovereign-setup') {
      const el = document.getElementById('sovereign-setup');
      requestAnimationFrame(() => el?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [location.hash]);

  const modules = [
    { key: 'polymarketCopyBot.modMain', icon: Terminal },
    { key: 'polymarketCopyBot.modListener', icon: Zap },
    { key: 'polymarketCopyBot.modMatcher', icon: Bot },
    { key: 'polymarketCopyBot.modExecutor', icon: Wallet },
    { key: 'polymarketCopyBot.modLogger', icon: Server },
  ] as const;

  const creds = [
    { key: 'polymarketCopyBot.credRpc' },
    { key: 'polymarketCopyBot.credPoly' },
    { key: 'polymarketCopyBot.credWallet' },
    { key: 'polymarketCopyBot.credSize' },
  ] as const;

  const whales = [
    { label: 'polymarketCopyBot.whale1', addr: '0x91583ceb1ebec79951a068e1d7d02c1ea590fa7b' },
    { label: 'polymarketCopyBot.whale2', addr: '0x4924840e6E4249C032F40a6b797825d0d8b33782' },
  ] as const;

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden pb-28 text-white"
      style={{ background: BG, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(212,175,55,0.09) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-lg px-4 pt-4">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/income-streams')}
            className="shrink-0 rounded-2xl border border-white/[0.08] p-2.5 hover:bg-white/[0.04]"
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: GOLD }} />
          </button>
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.45em] text-white/40 uppercase">
              {t('polymarketCopyBot.kicker')}
            </p>
            <h1
              className="text-xl font-black tracking-tight sm:text-2xl"
              style={{ color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.25)' }}
            >
              {t('polymarketCopyBot.title')}
            </h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-white/60">{t('polymarketCopyBot.lead')}</p>

        <div className={`${glass} mb-4 p-5`}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-[#D4AF37] uppercase">
            <Terminal className="h-4 w-4" />
            {t('polymarketCopyBot.archTitle')}
          </h2>
          <p className="mb-3 text-xs text-white/45">{t('polymarketCopyBot.archPath')}</p>
          <ul className="space-y-2">
            {modules.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-2 text-sm text-white/70">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]/80" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div id="sovereign-setup" className={`${glass} mb-4 scroll-mt-24 p-5`}>
          <h2 className="mb-3 text-xs font-black tracking-wide text-[#D4AF37] uppercase">
            {t('polymarketCopyBot.setupTitle')}
          </h2>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-white/65">
            <li>{t('polymarketCopyBot.setup1')}</li>
            <li>{t('polymarketCopyBot.setup2')}</li>
            <li>{t('polymarketCopyBot.setup3')}</li>
          </ol>
          <p className="mt-3 text-[11px] text-white/35">{t('polymarketCopyBot.setupNote')}</p>
        </div>

        <div className={`${glass} mb-4 p-5`}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-[#D4AF37] uppercase">
            <Wallet className="h-4 w-4" />
            {t('polymarketCopyBot.credsTitle')}
          </h2>
          <ul className="space-y-2">
            {creds.map(({ key }) => (
              <li key={key} className="text-sm text-white/65">
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${glass} mb-4 p-5`}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-wide text-[#D4AF37] uppercase">
            <Shield className="h-4 w-4" />
            {t('polymarketCopyBot.safetyTitle')}
          </h2>
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-white/60">
            <li>{t('polymarketCopyBot.safety1')}</li>
            <li>{t('polymarketCopyBot.safety2')}</li>
            <li>{t('polymarketCopyBot.safety3')}</li>
            <li>{t('polymarketCopyBot.safety4')}</li>
            <li>{t('polymarketCopyBot.safety5')}</li>
          </ul>
        </div>

        <div className={`${glass} mb-4 p-5`}>
          <h2 className="mb-3 text-xs font-black tracking-wide text-[#D4AF37] uppercase">
            {t('polymarketCopyBot.whalesTitle')}
          </h2>
          <ul className="space-y-2 text-xs font-mono text-white/50 break-all">
            {whales.map((w) => (
              <li key={w.addr}>
                <span className="mb-0.5 block text-[10px] font-sans font-bold tracking-wider text-white/40 uppercase">
                  {t(w.label)}
                </span>
                {w.addr}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-white/35">{t('polymarketCopyBot.whalesHint')}</p>
        </div>

        <div className={`${glass} mb-6 p-5`}>
          <h2 className="mb-2 text-xs font-black tracking-wide text-[#D4AF37] uppercase">
            {t('polymarketCopyBot.vpsTitle')}
          </h2>
          <p className="text-sm text-white/55">{t('polymarketCopyBot.vpsBody')}</p>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <Link
            to="/polymarket-bot"
            className="block w-full rounded-[24px] py-4 text-center text-[11px] font-black tracking-[0.2em] text-[#050505] uppercase"
            style={{
              background: 'linear-gradient(135deg,#D4AF37,#F0C040,#D4AF37)',
              boxShadow: '0 0 28px rgba(212,175,55,0.35)',
            }}
          >
            {t('polymarketCopyBot.ctaAppHub')}
          </Link>
          <Link
            to="/prediction-market-bot"
            className="block w-full rounded-[24px] border border-[#D4AF37]/35 py-3.5 text-center text-[10px] font-black tracking-[0.2em] text-[#D4AF37] uppercase"
          >
            {t('polymarketCopyBot.ctaAi')}
          </Link>
        </div>

        <p className="text-center text-[10px] leading-relaxed text-white/30">{t('polymarketCopyBot.disclaimer')}</p>
      </div>
    </div>
  );
}
