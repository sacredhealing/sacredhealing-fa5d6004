import React, { useCallback, useRef, useState } from 'react';

interface AnalogKnobProps {
  value: number;         // -12 to +12 dB
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: number;
  isSelected?: boolean;
}

export default function AnalogKnob({
  value,
  onChange,
  min = -12,
  max = 12,
  size = 80,
  isSelected = false,
}: AnalogKnobProps) {
  const knobRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(value);

  // Convert value to angle (0 dB = 12 o'clock, range from ~7 o'clock to ~5 o'clock)
  const normalizedValue = (value - min) / (max - min);
  const angle = -135 + normalizedValue * 270; // -135° to +135° (270° sweep)

  // Calculate LED indicator position on outer ring
  const ledRadius = (size / 2) - 6;
  const ledAngleRad = (angle - 90) * (Math.PI / 180);
  const ledX = size / 2 + Math.cos(ledAngleRad) * ledRadius;
  const ledY = size / 2 + Math.sin(ledAngleRad) * ledRadius;

  // Calculate pointer position (smaller radius)
  const pointerRadius = (size / 2) - 20;
  const pointerX = size / 2 + Math.cos(ledAngleRad) * pointerRadius;
  const pointerY = size / 2 + Math.sin(ledAngleRad) * pointerRadius;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      const sensitivity = (max - min) / 150;
      let newValue = startValue.current + deltaY * sensitivity;
      newValue = Math.max(min, Math.min(max, newValue));
      onChange(Math.round(newValue * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [value, min, max, onChange]);

  const handleDoubleClick = () => {
    onChange(0); // Reset to center
  };

  return (
    <svg
      ref={knobRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`cursor-grab ${isDragging ? 'cursor-grabbing' : ''} select-none`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Selection ring (shown when focused) */}
      {isSelected && (
        <rect
          x={4}
          y={4}
          width={size - 8}
          height={size - 8}
          rx={8}
          fill="none"
          stroke="#ec4899"
          strokeWidth={2}
          opacity={0.6}
        />
      )}

      {/* Outer ring - dark slate with subtle glow */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={(size / 2) - 10}
        fill="url(#knobGradient)"
        stroke="rgba(100, 116, 139, 0.3)"
        strokeWidth={1}
        filter={isDragging ? 'url(#activeGlow)' : undefined}
      />

      {/* Inner knob surface */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={(size / 2) - 18}
        fill="url(#innerGradient)"
      />

      {/* LED indicator dot - pink/magenta */}
      <circle
        cx={ledX}
        cy={ledY}
        r={5}
        fill="#ec4899"
        filter="url(#ledGlow)"
      />
      <circle
        cx={ledX}
        cy={ledY}
        r={3}
        fill="#f472b6"
      />

      {/* Orange pointer tick */}
      <line
        x1={size / 2}
        y1={size / 2}
        x2={pointerX}
        y2={pointerY}
        stroke="#f97316"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={4}
        fill="#334155"
      />

      {/* Gradients and filters */}
      <defs>
        <radialGradient id="knobGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
        <radialGradient id="innerGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <filter id="ledGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="glow" />
          <feFlood floodColor="#ec4899" floodOpacity="0.3" />
          <feComposite in2="glow" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
