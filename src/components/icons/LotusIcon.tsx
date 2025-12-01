import React from 'react';

interface LotusIconProps {
  className?: string;
  size?: number;
}

export const LotusIcon: React.FC<LotusIconProps> = ({ className, size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Center petal */}
      <path
        d="M32 8C32 8 38 20 38 32C38 44 32 52 32 52C32 52 26 44 26 32C26 20 32 8 32 8Z"
        fill="url(#lotus-gradient-1)"
        opacity="0.9"
      />
      {/* Left petals */}
      <path
        d="M32 52C32 52 20 48 14 38C8 28 12 18 12 18C12 18 22 22 28 32C34 42 32 52 32 52Z"
        fill="url(#lotus-gradient-2)"
        opacity="0.8"
      />
      <path
        d="M32 52C32 52 14 52 6 44C-2 36 2 24 2 24C2 24 14 30 22 38C30 46 32 52 32 52Z"
        fill="url(#lotus-gradient-3)"
        opacity="0.7"
      />
      {/* Right petals */}
      <path
        d="M32 52C32 52 44 48 50 38C56 28 52 18 52 18C52 18 42 22 36 32C30 42 32 52 32 52Z"
        fill="url(#lotus-gradient-2)"
        opacity="0.8"
      />
      <path
        d="M32 52C32 52 50 52 58 44C66 36 62 24 62 24C62 24 50 30 42 38C34 46 32 52 32 52Z"
        fill="url(#lotus-gradient-3)"
        opacity="0.7"
      />
      {/* Base */}
      <ellipse
        cx="32"
        cy="54"
        rx="12"
        ry="4"
        fill="url(#lotus-gradient-4)"
        opacity="0.6"
      />
      <defs>
        <linearGradient id="lotus-gradient-1" x1="32" y1="8" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD700" />
          <stop offset="1" stopColor="#8A2BE2" />
        </linearGradient>
        <linearGradient id="lotus-gradient-2" x1="12" y1="18" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8A2BE2" />
          <stop offset="1" stopColor="#40E0D0" />
        </linearGradient>
        <linearGradient id="lotus-gradient-3" x1="2" y1="24" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#40E0D0" />
          <stop offset="1" stopColor="#8A2BE2" />
        </linearGradient>
        <linearGradient id="lotus-gradient-4" x1="20" y1="54" x2="44" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8A2BE2" />
          <stop offset="0.5" stopColor="#FFD700" />
          <stop offset="1" stopColor="#8A2BE2" />
        </linearGradient>
      </defs>
    </svg>
  );
};
