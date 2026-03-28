import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Heart, Sparkles } from 'lucide-react';
import { SocialShare } from '@/components/SocialShare';

const GOLD = '#D4AF37';
const GLASS_BG = 'rgba(255, 255, 255, 0.02)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.05)';
const CYAN = '#22D3EE';

const glassCard =
  'rounded-[40px] border backdrop-blur-[40px] shadow-[0_0_40px_rgba(212,175,55,0.06)] transition-all duration-300';

const InviteFriends: React.FC = () => {
  const { t } = useTranslation();

  const shareTitle = t('dashboard.inviteShareTitle', 'Siddha Quantum Nexus');
  const shareText = t(
    'dashboard.inviteShareText',
    'Join me on Siddha Quantum Nexus — transform your path and earn SHC. 🧘✨'
  );

  return (
    <div
      className="min-h-screen pb-28 px-4 py-6 max-w-2xl mx-auto space-y-8"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: 'rgba(255,255,255,0.92)' }}
    >
      {/* Hero — AppLayout supplies global back bar */}
      <section
        className={`${glassCard} p-8 md:p-10 text-center border-[rgba(212,175,55,0.18)]`}
        style={{
          background: GLASS_BG,
          borderColor: 'rgba(212, 175, 55, 0.2)',
          boxShadow: '0 0 48px rgba(212, 175, 55, 0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <p
          className="text-[8px] font-extrabold uppercase tracking-[0.5em] mb-4"
          style={{ color: 'rgba(212, 175, 55, 0.78)' }}
        >
          {t('dashboard.inviteHeroEyebrow', 'Bhakti-Algorithm · Prema-Pulse')}
        </p>
        <div
          className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-[40px] border"
          style={{
            background: 'rgba(212, 175, 55, 0.08)',
            borderColor: 'rgba(212, 175, 55, 0.25)',
            boxShadow: '0 0 32px rgba(212, 175, 55, 0.12)',
          }}
        >
          <Users className="w-9 h-9" style={{ color: GOLD }} strokeWidth={2} aria-hidden />
        </div>
        <h1
          className="text-2xl md:text-3xl font-black tracking-tight px-2"
          style={{ color: GOLD, textShadow: '0 0 24px rgba(212, 175, 55, 0.25)', letterSpacing: '-0.05em' }}
        >
          {t('dashboard.inviteFriends')}
        </h1>
        <p
          className="mt-4 text-[15px] leading-relaxed max-w-md mx-auto"
          style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 400 }}
        >
          {t('dashboard.inviteDescription')}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className={`${glassCard} p-5 text-center`} style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}>
          <Heart className="w-7 h-7 mx-auto mb-3" style={{ color: GOLD }} strokeWidth={2} aria-hidden />
          <p className="text-sm leading-snug font-semibold text-white/90">
            {t('dashboard.inviteBenefitHealing', 'Spread healing through scalar intention')}
          </p>
        </div>
        <div className={`${glassCard} p-5 text-center`} style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}>
          <Sparkles className="w-7 h-7 mx-auto mb-3" style={{ color: CYAN }} strokeWidth={2} aria-hidden />
          <p className="text-sm leading-snug font-semibold text-white/90">
            {t('dashboard.inviteBenefitShc', 'Earn SHC via sovereign rewards')}
          </p>
        </div>
      </div>

      <section className={`${glassCard} p-6 md:p-8`} style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}>
        <h2
          className="text-base font-black tracking-tight mb-6"
          style={{ color: GOLD, letterSpacing: '-0.03em', textShadow: '0 0 16px rgba(212, 175, 55, 0.2)' }}
        >
          {t('dashboard.inviteShareSectionTitle', 'Transmit on social channels')}
        </h2>
        {/* Props-only: share URL and platform logic stay inside SocialShare */}
        <SocialShare title={shareTitle} text={shareText} className="[&_p]:text-white/50 [&_button]:rounded-full [&_button]:border-white/10 [&_button]:bg-white/[0.03] [&_button]:text-white/85 [&_button]:backdrop-blur-xl [&_button]:border [&_button:hover]:border-[rgba(212,175,55,0.35)] [&_button:hover]:shadow-[0_0_20px_rgba(212,175,55,0.12)]" />
      </section>
    </div>
  );
};

export default InviteFriends;
