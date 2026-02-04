import React from 'react';

const DISCLAIMER_TEXT =
  'This app is for spiritual and entertainment purposes only and is not intended to provide medical advice, diagnosis, or treatment.';

export const AppDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <footer
    className={`text-center text-foreground/80 text-sm py-4 px-4 border-t border-border/50 ${className}`}
    role="contentinfo"
  >
    {DISCLAIMER_TEXT}
  </footer>
);
