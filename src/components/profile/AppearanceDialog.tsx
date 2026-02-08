import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AppearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStoredTheme = (): 'dark' | 'light' | 'system' => {
  const stored = localStorage.getItem('app-theme');
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored;
  }
  return 'dark';
};

const applyTheme = (theme: 'dark' | 'light' | 'system') => {
  document.documentElement.classList.remove('light', 'dark');
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.classList.add(theme);
  }
};

// Apply theme on initial load
if (typeof window !== 'undefined') {
  applyTheme(getStoredTheme());
}

export const AppearanceDialog: React.FC<AppearanceDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const [theme, setTheme] = React.useState<'dark' | 'light' | 'system'>(getStoredTheme);

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    applyTheme(newTheme);
    toast({
      title: t('appearance.themeUpdated'),
      description: `${t('appearance.themeChangedTo')} ${t(`appearance.${newTheme}`)}`,
    });
  };

  const themeOptions = [
    { value: 'dark' as const, labelKey: 'appearance.dark', icon: Moon, descKey: 'appearance.darkDesc' },
    { value: 'light' as const, labelKey: 'appearance.light', icon: Sun, descKey: 'appearance.lightDesc' },
    { value: 'system' as const, labelKey: 'appearance.system', icon: Monitor, descKey: 'appearance.systemDesc' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Moon size={20} className="text-primary" />
            {t('appearance.title')}
          </DialogTitle>
          <DialogDescription>
            {t('appearance.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label className="text-muted-foreground text-sm">{t('appearance.chooseTheme')}</Label>
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
                  <p className="font-medium text-foreground">{t(option.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(option.descKey)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
