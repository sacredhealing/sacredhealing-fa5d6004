import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ServiceBannerRowProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaText?: string;
  onCtaClick: () => void;
  accentColor?: 'purple' | 'amber' | 'yellow' | 'green';
  showArrow?: boolean;
  className?: string;
  /** Sanctuary (Babaji's Cave): smoky glass, gold Om, price above title */
  variant?: 'default' | 'sanctuary';
  /** When variant=sanctuary, show this as serif price above the title (e.g. "€47") */
  priceAboveTitle?: string;
}

const ServiceBannerRow: React.FC<ServiceBannerRowProps> = ({
  icon: Icon,
  title,
  subtitle,
  ctaText,
  onCtaClick,
  accentColor = 'purple',
  showArrow = true,
  className,
  variant = 'default',
  priceAboveTitle,
}) => {
  const accentColors: Record<string, { bg: string; text: string; border: string; button: string }> = {
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      button: 'bg-purple-500 hover:bg-purple-600',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      button: 'bg-amber-500 hover:bg-amber-600',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      button: 'bg-yellow-500 hover:bg-yellow-600',
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      button: 'bg-green-500 hover:bg-green-600',
    },
  };

  const colors = accentColors[accentColor];

  if (variant === 'sanctuary') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer',
          'bg-white/[0.06] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.09]',
          className
        )}
        onClick={!ctaText ? onCtaClick : undefined}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xl font-serif shrink-0" style={{ fontFamily: 'Georgia, serif' }}>
          ॐ
        </div>
        <div className="flex-1 min-w-0">
          {priceAboveTitle && (
            <p className="text-xs font-serif text-[#D4AF37]/90 mb-0.5" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {priceAboveTitle}
            </p>
          )}
          <h4 className="font-semibold text-foreground truncate">{title}</h4>
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        </div>
        {ctaText ? (
          <Button
            size="sm"
            className="border border-[#D4AF37]/60 text-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10 whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              onCtaClick();
            }}
          >
            {ctaText}
          </Button>
        ) : showArrow ? (
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/20',
        colors.border,
        colors.bg,
        className
      )}
      onClick={!ctaText ? onCtaClick : undefined}
    >
      <div className={cn('p-2 rounded-full', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">{title}</h4>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
      {ctaText ? (
        <Button
          size="sm"
          className={cn('text-white whitespace-nowrap', colors.button)}
          onClick={(e) => {
            e.stopPropagation();
            onCtaClick();
          }}
        >
          {ctaText}
        </Button>
      ) : showArrow ? (
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      ) : null}
    </div>
  );
};

export { ServiceBannerRow };
