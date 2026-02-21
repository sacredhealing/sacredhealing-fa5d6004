import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from './useAdminRole';

const STORAGE_KEY = 'akashic_reveal_purchased';

/** Tracks whether user has purchased the high-ticket Akashic Deep Reading ($49). Uses localStorage + akashic_readings (My Records) for permanent access. Admins have full access. */
export function useAkashicAccess(userId?: string | null): {
  hasAccess: boolean;
  isLoading: boolean;
  setAccess: () => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasAccess, setHasAccessState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  useEffect(() => {
    if (adminLoading) return;

    if (isAdmin) {
      setHasAccessState(true);
      setIsLoading(false);
      return;
    }

    const unlocked = searchParams.get('unlocked');
    if (unlocked === '1' || unlocked === 'akashic') {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {}
      setHasAccessState(true);
      setIsLoading(false);
      searchParams.delete('unlocked');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    const checkAccess = async () => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === '1') {
          setHasAccessState(true);
          setIsLoading(false);
          return;
        }
        if (userId) {
          const { data } = await (supabase as any)
            .from('akashic_readings')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          setHasAccessState(!!data);
        } else {
          setHasAccessState(false);
        }
      } catch {
        setHasAccessState(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAccess();
  }, [searchParams, setSearchParams, userId, isAdmin, adminLoading]);

  const setAccess = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setHasAccessState(true);
  };

  return { hasAccess, isLoading, setAccess };
}
