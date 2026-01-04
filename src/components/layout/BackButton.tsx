import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home/dashboard or splash/auth pages
  const hideOnPaths = ['/', '/dashboard', '/splash', '/auth'];
  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if there's meaningful history to go back to
    // window.history.length includes the current page, so we need more than 2
    if (window.history.state?.idx > 0) {
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
      className="fixed top-4 left-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-accent transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
};
