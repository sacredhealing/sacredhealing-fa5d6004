import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Moon, Sun, Sparkles, Heart, Leaf, Brain, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { requestNotificationPermission, scheduleNotification, cancelNotification, rescheduleAllNotifications } from '@/services/NotificationService';

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReminderSetting {
  enabled: boolean;
  time: string;
}

interface NotificationPreferences {
  dailyMantra: ReminderSetting;
  dailyAffirmations: ReminderSetting;
  dailyMeditation: ReminderSetting;
  morningPractice: ReminderSetting;
  eveningPractice: ReminderSetting;
  healingJourney: ReminderSetting;
  mindfulnessCheckin: ReminderSetting;
}

const defaultPreferences: NotificationPreferences = {
  dailyMantra: { enabled: false, time: '08:00' },
  dailyAffirmations: { enabled: false, time: '11:00' },
  dailyMeditation: { enabled: false, time: '20:00' },
  morningPractice: { enabled: false, time: '07:00' },
  eveningPractice: { enabled: false, time: '21:00' },
  healingJourney: { enabled: false, time: '10:00' },
  mindfulnessCheckin: { enabled: false, time: '14:00' },
};

const timeOptions = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00'
];

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({ open, onOpenChange }) => {
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem('notification-preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  // Save preferences and handle notification scheduling
  const handlePreferenceChange = useCallback(async (
    key: keyof NotificationPreferences, 
    field: 'enabled' | 'time', 
    value: boolean | string
  ) => {
    const newPreferences = {
      ...preferences,
      [key]: { ...preferences[key], [field]: value }
    };
    
    setPreferences(newPreferences);
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences));
    
    const setting = newPreferences[key];
    
    // Handle notification scheduling
    if (field === 'enabled') {
      if (value === true) {
        // Request permission and schedule notification
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          await scheduleNotification(key, setting.time);
          toast.success('Reminder scheduled');
        } else {
          // Revert if permission denied
          setPreferences(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: false }
          }));
          toast.error('Notification permission denied');
        }
      } else {
        // Cancel notification
        await cancelNotification(key);
        toast.success('Reminder cancelled');
      }
    } else if (field === 'time' && setting.enabled) {
      // Reschedule with new time
      await scheduleNotification(key, value as string);
      toast.success('Reminder time updated');
    }
  }, [preferences]);

  // Initialize notifications on mount
  useEffect(() => {
    rescheduleAllNotifications();
  }, []);

  const reminderTypes = [
    {
      key: 'dailyMantra' as const,
      icon: Leaf,
      title: 'Daily Mantra',
      description: 'Return to your center with your sacred mantra',
      defaultTime: 'Morning',
    },
    {
      key: 'dailyAffirmations' as const,
      icon: Sparkles,
      title: 'Daily Affirmations',
      description: 'Plant positive seeds within your mind',
      defaultTime: 'Late morning',
    },
    {
      key: 'dailyMeditation' as const,
      icon: Moon,
      title: 'Daily Meditation',
      description: 'A few minutes of stillness to restore your energy',
      defaultTime: 'Evening',
    },
    {
      key: 'morningPractice' as const,
      icon: Sun,
      title: 'Morning Practice',
      description: 'Begin the day with presence and intention',
      defaultTime: 'Morning',
    },
    {
      key: 'eveningPractice' as const,
      icon: Moon,
      title: 'Evening Practice',
      description: 'Release the day and rest inward',
      defaultTime: 'Evening',
    },
    {
      key: 'healingJourney' as const,
      icon: Heart,
      title: 'Healing Journey',
      description: 'Gentle reflection on your healing path',
      defaultTime: '1-3 times weekly',
    },
    {
      key: 'mindfulnessCheckin' as const,
      icon: Brain,
      title: 'Mindfulness Check-in',
      description: 'Observe your mind with kindness',
      defaultTime: 'Optional',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bell size={20} className="text-primary" />
            Gentle Reminders
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Soft nudges to support your practice — all optional, never demanding
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {reminderTypes.map((reminder) => {
              const Icon = reminder.icon;
              const pref = preferences[reminder.key];
              
              return (
                <div 
                  key={reminder.key}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    pref.enabled 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        pref.enabled ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Icon size={18} className={
                          pref.enabled ? 'text-primary' : 'text-muted-foreground'
                        } />
                      </div>
                      <div className="flex-1">
                        <Label 
                          htmlFor={`${reminder.key}-toggle`}
                          className="text-foreground font-medium cursor-pointer"
                        >
                          {reminder.title}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {reminder.description}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      id={`${reminder.key}-toggle`}
                      checked={pref.enabled}
                      onCheckedChange={(checked) => handlePreferenceChange(reminder.key, 'enabled', checked)}
                    />
                  </div>
                  
                  {pref.enabled && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Remind me at</span>
                        <Select 
                          value={pref.time}
                          onValueChange={(value) => handlePreferenceChange(reminder.key, 'time', value)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time} className="text-xs">
                                {formatTime(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Gentle footer message */}
            <div className="text-center pt-4 pb-2">
              <p className="text-xs text-muted-foreground italic">
                "A soft tap on the shoulder from awareness itself"
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
