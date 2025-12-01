import React, { useState, useEffect } from 'react';
import { Search, Play, Award, ChevronLeft, ChevronRight, Loader2, X, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
}

const SpiritualEducation: React.FC = () => {
  const { user, session } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  const VIDEOS_PER_PAGE = 4;

  useEffect(() => {
    fetchVideos();
    if (user) {
      fetchWatchedVideos();
    }
  }, [user]);

  const fetchVideos = async (search = '', pageToken = '') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-videos', {
        body: { search, pageToken }
      });

      if (error) throw error;

      if (pageToken && data.videos) {
        setVideos(prev => [...prev, ...data.videos]);
      } else {
        setVideos(data.videos || []);
      }
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      console.error('Error fetching videos:', err);
      toast.error('Failed to load videos');
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
    setCurrentPage(0);
    fetchVideos(searchQuery);
  };

  const handleClaimReward = async () => {
    if (!selectedVideo || !session) {
      toast.error('Please sign in to earn rewards');
      return;
    }

    if (watchedVideos.has(selectedVideo.id)) {
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
        toast.success(data.message);
        setWatchedVideos(prev => new Set([...prev, selectedVideo.id]));
      }
    } catch (err) {
      toast.error('Failed to claim reward');
    } finally {
      setIsClaimingReward(false);
    }
  };

  const loadMore = () => {
    if (nextPageToken) {
      fetchVideos(searchQuery, nextPageToken);
    }
  };

  const displayedVideos = videos.slice(currentPage * VIDEOS_PER_PAGE, (currentPage + 1) * VIDEOS_PER_PAGE);
  const totalPages = Math.ceil(videos.length / VIDEOS_PER_PAGE);
  const canGoNext = currentPage < totalPages - 1 || nextPageToken;
  const canGoPrev = currentPage > 0;

  const handleNext = () => {
    if (currentPage >= totalPages - 1 && nextPageToken) {
      loadMore();
    }
    setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">Spiritual Education</h1>
        <p className="text-muted-foreground mt-1">Watch videos & earn 3 SHC each</p>
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
            <p className="text-lg font-bold text-accent">{watchedVideos.size * 3} SHC</p>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      {isLoading && videos.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No videos available</p>
          <p className="text-sm text-muted-foreground mt-1">Add YouTube channels in the admin panel</p>
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
                  {watchedVideos.has(video.id) && (
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
                    <span className="text-xs text-accent">+3 SHC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedVideo(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              <h2 className="font-heading font-semibold text-foreground">{selectedVideo.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedVideo.channelTitle}</p>
              
              {user ? (
                <Button
                  variant="gold"
                  className="w-full mt-4"
                  onClick={handleClaimReward}
                  disabled={isClaimingReward || watchedVideos.has(selectedVideo.id)}
                >
                  {isClaimingReward ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : watchedVideos.has(selectedVideo.id) ? (
                    <>
                      <Award className="w-4 h-4" />
                      Already Claimed
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      Claim 3 SHC Reward
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Sign in to earn SHC rewards for watching videos
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpiritualEducation;