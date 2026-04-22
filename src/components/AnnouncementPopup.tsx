import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AnnouncementModal from '@/components/AnnouncementModal';

/** Show at most one announcement; hide after dismiss or 24h from created_at (whichever applies). */
const VISIBILITY_TTL_MS = 24 * 60 * 60 * 1000;
const LEGACY_BANNER_DISMISSED_KEY = 'sq_dismissed_ann_v2';

interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  type: string;
  image_url: string | null;
  link_url: string | null;
  link_label?: string | null;
  audio_url: string | null;
  recurring: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  title_sv?: string | null;
  title_no?: string | null;
  title_es?: string | null;
  message_sv?: string | null;
  message_no?: string | null;
  message_es?: string | null;
  content_sv?: string | null;
  content_no?: string | null;
  content_es?: string | null;
  link_label_sv?: string | null;
  link_label_no?: string | null;
  link_label_es?: string | null;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  image_url: string | null;
  link_url: string | null;
  link_label?: string | null;
  audio_url: string | null;
  recurring: string | null;
}

function resolveLang(raw: string | undefined | null): string {
  if (!raw) return 'en';
  const code = raw.toLowerCase().split('-')[0];
  if (['en', 'sv', 'no', 'es'].includes(code)) return code;
  if (code === 'nb' || code === 'nn') return 'no';
  return 'en';
}

function localizedTitle(row: AnnouncementRow, lang: string): string {
  if (lang === 'en') return row.title;
  const k = `title_${lang}` as keyof AnnouncementRow;
  const v = row[k];
  if (typeof v === 'string' && v.trim()) return v;
  return row.title;
}

function localizedBody(row: AnnouncementRow, lang: string): string {
  const base = row.message ?? '';
  if (lang === 'en') return base;
  const msgK = `message_${lang}` as keyof AnnouncementRow;
  const contentK = `content_${lang}` as keyof AnnouncementRow;
  const m = row[msgK];
  const c = row[contentK];
  if (typeof m === 'string' && m.trim()) return m;
  if (typeof c === 'string' && c.trim()) return c;
  return base;
}

function localizedLinkLabel(row: AnnouncementRow, lang: string): string | null {
  const base = row.link_label ?? null;
  if (lang === 'en') return base;
  const k = `link_label_${lang}` as keyof AnnouncementRow;
  const v = row[k];
  if (typeof v === 'string' && v.trim()) return v;
  return base;
}

function localizeAnnouncement(row: AnnouncementRow, lang: string): Announcement {
  return {
    id: row.id,
    title: localizedTitle(row, lang),
    message: localizedBody(row, lang),
    type: row.type,
    image_url: row.image_url,
    link_url: row.link_url,
    link_label: localizedLinkLabel(row, lang),
    audio_url: row.audio_url,
    recurring: row.recurring,
  };
}

/** Merged dismiss set: legacy banner key + popup key + optional prune of very old ids */
function getLocalDismissedIdSet(): Set<string> {
  const out = new Set<string>();
  try {
    const a = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    if (Array.isArray(a)) a.forEach((id: string) => out.add(id));
  } catch {
    /* ignore */
  }
  try {
    const b = JSON.parse(localStorage.getItem(LEGACY_BANNER_DISMISSED_KEY) || '[]');
    if (Array.isArray(b)) b.forEach((id: string) => out.add(id));
  } catch {
    /* ignore */
  }
  return out;
}

function addLocalDismissed(id: string) {
  try {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    const list = Array.isArray(dismissed) ? dismissed : [];
    if (!list.includes(id)) {
      list.push(id);
      const trimmed = list.slice(-40);
      localStorage.setItem('dismissed_announcements', JSON.stringify(trimmed));
    }
  } catch {
    /* ignore */
  }
}

export const AnnouncementPopup: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { i18n } = useTranslation();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Logged-in: profile.preferred_language first (DB), then UI locale.
   * Guest: UI locale only.
   */
  const lang = resolveLang(user?.id ? profile?.preferred_language || i18n.language : i18n.language);

  const fetchAnnouncement = useCallback(async () => {
    if (user?.id && profileLoading) {
      return;
    }

    const now = new Date();
    const cutoffIso = new Date(now.getTime() - VISIBILITY_TTL_MS).toISOString();

    const { data: row, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now.toISOString())
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      setAnnouncement(null);
      setIsVisible(false);
      return;
    }

    const ann = row as AnnouncementRow;

    if (ann.expires_at && new Date(ann.expires_at) < now) {
      setAnnouncement(null);
      setIsVisible(false);
      return;
    }

    if (ann.recurring === 'weekly' && ann.starts_at) {
      const startDay = new Date(ann.starts_at).getDay();
      if (startDay !== now.getDay()) {
        setAnnouncement(null);
        setIsVisible(false);
        return;
      }
    }

    const createdAt = ann.created_at ? new Date(ann.created_at).getTime() : 0;
    if (createdAt && now.getTime() - createdAt > VISIBILITY_TTL_MS) {
      setAnnouncement(null);
      setIsVisible(false);
      return;
    }

    const dismissedIds = getLocalDismissedIdSet();

    if (user?.id) {
      const { data: dismissals } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id')
        .eq('user_id', user.id);

      dismissals?.forEach((d) => dismissedIds.add(d.announcement_id));
    }

    if (dismissedIds.has(ann.id)) {
      setAnnouncement(null);
      setIsVisible(false);
      return;
    }

    const localized = localizeAnnouncement(ann, lang);
    setAnnouncement(localized);
    setIsVisible(true);
  }, [user?.id, profileLoading, lang]);

  useEffect(() => {
    void fetchAnnouncement();
  }, [fetchAnnouncement]);

  useEffect(() => {
    const channel = supabase
      .channel('announcement-popup-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, () => {
        void fetchAnnouncement();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'announcements' }, () => {
        void fetchAnnouncement();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnnouncement]);

  const handleDismiss = async () => {
    if (!announcement) return;

    const id = announcement.id;
    addLocalDismissed(id);

    if (user) {
      supabase
        .from('announcement_dismissals')
        .insert({
          user_id: user.id,
          announcement_id: id,
          dismissed_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error && error.code !== '23505') {
            console.error('Error saving dismissal to DB:', error);
          }
        });
    }

    setIsVisible(false);
    setAnnouncement(null);
  };

  if (!isVisible || !announcement) return null;

  return (
    <AnnouncementModal
      title={announcement.title}
      message={announcement.message}
      linkUrl={announcement.link_url}
      linkLabel={announcement.link_label}
      imageUrl={announcement.image_url}
      audioUrl={announcement.audio_url}
      onDismiss={handleDismiss}
    />
  );
};
