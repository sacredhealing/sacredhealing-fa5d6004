import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Download, Flame, Trophy, Star, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { useSHC } from '@/contexts/SHCContext';
import { useAchievements } from '@/hooks/useAchievements';
import { toast } from 'sonner';

interface ShareableProgressCardProps {
  onShare?: () => void;
}

export const ShareableProgressCard: React.FC<ShareableProgressCardProps> = ({ onShare }) => {
  const { t } = useTranslation();
  const { balance, profile } = useSHC();
  const { userAchievements, userMilestones } = useAchievements();
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = [
    { 
      icon: Flame, 
      value: profile?.streak_days ?? 0, 
      labelKey: 'progressCard.dayStreak',
      color: 'text-orange-400'
    },
    { 
      icon: Trophy, 
      value: userAchievements.length, 
      labelKey: 'progressCard.achievements',
      color: 'text-yellow-400'
    },
    { 
      icon: Star, 
      value: userMilestones.length, 
      labelKey: 'progressCard.milestones',
      color: 'text-purple-400'
    },
    { 
      icon: Sparkles, 
      value: balance?.balance ?? 0, 
      labelKey: 'progressCard.shcEarned',
      color: 'text-amber-400'
    },
  ];

  const handleShare = async () => {
    const shareUrl = 'https://sacredhealing.lovable.app?utm_source=share&utm_medium=progress_card';
    const shareText = [
      `🧘 ${t('progressCard.shareIntro')}`,
      `✨ ${profile?.streak_days ?? 0} ${t('progressCard.dayStreak')}`,
      `🏆 ${userAchievements.length} ${t('progressCard.achievements')}`,
      `💫 ${balance?.balance ?? 0} ${t('progressCard.shcEarned')}`,
      '',
      t('progressCard.shareJoinPath'),
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('progressCard.shareTitle'),
          text: shareText,
          url: shareUrl,
        });
        onShare?.();
        toast.success(t('progressCard.sharedSuccess'));
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
      toast.success(t('progressCard.copiedToClipboard'));
      onShare?.();
    } catch (err) {
      toast.error(t('progressCard.failedToCopy'));
    }
  };

  return (
    <Card 
      ref={cardRef}
      className="relative overflow-hidden bg-gradient-to-br from-purple-900/90 via-violet-800/80 to-fuchsia-900/90 border-purple-500/30 p-6"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-20">
        <LotusIcon size={120} />
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-white">
              {(profile as any)?.display_name || t('progressCard.sacredSoul')}
            </h3>
            <p className="text-sm text-purple-200">{t('progressCard.sacredHealingJourney')}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat) => (
            <div 
              key={stat.labelKey}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
            >
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-purple-200">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <LotusIcon size={20} className="text-amber-400" />
          <span className="text-sm font-medium text-amber-400">{t('progressCard.sacredHealing')}</span>
        </div>

        {/* Share Button */}
        <Button 
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {t('progressCard.shareMyProgress')}
        </Button>
      </div>
    </Card>
  );
};
