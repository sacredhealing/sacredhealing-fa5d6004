import React from 'react';
import { useTranslation } from 'react-i18next';

export const AppDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  return (
    <footer
      className={`text-center text-foreground/80 text-sm py-4 px-4 border-t border-border/50 ${className}`}
      role="contentinfo"
    >
      {t('common.disclaimer')}
    </footer>
  );
};
