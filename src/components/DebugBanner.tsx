import React, { useState, useEffect } from 'react';
import { X, Bug } from 'lucide-react';

// Enable/disable debug banner via localStorage or env var
const DEBUG_BANNER_ENABLED = import.meta.env.VITE_DEBUG_BANNER === 'true' || 
  localStorage.getItem('debug_banner_enabled') === 'true';

export const DebugBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(DEBUG_BANNER_ENABLED);
  const [buildId, setBuildId] = useState<string>('');
  const [commitHash, setCommitHash] = useState<string>('');
  const [currentRoute, setCurrentRoute] = useState<string>('');

  useEffect(() => {
    // Get current route from window.location (works without Router context)
    setCurrentRoute(window.location.pathname);
    
    // Try to get build ID from meta tag or env
    const buildMeta = document.querySelector('meta[name="build-id"]');
    const buildFromMeta = buildMeta?.getAttribute('content');
    const buildFromEnv = import.meta.env.VITE_BUILD_ID || import.meta.env.VITE_COMMIT_HASH;
    
    setBuildId(buildFromMeta || buildFromEnv || 'dev');
    
    // Try to get commit hash
    const commitMeta = document.querySelector('meta[name="commit-hash"]');
    const commitFromMeta = commitMeta?.getAttribute('content');
    const commitFromEnv = import.meta.env.VITE_COMMIT_HASH;
    
    setCommitHash(commitFromMeta || commitFromEnv || 'unknown');
  }, []);

  if (!isVisible) return null;

  const env = import.meta.env.MODE || 'development';

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500/95 dark:bg-yellow-600/95 border-b border-yellow-600 dark:border-yellow-700 px-4 py-1.5 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Bug className="w-3 h-3" />
            <span className="font-semibold">DEBUG</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-900 dark:text-yellow-100">Route:</span>
            <span className="bg-yellow-600/30 dark:bg-yellow-700/30 px-1.5 py-0.5 rounded font-semibold">
              {currentRoute}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-900 dark:text-yellow-100">Env:</span>
            <span className="bg-yellow-600/30 dark:bg-yellow-700/30 px-1.5 py-0.5 rounded">
              {env}
            </span>
          </div>
          {buildId && buildId !== 'dev' && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-900 dark:text-yellow-100">Build:</span>
              <span className="bg-yellow-600/30 dark:bg-yellow-700/30 px-1.5 py-0.5 rounded font-mono">
                {buildId.substring(0, 8)}
              </span>
            </div>
          )}
          {commitHash && commitHash !== 'unknown' && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-900 dark:text-yellow-100">Commit:</span>
              <span className="bg-yellow-600/30 dark:bg-yellow-700/30 px-1.5 py-0.5 rounded font-mono">
                {commitHash.substring(0, 7)}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem('debug_banner_enabled', 'false');
          }}
          className="hover:bg-yellow-600/50 dark:hover:bg-yellow-700/50 rounded p-1 transition-colors"
          aria-label="Close debug banner"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Toggle function for console (dev only)
if (import.meta.env.DEV) {
  (window as any).toggleDebugBanner = () => {
    const enabled = localStorage.getItem('debug_banner_enabled') === 'true';
    localStorage.setItem('debug_banner_enabled', (!enabled).toString());
    window.location.reload();
  };
  console.log('💡 Debug banner: Run toggleDebugBanner() in console to show/hide');
}

