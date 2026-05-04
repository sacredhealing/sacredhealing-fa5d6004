// ============================================================
// SQI SOVEREIGN SHIELD — Edge Function Security Middleware
// Deploy to: supabase/functions/_shared/security.ts
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';

// ── CORS Headers ─────────────────────────────────────────────
// Only allow your production domain + localhost for dev

const ALLOWED_ORIGINS = [
  'https://sacredhealing.lovable.app',
  'https://siddhaquantumnexus.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }
  const origin = req.headers.get('Origin') ?? '';
  if (req.method !== 'GET' && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not permitted' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

// ── Rate Limiting (via Supabase) ─────────────────────────────

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  identifier: string; // IP or user_id
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string;
}> {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

  const { count } = await adminClient
    .from('rate_limit_events')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', config.identifier)
    .gte('created_at', windowStart);

  const requestCount = count ?? 0;
  const allowed = requestCount < config.maxRequests;

  if (!allowed) {
    await logThreat(adminClient, 'RATE_LIMIT_EXCEEDED', {
      identifier: config.identifier,
      count: requestCount,
    }, 'HIGH');
  } else {
    // Record this request
    await adminClient.from('rate_limit_events').insert({
      identifier: config.identifier,
      created_at: new Date().toISOString(),
    });
  }

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - requestCount - 1),
    resetAt: new Date(Date.now() + config.windowSeconds * 1000).toISOString(),
  };
}

// ── JWT Validation ───────────────────────────────────────────

export async function validateJWT(req: Request): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing authorization header' };
  }

  const token = authHeader.split(' ')[1];
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: { user }, error } = await adminClient.auth.getUser(token);

  if (error || !user) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  return { valid: true, userId: user.id, email: user.email };
}

// ── Admin Guard ──────────────────────────────────────────────

const ADMIN_EMAILS = [
  'sacredhealingvibe@gmail.com',
  'laila.amrouche@gmail.com',
];

export async function requireAdmin(req: Request): Promise<{
  authorized: boolean;
  userId?: string;
  error?: string;
}> {
  const { valid, userId, email, error } = await validateJWT(req);
  if (!valid) return { authorized: false, error };

  if (!email || !ADMIN_EMAILS.includes(email)) {
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await logThreat(adminClient, 'UNAUTHORIZED_ADMIN_ACCESS', {
      email, userId, path: req.url,
    }, 'CRITICAL');
    return { authorized: false, error: 'Insufficient privileges' };
  }

  return { authorized: true, userId };
}

// ── Webhook Signature Validation ─────────────────────────────
// For Stripe webhooks — validates HMAC signature

export async function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string = WEBHOOK_SECRET
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const msgData = encoder.encode(body);
    const sigBuffer = await crypto.subtle.sign('HMAC', key, msgData);
    const sigHex = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256=${sigHex}` === signature;
  } catch {
    return false;
  }
}

// ── Input Sanitizer (server-side) ────────────────────────────

const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /union\s+select/gi,
  /drop\s+table/gi,
  /insert\s+into/gi,
  /exec\s*\(/gi,
];

export function sanitizeString(input: string): string {
  let clean = input;
  DANGEROUS_PATTERNS.forEach(p => { clean = clean.replace(p, ''); });
  return clean.trim().slice(0, 10_000); // Max 10k chars
}

// ── Request Size Limit ───────────────────────────────────────

export async function enforceBodySizeLimit(req: Request, maxBytes = 1_048_576): Promise<{
  valid: boolean;
  body?: string;
  error?: string;
}> {
  const contentLength = req.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return { valid: false, error: 'Request body too large' };
  }
  try {
    const body = await req.text();
    if (body.length > maxBytes) {
      return { valid: false, error: 'Request body too large' };
    }
    return { valid: true, body };
  } catch {
    return { valid: false, error: 'Failed to read request body' };
  }
}

// ── Threat Logger ────────────────────────────────────────────

async function logThreat(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  eventType: string,
  metadata: Record<string, unknown>,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
) {
  try {
    await client.from('security_events').insert({
      event_type: eventType,
      metadata,
      severity,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Never crash edge function over logging
  }
}

// ── Secure Response Helper ───────────────────────────────────

export function secureResponse(
  data: unknown,
  status = 200,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export function secureErrorResponse(
  message: string,
  status = 400,
  corsHeaders: Record<string, string> = {}
): Response {
  // Never expose internal error details to client
  const safeMessage = status >= 500 ? 'Internal server error' : message;
  return new Response(JSON.stringify({ error: safeMessage }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
