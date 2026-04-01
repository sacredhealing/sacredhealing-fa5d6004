import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AnnouncementModal from '@/components/AnnouncementModal';

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
  title_sv?: string | null;
  title_no?: string | null;
  title_es?: string | null;
  /** Some pipelines / edge functions use message_* for localized body */
  message_sv?: string | null;
  message_no?: string | null;
  message_es?: string | null;
  /** Others use content_* — read both */
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

function resolveLang(raw: string): string {
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

function getLocalDismissed(): Set<string> {
  try {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    return new Set(dismissed);
  } catch {
    return new Set();
  }
}

function addLocalDismissed(id: string) {
  try {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed));
    }
  } catch {
    // ignore
  }
}

export const AnnouncementPopup: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { i18n } = useTranslation();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  /** Profile language drives copy; fall back to active i18n locale so UI stays in sync */
  const lang = resolveLang(profile?.preferred_language || i18n.language || 'en');

  const fetchAnnouncement = useCallback(async () => {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !announcements?.length) return;

    const now = new Date();
    const validAnnouncements = announcements.filter((a: any) => {
      if (a.expires_at && new Date(a.expires_at) < now) return false;
      if (a.recurring === 'weekly') {
        const startDay = new Date(a.starts_at).getDay();
        return startDay === now.getDay();
      }
      return true;
    });

    if (!validAnnouncements.length) return;

    const dismissedIds = getLocalDismissed();

    if (user) {
      const { data: dismissals } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id')
        .eq('user_id', user.id);

      dismissals?.forEach((d) => dismissedIds.add(d.announcement_id));
    }

    const unread = validAnnouncements.find((a: any) => !dismissedIds.has(a.id));

    if (unread) {
      const localized = localizeAnnouncement(unread as AnnouncementRow, lang);
      setAnnouncement(localized);
      setIsVisible(true);
    } else {
      setAnnouncement(null);
      setIsVisible(false);
    }
  }, [user, lang]);

  useEffect(() => {
    fetchAnnouncement();
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
