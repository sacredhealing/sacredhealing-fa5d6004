import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Play, Award, ChevronLeft, ChevronRight, Loader2, ArrowLeft, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

const SpiritualEducation: React.FC = () => {
  const { user, session } = useAuth();
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
        toast.success(`🎉 You earned ${SHC_REWARD} SHC for watching this video!`);
        setWatchedVideos(prev => new Set([...prev, selectedVideo.id]));
        setSessionRewardedVideos(prev => new Set([...prev, selectedVideo.id]));
        addOptimisticBalance(SHC_REWARD);
      }
    } catch (err) {
      console.error('Failed to claim reward:', err);
    } finally {
      setIsClaimingReward(false);
    }
  }, [selectedVideo, session, watchedVideos, sessionRewardedVideos]);

  const handleClaimReward = async () => {
    if (!selectedVideo || !session) {
      toast.error('Please sign in to earn rewards');
      return;
    }

    if (watchedVideos.has(selectedVideo.id) || sessionRewardedVideos.has(selectedVideo.id)) {
      toast.info('You already earned SHC for this video');
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
        toast.success(`🎉 You earned ${SHC_REWARD} SHC!`);
        setWatchedVideos(prev => new Set([...prev, selectedVideo.id]));
        setSessionRewardedVideos(prev => new Set([...prev, selectedVideo.id]));
        addOptimisticBalance(SHC_REWARD);
      }
    } catch (err) {
      toast.error('Failed to claim reward');
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
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">Spiritual Education</h1>
        <p className="text-muted-foreground mt-1">Watch videos & earn {SHC_REWARD} SHC each</p>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
      </form>

      {/* Stats */}
      <div className="bg-gradient-card rounded-xl p-4 mb-6 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Youtube className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground">Videos Watched</p>
              <p className="text-sm text-muted-foreground">{watchedVideos.size} completed</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-accent">{watchedVideos.size * SHC_REWARD} SHC</p>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No videos found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {displayedVideos.map((video, index) => (
              <div
                key={video.id}
                className="relative rounded-xl overflow-hidden border border-border/50 bg-gradient-card cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  {isVideoRewarded(video.id) && (
                    <div className="absolute top-2 right-2 bg-secondary/90 rounded-full p-1">
                      <Award className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Award className="w-3 h-3 text-accent" />
                    <span className="text-xs text-accent">+{SHC_REWARD} SHC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* Back Button Header */}
          <div className="flex items-center p-4 bg-background/10 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToVideos}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Videos
            </Button>
          </div>

          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden" ref={playerContainerRef}>
                <div id="youtube-player" className="w-full h-full" />
              </div>
              
              {/* Video Info */}
              <div className="bg-background rounded-xl mt-4 p-4">
                <h2 className="font-heading font-semibold text-foreground text-lg">{selectedVideo.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selectedVideo.channelTitle}</p>
                
                {user ? (
                  <div className="mt-4">
                    {videoEnded && !isVideoRewarded(selectedVideo.id) ? (
                      <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-3">
                        <p className="text-accent text-sm font-medium">🎉 Video completed! Claiming your reward...</p>
                      </div>
                    ) : null}
                    
                    <Button
                      variant="gold"
                      className="w-full"
                      onClick={handleClaimReward}
                      disabled={isClaimingReward || isVideoRewarded(selectedVideo.id)}
                    >
                      {isClaimingReward ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isVideoRewarded(selectedVideo.id) ? (
                        <>
                          <Award className="w-4 h-4" />
                          Already Claimed
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          {videoEnded ? `Claim ${SHC_REWARD} SHC Reward` : `Watch to Earn ${SHC_REWARD} SHC`}
                        </>
                      )}
                    </Button>
                    
                    {!videoEnded && !isVideoRewarded(selectedVideo.id) && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Watch the full video to earn your reward automatically
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Sign in to earn SHC rewards for watching videos
                  </p>
                )}

                {/* Reviews */}
                <div className="mt-6 border-t border-border/50 pt-4 max-h-60 overflow-y-auto">
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
  );
};

export default SpiritualEducation;
