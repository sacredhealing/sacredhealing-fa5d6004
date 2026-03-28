/**
 * Client-side RSS fetch for Anchor / standard podcast feeds.
 * Anchor returns `Access-Control-Allow-Origin: *` so this works from the browser.
 */

const ITUNES_NS = 'http://www.itunes.com/dtds/podcast-1.0.dtd';

export interface PodcastRssEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audioUrl: string;
  spotifyUrl: string;
  imageUrl: string;
}

/** Default feed: Sacred Healing / sacredhealing Anchor show (matches app Spotify profile / creators link). */
export const DEFAULT_PODCAST_RSS_URL = 'https://anchor.fm/s/c4afc20/podcast/rss';

function stripHtml(html: string): string {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html.replace(/<br\s*\/?>/gi, ' ');
  const t = d.textContent || d.innerText || '';
  return t.replace(/\s+/g, ' ').trim();
}

function textContent(el: Element | null | undefined): string {
  return el?.textContent?.trim() || '';
}

export async function fetchPodcastEpisodesFromRss(rssUrl: string): Promise<PodcastRssEpisode[]> {
  const res = await fetch(rssUrl, { credentials: 'omit' });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) throw new Error('RSS parse error');

  const channel = doc.querySelector('channel');
  const channelImage =
    channel?.getElementsByTagNameNS(ITUNES_NS, 'image')[0]?.getAttribute('href') ||
    channel?.querySelector('image url')?.textContent?.trim() ||
    '';

  const items = doc.querySelectorAll('item');
  const out: PodcastRssEpisode[] = [];

  items.forEach((item, index) => {
    const title = textContent(item.querySelector('title'));
    const guid = textContent(item.querySelector('guid')) || `rss-${index}`;
    const pubDate = textContent(item.querySelector('pubDate'));
    const linkEl = item.querySelector('link');
    const spotifyUrl = linkEl?.textContent?.trim() || '';

    const enclosure = item.querySelector('enclosure');
    const audioUrl = enclosure?.getAttribute('url') || '';

    const duration = textContent(item.getElementsByTagNameNS(ITUNES_NS, 'duration')[0]);

    const img =
      item.getElementsByTagNameNS(ITUNES_NS, 'image')[0]?.getAttribute('href') || channelImage;

    const descRaw = textContent(item.querySelector('description')) || textContent(item.getElementsByTagNameNS(ITUNES_NS, 'summary')[0]);

    if (!title || !audioUrl) return;

    out.push({
      id: guid,
      title,
      description: stripHtml(descRaw),
      pubDate,
      duration,
      audioUrl,
      spotifyUrl,
      imageUrl: img || '',
    });
  });

  return out;
}
