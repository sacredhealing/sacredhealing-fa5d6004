import React from 'react';

const MalaBeadsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="18" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="20" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="20" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="20" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="4" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 21V24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 24L12 22L14 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 5.5C8 6.5 7 7.5 6.5 8" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <path d="M17.5 8C17 7.5 16 6.5 14 5.5" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
  </svg>
);

export default MalaBeadsIcon;
