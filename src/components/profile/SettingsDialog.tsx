import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Volume2, Vibrate, Download, Trash2, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { APP_HOW_IT_WORKS_YOUTUBE_URL } from '@/lib/marketingUrls';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const [soundEffects, setSoundEffects] = React.useState(true);
  const [hapticFeedback, setHapticFeedback] = React.useState(true);
  const [autoDownload, setAutoDownload] = React.useState(false);
  const { toast } = useToast();

  const handleClearCache = () => {
    localStorage.clear();
    toast({
      title: t('settingsDialog.clearCacheTitle'),
      description: t('settingsDialog.clearCacheDesc'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings size={20} className="text-primary" />
            {t('settingsDialog.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Youtube size={22} className="text-red-500 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('settingsDialog.howAppWorksTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('settingsDialog.howAppWorksDesc')}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href={APP_HOW_IT_WORKS_YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                {t('settingsDialog.watchOnYoutube')}
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="sound-effects" className="text-foreground">{t('settingsDialog.soundEffects')}</Label>
                <p className="text-xs text-muted-foreground">{t('settingsDialog.soundEffectsDesc')}</p>
              </div>
            </div>
            <Switch id="sound-effects" checked={soundEffects} onCheckedChange={setSoundEffects} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="haptic-feedback" className="text-foreground">{t('settingsDialog.hapticFeedback')}</Label>
                <p className="text-xs text-muted-foreground">{t('settingsDialog.hapticDesc')}</p>
              </div>
            </div>
            <Switch id="haptic-feedback" checked={hapticFeedback} onCheckedChange={setHapticFeedback} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="auto-download" className="text-foreground">{t('settingsDialog.autoDownload')}</Label>
                <p className="text-xs text-muted-foreground">{t('settingsDialog.autoDownloadDesc')}</p>
              </div>
            </div>
            <Switch id="auto-download" checked={autoDownload} onCheckedChange={setAutoDownload} />
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleClearCache}
            >
              <Trash2 size={16} className="mr-2" />
              {t('settingsDialog.clearCache')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
