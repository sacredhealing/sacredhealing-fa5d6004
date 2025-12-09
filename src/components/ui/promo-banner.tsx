import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Loader2, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PromoBannerFeature {
  icon?: LucideIcon;
  text: string;
}

export interface PromoBannerPrice {
  amount: number;
  currency?: string;
  label?: string;
  originalAmount?: number;
  savings?: string;
  isHighlighted?: boolean;
}

export interface PromoBannerProps {
  badge?: string;
  badgeIcon?: string;
  title: string;
  description: string;
  features?: PromoBannerFeature[];
  featuresLeft?: PromoBannerFeature[];
  featuresRight?: PromoBannerFeature[];
  prices?: PromoBannerPrice[];
  ctaText: string;
  ctaIcon?: LucideIcon;
  onCtaClick: () => void;
  isLoading?: boolean;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  accentColor?: string;
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  className?: string;
}

const PromoBanner: React.FC<PromoBannerProps> = ({
  badge,
  badgeIcon,
  title,
  description,
  features = [],
  featuresLeft = [],
  featuresRight = [],
  prices = [],
  ctaText,
  ctaIcon: CtaIcon,
  onCtaClick,
  isLoading = false,
  gradientFrom = 'from-amber-600/30',
  gradientVia = 'via-purple-500/20',
  gradientTo = 'to-amber-800/30',
  accentColor = 'amber',
  expandable = false,
  expandedContent,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const accentColors: Record<string, { badge: string; border: string; text: string; button: string; glow: string }> = {
    amber: {
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      button: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
      glow: 'bg-amber-500/20',
    },
    purple: {
      badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      button: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      glow: 'bg-purple-500/20',
    },
    yellow: {
      badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      button: 'from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
      glow: 'bg-yellow-500/20',
    },
    green: {
      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      border: 'border-green-500/30',
      text: 'text-green-400',
      button: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
      glow: 'bg-green-500/20',
    },
  };

  const colors = accentColors[accentColor] || accentColors.amber;

  const handleClick = () => {
    if (expandable && !isExpanded) {
      setIsExpanded(true);
    } else {
      onCtaClick();
    }
  };

  const hasDoubleFeatures = featuresLeft.length > 0 || featuresRight.length > 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 animate-slide-up transition-all duration-300',
        `bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`,
        colors.border,
        'border',
        className
      )}
    >
      {/* Background glows */}
      <div className={cn('absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl', colors.glow)} />
      <div className={cn('absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-60', colors.glow)} />

      <div className="relative">
        {/* Badge */}
        {badge && (
          <Badge className={cn('mb-3', colors.badge)}>
            {badgeIcon} {badge}
          </Badge>
        )}

        {/* Title */}
        <h3 className="text-xl font-heading font-bold text-foreground mb-2">{title}</h3>

        {/* Description */}
        <p className="text-foreground/80 mb-4 leading-relaxed text-sm">{description}</p>

        {/* Features - Single column */}
        {features.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mb-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-foreground/70">
                {feature.icon && <feature.icon size={16} className={colors.text} />}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Features - Double column */}
        {hasDoubleFeatures && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {featuresLeft.length > 0 && (
              <div className="space-y-2">
                {featuresLeft.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-foreground/70">
                    {feature.icon && <feature.icon size={16} className={cn(colors.text, 'mt-0.5 flex-shrink-0')} />}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            )}
            {featuresRight.length > 0 && (
              <div className="space-y-2">
                {featuresRight.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-foreground/70">
                    {feature.icon && <feature.icon size={16} className={cn(colors.text, 'mt-0.5 flex-shrink-0')} />}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expanded content */}
        {expandable && isExpanded && expandedContent && (
          <div className="mb-4 animate-fade-in">{expandedContent}</div>
        )}

        {/* Prices */}
        {prices.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {prices.map((price, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-muted-foreground text-sm">or</span>}
                <div className="flex items-baseline gap-1">
                  <span className={cn('text-2xl font-heading font-bold', price.isHighlighted ? 'text-gradient-gold' : 'text-foreground')}>
                    {price.currency || '€'}{price.amount}
                  </span>
                  {price.label && <span className="text-muted-foreground text-sm">{price.label}</span>}
                  {price.savings && (
                    <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      {price.savings}
                    </Badge>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleClick}
          disabled={isLoading}
          className={cn('bg-gradient-to-r text-white font-semibold', colors.button)}
        >
          {isLoading ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : CtaIcon ? (
            <CtaIcon size={18} className="mr-2" />
          ) : expandable && !isExpanded ? (
            <ChevronDown size={18} className="mr-2" />
          ) : (
            <ChevronRight size={18} className="mr-2" />
          )}
          {ctaText}
        </Button>

        {/* Collapse button when expanded */}
        {expandable && isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="ml-2 text-muted-foreground"
          >
            Collapse
          </Button>
        )}
      </div>
    </div>
  );
};

export { PromoBanner };
