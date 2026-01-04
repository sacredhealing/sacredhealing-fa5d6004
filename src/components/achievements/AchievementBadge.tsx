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

const colorMap: Record<string, string> = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-slate-300 to-slate-500",
  gold: "from-yellow-400 to-yellow-600",
  purple: "from-purple-500 to-purple-700",
  diamond: "from-cyan-300 to-cyan-500",
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
  const gradientClass = colorMap[badgeColor] || colorMap.gold;

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
        "relative rounded-full flex items-center justify-center",
        sizeClasses[size],
        unlocked 
          ? `bg-gradient-to-br ${gradientClass} shadow-lg` 
          : "bg-muted"
      )}>
        <Icon className={cn(
          iconSizes[size],
          unlocked ? "text-white" : "text-muted-foreground"
        )} />
        
        {!unlocked && (
          <div className="absolute inset-0 rounded-full bg-background/50 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground" />
          </div>
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
