import React from 'react';
import { Share2, X, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { toast } from 'sonner';
import { Track } from '@/contexts/MusicPlayerContext';
import { useTranslation } from '@/hooks/useTranslation';
import { tMusicMood, tMusicSpiritualPath } from '@/features/music/musicDisplayI18n';

interface MusicShareCardProps {
  track: Track;
  onClose?: () => void;
  onShare?: () => void;
}

export const MusicShareCard: React.FC<MusicShareCardProps> = ({
  track,
  onClose,
  onShare,
}) => {
  const { t } = useTranslation();

  const buildShareText = () => {
    const by = t('music.shareCard.by', 'by');
    const tagline = t('music.shareCard.discoverTagline', 'Discover healing music at Siddha Quantum Nexus');
    let text = `🎵 "${track.title}" ${by} ${track.artist}\n\n`;
    if (track.affirmation) {
      text += `${t('music.shareCard.affirmationLine', { defaultValue: '✨ "{{text}}"', text: track.affirmation })}\n\n`;
    }
    text += tagline;
    return text;
  };

  const handleShare = async () => {
    const shareUrl = `https://sacredhealing.lovable.app/music/track/${track.id}?utm_source=share&utm_medium=music`;
    const shareText = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: shareText,
          url: shareUrl,
        });
        onShare?.();
        toast.success(t('music.shareCard.sharedOk', 'Shared successfully!'));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText + '\n' + shareUrl);
        }
      }
    } else {
      copyToClipboard(shareText + '\n' + shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('music.shareCard.copiedOk', 'Copied to clipboard!'));
      onShare?.();
    } catch (err) {
      toast.error(t('music.shareCard.copyFail', 'Failed to copy'));
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-900/95 via-purple-800/90 to-violet-900/95 border-purple-500/30">
      {/* Close button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X size={16} className="text-white" />
        </button>
      )}

      {/* Background decorations */}
      <div className="absolute bottom-0 right-0 opacity-10">
        <LotusIcon size={120} />
      </div>
      <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />

      <div className="relative p-6">
        {/* Track Cover */}
        <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden shadow-2xl mb-4 border border-white/10">
          {track.cover_image_url ? (
            <img src={track.cover_image_url} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <Music2 size={40} className="text-white/50" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-white mb-1">{track.title}</h3>
          <p className="text-purple-200 text-sm">{track.artist}</p>
        </div>

        {/* Mood & Path badges */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {track.mood && (
            <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-medium capitalize">
              {tMusicMood(track.mood, t as any)}
            </span>
          )}
          {track.spiritual_path && (
            <span className="bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-full text-xs font-medium capitalize">
              {tMusicSpiritualPath(track.spiritual_path, t)}
            </span>
          )}
        </div>

        {/* Affirmation */}
        {track.affirmation && (
          <blockquote className="text-center text-white/90 italic text-sm leading-relaxed mb-5 px-2">
            "{track.affirmation}"
          </blockquote>
        )}

        {/* Branding */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <LotusIcon size={20} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              {t('music.shareCard.brandName', 'Siddha Quantum Nexus')}
            </span>
          </div>

          <Button 
            size="sm"
            onClick={handleShare}
            className="bg-white/15 hover:bg-white/25 text-white border-0 gap-2"
          >
            <Share2 size={14} />
            {t('music.shareCard.shareCta', 'Share')}
          </Button>
        </div>
      </div>
    </Card>
  );
};
