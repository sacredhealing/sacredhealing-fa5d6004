// Vercel edge function — proxies R2 audio to add CORS headers
// Auto-handles: /api/audio/meditations/foo.wav, /api/audio/songs/bar.mp3, etc.

const R2_BASE = 'https://pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const origin = req.headers.get('origin') || '*';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      },
    });
  }

  // Extract path: /api/audio/meditations/foo.wav → /meditations/foo.wav
  const url = new URL(req.url);
  const r2Path = url.pathname.replace(/^\/api\/audio/, '') || '/';
  const r2Url = R2_BASE + r2Path;

  const upstreamHeaders = {};
  const range = req.headers.get('range');
  if (range) upstreamHeaders['Range'] = range;

  try {
    const upstream = await fetch(r2Url, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders,
    });

    const responseHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges, ETag',
      'Vary': 'Origin',
      'Cache-Control': 'public, max-age=3600',
    };

    // Forward essential streaming headers from R2
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const v = upstream.headers.get(h);
      if (v) responseHeaders[h] = v;
    }

    return new Response(req.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 502 });
  }
}
