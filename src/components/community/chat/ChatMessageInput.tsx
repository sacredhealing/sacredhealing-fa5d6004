import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatMessageInput = ({ 
  onSend, 
  disabled = false,
  placeholder = 'Write a message...'
}: ChatMessageInputProps) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-primary shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 bg-muted rounded-2xl flex items-end border border-border focus-within:border-primary transition-all p-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none text-base text-foreground px-2 py-1.5 resize-none max-h-[200px] placeholder:text-muted-foreground disabled:opacity-50 leading-relaxed"
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-accent shrink-0 h-8 w-8"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>
        
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || disabled}
          className={`rounded-full shrink-0 transition-all ${
            text.trim() && !disabled
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground scale-100'
              : 'bg-muted text-muted-foreground scale-95 opacity-50'
          }`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatMessageInput;
