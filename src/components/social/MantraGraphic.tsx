import React from 'react';
import { Share2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface MantraGraphicProps {
  mantra: string;
  title?: string;
  duration?: string;
  shcReward?: number;
  onShare?: () => void;
}

export const MantraGraphic: React.FC<MantraGraphicProps> = ({
  mantra,
  title,
  duration,
  shcReward,
  onShare,
}) => {
  const { t } = useTranslation();
  const handleShare = async () => {
    const shareUrl = 'https://sacredhealing.lovable.app/mantras?utm_source=share&utm_medium=mantra';
    const shareText = `🕉️ ${title || 'Sacred Mantra'}\n\n"${mantra}"\n\n✨ Chant with me on Siddha Quantum Nexus`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Sacred Mantra',
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
      toast.success('Mantra copied to clipboard!');
      onShare?.();
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-amber-900/90 via-orange-800/80 to-red-900/90 border-amber-500/30 p-6">
      {/* Sacred geometry background */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
          {/* Sri Yantra triangles simplified */}
          <polygon points="100,30 170,140 30,140" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
          <polygon points="100,160 30,60 170,60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
        </svg>
      </div>
      
      {/* Glow effects */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/30 rounded-full blur-3xl" />

      <div className="relative text-center">
        {/* Om symbol */}
        <div className="text-5xl mb-4">🕉️</div>

        {/* Title */}
        {title && (
          <h3 className="text-lg font-heading font-bold text-amber-400 mb-2">
            {title}
          </h3>
        )}

        {/* Mantra text */}
        <p className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-4 font-heading">
          {mantra}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-center gap-4 text-sm text-amber-200 mb-6">
          {duration && (
            <span className="flex items-center gap-1">
              <Music className="w-4 h-4" />
              {duration}
            </span>
          )}
          {shcReward && (
            <span className="flex items-center gap-1">
              ✨ {t('mantras.share.shcLine', { amount: shcReward })}
            </span>
          )}
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <LotusIcon size={20} className="text-amber-400" />
          <span className="text-sm font-medium text-amber-400">{t('mantras.share.brand')}</span>
        </div>

        {/* Share Button */}
        <Button 
          size="sm"
          onClick={handleShare}
          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {t('mantras.share.button')}
        </Button>
      </div>
    </Card>
  );
};
