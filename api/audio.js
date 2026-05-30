// Vercel serverless function — proxies R2 audio to bypass CORS
// Runs server-side so no browser CORS restriction applies

const ALLOWED_ORIGINS = [
  'https://www.siddhaquantumnexus.com',
  'https://siddhaquantumnexus.com',
];

const R2_HOST = 'pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get('path');

  if (!path) {
    return new Response('Missing path', { status: 400 });
  }

  // Only allow r2 paths (security: prevent SSRF)
  const r2Url = `https://${R2_HOST}/${path.replace(/^\//, '')}`;

  const upstreamHeaders = {};
  const range = req.headers.get('range');
  if (range) upstreamHeaders['Range'] = range;

  try {
    const upstream = await fetch(r2Url, {
      method: req.method,
      headers: upstreamHeaders,
    });

    const responseHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges',
      'Cache-Control': 'public, max-age=3600',
    };

    // Forward key headers from upstream
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'].forEach(h => {
      const v = upstream.headers.get(h);
      if (v) responseHeaders[h] = v;
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response('Upstream error: ' + err.message, { status: 502 });
  }
}
