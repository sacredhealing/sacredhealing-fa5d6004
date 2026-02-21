const { hasAccess, isLoading } = useAkashicAccess(user?.id);  // destructure isLoading

// Replace the redirect useEffect:
useEffect(() => {
  if (!isLoading && !hasAccess) {
    navigate('/akashic-records', { replace: true });
  }
}, [hasAccess, isLoading, navigate]);

// Replace the early return:
if (isLoading) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
    </div>
  );
}
if (!hasAccess) return null;
