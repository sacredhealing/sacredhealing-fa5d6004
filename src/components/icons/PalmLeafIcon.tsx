import React from 'react';

const PalmLeafIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="6" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="4" y="11" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="4" y="16" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default PalmLeafIcon;
