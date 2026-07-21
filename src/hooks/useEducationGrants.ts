import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Fetches the current user's standalone Siddha Portal academy grants —
 * admin_granted_access rows with access_type='program', keyed by academy
 * (see EDUCATION_PROGRAMS in lib/tierAccess.ts). These bypass membership
 * tier entirely for the granted academy only, without touching the user's
 * paid tier or unlocking any other Siddha-Quantum feature.
 */
export function useEducationGrants() {
  const { user } = useAuth();
  const [grantedAcademies, setGrantedAcademies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setGrantedAcademies(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('admin_granted_access')
      .select('access_id')
      .eq('user_id', user.id)
      .eq('access_type', 'program')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setGrantedAcademies(new Set());
        } else {
          setGrantedAcademies(new Set((data || []).map((r) => r.access_id).filter(Boolean) as string[]));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return { grantedAcademies, loading };
}
