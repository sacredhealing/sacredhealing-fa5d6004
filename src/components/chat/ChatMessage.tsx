// Drop-in chat bubble + gold copy button — one tap, no selection bar on Android.

import { useCopyMessage } from '@/hooks/useCopyMessage';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ id, role, content }: ChatMessageProps) {
  const { copyMessage, copiedId } = useCopyMessage();
  const { t } = useTranslation();
  const isCopied = copiedId === id;
  const isAssistant = role === 'assistant';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAssistant ? 'flex-start' : 'flex-end',
        marginBottom: 16,
        position: 'relative',
      }}
    >
      <div
        style={{
          background: isAssistant ? 'rgba(255,255,255,0.03)' : 'rgba(212,175,55,0.08)',
          border: isAssistant ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(212,175,55,0.2)',
          borderRadius: isAssistant ? '4px 20px 20px 20px' : '20px 4px 20px 20px',
          padding: '14px 16px',
          maxWidth: '88%',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 14,
          lineHeight: 1.7,
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {content}
      </div>

      {isAssistant && (
        <button
          type="button"
          aria-label={isCopied ? t('chatBubble.copied') : t('chatBubble.copyAria')}
          onClick={() => copyMessage(content, id)}
          style={{
            marginTop: 6,
            marginLeft: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
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
                <path
                  d="M20 6L9 17L4 12"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#22c55e',
                }}
              >
                {t('chatBubble.copied')}
              </span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="#D4AF37" strokeWidth="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#D4AF37" strokeWidth="2" />
              </svg>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(212,175,55,0.5)',
                }}
              >
                {t('chatBubble.copy')}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
