import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, Headphones, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_PODCAST_RSS_URL, fetchPodcastEpisodesFromRss, type PodcastRssEpisode } from '@/lib/podcastRss';

const GOLD = '#D4AF37';
const GLASS_BG = 'rgba(255, 255, 255, 0.02)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.05)';
const glassCard =
  'rounded-[40px] border backdrop-blur-[40px] shadow-[0_0_36px_rgba(212,175,55,0.05)] transition-all duration-300';

type Episode = PodcastRssEpisode;

const PodcastEpisodeList: React.FC = () => {
  const { t, language } = useTranslation();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const localeTag =
    language === 'sv' ? 'sv-SE' : language === 'es' ? 'es-ES' : language === 'no' ? 'nb-NO' : 'en-US';

  const fetchEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rssUrl =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PODCAST_RSS_URL) || DEFAULT_PODCAST_RSS_URL;

      let list: Episode[] = [];
      try {
        list = await fetchPodcastEpisodesFromRss(rssUrl);
      } catch (rssErr) {
        console.warn('[podcast] RSS fetch failed, trying edge function', rssErr);
      }

      if (list.length === 0) {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-podcast-episodes');
        if (!fnError && data?.success && Array.isArray(data?.episodes)) {
          list = data.episodes as Episode[];
        } else if (fnError) {
          throw fnError;
        }
      }

      if (list.length === 0) {
        setError(t('podcastPage.noEpisodes', 'No episodes could be loaded.'));
      } else {
        setEpisodes(list);
      }
    } catch (err) {
      console.error('Error fetching episodes:', err);
      setError(t('podcastPage.loadError', 'Could not load the podcast feed.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(localeTag, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    if (duration.includes(':')) return duration;
    const seconds = parseInt(duration, 10);
    if (Number.isNaN(seconds)) return duration;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onAudioPlay = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const current = e.currentTarget;
    listRef.current?.querySelectorAll('audio').forEach((el) => {
      if (el !== current) (el as HTMLAudioElement).pause();
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4" role="status">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: GOLD }} aria-hidden />
        <span className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/40">
          {t('leaderboard.loading', 'Syncing the field…')}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${glassCard} p-8 text-center`}
        style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}
      >
        <p className="mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {error}
        </p>
        <Button
          type="button"
          onClick={fetchEpisodes}
          variant="outline"
          className="rounded-full border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.08)] text-[#D4AF37] hover:bg-[rgba(212,175,55,0.15)]"
        >
          {t('podcastPage.tryAgain', 'Try again')}
        </Button>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div
        className={`${glassCard} p-8 text-center`}
        style={{ background: GLASS_BG, borderColor: GLASS_BORDER }}
      >
        <p style={{ color: 'rgba(255,255,255,0.55)' }}>{t('podcastPage.noEpisodes', 'No episodes could be loaded.')}</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="space-y-4">
      <p className="text-[8px] font-extrabold uppercase tracking-[0.5em] mb-2" style={{ color: 'rgba(212,175,55,0.65)' }}>
        {t('podcastPage.episodesAvailable', {
          count: episodes.length,
          defaultValue: '{{count}} transmissions available',
        })}
      </p>

      {episodes.map((episode, index) => (
        <div
          key={episode.id}
          className={`${glassCard} p-4 md:p-5 overflow-hidden`}
          style={{
            background: GLASS_BG,
            borderColor: GLASS_BORDER,
            animationDelay: `${Math.min(index, 20) * 0.03}s`,
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div
              className="w-full h-28 sm:h-32 sm:w-32 rounded-[24px] overflow-hidden shrink-0 border border-white/[0.07]"
              style={{ background: 'rgba(212,175,55,0.06)' }}
            >
              {episode.imageUrl ? (
                <img src={episode.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Headphones className="w-10 h-10 opacity-40" style={{ color: GOLD }} aria-hidden />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div>
                <h3
                  className="font-black text-base md:text-lg leading-snug line-clamp-3 text-white"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  {episode.title}
                </h3>
                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px]"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {episode.pubDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#22D3EE' }} aria-hidden />
                      <span className="sr-only">{t('podcastPage.published', 'Published')}: </span>
                      {formatDate(episode.pubDate)}
                    </span>
                  )}
                  {episode.duration && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      <span className="sr-only">{t('podcastPage.duration', 'Duration')}: </span>
                      {formatDuration(episode.duration)}
                    </span>
                  )}
                </div>
              </div>

              {episode.description && (
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'rgba(255,255,255,0.58)' }}>
                  {episode.description}
                </p>
              )}

              {episode.audioUrl ? (
                <div className="pt-1">
                  <p
                    className="text-[8px] font-extrabold uppercase tracking-[0.35em] mb-2"
                    style={{ color: 'rgba(212,175,55,0.55)' }}
                  >
                    {t('podcastPage.listenInApp', 'Play in sanctuary')}
                  </p>
                  <audio
                    controls
                    preload="none"
                    src={episode.audioUrl}
                    className="w-full max-h-12 rounded-xl opacity-95 podcast-native-audio"
                    onPlay={onAudioPlay}
                  />
                </div>
              ) : episode.spotifyUrl ? (
                <p className="text-xs pt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <a
                    href={episode.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[#D4AF37]"
                  >
                    {t('podcastPage.openSpotifyOptional', 'Open in Spotify (optional)')}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ))}

      <style>{`
        .podcast-native-audio::-webkit-media-controls-panel {
          background: rgba(5, 5, 5, 0.85);
        }
      `}</style>
    </div>
  );
};

export default PodcastEpisodeList;
