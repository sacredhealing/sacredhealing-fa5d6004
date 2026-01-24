import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioLines, CloudRain, Gem, Circle, X, Volume2, VolumeX } from 'lucide-react';
import { useAmbientAudio, AmbientSound } from '@/contexts/AmbientAudioContext';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  'cloud-rain': CloudRain,
  'gem': Gem,
  'circle': Circle,
  'music': AudioLines,
};

export const AmbientSoundToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { sounds, currentSound, isPlaying, volume, playSound, stopSound, setVolume, isLoading } = useAmbientAudio();
  const [isOpen, setIsOpen] = useState(false);

  const handleSoundSelect = (sound: AmbientSound) => {
    if (currentSound?.id === sound.id && isPlaying) {
      stopSound();
    } else {
      playSound(sound);
    }
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || AudioLines;
  };

  return (
    <div className={cn('relative', className)}>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2.5 rounded-full transition-all duration-300',
          isPlaying
            ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(138,43,226,0.3)]'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        whileTap={{ scale: 0.95 }}
        aria-label="Ambient sounds"
      >
        <AudioLines className="w-5 h-5" />
        
        {/* Playing indicator */}
        {isPlaying && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">Ambient Sounds</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Sound Options */}
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sounds.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No ambient sounds available
                  </p>
                ) : (
                  sounds.map((sound) => {
                    const IconComponent = getIcon(sound.icon_name);
                    const isActive = currentSound?.id === sound.id && isPlaying;
                    const hasAudio = !!sound.audio_url;

                    return (
                      <button
                        key={sound.id}
                        onClick={() => hasAudio && handleSoundSelect(sound)}
                        disabled={!hasAudio}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
                          isActive
                            ? 'bg-primary/20 text-primary'
                            : hasAudio
                            ? 'hover:bg-muted text-foreground'
                            : 'opacity-50 cursor-not-allowed text-muted-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            isActive ? 'bg-primary/20' : 'bg-muted'
                          )}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{sound.name}</p>
                          {!hasAudio && (
                            <p className="text-xs text-muted-foreground">Coming soon</p>
                          )}
                        </div>
                        {isActive && (
                          <motion.div
                            className="flex gap-0.5"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <span className="w-1 h-3 bg-primary rounded-full" />
                            <span className="w-1 h-4 bg-primary rounded-full" />
                            <span className="w-1 h-2 bg-primary rounded-full" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Volume Control */}
              {currentSound && (
                <div className="p-3 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                    <Slider
                      value={[volume * 100]}
                      onValueChange={([val]) => setVolume(val / 100)}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Volume: {Math.round(volume * 100)}%
                  </p>
                </div>
              )}

              {/* Stop Button */}
              {isPlaying && (
                <div className="p-2 border-t border-border/50">
                  <button
                    onClick={stopSound}
                    className="w-full p-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    Stop Ambient Sound
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
