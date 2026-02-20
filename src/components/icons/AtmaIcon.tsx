import React from 'react';

const AtmaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 20C5 17.2386 8.13401 15 12 15C15.866 15 19 17.2386 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 15V12" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
  </svg>
);

export default AtmaIcon;
