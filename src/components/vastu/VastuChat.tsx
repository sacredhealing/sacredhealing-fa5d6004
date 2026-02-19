import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, User, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vastu-chat`;

export const VastuChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else {
          toast.error('Failed to connect to the Vastu guide. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Vastu chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'The cosmic connection was interrupted. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    'Which direction should my bed face?',
    'How do I activate the wealth corner?',
    'Is my kitchen placement correct?',
    'What colours suit my living room?',
  ];

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden border-2 border-primary/20">
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-700/50 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl">Vastu Guide</h3>
            <p className="text-[10px] uppercase opacity-70 tracking-widest">AI Spatial Wisdom</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs opacity-70">Powered by Sacred Healing AI</span>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-6" ref={scrollRef}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-serif mb-2">Namaste 🙏</p>
              <p className="text-sm mb-6">Ask your Vastu guide anything about harmonising your space</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs text-left px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-amber-800 text-white rounded-br-none'
                    : 'bg-muted border border-border rounded-bl-none'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-amber-600" />
                    )}
                    <span className="text-[10px] uppercase tracking-wider opacity-70">
                      {msg.role === 'user' ? 'You' : 'Vastu Guide'}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your home's Vastu..."
            className="flex-1 rounded-xl"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="w-12 h-12 rounded-xl bg-amber-800 hover:bg-amber-900"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
