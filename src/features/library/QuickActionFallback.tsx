export function QuickActionFallback({
  title = "Coming soon",
  body = "New sessions are being added. For now, you can explore what's available.",
  buttonLabel = "Browse meditations",
  onClick,
}: {
  title?: string;
  body?: string;
  buttonLabel?: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-white font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/60">{body}</div>

      <button
        onClick={onClick}
        className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
