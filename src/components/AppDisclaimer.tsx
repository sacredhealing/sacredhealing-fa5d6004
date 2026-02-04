import React from 'react';

const DISCLAIMER_TEXT =
  'This app is for spiritual and entertainment purposes only and is not intended to provide medical advice, diagnosis, or treatment.';

export const AppDisclaimer: React.FC<{
  className?: string;
  fixed?: boolean;
  /** When fixed: 'nav' = above bottom nav, 'screen' = bottom of viewport, 'aboveFooter' = above a ~80px footer */
  position?: 'nav' | 'screen' | 'aboveFooter';
}> = ({ className = '', fixed = false, position = 'nav' }) => (
  <footer
    className={`text-center text-foreground/80 text-sm py-3 px-4 border-t border-border/50 ${
      fixed
        ? 'fixed left-0 right-0 z-40 bg-background/95 backdrop-blur-sm'
        : ''
    } ${className}`}
    style={
      fixed && position === 'nav'
        ? { bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }
        : fixed && position === 'screen'
          ? { bottom: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }
          : fixed && position === 'aboveFooter'
            ? { bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }
            : undefined
    }
    role="contentinfo"
  >
    {DISCLAIMER_TEXT}
  </footer>
);
