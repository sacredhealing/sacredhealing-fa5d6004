// ============================================================
// SQI SOVEREIGN SHIELD — Security Layer v2050
// Bhakti-Algorithm: "Protect the Sacred Temple"
// ============================================================

import { supabase } from '@/integrations/supabase/client';

// ── 1. RATE LIMITER ─────────────────────────────────────────
// Prevents brute-force attacks on auth + API calls

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  check(key: string, maxAttempts = 5, windowMs = 60_000): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { count: 1, firstAttempt: now, blocked: false });
      return true;
    }

    // Reset window
    if (now - entry.firstAttempt > windowMs) {
      this.store.set(key, { count: 1, firstAttempt: now, blocked: false });
      return true;
    }

    if (entry.blocked) return false;

    entry.count++;
    if (entry.count > maxAttempts) {
      entry.blocked = true;
      void this.logThreat('RATE_LIMIT_EXCEEDED', { key, attempts: entry.count });
      return false;
    }

    return true;
  }

  getRemainingAttempts(key: string, maxAttempts = 5): number {
    const entry = this.store.get(key);
    if (!entry) return maxAttempts;
    return Math.max(0, maxAttempts - entry.count);
  }

  getBlockTimeRemaining(key: string, windowMs = 60_000): number {
    const entry = this.store.get(key);
    if (!entry || !entry.blocked) return 0;
    return Math.max(0, windowMs - (Date.now() - entry.firstAttempt));
  }

  private async logThreat(type: string, meta: Record<string, unknown>) {
    try {
      await supabase.from('security_events').insert([{
        event_type: type,
        metadata: meta as never,
        severity: 'HIGH',
        created_at: new Date().toISOString(),
      }]);
    } catch {
      // Silently fail — never block UX for logging
    }
  }
}

export const rateLimiter = new RateLimiter();

// ── 2. INPUT SANITIZER ──────────────────────────────────────
// Strips XSS, SQL injection attempts, script tags

const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onload=, etc.
  /data:text\/html/gi,
  /vbscript:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /union\s+select/gi,
  /drop\s+table/gi,
  /insert\s+into/gi,
  /delete\s+from/gi,
  /exec\s*\(/gi,
  /eval\s*\(/gi,
  /\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/gi, // OR 1=1
];

export function sanitizeInput(input: string): string {
  let clean = input;
  DANGEROUS_PATTERNS.forEach((pattern) => {
    clean = clean.replace(pattern, '');
  });
  // HTML-encode remaining angle brackets
  return clean.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  for (const key in obj) {
    const val = obj[key];
    (sanitized as Record<string, unknown>)[key] =
      typeof val === 'string' ? sanitizeInput(val) : val;
  }
  return sanitized;
}

// ── 3. SESSION GUARD ────────────────────────────────────────
// Auto-logout on inactivity, session token validation

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

let activityTimer: ReturnType<typeof setTimeout> | null = null;

export function initSessionGuard(onTimeout: () => void) {
  const resetTimer = () => {
    if (activityTimer) clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
      onTimeout();
      void logSecurityEvent('SESSION_TIMEOUT', { reason: 'inactivity' }, 'MEDIUM');
    }, SESSION_TIMEOUT_MS);
  };

  ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
  resetTimer();

  return () => {
    ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    if (activityTimer) clearTimeout(activityTimer);
  };
}

// ── 4. DEVICE FINGERPRINT ───────────────────────────────────
// Detects account sharing / suspicious multi-device usage

export async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0,
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0,
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(components);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── 5. CONTENT SECURITY ─────────────────────────────────────
// Validate URLs (no open redirects), validate file uploads

const ALLOWED_URL_PROTOCOLS = ['https:', 'http:'];
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not permitted' };
  }
  // Check for double extensions (e.g. malware.jpg.exe)
  const nameParts = file.name.split('.');
  if (nameParts.length > 2) {
    return { valid: false, error: 'Suspicious filename detected' };
  }
  return { valid: true };
}

// ── 6. ANTI-SCRAPING HONEYPOT ──────────────────────────────
// Hidden form field — bots fill it, humans don't

export function validateHoneypot(value: string): boolean {
  return value === ''; // Must be empty — bots autofill this
}

// ── 7. SECURITY EVENT LOGGER ────────────────────────────────

export async function logSecurityEvent(
  eventType: string,
  metadata: Record<string, unknown>,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from('security_events').insert({
      event_type: eventType,
      user_id: user?.id ?? null,
      metadata,
      severity,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Never let logging break the app
  }
}

// ── 8. AUTH HELPERS ─────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 254;
}

export function isStrongPassword(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');
  if (/\d/.test(password)) score++;
  else feedback.push('Add numbers');
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Add special characters');

  return { valid: score >= 4, score, feedback };
}

// ── 9. CSRF TOKEN ───────────────────────────────────────────

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function storeCSRFToken(token: string) {
  sessionStorage.setItem('sqi_csrf', token);
}

export function validateCSRFToken(token: string): boolean {
  return sessionStorage.getItem('sqi_csrf') === token;
}
