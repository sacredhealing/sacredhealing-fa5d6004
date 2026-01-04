import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "./AchievementBadge";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  badge_color: string;
  shc_reward: number;
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
  onShare?: (achievement: Achievement) => void;
}

export const AchievementPopup = ({ 
  achievement, 
  onClose,
  onShare 
}: AchievementPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleShare = () => {
    if (achievement && onShare) {
      onShare(achievement);
    }
  };

  return (
    <AnimatePresence>
      {achievement && isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="relative bg-gradient-to-br from-primary/20 via-card to-accent/20 border border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Confetti/sparkle background effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-primary/40"
                  initial={{ 
                    x: Math.random() * 400 - 200, 
                    y: -20,
                    opacity: 1 
                  }}
                  animate={{ 
                    y: 200,
                    opacity: 0 
                  }}
                  transition={{ 
                    duration: 2,
                    delay: Math.random() * 0.5,
                    repeat: Infinity
                  }}
                />
              ))}
            </div>

            <div className="relative p-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-2 right-2 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="text-center mb-4">
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-primary font-semibold text-sm uppercase tracking-wider"
                >
                  Achievement Unlocked!
                </motion.p>
              </div>

              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, delay: 0.2 }}
                >
                  <AchievementBadge
                    name={achievement.name}
                    description={achievement.description}
                    iconName={achievement.icon_name}
                    badgeColor={achievement.badge_color}
                    shcReward={achievement.shc_reward}
                    unlocked
                    size="lg"
                  />
                </motion.div>
              </div>

              {onShare && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 flex justify-center"
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Achievement
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
