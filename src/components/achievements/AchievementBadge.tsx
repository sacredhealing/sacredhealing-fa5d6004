import { Award, Flame, Target, Share2, Users, Star, Sparkles, Heart, Crown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  name: string;
  description?: string;
  iconName: string;
  badgeColor?: string;
  unlocked?: boolean;
  unlockedAt?: string;
  shcReward?: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  onClick?: () => void;
}

const iconMap: Record<string, any> = {
  Award,
  Flame,
  Target,
  Share2,
  Users,
  Star,
  Sparkles,
  Heart,
  Crown,
  Calendar,
};

const colorMap: Record<string, { gradient: string; icon: string; glow: string }> = {
  bronze: { gradient: "from-amber-600 to-amber-800", icon: "text-amber-100", glow: "shadow-amber-500/50" },
  silver: { gradient: "from-slate-300 to-slate-500", icon: "text-slate-100", glow: "shadow-slate-400/50" },
  gold: { gradient: "from-yellow-400 to-amber-500", icon: "text-yellow-100", glow: "shadow-yellow-500/50" },
  purple: { gradient: "from-purple-500 to-purple-700", icon: "text-purple-100", glow: "shadow-purple-500/50" },
  diamond: { gradient: "from-cyan-300 to-cyan-500", icon: "text-cyan-100", glow: "shadow-cyan-400/50" },
  orange: { gradient: "from-orange-400 to-orange-600", icon: "text-orange-100", glow: "shadow-orange-500/50" },
};

export const AchievementBadge = ({
  name,
  description,
  iconName,
  badgeColor = "gold",
  unlocked = false,
  unlockedAt,
  shcReward,
  size = "md",
  showDetails = true,
  onClick,
}: AchievementBadgeProps) => {
  const Icon = iconMap[iconName] || Award;
  const colorStyle = colorMap[badgeColor] || colorMap.gold;

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300",
        unlocked ? "bg-card/50" : "bg-card/20 opacity-50",
        onClick && "cursor-pointer hover:bg-card/70"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "relative rounded-full flex items-center justify-center transition-all duration-300",
        sizeClasses[size],
        unlocked 
          ? `bg-gradient-to-br ${colorStyle.gradient} shadow-lg ${colorStyle.glow}` 
          : "bg-muted/50 border border-border/50"
      )}>
        <Icon className={cn(
          iconSizes[size],
          unlocked ? colorStyle.icon : "text-muted-foreground/50"
        )} />
        
        {unlocked && (
          <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" style={{ animationDuration: '3s' }} />
        )}
      </div>

      {showDetails && (
        <div className="text-center">
          <p className={cn(
            "font-semibold text-sm",
            unlocked ? "text-foreground" : "text-muted-foreground"
          )}>
            {name}
          </p>
          
          {description && (
            <p className="text-xs text-muted-foreground mt-1 max-w-[120px]">
              {description}
            </p>
          )}

          {shcReward && shcReward > 0 && (
            <p className={cn(
              "text-xs mt-1",
              unlocked ? "text-primary" : "text-muted-foreground"
            )}>
              +{shcReward} SHC
            </p>
          )}

          {unlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
