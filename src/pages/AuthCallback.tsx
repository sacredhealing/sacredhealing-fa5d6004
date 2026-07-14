import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const sanitizeRedirect = (value: string | null | undefined) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return '/dashboard';
    return `${url.pathname}${url.search}${url.hash}` || '/dashboard';
  } catch {
    return '/dashboard';
  }
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = useMemo(() => {
    let storedRedirect: string | null = null;
    try {
      storedRedirect = window.sessionStorage.getItem('postLoginRedirect');
    } catch {
      storedRedirect = null;
    }
    return sanitizeRedirect(searchParams.get('redirect') || storedRedirect || '/dashboard');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const complete = (path: string) => {
      if (cancelled) return;
      try {
        window.sessionStorage.removeItem('postLoginRedirect');
      } catch {
        // Session storage can be unavailable in restricted browser contexts.
      }
      navigate(path, { replace: true });
    };

    const fail = (message: string) => {
      if (cancelled) return;
      try {
        window.sessionStorage.removeItem('postLoginRedirect');
      } catch {
        // Ignore storage failures.
      }
      setErrorMessage(message);
    };

    const finishGoogleAuth = async () => {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) complete(redirectPath);
      });
      subscription = data.subscription;

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const returnedError =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (returnedError) {
        fail(returnedError);
        return;
      }

      const code = searchParams.get('code');
      const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');

      try {
        if (accessToken && refreshToken) {
          const { data: tokenData, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (tokenData.session?.access_token) {
            complete(redirectPath);
            return;
          }
        }

        const initialSession = (await supabase.auth.getSession()).data.session;
        if (initialSession?.access_token) {
          complete(redirectPath);
          return;
        }

        if (code) {
          const { data: codeData, error } = await supabase.auth.exchangeCodeForSession(code);
          if (codeData.session?.access_token) {
            complete(redirectPath);
            return;
          }
          if (error && !/already|invalid|expired|verifier/i.test(error.message)) {
            throw error;
          }
        }

        for (let attempt = 0; attempt < 24; attempt += 1) {
          await delay(500);
          if (cancelled) return;
          const session = (await supabase.auth.getSession()).data.session;
          if (session?.access_token) {
            complete(redirectPath);
            return;
          }
        }

        fail('Google sign-in returned without an active session. Please try signing in again.');
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Google sign-in could not be completed.');
      }
    };

    void finishGoogleAuth();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [navigate, redirectPath, searchParams]);

  if (errorMessage) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <section className="w-full max-w-md border border-primary/25 bg-card/70 p-8 text-center shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-semibold text-primary">Google sign-in paused</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{errorMessage}</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/auth', { replace: true })}>
            Return to sign in
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <section className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <h1 className="text-xl font-semibold text-primary">Completing Google sign-in</h1>
        <p className="text-sm text-muted-foreground">Preparing your dashboard…</p>
      </section>
    </main>
  );
}