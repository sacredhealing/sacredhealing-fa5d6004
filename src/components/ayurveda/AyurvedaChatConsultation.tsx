import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, User, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AyurvedaChatConsultationProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayurveda-chat`;

export const AyurvedaChatConsultation: React.FC<AyurvedaChatConsultationProps> = ({ profile, dosha }) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          profile,
          dosha,
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 402) {
          toast.error('Usage limits reached. Please try again later.');
        } else {
          toast.error('Failed to connect to the healer. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message to update progressively
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
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON, wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Forgive me, my connection to the ether is interrupted. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden border-2 border-emerald-500/20">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600/50 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl">Ayurvedic AI Consultant</h3>
            <p className="text-[10px] uppercase opacity-70 tracking-widest">Professional Text Session</p>
          </div>
          {profile && dosha && (
            <div className="ml-auto text-right">
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs opacity-70">{dosha.primary} Prakriti</p>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-6" ref={scrollRef}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-serif mb-2">Welcome, Seeker of Balance</p>
              <p className="text-sm">Ask anything about your health, diet, or daily routine...</p>
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
                    ? 'bg-emerald-700 text-white rounded-br-none' 
                    : 'bg-muted border border-border rounded-bl-none'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                    )}
                    <span className="text-[10px] uppercase tracking-wider opacity-70">
                      {msg.role === 'user' ? 'You' : 'Doctor'}
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
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
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
            placeholder="Type your health concern..."
            className="flex-1 rounded-xl"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            className="w-12 h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800"
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
