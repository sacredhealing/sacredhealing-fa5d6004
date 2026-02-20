import React from 'react';

const AlchemicalStarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L14.5 9H21.5L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2.5 9H9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
  </svg>
);

export default AlchemicalStarIcon;
