import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { TRANSMISSION_SCRIPTS } from './vastuConstants';

export interface VastuMessage {
  role: 'user' | 'model';
  text: string;
  images?: string[];
  timestamp: number;
}

interface AudioTransmissionCardProps {
  id: number;
  title: string;
}

const AudioTransmissionCard: React.FC<AudioTransmissionCardProps> = ({ id, title }) => {
  const [showScript, setShowScript] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required to record your transmission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const audio = new Audio(url);
      audio.play();
    }
  };

  const scriptData = TRANSMISSION_SCRIPTS[id];

  return (
    <div className="my-6 bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/50 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-700 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-lg">🕉</span>
        </div>
        <div className="flex-grow">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-800 mb-1">
            Sound Alchemy Layer: {id}
          </h4>
          <h3 className="text-xl font-bold text-stone-800 tracking-tight">{title}</h3>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Record the Beeja Mantras into this sanctuary. Vibrate your intention into the physical walls.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setShowScript(!showScript)}
              className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-700 hover:border-amber-400 hover:text-amber-800 transition-all"
            >
              {showScript ? '📖 Seal Script' : '📜 Unveil Script'}
            </button>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-amber-700 text-white rounded-full text-xs font-bold hover:bg-amber-800 transition-all"
              >
                🔴 Perform Transmission
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-all animate-pulse"
              >
                ⏹ Seal Recording
              </button>
            )}
            {recordedBlob && !isRecording && (
              <button
                onClick={playRecording}
                className="px-4 py-2 bg-stone-800 text-white rounded-full text-xs font-bold hover:bg-black transition-all"
              >
                ▶ Review Frequency
              </button>
            )}
          </div>
        </div>
      </div>

      {showScript && scriptData && (
        <div className="bg-white/40 p-5 border-t border-amber-100">
          <p className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em] mb-3">
            📜 Sacred Script
          </p>
          <p className="text-stone-800 italic leading-relaxed text-sm font-serif">
            "{scriptData.script}"
          </p>
          <p className="text-[10px] text-stone-500 mt-4 font-medium uppercase tracking-widest">
            Speak slowly. Let the sound emerge from your heart center.
          </p>
        </div>
      )}
    </div>
  );
};

// Simple markdown renderer
const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-bold mt-4 mb-2 text-amber-800">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold mt-5 mb-2 text-stone-800">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-stone-900 border-b pb-2 border-stone-100">{line.slice(2)}</h1>);
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-amber-600 bg-stone-50/50 px-5 py-3 italic my-4 text-stone-700 rounded-r-lg font-serif text-sm">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-sm mb-1">{inlineMarkdown(line.slice(2))}</li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={i} className="ml-5 list-decimal text-sm mb-1">{inlineMarkdown(line.replace(/^\d+\.\s/, ''))}</li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-sm leading-relaxed mb-2">{inlineMarkdown(line)}</p>);
    }
    i++;
  }

  return elements;
};

const inlineMarkdown = (text: string): React.ReactNode => {
  // Handle **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-stone-900 underline decoration-amber-300 decoration-2">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-stone-100 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const renderMessageContent = (text: string): React.ReactNode => {
  // Strip module tags from display
  const cleaned = text
    .replace(/\[MODULE_START:\s*\d+\]/g, '')
    .replace(/\[MODULE_COMPLETE:\s*\d+\]/g, '');

  // Split on [AUDIO: X - Title] tags
  const audioRegex = /\[AUDIO:\s*(\d+)\s*-\s*([^\]]+)\]/g;
  const parts: Array<{ type: 'text' | 'audio'; content?: string; id?: number; title?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = audioRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: cleaned.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'audio', id: parseInt(match[1]), title: match[2].trim() });
    lastIndex = audioRegex.lastIndex;
  }

  const remaining = cleaned.substring(lastIndex);
  if (remaining) parts.push({ type: 'text', content: remaining });

  if (parts.length === 0) {
    return <div className="prose prose-stone max-w-none">{renderMarkdown(cleaned)}</div>;
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text' && part.content) {
          return (
            <div key={i} className="prose prose-stone max-w-none">
              {renderMarkdown(part.content)}
            </div>
          );
        }
        if (part.type === 'audio' && part.id !== undefined && part.title) {
          return <AudioTransmissionCard key={i} id={part.id} title={part.title} />;
        }
        return null;
      })}
    </>
  );
};

interface VastuChatWindowProps {
  messages: VastuMessage[];
  onSendMessage: (text: string, images?: string[]) => void;
  isThinking: boolean;
}

export const VastuChatWindow: React.FC<VastuChatWindowProps> = ({ messages, onSendMessage, isThinking }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && selectedImages.length === 0) return;
    onSendMessage(inputValue, selectedImages.length > 0 ? selectedImages : undefined);
    setInputValue('');
    setSelectedImages([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/30 overflow-hidden">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Welcome screen */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto py-12">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-amber-100/50 rounded-full flex items-center justify-center">
                <span className="text-5xl">🕉</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-3 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              The Siddha Architect
            </h2>
            <p className="text-stone-600 leading-relaxed mb-8 font-medium">
              Welcome, Initiate. We do not just decorate; we consecrate. Prepare to align your physical realm with the currents of cosmic abundance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
              <button
                onClick={() => onSendMessage('Architect, I am ready to begin the transformation. Open the first module.')}
                className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all text-left group"
              >
                <span className="block text-amber-700 font-black uppercase tracking-widest text-[10px] mb-2">
                  Initiate Path →
                </span>
                <span className="text-base font-bold text-stone-800">The Living Field</span>
                <p className="text-xs text-stone-500 mt-1">Begin Module 1: Overview of your home's energetic anatomy.</p>
              </button>
              <button
                onClick={() => onSendMessage('I have photos of my room from multiple angles. I request a holistic Diagnostic Darshan.')}
                className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all text-left group"
              >
                <span className="block text-amber-700 font-black uppercase tracking-widest text-[10px] mb-2">
                  Third Eye Audit →
                </span>
                <span className="text-base font-bold text-stone-800">360° Diagnostic</span>
                <p className="text-xs text-stone-500 mt-1">Upload multiple photos for complete spatial synthesis.</p>
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
          >
            {msg.role === 'model' && (
              <div className="w-9 h-9 rounded-full bg-stone-100 flex-shrink-0 flex items-center justify-center text-amber-700 border border-amber-200/50">
                <span className="text-sm">🕉</span>
              </div>
            )}
            <div
              className={`max-w-[85%] md:max-w-[78%] p-5 md:p-6 shadow-md ${
                msg.role === 'user'
                  ? 'bg-stone-900 text-stone-100'
                  : 'bg-white text-stone-800 border border-stone-100/50'
              }`}
              style={{
                borderRadius: msg.role === 'user' ? '1.5rem 1.5rem 0.25rem 1.5rem' : '1.5rem 1.5rem 1.5rem 0.25rem',
              }}
            >
              {/* Image previews */}
              {msg.images && msg.images.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {msg.images.map((img, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border-2 border-white shadow-md">
                      <img src={img} alt={`Space ${i + 1}`} className="w-full h-40 object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {/* Message content */}
              <div className={msg.role === 'user' ? 'text-sm leading-relaxed' : ''}>
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.text}</p>
                ) : (
                  renderMessageContent(msg.text)
                )}
              </div>
              <div className={`text-[9px] mt-3 font-bold uppercase tracking-widest opacity-40 text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Transmission
              </div>
            </div>
          </motion.div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-50 flex-shrink-0 flex items-center justify-center text-amber-600 border border-amber-100">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div
              className="bg-white border border-stone-100 px-5 py-4 shadow-sm flex items-center gap-3"
              style={{ borderRadius: '1.5rem 1.5rem 1.5rem 0.25rem' }}
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
              <span className="text-[11px] font-black text-stone-500 uppercase tracking-widest">
                Siddha Third Eye is analyzing your field…
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 md:p-6 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Image previews */}
          {selectedImages.length > 0 && (
            <div className="mb-4 bg-amber-50/50 p-3 rounded-2xl border border-amber-200/50">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                  Multi-View Diagnostic Ready
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedImages([])}
                  className="text-[10px] text-red-600 font-bold uppercase tracking-widest hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow group">
                    <img src={img} className="h-full w-full object-cover" alt="Selected" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-16 w-16 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:border-amber-400 hover:text-amber-700 transition-all text-xl"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-12 h-12 rounded-2xl bg-stone-50 text-stone-600 hover:bg-amber-100 hover:text-amber-800 transition-all flex items-center justify-center border border-stone-200 text-xl"
              title="Upload room photos for diagnostic"
            >
              📷
            </button>
            <div className="flex-grow relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Direct your inquiry to the Architect…"
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all pr-16"
                disabled={isThinking}
              />
              <button
                type="submit"
                disabled={(!inputValue.trim() && selectedImages.length === 0) || isThinking}
                className="absolute right-2 top-2 h-10 w-12 rounded-xl bg-amber-800 text-white disabled:bg-stone-200 disabled:text-stone-400 hover:bg-stone-900 transition-all flex items-center justify-center"
              >
                ↑
              </button>
            </div>
          </div>

          {/* Directional hints */}
          <div className="flex justify-center gap-8 mt-3 overflow-x-auto">
            {[
              { icon: '💧', label: 'Wealth (North)', color: 'text-blue-500' },
              { icon: '🔥', label: 'Energy (SE)', color: 'text-red-500' },
              { icon: '⛰', label: 'Stability (SW)', color: 'text-amber-700' },
              { icon: '☀️', label: 'Grace (NE)', color: 'text-amber-400' },
            ].map((h) => (
              <div key={h.label} className="flex items-center gap-1 opacity-40 hover:opacity-80 transition-opacity whitespace-nowrap">
                <span className={`text-[10px] ${h.color}`}>{h.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">{h.label}</span>
              </div>
            ))}
          </div>
        </form>

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
