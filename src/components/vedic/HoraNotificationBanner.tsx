import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HoraNotificationBannerProps {
  message: string;
  onDismiss: () => void;
}

export const HoraNotificationBanner: React.FC<HoraNotificationBannerProps> = ({ message, onDismiss }) => {
  const navigate = useNavigate();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900/90 to-amber-800/90 backdrop-blur-sm border-b border-amber-500/30 px-6 py-3 animate-in slide-in-from-top duration-500"
      role="alert"
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-amber-300" aria-hidden>🔱</span>
          <p className="text-amber-100 text-sm font-serif">{message}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onDismiss();
              navigate('/mantras');
            }}
            className="px-4 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-200 text-xs hover:bg-amber-500/30 transition"
          >
            Go to Mantras →
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-amber-400/40 hover:text-amber-300 p-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
