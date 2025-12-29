/**
 * Centralized logging utility for error tracking and monitoring
 * Can be extended to send logs to external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

const LOG_STORAGE_KEY = 'app_error_logs';
const MAX_STORED_LOGS = 100;

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private persistLog(entry: LogEntry): void {
    try {
      const stored = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
      stored.push(entry);
      // Keep only the most recent logs
      if (stored.length > MAX_STORED_LOGS) {
        stored.splice(0, stored.length - MAX_STORED_LOGS);
      }
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Silent fail if storage is unavailable
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.formatEntry('info', message, context);
    console.info(`[INFO] ${message}`, context);
    // Only persist important info logs
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.formatEntry('warn', message, context);
    console.warn(`[WARN] ${message}`, context);
    this.persistLog(entry);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : { raw: error };

    const entry = this.formatEntry('error', message, { ...context, error: errorDetails });
    console.error(`[ERROR] ${message}`, errorDetails, context);
    this.persistLog(entry);

    // Here you could send to external service:
    // this.sendToExternalService(entry);
  }

  // Track user actions for debugging
  trackAction(action: string, details?: Record<string, unknown>): void {
    this.debug(`User Action: ${action}`, details);
  }

  // Track page performance
  trackPerformance(metric: string, value: number): void {
    this.debug(`Performance: ${metric}`, { value, unit: 'ms' });
  }

  // Get stored logs for debugging
  getStoredLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored logs
  clearLogs(): void {
    localStorage.removeItem(LOG_STORAGE_KEY);
  }
}

export const logger = new Logger();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason);
  });
}
