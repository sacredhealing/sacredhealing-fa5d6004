// In useAkashicAccess.ts
export function useAkashicAccess(userId?: string | null): { 
  hasAccess: boolean; 
  isLoading: boolean;  // ADD THIS
  setAccess: () => void 
} {
  const [hasAccess, setHasAccessState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // ADD THIS
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  useEffect(() => {
    if (adminLoading) return;
    
    if (isAdmin) {
      setHasAccessState(true);
      setIsLoading(false);  // ADD THIS
      return;
    }

    const unlocked = searchParams.get('unlocked');
    if (unlocked === '1' || unlocked === 'akashic') {
      // ... existing code ...
      setHasAccessState(true);
      setIsLoading(false);  // ADD THIS
      return;
    }

    const checkAccess = async () => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === '1') {
          setHasAccessState(true);
          setIsLoading(false);  // ADD THIS
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
        setIsLoading(false);  // ADD THIS
      }
    };
    checkAccess();
  }, [searchParams, setSearchParams, userId, isAdmin, adminLoading]);

  return { hasAccess, isLoading, setAccess };  // ADD isLoading
}
