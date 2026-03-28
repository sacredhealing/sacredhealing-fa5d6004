import React from 'react';
import { BarChart3, Users, Headphones } from 'lucide-react';
import PodcastEpisodeList from '@/components/podcast/PodcastEpisodeList';
import { useTranslation } from '@/hooks/useTranslation';

const SPOTIFY_SHOW_ID = '2nhPr6e1a4dhivvIgMcceI';

const GOLD = '#D4AF37';
const GLASS_BG = 'rgba(255, 255, 255, 0.02)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.05)';
const CYAN = '#22D3EE';
const glassCard =
  'rounded-[40px] border backdrop-blur-[40px] shadow-[0_0_40px_rgba(212,175,55,0.06)] transition-all duration-300';

const Podcast: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      className="min-h-screen pb-28 px-4 pt-2 max-w-3xl mx-auto space-y-8"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: 'rgba(255,255,255,0.92)' }}
    >
      <header className="pt-4">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.5em] mb-3" style={{ color: 'rgba(212, 175, 55, 0.78)' }}>
          {t('podcastPage.heroEyebrow', 'Prema-Pulse · Vedic Light-Code Audio')}
        </p>
        <h1
          className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 flex-wrap"
          style={{ color: GOLD, textShadow: '0 0 24px rgba(212, 175, 55, 0.22)', letterSpacing: '-0.05em' }}
        >
          <Headphones className="w-8 h-8 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
          {t('dashboard.podcast', 'Podcast')}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed max-w-xl" style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 400 }}>
          {t('podcastPage.subtitle', 'Awaken your spiritual bliss — streamed inside the sanctuary.')}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div
          className={`${glassCard} p-5 text-center border-[rgba(212,175,55,0.15)]`}
          style={{ background: GLASS_BG, borderColor: 'rgba(212, 175, 55, 0.18)' }}
        >
          <BarChart3 className="w-7 h-7 mx-auto mb-2" style={{ color: GOLD }} strokeWidth={2} aria-hidden />
          <p className="text-xl md:text-2xl font-black tabular-nums text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            {t('podcastPage.streamsValue', '280,545')}
          </p>
          <p className="text-[8px] font-extrabold uppercase tracking-[0.4em] mt-2 leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('podcastPage.streamsLabel', 'Streams & downloads')}
          </p>
        </div>
        <div className={`${glassCard} p-5 text-center`} style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}>
          <Users className="w-7 h-7 mx-auto mb-2" style={{ color: CYAN }} strokeWidth={2} aria-hidden />
          <p className="text-xl md:text-2xl font-black tabular-nums text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            {t('podcastPage.followersValue', '1,107')}
          </p>
          <p className="text-[8px] font-extrabold uppercase tracking-[0.4em] mt-2 leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('podcastPage.followersLabel', 'Spotify community')}
          </p>
        </div>
      </div>

      <section
        className={`${glassCard} p-6 md:p-8 border-[rgba(212,175,55,0.14)]`}
        style={{ background: GLASS_BG, boxShadow: '0 0 36px rgba(212, 175, 55, 0.07)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Headphones className="w-6 h-6 shrink-0" style={{ color: GOLD }} strokeWidth={2} aria-hidden />
          <h2 className="font-black text-lg tracking-tight text-white" style={{ letterSpacing: '-0.03em' }}>
            {t('podcastPage.allEpisodes', 'All episodes')}
          </h2>
        </div>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255, 255, 255, 0.58)' }}>
          {t(
            'podcastPage.intro',
            'Listen to every episode here with Bhakti-Algorithm clarity. Audio is served from the Akasha feed — no need to leave the app.'
          )}
        </p>
        <PodcastEpisodeList />
      </section>

      <p className="text-center pb-4">
        <a
          href={`https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold underline-offset-4 hover:underline"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {t('podcastPage.openSpotifyOptional', 'Open in Spotify (optional)')}
        </a>
      </p>
    </div>
  );
};

export default Podcast;
