import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BACK_BUTTON_HIDE_PATHS = ['/', '/dashboard', '/splash', '/auth', '/community'];

type BackButtonProps = {
  /** When "inline", renders inside a header bar (no fixed positioning). Default: "floating" */
  variant?: 'floating' | 'inline';
};

export const BackButton: React.FC<BackButtonProps> = ({ variant = 'floating' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (BACK_BUTTON_HIDE_PATHS.includes(location.pathname)) {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const baseClasses = 'p-2.5 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all cursor-pointer';
  const positionClasses = variant === 'inline'
    ? 'flex items-center justify-center shrink-0'
    : 'fixed top-4 left-4 z-[100]';

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`${baseClasses} ${positionClasses}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
};
