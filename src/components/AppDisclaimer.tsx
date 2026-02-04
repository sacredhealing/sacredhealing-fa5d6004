import React from 'react';

const DISCLAIMER_TEXT =
  'This app is for spiritual and entertainment purposes only and is not intended to provide medical advice, diagnosis, or treatment.';

export const AppDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <footer
    className={`text-center text-muted-foreground text-xs py-4 px-4 ${className}`}
    role="contentinfo"
  >
    {DISCLAIMER_TEXT}
  </footer>
);
