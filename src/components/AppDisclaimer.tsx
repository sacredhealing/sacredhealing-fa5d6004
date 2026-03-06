export const AppDisclaimer = ({ className }: { className?: string }) => (
  <p
    className={`text-center text-white/20 text-[8px] tracking-widest leading-relaxed ${className ?? ''}`}
    style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 400 }}
  >
    For spiritual & entertainment purposes only.
  </p>
);
