import React, { useEffect, useState } from 'react';
import { X, Bell, Sparkles, AlertTriangle, CheckCircle, Info, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  image_url: string | null;
  link_url: string | null;
  audio_url: string | null;
  recurring: string | null;
}

export const AnnouncementPopup: React.FC = () => {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [recentlyDismissed, setRecentlyDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncement();
  }, [user]);

  // Always use localStorage as the source of truth for dismissals (works for guests + as fallback for users)
  const getLocalDismissed = (): Set<string> => {
    try {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
      return new Set(dismissed);
    } catch {
      return new Set();
    }
  };

  const addLocalDismissed = (id: string) => {
    try {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed));
      }
    } catch {
      // ignore
    }
  };

  const fetchAnnouncement = async () => {
    // Get all active announcements
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !announcements?.length) return;

    // Filter by expiry and recurring logic
    const now = new Date();
    const validAnnouncements = announcements.filter(a => {
      if (a.expires_at && new Date(a.expires_at) < now) return false;
      if (a.recurring === 'weekly') {
        const startDay = new Date(a.starts_at).getDay();
        return startDay === now.getDay();
      }
      return true;
    });

    if (!validAnnouncements.length) return;

    // Build dismissed set: always check localStorage first (covers guests + fallback for users)
    const dismissedIds = getLocalDismissed();

    // Additionally check DB dismissals for logged-in users
    if (user) {
      const { data: dismissals } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id')
        .eq('user_id', user.id);

      dismissals?.forEach(d => dismissedIds.add(d.announcement_id));
    }

    // Find first announcement not yet dismissed in any storage
    const unread = validAnnouncements.find(a =>
      !dismissedIds.has(a.id) && !recentlyDismissed.has(a.id)
    );

    if (unread) {
      setAnnouncement(unread);
      setIsVisible(true);
    } else {
      setAnnouncement(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = async () => {
    if (!announcement) return;

    const id = announcement.id;

    // Always persist to localStorage immediately (works for guests + as DB fallback)
    addLocalDismissed(id);

    // Also persist to DB for logged-in users
    if (user) {
      supabase.from('announcement_dismissals').insert({
        user_id: user.id,
        announcement_id: id,
        dismissed_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error && error.code !== '23505') {
          console.error('Error saving dismissal to DB:', error);
        }
      });
    }

    // Mark as recently dismissed so it won't reappear this session
    setRecentlyDismissed(prev => new Set(prev).add(id));

    // Hide immediately
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-md bg-gradient-to-br ${getBgColor()} border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 bg-card`}
        onClick={(e) => e.stopPropagation()}
      >
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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {announcement.title}
              </h3>
              {announcement.recurring && (
                <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {announcement.recurring}
                </span>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed mt-2">
              {announcement.message}
            </p>
          </div>
        </div>

        {/* Image */}
        {announcement.image_url && (
          <div className="mt-4">
            <img 
              src={announcement.image_url} 
              alt="" 
              className="w-full rounded-lg object-cover max-h-48"
            />
          </div>
        )}

        {/* Audio Player */}
        {announcement.audio_url && (
          <div className="mt-4">
            <audio controls className="w-full" src={announcement.audio_url}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          {/* Link Button - dismiss on click so announcement never shows again */}
          {announcement.link_url && (
            <Button
              variant="outline"
              onClick={async () => {
                const url = announcement.link_url!;
                await handleDismiss();
                window.open(url, '_blank');
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Learn More
            </Button>
          )}
          <Button onClick={handleDismiss} className="px-6">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};
