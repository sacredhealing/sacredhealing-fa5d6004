import React from 'react';

const ThirdEyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Almond eye */}
    <path
      d="M2 12C2 12 5 6 12 6C19 6 22 12 22 12C22 12 19 18 12 18C5 18 2 12 2 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    {/* Iris ring */}
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" />
    {/* Pupil / inner focus */}
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    {/* Third-eye bindu above eye — potent focal point */}
    <circle cx="12" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="5" r="0.65" fill="currentColor" />
    {/* Rays from third eye (potency) */}
    <path d="M12 3.2V2M12 7v1M15 5l1-.8M9 5l-1-.8M15 5.8l1 .8M9 5.8l-1 .8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
  </svg>
);

export default ThirdEyeIcon;
