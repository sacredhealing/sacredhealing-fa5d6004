import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Play, Award, ChevronLeft, ChevronRight, Loader2, ArrowLeft, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { useSHC } from '@/contexts/SHCContext';

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: {
        videoId: string;
        playerVars?: Record<string, number>;
        events?: {
          onStateChange?: (event: { data: number }) => void;
        };
      }) => {
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  channelTitle: string;
}

type YTPlayer = {
  destroy: () => void;
};

const SHC_REWARD = 100;

const akashaField = (
  <>
    <div className="pointer-events-none fixed inset-0 bg-[#050505] z-0" aria-hidden />
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.95] bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(212,175,55,0.1)_0%,transparent_55%),radial-gradient(ellipse_90%_55%_at_100%_25%,rgba(212,175,55,0.05)_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_0%_75%,rgba(34,211,238,0.035)_0%,transparent_45%)]"
      aria-hidden
    />
  </>
);

const SpiritualEducation: React.FC = () => {
  const { user, session } = useAuth();
  const { t } = useTranslation();
  const { addOptimisticBalance } = useSHC();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [sessionRewardedVideos, setSessionRewardedVideos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const VIDEOS_PER_PAGE = 4;

  // Load YouTube IFrame API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    if (user) {
      fetchWatchedVideos();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = videos.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVideos(filtered);
      setCurrentPage(0);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  // Initialize YouTube player when modal opens
  useEffect(() => {
    if (selectedVideo && playerContainerRef.current) {
      setVideoEnded(false);
      
      const initPlayer = () => {
        if (playerRef.current) {
          playerRef.current.destroy();
        }
        
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: selectedVideo.id,
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onStateChange: (event: any) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === 0) {
                setVideoEnded(true);
                handleAutoClaimReward();
              }
            },
          },
        });
      };

      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        (window as any).onYouTubeIframeAPIReady = initPlayer;
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [selectedVideo]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-videos');
      if (error) throw error;
      const fetchedVideos = data.videos || [];
      setVideos(fetchedVideos);
      setFilteredVideos(fetchedVideos);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWatchedVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('video_completions')
      .select('video_id')
      .eq('user_id', user.id);
    
    if (data) {
      setWatchedVideos(new Set(data.map(v => v.video_id)));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleAutoClaimReward = useCallback(async () => {
    if (!selectedVideo || !session) return;
    if (watchedVideos.has(selectedVideo.id) || sessionRewardedVideos.has(selectedVideo.id)) return;

    setIsClaimingReward(true);
    try {
      const { data, error } = await supabase.functions.invoke('complete-video-watch', {
        body: { 
          videoId: selectedVideo.id, 
          videoTitle: selectedVideo.title 
        }
      });

      if (error) throw error;

      if (data.alreadyWatched) {
        toast.info(data.message);
      } else {
        toast.success(
          t('spiritualEducation.toastEarnedVideo', { amount: String(SHC_REWARD) })
        );
        setWatchedVideos(prev => new Set([...prev, selectedVideo.id]));
        setSessionRewardedVideos(prev => new Set([...prev, selectedVideo.id]));
        addOptimisticBalance(SHC_REWARD);
      }
    } catch (err) {
      console.error('Failed to claim reward:', err);
    } finally {
      setIsClaimingReward(false);
    }
  }, [selectedVideo, session, watchedVideos, sessionRewardedVideos, t, addOptimisticBalance]);

  const handleClaimReward = async () => {
    if (!selectedVideo || !session) {
      toast.error(t('spiritualEducation.toastSignIn'));
      return;
    }

    if (watchedVideos.has(selectedVideo.id) || sessionRewardedVideos.has(selectedVideo.id)) {
      toast.info(t('spiritualEducation.toastAlreadyEarned'));
      return;
    }

    setIsClaimingReward(true);
    try {
      const { data, error } = await supabase.functions.invoke('complete-video-watch', {
        body: { 
          videoId: selectedVideo.id, 
          videoTitle: selectedVideo.title 
        }
      });

      if (error) throw error;

      if (data.alreadyWatched) {
        toast.info(data.message);
      } else {
        toast.success(t('spiritualEducation.toastEarned', { amount: String(SHC_REWARD) }));
        setWatchedVideos(prev => new Set([...prev, selectedVideo.id]));
        setSessionRewardedVideos(prev => new Set([...prev, selectedVideo.id]));
        addOptimisticBalance(SHC_REWARD);
      }
    } catch (err) {
      toast.error(t('spiritualEducation.toastClaimFailed'));
    } finally {
      setIsClaimingReward(false);
    }
  };

  const handleBackToVideos = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setSelectedVideo(null);
    setVideoEnded(false);
  };

  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const displayedVideos = filteredVideos.slice(
    currentPage * VIDEOS_PER_PAGE, 
    (currentPage + 1) * VIDEOS_PER_PAGE
  );

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const isVideoRewarded = (videoId: string) => 
    watchedVideos.has(videoId) || sessionRewardedVideos.has(videoId);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] pb-28">
      {akashaField}
      <div className="relative z-10 px-4 pt-6 max-w-4xl mx-auto">
      <header className="mb-8 animate-fade-in">
        <p className="sqi-label-text mb-2 text-[#D4AF37]/70">{t('spiritualEducation.eyebrow')}</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-[-0.05em] font-heading text-[#D4AF37] gold-glow">
          {t('spiritualEducation.title')}
        </h1>
        <p className="sqi-body-text mt-2 text-base">
          {t('spiritualEducation.tagline', { amount: String(SHC_REWARD) })}
        </p>
      </header>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/70" />
          <Input
            type="text"
            placeholder={t('spiritualEducation.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 rounded-[28px] h-12 border-white/[0.1] bg-white/[0.04] text-white placeholder:text-white/35 backdrop-blur-[40px] focus-visible:border-[#D4AF37]/45 focus-visible:ring-[#D4AF37]/20"
          />
        </div>
      </form>

      <div className="rounded-[40px] p-5 mb-8 border border-white/[0.08] bg-white/[0.02] backdrop-blur-[40px] shadow-[0_0_48px_-16px_rgba(212,175,55,0.15)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 flex items-center justify-center shrink-0 shadow-[0_0_20px_-8px_rgba(212,175,55,0.35)]">
              <Youtube className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <p className="font-black tracking-[-0.03em] text-white text-sm">
                {t('spiritualEducation.videosWatched')}
              </p>
              <p className="text-sm sqi-body-text">
                {t('spiritualEducation.completedCount', { count: watchedVideos.size })}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black tracking-[-0.03em] text-[#22D3EE] font-heading">{watchedVideos.size * SHC_REWARD} SHC</p>
            <p className="text-[10px] sqi-label-text !text-white/45 !tracking-[0.35em]">
              {t('spiritualEducation.totalEarned')}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center py-20"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={t('spiritualEducation.loadingAria')}
        >
          <Loader2
            className="w-9 h-9 animate-spin text-[#D4AF37] drop-shadow-[0_0_16px_rgba(212,175,55,0.45)]"
            aria-hidden
          />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16 rounded-[40px] border border-dashed border-[#D4AF37]/20 bg-white/[0.02]">
          <Youtube className="w-12 h-12 text-[#D4AF37]/65 mx-auto mb-4" />
          <p className="sqi-body-text">{t('spiritualEducation.noVideos')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {displayedVideos.map((video, index) => (
              <div
                key={video.id}
                className="relative rounded-[28px] overflow-hidden border border-white/[0.08] bg-white/[0.02] backdrop-blur-[40px] cursor-pointer transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.25)] hover:scale-[1.02] animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#050505]/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/20 p-3 shadow-[0_0_24px_rgba(212,175,55,0.35)]">
                      <Play className="w-10 h-10 text-[#D4AF37]" fill="currentColor" />
                    </div>
                  </div>
                  {isVideoRewarded(video.id) && (
                    <div className="absolute top-2 right-2 rounded-full border border-[#D4AF37]/40 bg-[#050505]/85 p-1.5 backdrop-blur-sm">
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold tracking-tight text-sm text-white line-clamp-2 leading-snug">{video.title}</h3>
                  <p className="text-xs sqi-body-text mt-1 line-clamp-1">{video.channelTitle}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Award className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#D4AF37]">
                      {t('spiritualEducation.rewardBadge', { amount: String(SHC_REWARD) })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="rounded-full border-white/[0.12] bg-white/[0.04] text-white hover:border-[#D4AF37]/35 hover:text-[#D4AF37] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('spiritualEducation.previous')}
              </Button>
              <span className="text-sm sqi-body-text px-2">
                {t('spiritualEducation.pageOf', {
                  current: currentPage + 1,
                  total: totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1}
                className="rounded-full border-white/[0.12] bg-white/[0.04] text-white hover:border-[#D4AF37]/35 hover:text-[#D4AF37] disabled:opacity-40"
              >
                {t('spiritualEducation.next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md z-[200] flex flex-col">
          <div className="flex items-center p-4 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-[40px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToVideos}
              className="rounded-full text-[#D4AF37] hover:text-[#D4AF37] hover:bg-white/[0.08]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('spiritualEducation.backToVideos')}
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl">
              <div
                className="relative aspect-video bg-black rounded-[24px] overflow-hidden border border-[#D4AF37]/25 shadow-[0_0_48px_-12px_rgba(212,175,55,0.2)]"
                ref={playerContainerRef}
              >
                <div id="youtube-player" className="w-full h-full" />
              </div>

              <div className="rounded-[28px] mt-4 p-5 border border-white/[0.08] bg-white/[0.04] backdrop-blur-[40px] shadow-[0_0_40px_-14px_rgba(212,175,55,0.12)]">
                <h2 className="font-black tracking-[-0.04em] font-heading text-lg text-white leading-snug">{selectedVideo.title}</h2>
                <p className="text-sm sqi-body-text mt-1">{selectedVideo.channelTitle}</p>

                {user ? (
                  <div className="mt-4">
                    {videoEnded && !isVideoRewarded(selectedVideo.id) ? (
                      <div className="border border-[#22D3EE]/30 bg-[#22D3EE]/10 rounded-[20px] p-3 mb-3">
                        <p className="text-[#22D3EE] text-sm font-semibold">
                          {t('spiritualEducation.videoCompletedClaiming')}
                        </p>
                      </div>
                    ) : null}

                    <Button
                      variant="gold"
                      className="w-full rounded-[40px] h-11 text-xs font-black tracking-[0.15em] uppercase shadow-[0_0_32px_-8px_rgba(212,175,55,0.4)]"
                      onClick={handleClaimReward}
                      disabled={isClaimingReward || isVideoRewarded(selectedVideo.id)}
                    >
                      {isClaimingReward ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isVideoRewarded(selectedVideo.id) ? (
                        <>
                          <Award className="w-4 h-4" />
                          {t('spiritualEducation.alreadyClaimed')}
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          {videoEnded
                            ? t('spiritualEducation.claimReward', { amount: String(SHC_REWARD) })
                            : t('spiritualEducation.watchToEarn', { amount: String(SHC_REWARD) })}
                        </>
                      )}
                    </Button>

                    {!videoEnded && !isVideoRewarded(selectedVideo.id) && (
                      <p className="text-xs sqi-body-text text-center mt-3">
                        {t('spiritualEducation.watchFullHint')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm sqi-body-text mt-4">
                    {t('spiritualEducation.signInEarn')}
                  </p>
                )}

                <div className="mt-6 border-t border-white/[0.08] pt-4 max-h-60 overflow-y-auto">
                  <ReviewSection
                    contentType="video"
                    contentId={selectedVideo.id}
                    contentTitle={selectedVideo.title}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SpiritualEducation;
