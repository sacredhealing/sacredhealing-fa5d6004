import React from 'react';
import { Share2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { toast } from 'sonner';

interface ShareableQuoteCardProps {
  quote: string;
  author?: string;
  category?: string;
  onShare?: () => void;
}

export const ShareableQuoteCard: React.FC<ShareableQuoteCardProps> = ({
  quote,
  author = 'Sacred Healing',
  category,
  onShare,
}) => {
  const handleShare = async () => {
    const shareUrl = 'https://sacredhealing.lovable.app?utm_source=share&utm_medium=quote';
    const shareText = `"${quote}"\n\n— ${author}\n\n✨ Discover daily wisdom at Sacred Healing`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Wisdom',
          text: shareText,
          url: shareUrl,
        });
        onShare?.();
        toast.success('Shared successfully!');
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
      toast.success('Quote copied to clipboard!');
      onShare?.();
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/90 via-indigo-800/80 to-violet-900/90 border-purple-500/30 p-6">
      {/* Background decorations */}
      <div className="absolute top-4 left-4 opacity-20">
        <Quote className="w-16 h-16 text-purple-300" />
      </div>
      <div className="absolute bottom-0 right-0 opacity-20">
        <LotusIcon size={100} />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />

      <div className="relative">
        {/* Category badge */}
        {category && (
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-purple-200 mb-4">
            {category}
          </span>
        )}

        {/* Quote */}
        <blockquote className="text-lg md:text-xl text-white font-medium leading-relaxed mb-4 italic">
          "{quote}"
        </blockquote>

        {/* Author */}
        <p className="text-sm text-purple-200 mb-6">
          — {author}
        </p>

        {/* Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LotusIcon size={20} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Sacred Healing</span>
          </div>

          <Button 
            size="sm"
            onClick={handleShare}
            className="bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </Card>
  );
};
