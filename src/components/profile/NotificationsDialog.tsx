import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Clock, Sparkles, Heart } from 'lucide-react';

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({ open, onOpenChange }) => {
  const [dailyReminders, setDailyReminders] = React.useState(true);
  const [meditationReminders, setMeditationReminders] = React.useState(true);
  const [newContent, setNewContent] = React.useState(true);
  const [communityUpdates, setCommunityUpdates] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bell size={20} className="text-primary" />
            Notifications
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-muted-foreground" />
              <Label htmlFor="daily-reminders" className="text-foreground">Daily Reminders</Label>
            </div>
            <Switch id="daily-reminders" checked={dailyReminders} onCheckedChange={setDailyReminders} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-muted-foreground" />
              <Label htmlFor="meditation-reminders" className="text-foreground">Meditation Reminders</Label>
            </div>
            <Switch id="meditation-reminders" checked={meditationReminders} onCheckedChange={setMeditationReminders} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-muted-foreground" />
              <Label htmlFor="new-content" className="text-foreground">New Content Alerts</Label>
            </div>
            <Switch id="new-content" checked={newContent} onCheckedChange={setNewContent} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart size={18} className="text-muted-foreground" />
              <Label htmlFor="community-updates" className="text-foreground">Community Updates</Label>
            </div>
            <Switch id="community-updates" checked={communityUpdates} onCheckedChange={setCommunityUpdates} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
