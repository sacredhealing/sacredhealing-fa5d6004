import { useCopyMessage } from '@/hooks/useCopyMessage';

interface CopyMessageButtonProps {
  content: string;
  id: string;
  align?: 'left' | 'right';
}

/** Reusable Siddha-Gold copy button shown beneath AI assistant message bubbles. */
export function CopyMessageButton({ content, id, align = 'left' }: CopyMessageButtonProps) {
  const { copyMessage, copiedId } = useCopyMessage();
  const isCopied = copiedId === id;

  return (
    <button
      type="button"
      aria-label={isCopied ? 'Copied' : 'Copy message'}
      onClick={() => copyMessage(content, id)}
      style={{
        marginTop: 6,
        alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 8,
        transition: 'all 0.2s ease',
      }}
    >
      {isCopied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22c55e' }}>
            Copied
          </span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="#D4AF37" strokeWidth="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#D4AF37" strokeWidth="2" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)' }}>
            Copy
          </span>
        </>
      )}
    </button>
  );
}
