import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music2, ShoppingCart, Download, Heart, Clock, Sparkles, Lock, ListMusic, Loader2, CreditCard, Coins, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { useSearchParams } from 'react-router-dom';
import MasteringService from '@/components/music/MasteringService';
import MusicMembershipBanner from '@/components/music/MusicMembershipBanner';

interface Track {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  genre: string;
  duration_seconds: number;
  preview_url: string;
  full_audio_url: string;
  cover_image_url: string | null;
  price_usd: number;
  price_shc: number;
  shc_reward: number;
  play_count: number;
}

const Music: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { balance, refreshBalance } = useSHCBalance();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'liked'>('all');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Track | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTracks();
    fetchPurchases();
    
    // Handle successful Stripe purchase redirect
    const purchasedTrackId = searchParams.get('purchased');
    if (purchasedTrackId) {
      handleStripeSuccess(purchasedTrackId);
    }

    // Handle mastering order success/cancel
    const masteringSuccess = searchParams.get('mastering_success');
    const masteringCancelled = searchParams.get('mastering_cancelled');
    
    if (masteringSuccess) {
      toast({
        title: "Mastering order placed!",
        description: "Thank you! I'll send your professionally mastered track to your email within 3-5 business days."
      });
    } else if (masteringCancelled) {
      toast({
        title: "Order cancelled",
        description: "Your mastering order was cancelled. Your files have been saved if you want to try again."
      });
    }

    // Handle membership success
    const membershipSuccess = searchParams.get('membership_success');
    const membershipCancelled = searchParams.get('membership_cancelled');
    
    if (membershipSuccess) {
      toast({
        title: "Welcome to Music Membership! 🎵",
        description: `Your ${membershipSuccess} subscription is now active. Enjoy unlimited music and 33 SHC per stream!`
      });
    } else if (membershipCancelled) {
      toast({
        title: "Subscription cancelled",
        description: "Your membership checkout was cancelled."
      });
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [searchParams]);

  const handleStripeSuccess = async (trackId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('music_purchases')
      .upsert({
        user_id: user.id,
        track_id: trackId,
        payment_method: 'stripe',
        amount_paid: 0
      }, { onConflict: 'user_id,track_id' });

    toast({
      title: "Purchase complete!",
      description: "Your track is now available to stream and download"
    });
    fetchPurchases();
  };

  const fetchTracks = async () => {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTracks(data);
    }
    setIsLoading(false);
  };

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('music_purchases')
      .select('track_id')
      .eq('user_id', user.id);

    if (data) {
      setPurchasedIds(data.map(p => p.track_id));
    }
  };

  const playTrack = (track: Track) => {
    const isOwned = purchasedIds.includes(track.id);
    
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audioUrl = isOwned ? track.full_audio_url : track.preview_url;
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        if (!isOwned) {
          toast({
            title: "Preview ended",
            description: "Purchase this track to listen to the full version!",
          });
        }
      };
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(percent);
        }
      };
      
      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const handlePurchase = async (track: Track, method: 'shc' | 'stripe') => {
    setPurchasingId(track.id);
    setShowPaymentModal(null);

    try {
      const response = await supabase.functions.invoke('purchase-music', {
        body: { trackId: track.id, paymentMethod: method }
      });

      if (response.error) throw response.error;
      
      const data = response.data;

      if (method === 'stripe' && data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
      } else if (method === 'shc') {
        toast({
          title: "Purchase complete!",
          description: `You bought "${track.title}" and earned +${track.shc_reward} SHC!`
        });
        fetchPurchases();
        refreshBalance();
      }
    } catch (error: any) {
      toast({
        title: "Purchase failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setPurchasingId(null);
    }
  };

  const toggleLike = (trackId: string) => {
    setLikedIds(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const downloadTrack = (track: Track) => {
    window.open(track.full_audio_url, '_blank');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ownedTracks = tracks.filter(t => purchasedIds.includes(t.id));
  const likedTracks = tracks.filter(t => likedIds.includes(t.id));
  const displayTracks = activeTab === 'all' ? tracks : activeTab === 'owned' ? ownedTracks : likedTracks;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-32">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <Music2 className="text-primary" />
          Sacred Music
        </h1>
        <p className="text-muted-foreground mt-1">Healing beats & spiritual sounds</p>
      </header>

      {/* Music Membership */}
      <MusicMembershipBanner />

      {/* Mastering Service */}
      <MasteringService />

      {/* Stats */}
      <div className="flex gap-4 mb-6 animate-slide-up">
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-primary">{ownedTracks.length}</p>
          <p className="text-xs text-muted-foreground">Owned</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-secondary">{balance?.balance.toLocaleString() ?? '0'}</p>
          <p className="text-xs text-muted-foreground">SHC</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-accent">{tracks.length}</p>
          <p className="text-xs text-muted-foreground">Tracks</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <Music2 size={16} />
          All
        </button>
        <button
          onClick={() => setActiveTab('owned')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'owned'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <ListMusic size={16} />
          My Music
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'liked'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <Heart size={16} />
          Liked
        </button>
      </div>

      {/* Track List */}
      <div className="space-y-3 animate-fade-in">
        {displayTracks.map((track, index) => {
          const isOwned = purchasedIds.includes(track.id);
          const isLiked = likedIds.includes(track.id);
          const isPurchasing = purchasingId === track.id;
          const isCurrentTrack = currentTrack?.id === track.id;

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isCurrentTrack
                  ? 'bg-primary/10 border-primary/50'
                  : 'bg-gradient-card border-border/50'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
            {/* Cover & Play */}
              <button
                onClick={() => playTrack(track)}
                className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
              >
                {track.cover_image_url ? (
                  <img 
                    src={track.cover_image_url} 
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-spiritual flex items-center justify-center">
                    <Music2 size={24} className="text-foreground/70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="text-primary" size={20} />
                  ) : (
                    <Play className="text-primary" size={20} />
                  )}
                </div>
                {!isOwned && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <Lock size={10} className="text-accent-foreground" />
                  </div>
                )}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground">{track.artist}</p>
                {track.description && (
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{track.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} />
                    {formatDuration(track.duration_seconds)}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Headphones size={10} />
                    {track.play_count.toLocaleString()}
                  </span>
                  {!isOwned && (
                    <span className="text-xs text-accent flex items-center gap-1">
                      <Sparkles size={10} />
                      +{track.shc_reward} SHC
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLike(track.id)}
                  className={`p-2 rounded-full transition-colors ${
                    isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                  }`}
                >
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                
                {isOwned ? (
                  <Button variant="ghost" size="sm" onClick={() => downloadTrack(track)}>
                    <Download size={16} />
                  </Button>
                ) : (
                  <Button 
                    variant="gold" 
                    size="sm" 
                    onClick={() => setShowPaymentModal(track)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        ${track.price_usd}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {displayTracks.length === 0 && (
          <div className="text-center py-12">
            <Music2 className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground">
              {activeTab === 'owned' 
                ? "You haven't purchased any tracks yet" 
                : activeTab === 'liked'
                ? "No liked tracks yet"
                : "No tracks available yet"}
            </p>
          </div>
        )}
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 animate-slide-up">
          <div className="bg-card/95 backdrop-blur-lg rounded-2xl border border-border/50 p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                {currentTrack.cover_image_url ? (
                  <img 
                    src={currentTrack.cover_image_url} 
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-spiritual flex items-center justify-center">
                    <Music2 size={20} className="text-foreground/70" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground">
                  {purchasedIds.includes(currentTrack.id) ? 'Full Track' : '30s Preview'}
                </p>
              </div>
              <button
                onClick={() => playTrack(currentTrack)}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="text-primary-foreground" size={20} />
                ) : (
                  <Play className="text-primary-foreground" size={20} />
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Slider
                value={[progress]}
                max={100}
                step={1}
                className="flex-1"
              />
              {!purchasedIds.includes(currentTrack.id) && (
                <Button variant="gold" size="sm" onClick={() => setShowPaymentModal(currentTrack)}>
                  Buy ${currentTrack.price_usd}
                </Button>
              )}
            </div>
            
            {!purchasedIds.includes(currentTrack.id) && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Purchase to unlock full track & earn +{currentTrack.shc_reward} SHC
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">
              Buy "{showPaymentModal.title}"
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Choose your payment method
            </p>

            <div className="space-y-3">
              {/* SHC Payment */}
              <button
                onClick={() => handlePurchase(showPaymentModal, 'shc')}
                disabled={!balance || balance.balance < showPaymentModal.price_shc}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Coins className="text-accent" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Pay with SHC</p>
                  <p className="text-sm text-muted-foreground">
                    {showPaymentModal.price_shc} SHC + earn {showPaymentModal.shc_reward} back
                  </p>
                </div>
              </button>

              {/* Stripe Payment */}
              <button
                onClick={() => handlePurchase(showPaymentModal, 'stripe')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="text-primary" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Credit Card</p>
                  <p className="text-sm text-muted-foreground">
                    ${showPaymentModal.price_usd} USD via Stripe
                  </p>
                </div>
              </button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => setShowPaymentModal(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Music;
