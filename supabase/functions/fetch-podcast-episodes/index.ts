const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audioUrl: string;
  spotifyUrl: string;
  imageUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[FETCH-PODCAST] Function started');
    
    // RSS feed URL for Sacred Healing Vibration podcast
    // Try Anchor/Spotify for Podcasters RSS feed format
    const rssUrl = 'https://anchor.fm/s/f18ec0d8/podcast/rss';
    
    console.log('[FETCH-PODCAST] Fetching RSS from:', rssUrl);
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PodcastFetcher/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      console.error('[FETCH-PODCAST] RSS fetch failed:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch RSS feed', episodes: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();
    console.log('[FETCH-PODCAST] RSS fetched, length:', xmlText.length);

    // Parse XML manually (Deno doesn't have DOMParser by default)
    const episodes: PodcastEpisode[] = [];
    
    // Extract channel image
    const channelImageMatch = xmlText.match(/<itunes:image[^>]*href="([^"]+)"/);
    const channelImage = channelImageMatch ? channelImageMatch[1] : '';
    
    // Split by <item> tags
    const items = xmlText.split('<item>').slice(1);
    
    for (const item of items) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
      const durationMatch = item.match(/<itunes:duration>([^<]+)<\/itunes:duration>/);
      const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]+)"/);
      const guidMatch = item.match(/<guid[^>]*>([^<]+)<\/guid>/);
      const episodeImageMatch = item.match(/<itunes:image[^>]*href="([^"]+)"/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      
      if (titleMatch) {
        const title = titleMatch[1].trim();
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...' : '';
        const pubDate = pubDateMatch ? pubDateMatch[1] : '';
        const duration = durationMatch ? durationMatch[1] : '';
        const audioUrl = enclosureMatch ? enclosureMatch[1] : '';
        const guid = guidMatch ? guidMatch[1] : '';
        const imageUrl = episodeImageMatch ? episodeImageMatch[1] : channelImage;
        const link = linkMatch ? linkMatch[1] : '';
        
        // Create Spotify URL from episode - try to extract episode ID
        let spotifyUrl = 'https://open.spotify.com/show/2nhPr6e1a4dhivvIgMcceI';
        if (link && link.includes('spotify.com')) {
          spotifyUrl = link;
        }
        
        episodes.push({
          id: guid || `ep-${episodes.length}`,
          title,
          description,
          pubDate,
          duration,
          audioUrl,
          spotifyUrl,
          imageUrl,
        });
      }
    }

    console.log('[FETCH-PODCAST] Parsed episodes:', episodes.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        episodes,
        showUrl: 'https://open.spotify.com/show/2nhPr6e1a4dhivvIgMcceI'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[FETCH-PODCAST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, episodes: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
