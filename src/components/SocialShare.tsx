import React from 'react';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Linkedin, Link2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export const SocialShare: React.FC<SocialShareProps> = ({
  title = 'Sacred Healing',
  text = 'Check out Sacred Healing - Transform your spiritual journey!',
  url,
  className,
  variant = 'default'
}) => {
  const { t } = useTranslation();
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      color: 'hover:bg-[#1877F2]/20 hover:text-[#1877F2]'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      color: 'hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2]'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`,
      color: 'hover:bg-[#0A66C2]/20 hover:text-[#0A66C2]'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: 'hover:bg-[#25D366]/20 hover:text-[#25D366]'
    }
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('share.linkCopied'));
    } catch (err) {
      toast.error(t('share.copyFailed'));
    }
  };

  const openShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 rounded-full transition-all', link.color)}
            onClick={() => openShare(link.url)}
            title={`Share on ${link.name}`}
          >
            <link.icon size={16} />
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary"
          onClick={copyLink}
          title={t('share.copyLink')}
        >
          <Link2 size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-sm text-muted-foreground">{t('share.shareWith')}</p>
      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="outline"
            size="sm"
            className={cn('gap-2 transition-all', link.color)}
            onClick={() => openShare(link.url)}
          >
            <link.icon size={18} />
            {link.name}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-primary/20 hover:text-primary"
          onClick={copyLink}
        >
          <Link2 size={18} />
          {t('share.copyLink')}
        </Button>
      </div>
    </div>
  );
};
