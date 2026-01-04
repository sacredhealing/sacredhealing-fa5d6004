import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ShareData {
  shareType: string;
  platform: string;
  contentId?: string;
  contentType?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export const useSocialShare = () => {
  const { user } = useAuth();

  const trackShare = useCallback(async (data: ShareData) => {
    if (!user) return;

    try {
      await supabase.from('social_shares').insert({
        user_id: user.id,
        share_type: data.shareType,
        platform: data.platform,
        content_id: data.contentId,
        content_type: data.contentType,
        utm_source: data.utmSource || 'share',
        utm_medium: data.utmMedium || data.shareType,
        utm_campaign: data.utmCampaign,
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  }, [user]);

  const generateShareUrl = useCallback((
    baseUrl: string,
    params: { source?: string; medium?: string; campaign?: string; content?: string }
  ) => {
    const url = new URL(baseUrl);
    if (params.source) url.searchParams.set('utm_source', params.source);
    if (params.medium) url.searchParams.set('utm_medium', params.medium);
    if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
    if (params.content) url.searchParams.set('utm_content', params.content);
    return url.toString();
  }, []);

  const shareToSocial = useCallback(async (
    platform: string,
    data: { title: string; text: string; url: string }
  ) => {
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}&quote=${encodeURIComponent(data.text)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(data.text + ' ' + data.url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}&summary=${encodeURIComponent(data.text)}`,
    };

    const shareUrl = shareUrls[platform];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      await trackShare({
        shareType: 'social',
        platform,
        utmSource: 'share',
        utmMedium: platform,
      });
    }
  }, [trackShare]);

  return {
    trackShare,
    generateShareUrl,
    shareToSocial,
  };
};
