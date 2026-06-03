// Vercel serverless function: POST /api/audio-upload
// Accepts: multipart/form-data with "file" and optional "folder" fields
// Returns: { url: string } — the R2 public URL

const { AwsV4Signer } = require('aws4fetch');

const R2_ACCOUNT_ID = '79dae6f785e6758a441aa69dd3f7b2af';
const R2_ACCESS_KEY = 'fe3243e15f429886b7f3c5d9e23c8262';
const R2_SECRET_KEY = '3e8dab0a93ba4eaa1f1b4c43682e15a961d6d1b269b8e0b40ed64fbd2e025e50';
const R2_BUCKET = 'siddhaquantumnexus';
const R2_PUBLIC_URL = 'https://pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    // Parse multipart form data manually using built-in Node.js
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      res.status(400).json({ error: 'Expected multipart/form-data' });
      return;
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) { res.status(400).json({ error: 'No boundary' }); return; }

    // Read body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    // Parse multipart
    const parts = parseMultipart(body, boundary);
    const filePart = parts.find(p => p.name === 'file');
    const folderPart = parts.find(p => p.name === 'folder');
    
    if (!filePart) { res.status(400).json({ error: 'No file field' }); return; }
    
    const folder = folderPart ? folderPart.data.toString() : 'meditations';
    const ext = (filePart.filename || 'audio.mp3').split('.').pop();
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    // Upload to R2 using AWS Signature v4
    const url = `${R2_ENDPOINT}/${R2_BUCKET}/${key}`;
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateShort = dateStr.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    
    // Simple AWS v4 signing
    const signedUrl = await signRequest({
      method: 'PUT',
      url,
      body: filePart.data,
      contentType: filePart.contentType || 'application/octet-stream',
      accessKey: R2_ACCESS_KEY,
      secretKey: R2_SECRET_KEY,
      region,
      service,
    });
    
    const uploadRes = await fetch(url, {
      method: 'PUT',
      headers: signedUrl.headers,
      body: filePart.data,
    });
    
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      res.status(502).json({ error: 'R2 upload failed: ' + errText });
      return;
    }
    
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    res.status(200).json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
};

function parseMultipart(body, boundary) {
  const sep = Buffer.from('--' + boundary);
  const parts = [];
  let start = body.indexOf(sep) + sep.length + 2; // skip \r\n
  
  while (start < body.length) {
    const end = body.indexOf(sep, start);
    if (end === -1) break;
    const part = body.slice(start, end - 2); // trim \r\n
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = end + sep.length + 2; continue; }
    
    const headerStr = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4);
    
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const ctMatch = headerStr.match(/Content-Type: ([^\r\n]+)/);
    
    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: filenameMatch ? filenameMatch[1] : null,
      contentType: ctMatch ? ctMatch[1].trim() : 'text/plain',
      data,
    });
    start = end + sep.length + 2;
  }
  return parts;
}

async function signRequest({ method, url, body, contentType, accessKey, secretKey, region, service }) {
  const crypto = require('crypto');
  const urlObj = new URL(url);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  
  const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
  
  const headers = {
    'host': urlObj.host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'content-type': contentType,
  };
  
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}`).join('\n') + '\n';
  const canonicalRequest = [method, urlObj.pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, crypto.createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
  
  const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
  const signingKey = hmac(hmac(hmac(hmac('AWS4' + secretKey, dateStamp), region), service), 'aws4_request');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  
  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    headers: {
      ...headers,
      'Authorization': authHeader,
    }
  };
}
