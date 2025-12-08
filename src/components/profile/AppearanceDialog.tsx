import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppearanceDialog: React.FC<AppearanceDialogProps> = ({ open, onOpenChange }) => {
  const [theme, setTheme] = React.useState<'dark' | 'light' | 'system'>('dark');

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    // For now, app is dark mode only - this is prepared for future theme support
    document.documentElement.classList.remove('light', 'dark');
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(newTheme);
    }
  };

  const themeOptions = [
    { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { value: 'light' as const, label: 'Light', icon: Sun, description: 'Bright and clear' },
    { value: 'system' as const, label: 'System', icon: Monitor, description: 'Match device settings' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Moon size={20} className="text-primary" />
            Appearance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label className="text-muted-foreground text-sm">Choose your theme</Label>
          <div className="grid gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all",
                  theme === option.value
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/20 border-border/50 hover:bg-muted/40"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  theme === option.value ? "bg-primary/20" : "bg-muted"
                )}>
                  <option.icon size={20} className={theme === option.value ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
