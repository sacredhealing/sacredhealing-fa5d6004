import React from 'react';

const SiddhaQuantumSextileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer hexagram (sextile geometry) */}
    <path
      d="M12 2.2L8 9H4L8 15L12 21.8L16 15H20L16 9L12 2.2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Inner rotated hexagram for quantum overlay */}
    <path
      d="M12 3.8L15.2 9.3L21 10.2L16.6 14.1L17.7 20L12 17.2L6.3 20L7.4 14.1L3 10.2L8.8 9.3L12 3.8Z"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinejoin="round"
      opacity="0.6"
    />
    {/* Central nucleus */}
    <circle
      cx="12"
      cy="12"
      r="2.1"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <circle
      cx="12"
      cy="12"
      r="0.9"
      fill="currentColor"
    />
  </svg>
);

export default SiddhaQuantumSextileIcon;

