import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Play, Pause, Coins, Clock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { toast } from 'sonner';

interface Mantra {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  shc_reward: number;
  play_count: number;
}

const Mantras = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshBalance } = useSHCBalance();
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchMantras();
  }, []);

  const fetchMantras = async () => {
    const { data, error } = await supabase
      .from('mantras')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setMantras(data);
    }
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async (mantra: Mantra) => {
    if (playingId === mantra.id) {
      // Pause
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio
    const audio = new Audio(mantra.audio_url);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      setProgress(prev => ({ ...prev, [mantra.id]: progressPercent }));
    });

    audio.addEventListener('ended', async () => {
      setPlayingId(null);
      setProgress(prev => ({ ...prev, [mantra.id]: 0 }));
      
      // Award SHC if logged in
      if (user) {
        await awardMantraReward(mantra);
      }
    });

    try {
      await audio.play();
      setPlayingId(mantra.id);
      
      // Update play count
      await supabase
        .from('mantras')
        .update({ play_count: mantra.play_count + 1 })
        .eq('id', mantra.id);
    } catch (error) {
      toast.error('Failed to play audio');
    }
  };

  const awardMantraReward = async (mantra: Mantra) => {
    try {
      // Record completion
      await supabase.from('mantra_completions').insert({
        user_id: user?.id,
        mantra_id: mantra.id,
        shc_earned: mantra.shc_reward,
      });

      // Update user balance
      const { data: balanceData } = await supabase
        .from('user_balances')
        .select('balance, total_earned')
        .eq('user_id', user?.id)
        .single();

      if (balanceData) {
        await supabase
          .from('user_balances')
          .update({
            balance: balanceData.balance + mantra.shc_reward,
            total_earned: balanceData.total_earned + mantra.shc_reward,
          })
          .eq('user_id', user?.id);
      }

      // Record transaction
      await supabase.from('shc_transactions').insert({
        user_id: user?.id,
        type: 'earned',
        amount: mantra.shc_reward,
        description: `Mantra completed: ${mantra.title}`,
        status: 'completed',
      });

      toast.success(`+${mantra.shc_reward} SHC earned!`, {
        description: 'Thank you for your practice',
        icon: '✨',
      });

      refreshBalance();
    } catch (error) {
      console.error('Error awarding mantra reward:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500/20 via-background to-amber-500/10 px-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Sacred Mantras</h1>
        <p className="text-muted-foreground mb-3">
          Listen to ancient mantras and earn 111 SHC per completion
        </p>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Coins className="w-3 h-3 mr-1" />
          111 SHC per mantra
        </Badge>
      </div>

      {/* Mantras List */}
      <div className="px-4 py-6 space-y-4">
        {mantras.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground text-sm">
              Sacred mantras will be added soon. Check back later!
            </p>
          </Card>
        ) : (
          mantras.map((mantra) => {
            const isPlaying = playingId === mantra.id;
            const currentProgress = progress[mantra.id] || 0;

            return (
              <Card key={mantra.id} className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {/* Cover Image */}
                  <div 
                    className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/30 to-amber-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden"
                  >
                    {mantra.cover_image_url ? (
                      <img 
                        src={mantra.cover_image_url} 
                        alt={mantra.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-6 h-6 text-purple-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{mantra.title}</h3>
                    {mantra.description && (
                      <p className="text-sm text-muted-foreground truncate">{mantra.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDuration(mantra.duration_seconds)}
                      </span>
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                        <Coins className="w-3 h-3 mr-1" />
                        {mantra.shc_reward} SHC
                      </Badge>
                    </div>
                  </div>

                  {/* Play Button */}
                  <Button
                    size="icon"
                    variant={isPlaying ? 'default' : 'outline'}
                    className="flex-shrink-0 rounded-full w-12 h-12"
                    onClick={() => handlePlay(mantra)}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {isPlaying && (
                  <div className="px-4 pb-4">
                    <Progress value={currentProgress} className="h-1" />
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Info Section */}
      <div className="px-4 py-6">
        <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-amber-500/10 border-purple-500/20">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            About Mantras
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mantras are sacred sounds that carry powerful vibrations. By chanting or listening to mantras, 
            you align your energy with divine frequencies, promoting healing, clarity, and spiritual awakening. 
            Complete each mantra to earn 111 SHC as a reward for your practice.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Mantras;
