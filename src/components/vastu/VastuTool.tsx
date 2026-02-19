import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VastuChatWindow, VastuMessage } from './VastuChat';
import { MODULES } from './vastuConstants';
import { toast } from 'sonner';

interface VastuToolProps {
  isAdmin?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vastu-chat`;

export const VastuTool: React.FC<VastuToolProps> = ({ isAdmin = false }) => {
  const [currentModule, setCurrentModule] = useState(1);
  const [messages, setMessages] = useState<VastuMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  
  const [isMasterUnlocked, setIsMasterUnlocked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const handleSendMessage = useCallback(async (text: string, images?: string[]) => {
    const userMsg: VastuMessage = {
      role: 'user',
      text,
      images,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    let assistantContent = '';

    try {
      // Build messages for API (convert to role/content format)
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text,
      }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, images }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else {
          toast.error('The cosmic connection was interrupted. Please try again.');
        }
        setIsThinking(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message to stream into
      setMessages((prev) => [...prev, { role: 'model', text: '', timestamp: Date.now() }]);

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
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'model',
                  text: assistantContent,
                  timestamp: Date.now(),
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // After full response: detect module progression
      const startMatch = assistantContent.match(/\[MODULE_START:\s*(\d+)\]/);
      const completeMatch = assistantContent.match(/\[MODULE_COMPLETE:\s*(\d+)\]/);

      if (startMatch) {
        setCurrentModule(parseInt(startMatch[1]));
      } else if (completeMatch) {
        const next = Math.min(10, parseInt(completeMatch[1]) + 1);
        setCurrentModule(next);
      }

    } catch (error) {
      console.error('Vastu chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'The cosmic connection was interrupted. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [messages]);

  const handleModuleClick = (id: number) => {
    const isCompleted = id < currentModule;
    const isCurrent = id === currentModule;
    const isAvailable = isMasterUnlocked || isCompleted || isCurrent;

    if (!isAvailable) return;

    setIsSidebarOpen(false);
    setCurrentModule(id);
    const moduleTitle = MODULES.find((m) => m.id === id)?.title;
    handleSendMessage(
      `Architect, I would like to jump directly to Module ${id}: ${moduleTitle}. Please introduce this module, provide the diagnostics, and the abundance guidelines for this space.`
    );
  };

  

  return (
    <div className="flex h-[calc(100vh-8rem)] relative overflow-hidden rounded-2xl border border-stone-200 shadow-xl bg-stone-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-auto top-0 left-0 h-full
          w-64 bg-stone-50 border-r border-stone-200 flex flex-col
          transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
              Your Journey
            </h3>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest">10-Module Path</p>
          </div>
          <span className="text-stone-300 text-lg">🧭</span>
        </div>


        {/* Modules list */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1.5">
          {MODULES.map((module) => {
            const isCompleted = module.id < currentModule;
            const isCurrent = module.id === currentModule;
            const isAvailable = isMasterUnlocked || isCompleted || isCurrent;

            return (
              <button
                key={module.id}
                disabled={!isAvailable}
                onClick={() => handleModuleClick(module.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border group ${
                  isCurrent
                    ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-100'
                    : isCompleted
                    ? 'bg-stone-100 border-stone-200 opacity-80'
                    : isAvailable
                    ? 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-sm'
                    : 'bg-stone-50 border-transparent opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-amber-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : isAvailable
                      ? 'bg-stone-200 text-stone-600 group-hover:bg-amber-200 group-hover:text-amber-800'
                      : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {isCompleted ? '✓' : module.id}
                </div>
                <div className="flex-grow min-w-0">
                  <p className={`text-[12px] font-semibold leading-tight truncate ${isCurrent ? 'text-stone-900' : 'text-stone-600'}`}>
                    {module.title}
                  </p>
                  {isCurrent && (
                    <span className="text-[9px] text-amber-700 font-black uppercase tracking-widest mt-0.5 block animate-pulse">
                      Current Focus
                    </span>
                  )}
                  {!isAvailable && (
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-tight mt-0.5 block">🔒 Locked</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Developer tools (admin or always for testing) */}
        <div className="p-3 border-t border-stone-200">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Dev Tools</p>
          <button
            onClick={() => setIsMasterUnlocked((v) => !v)}
            className={`w-full py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isMasterUnlocked
                ? 'bg-amber-700 text-white hover:bg-amber-800'
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
          >
            {isMasterUnlocked ? '🔓 Lock Course' : '🔒 Unlock All'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-amber-800 to-stone-900 text-white flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-white/70 hover:text-white transition-colors p-1"
          >
            ☰
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-amber-700/40 flex items-center justify-center">
              <span className="text-xl">🕉</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Vastu</span>
                <span className="text-amber-300 font-light text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                  Abundance Architect
                </span>
              </div>
              <p className="text-[9px] text-white/50 uppercase tracking-widest">Conscious Space Design</p>
            </div>
          </div>

          {/* Module badge */}
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-white/50 uppercase tracking-widest">Module</p>
            <p className="text-lg font-black text-amber-300">{currentModule} / 10</p>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 min-h-0">
          <VastuChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isThinking={isThinking}
          />
        </div>
      </div>

    </div>
  );
};
