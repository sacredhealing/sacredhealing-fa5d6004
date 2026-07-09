/**
 * The same keyframes SiddhaPortal.tsx defines inline. Pulled into one
 * shared component so every education surface (hub + every academy's
 * reader) uses identical animation timing instead of copy-pasted <style>
 * blocks that can drift out of sync.
 */
export default function EducationKeyframes() {
  return (
    <style>{`
      @keyframes sqFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes sqBreathe { 0%,100%{transform:scale(1);opacity:0.75} 50%{transform:scale(1.07);opacity:0.95} }
      @keyframes sqLiveFlash { 0%,100%{opacity:1} 50%{opacity:0.2} }
      @keyframes sqScalarPulse { 0%{opacity:0;transform:scale(0.65)} 35%{opacity:0.9} 75%{opacity:0.15;transform:scale(1.18)} 100%{opacity:0;transform:scale(1.35)} }
      @keyframes sqGlowPulse { 0%,100%{opacity:0.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
      @keyframes sqGoldFlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes sqShimmerSweep { 0%{opacity:0;transform:translateX(-100%)} 40%{opacity:1} 100%{opacity:0;transform:translateX(100%)} }
    `}</style>
  );
}
