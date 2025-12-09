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
      {/* Icon */}
      <div className={cn('p-2 rounded-full', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">{title}</h4>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>

      {/* CTA or Arrow */}
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
