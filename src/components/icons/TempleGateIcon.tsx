import React from 'react';

const TempleGateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M10 21V15H14V21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 7V11M10 9H14" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
  </svg>
);

export default TempleGateIcon;
