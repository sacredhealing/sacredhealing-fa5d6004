import React, { useEffect, useState } from 'react';
import { X, Bell, Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
}

export const AnnouncementPopup: React.FC = () => {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, [user]);

  const fetchAnnouncement = async () => {
    // Get all active announcements
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !announcements?.length) return;

    // If user is logged in, filter out dismissed announcements
    if (user) {
      const { data: dismissals } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id')
        .eq('user_id', user.id);

      const dismissedIds = new Set(dismissals?.map(d => d.announcement_id) || []);
      const unread = announcements.find(a => !dismissedIds.has(a.id));
      
      if (unread) {
        setAnnouncement(unread);
        setIsVisible(true);
      }
    } else {
      // For non-logged in users, use localStorage
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
      const unread = announcements.find(a => !dismissed.includes(a.id));
      
      if (unread) {
        setAnnouncement(unread);
        setIsVisible(true);
      }
    }
  };

  const handleDismiss = async () => {
    if (!announcement) return;

    if (user) {
      await supabase.from('announcement_dismissals').insert({
        user_id: user.id,
        announcement_id: announcement.id,
      });
    } else {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
      dismissed.push(announcement.id);
      localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed));
    }

    setIsVisible(false);
    setAnnouncement(null);
  };

  if (!isVisible || !announcement) return null;

  const getIcon = () => {
    switch (announcement.type) {
      case 'success': return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-6 w-6 text-yellow-400" />;
      case 'promotion': return <Sparkles className="h-6 w-6 text-primary" />;
      default: return <Info className="h-6 w-6 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (announcement.type) {
      case 'success': return 'from-green-500/20 to-green-600/10 border-green-500/30';
      case 'warning': return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 'promotion': return 'from-primary/20 to-secondary/10 border-primary/30';
      default: return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md bg-gradient-to-br ${getBgColor()} border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300`}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-background/50">
            {getIcon()}
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {announcement.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {announcement.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleDismiss} className="px-6">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};
