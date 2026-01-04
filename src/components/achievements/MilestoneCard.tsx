import React from 'react';
import { Award, Star, Crown, Sparkles, Flame, Target, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface MilestoneCardProps {
  name: string;
  description?: string;
  iconName: string;
  currentValue: number;
  targetValue: number;
  reached: boolean;
  reachedAt?: string;
  shcReward?: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award,
  Star,
  Crown,
  Sparkles,
  Flame,
  Target,
  Heart,
  Zap,
};

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  name,
  description,
  iconName,
  currentValue,
  targetValue,
  reached,
  reachedAt,
  shcReward,
}) => {
  const Icon = iconMap[iconName] || Award;
  const progress = Math.min((currentValue / targetValue) * 100, 100);

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-4 transition-all duration-300",
        reached 
          ? "bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border border-amber-500/30"
          : "bg-card/50 border border-border/30"
      )}
    >
      {/* Glow effect for reached milestones */}
      {reached && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/30 rounded-full blur-2xl" />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
          reached 
            ? "bg-gradient-to-br from-amber-400 to-orange-500" 
            : "bg-muted"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            reached ? "text-white" : "text-muted-foreground"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-semibold truncate",
              reached ? "text-amber-400" : "text-foreground"
            )}>
              {name}
            </h4>
            {reached && (
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                ✓ Achieved
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {description}
            </p>
          )}

          {/* Progress */}
          {!reached && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentValue.toLocaleString()} / {targetValue.toLocaleString()}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Reward */}
          {shcReward && shcReward > 0 && (
            <div className={cn(
              "mt-2 inline-flex items-center gap-1 text-sm",
              reached ? "text-amber-400" : "text-primary"
            )}>
              <Sparkles className="w-4 h-4" />
              +{shcReward} SHC
            </div>
          )}

          {/* Reached date */}
          {reached && reachedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Reached on {new Date(reachedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
