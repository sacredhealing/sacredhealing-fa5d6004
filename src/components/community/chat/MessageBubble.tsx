import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isMe: boolean;
  isRead?: boolean;
  showReadReceipt?: boolean;
}

const MessageBubble = ({ 
  content, 
  timestamp, 
  isMe, 
  isRead = false,
  showReadReceipt = true 
}: MessageBubbleProps) => {
  return (
    <div className={`flex w-full mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 relative ${
          isMe
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm'
            : 'rounded-2xl rounded-bl-sm text-foreground'
        }`}
        style={!isMe ? {
          background: '#0a0a0a',
          border: '1px solid #D4AF37',
          boxShadow: '0 0 8px rgba(212,175,55,0.15), inset 0 0 4px rgba(212,175,55,0.05)'
        } : undefined}
      >
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {content}
        </p>
        <div className="flex items-center justify-end mt-1.5 gap-1">
          <span className="text-[10px] opacity-60">
            {timestamp}
          </span>
          {isMe && showReadReceipt && (
            isRead ? (
              <CheckCheck className="h-3 w-3 text-blue-400" />
            ) : (
              <Check className="h-3 w-3 opacity-60" />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
