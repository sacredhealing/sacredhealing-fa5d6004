import React from 'react';

const MerkabaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer upward triangle */}
    <polygon
      points="12 2 20 17 4 17"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Outer downward triangle */}
    <polygon
      points="12 22 4 7 20 7"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Inner star / light point */}
    <circle
      cx="12"
      cy="12"
      r="2.3"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" />
  </svg>
);

export default MerkabaIcon;

