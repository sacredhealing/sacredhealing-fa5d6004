import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home/dashboard, splash/auth pages, or community (has its own tabs)
  const hideOnPaths = ['/', '/dashboard', '/splash', '/auth', '/community'];
  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }

  const handleBack = () => {
    // Check if there's meaningful history to go back to
    // window.history.length > 2 accounts for initial page load
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback to dashboard/home
      navigate('/dashboard');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="fixed top-4 left-4 z-[100] p-3 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all cursor-pointer"
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
};
