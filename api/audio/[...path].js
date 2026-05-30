// Node.js serverless function — CORS proxy for R2 audio
// Handles /api/audio/meditations/foo.wav, /api/audio/songs/bar.mp3 etc.

const https = require('https');

const R2_BASE = 'https://pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev';

module.exports = async function handler(req, res) {
  const origin = req.headers['origin'] || '*';
  
  // CORS headers on all responses
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range, Accept-Ranges, ETag');
  res.setHeader('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Extract R2 path from URL: /api/audio/meditations/foo.wav -> /meditations/foo.wav
  const r2Path = req.url.replace(/^\/api\/audio/, '') || '/';
  const r2Url = R2_BASE + r2Path;
  
  try {
    const upstreamHeaders = {};
    if (req.headers['range']) upstreamHeaders['Range'] = req.headers['range'];
    
    // Fetch from R2
    const response = await fetch(r2Url, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders
    });
    
    // Forward status and key headers
    res.status(response.status);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'cache-control']) {
      const v = response.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    
    // Stream body
    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (err) {
    res.status(502).end('Proxy error: ' + err.message);
  }
};
