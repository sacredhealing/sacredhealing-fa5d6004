// ============================================================
// SQI SOVEREIGN SHIELD — SecurityProvider
// Wraps the entire app with real-time protection
// ============================================================

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  initSessionGuard,
  generateFingerprint,
  logSecurityEvent,
  generateCSRFToken,
  storeCSRFToken,
} from '@/lib/security';

// ── Types ────────────────────────────────────────────────────

interface SecurityContextValue {
  csrfToken: string;
  fingerprint: string;
  threatLevel: 'CLEAR' | 'WATCH' | 'ALERT' | 'CRITICAL';
  isSessionValid: boolean;
  securityEvents: SecurityEvent[];
}

interface SecurityEvent {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const SecurityContext = createContext<SecurityContextValue>({
  csrfToken: '',
  fingerprint: '',
  threatLevel: 'CLEAR',
  isSessionValid: true,
  securityEvents: [],
});

export function useSecurityContext() {
  return useContext(SecurityContext);
}

// ── Provider ─────────────────────────────────────────────────

interface SecurityProviderProps {
  children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const navigate = useNavigate();
  const [csrfToken] = useState(() => {
    const token = generateCSRFToken();
    storeCSRFToken(token);
    return token;
  });
  const [fingerprint, setFingerprint] = useState('');
  const [threatLevel, setThreatLevel] = useState<SecurityContextValue['threatLevel']>('CLEAR');
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const devToolsCount = useRef(0);

  const addSecurityEvent = useCallback((type: string, severity: SecurityEvent['severity'], metadata?: Record<string, unknown>) => {
    setSecurityEvents((prev) => [
      { type, severity, timestamp: new Date().toISOString(), metadata },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // ── Fingerprint generation ──────────────────────────────
  useEffect(() => {
    generateFingerprint().then((fp) => {
      setFingerprint(fp);
      const stored = sessionStorage.getItem('sqi_fp');
      if (!stored) {
        sessionStorage.setItem('sqi_fp', fp);
      } else if (stored !== fp) {
        logSecurityEvent('FINGERPRINT_MISMATCH', { stored, current: fp }, 'HIGH');
        addSecurityEvent('FINGERPRINT_MISMATCH', 'HIGH');
        setThreatLevel('ALERT');
      }
    });
  }, [addSecurityEvent]);

  // ── Session guard (auto-logout on inactivity) ──────────
  useEffect(() => {
    const cleanup = initSessionGuard(async () => {
      setIsSessionValid(false);
      await supabase.auth.signOut();
      navigate('/auth');
    });
    return cleanup;
  }, [navigate]);

  // ── DevTools detection ──────────────────────────────────
  useEffect(() => {
    const threshold = 160;
    const detectDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        devToolsCount.current++;
        if (devToolsCount.current === 3) {
          logSecurityEvent('DEVTOOLS_OPENED', {}, 'MEDIUM');
        }
      }
    };
    const interval = setInterval(detectDevTools, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Right-click / inspect protection on production ─────
  useEffect(() => {
    if (import.meta.env.PROD) {
      const preventContextMenu = (e: MouseEvent) => e.preventDefault();
      const preventKeys = (e: KeyboardEvent) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
          logSecurityEvent('INSPECT_ATTEMPT', { key: e.key }, 'LOW');
        }
      };
      document.addEventListener('contextmenu', preventContextMenu);
      document.addEventListener('keydown', preventKeys);
      return () => {
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('keydown', preventKeys);
      };
    }
  }, []);

  // ── Supabase auth state monitoring ─────────────────────
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsSessionValid(false);
        sessionStorage.removeItem('sqi_fp');
        sessionStorage.removeItem('sqi_csrf');
      }
      if (event === 'TOKEN_REFRESHED') {
        logSecurityEvent('TOKEN_REFRESHED', { userId: session?.user?.id }, 'LOW');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Real-time security events from DB ──────────────────
  useEffect(() => {
    const channel = supabase
      .channel('security-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload) => {
          const row = payload.new as SecurityEvent & { event_type?: string; severity?: SecurityEvent['severity'] };
          const sev = row.severity;
          if (sev !== 'HIGH' && sev !== 'CRITICAL') return;
          const evtType = row.event_type ?? row.type ?? 'UNKNOWN';
          addSecurityEvent(evtType, sev, row.metadata);
          setThreatLevel((prev) => {
            if (sev === 'CRITICAL') return 'CRITICAL';
            if (sev === 'HIGH' && prev === 'CLEAR') return 'WATCH';
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [addSecurityEvent]);

  // ── Clipboard hijack protection ─────────────────────────
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = document.getSelection()?.toString() ?? '';
      if (/sk-[a-zA-Z0-9]{20,}/.test(selection)) {
        e.preventDefault();
        logSecurityEvent('SENSITIVE_COPY_ATTEMPT', {}, 'MEDIUM');
      }
    };
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);

  return (
    <SecurityContext.Provider value={{ csrfToken, fingerprint, threatLevel, isSessionValid, securityEvents }}>
      <input
        type="text"
        name="sqi_guard"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
      />
      {children}
    </SecurityContext.Provider>
  );
}

// ── Threat Level Banner (optional overlay) ─────────────────────────

export function ThreatLevelIndicator() {
  const { t } = useTranslation();
  const { threatLevel, securityEvents } = useSecurityContext();
  if (threatLevel === 'CLEAR') return null;

  const colors = {
    WATCH: '#D4AF37',
    ALERT: '#F97316',
    CRITICAL: '#EF4444',
  } as const;

  type BannerLevel = keyof typeof colors;
  const levelKey = threatLevel as BannerLevel;
  const labelLevel: Record<BannerLevel, string> = {
    WATCH: t('securityShield.levels.WATCH'),
    ALERT: t('securityShield.levels.ALERT'),
    CRITICAL: t('securityShield.levels.CRITICAL'),
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: 'rgba(5,5,5,0.95)',
        border: `1px solid ${colors[levelKey]}`,
        borderRadius: 16,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        backdropFilter: 'blur(20px)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: colors[levelKey],
          boxShadow: `0 0 8px ${colors[levelKey]}`,
          animation: 'pulse 1s infinite',
        }}
      />
      <span
        style={{
          color: colors[levelKey],
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
        }}
      >
        {t('securityShield.threatBanner', { level: labelLevel[levelKey] })}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
        {t('securityShield.eventCount', { count: securityEvents.length })}
      </span>
    </div>
  );
}
