import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { TRANSMISSION_SCRIPTS } from './vastuConstants';

// ─────────────────────────────────────────────
// SQI 2050 Design Tokens
// Gold:   #D4AF37   Akasha: #050505
// Glass:  rgba(255,255,255,0.02)
// Border: rgba(255,255,255,0.06)
// Cyan:   #22D3EE  (scanner / active states)
// ─────────────────────────────────────────────

export interface VastuMessage {
  role: 'user' | 'model';
  text: string;
  images?: string[];
  timestamp: number;
}

// ── Audio Transmission Card ────────────────────
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

  // ── RECORDING LOGIC: UNCHANGED ──
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
    <div
      style={{
        margin: '20px 0',
        background: 'rgba(212,175,55,0.03)',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: '28px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'relative',
      }}
    >
      {/* Gold top shimmer */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
        }}
      />

      <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(212,175,55,0.15)',
          }}
        >
          🕉
        </div>

        <div style={{ flexGrow: 1 }}>
          <h4
            style={{
              fontSize: '8px',
              fontWeight: 800,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              margin: '0 0 6px',
            }}
          >
            Sound Alchemy Layer: {id}
          </h4>
          <h3
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '18px',
              fontWeight: 600,
              color: '#fff',
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7,
              margin: '0 0 16px',
            }}
          >
            Record the Beeja Mantras into this sanctuary. Vibrate your intention into the
            physical walls.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setShowScript(!showScript)}
              style={{
                padding: '8px 18px',
                borderRadius: '100px',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {showScript ? '📖 Seal Script' : '📜 Unveil Script'}
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                style={{
                  padding: '8px 18px',
                  borderRadius: '100px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #D4AF37, #b8962a)',
                  border: 'none',
                  color: '#050505',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                }}
              >
                🔴 Perform Transmission
              </button>
            ) : (
              <button
                onClick={stopRecording}
                style={{
                  padding: '8px 18px',
                  borderRadius: '100px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  animation: 'sqiPulse 1.5s ease infinite',
                }}
              >
                ⏹ Seal Recording
              </button>
            )}

            {recordedBlob && !isRecording && (
              <button
                onClick={playRecording}
                style={{
                  padding: '8px 18px',
                  borderRadius: '100px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  color: '#22D3EE',
                  cursor: 'pointer',
                }}
              >
                ▶ Review Frequency
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Script reveal */}
      {showScript && scriptData && (
        <div
          style={{
            background: 'rgba(212,175,55,0.03)',
            borderTop: '1px solid rgba(212,175,55,0.1)',
            padding: '20px',
          }}
        >
          <p
            style={{
              fontSize: '8px',
              fontWeight: 800,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              margin: '0 0 12px',
            }}
          >
            📜 Sacred Script
          </p>
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.8,
              margin: '0 0 14px',
            }}
          >
            "{scriptData.script}"
          </p>
          <p
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
              margin: 0,
            }}
          >
            Speak slowly. Let the sound emerge from your heart center.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Markdown renderer: LOGIC UNCHANGED, styles updated ──
const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={i}
          style={{
            fontSize: '14px',
            fontWeight: 800,
            marginTop: '20px',
            marginBottom: '8px',
            color: '#D4AF37',
            letterSpacing: '-0.01em',
          }}
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={i}
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            fontWeight: 600,
            marginTop: '24px',
            marginBottom: '10px',
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={i}
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            fontWeight: 300,
            fontStyle: 'italic',
            marginTop: '28px',
            marginBottom: '12px',
            color: '#D4AF37',
            textShadow: '0 0 20px rgba(212,175,55,0.3)',
            borderBottom: '1px solid rgba(212,175,55,0.15)',
            paddingBottom: '10px',
          }}
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={i}
          style={{
            borderLeft: '3px solid #D4AF37',
            background: 'rgba(212,175,55,0.04)',
            padding: '12px 18px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.7)',
            margin: '16px 0',
            borderRadius: '0 12px 12px 0',
          }}
        >
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li
          key={i}
          style={{
            marginLeft: '20px',
            listStyleType: 'disc',
            fontSize: '13px',
            marginBottom: '4px',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {inlineMarkdown(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li
          key={i}
          style={{
            marginLeft: '20px',
            listStyleType: 'decimal',
            fontSize: '13px',
            marginBottom: '4px',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {inlineMarkdown(line.replace(/^\d+\.\s/, ''))}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '8px' }} />);
    } else {
      elements.push(
        <p
          key={i}
          style={{
            fontSize: '13px',
            lineHeight: 1.8,
            marginBottom: '8px',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {inlineMarkdown(line)}
        </p>
      );
    }
    i++;
  }
  return elements;
};

const inlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={idx}
          style={{ fontWeight: 800, color: '#D4AF37', textDecoration: 'underline', textDecorationColor: 'rgba(212,175,55,0.3)' }}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.15)',
            padding: '1px 6px',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#D4AF37',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// ── renderMessageContent: LOGIC UNCHANGED ──
const renderMessageContent = (text: string): React.ReactNode => {
  const cleaned = text
    .replace(/\[MODULE_START:\s*\d+\]/g, '')
    .replace(/\[MODULE_COMPLETE:\s*\d+\]/g, '');
  const audioRegex = /\[AUDIO:\s*(\d+)\s*-\s*([^\]]+)\]/g;
  const parts: Array<{
    type: 'text' | 'audio';
    content?: string;
    id?: number;
    title?: string;
  }> = [];
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
    return <div>{renderMarkdown(cleaned)}</div>;
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text' && part.content) {
          return <div key={i}>{renderMarkdown(part.content)}</div>;
        }
        if (part.type === 'audio' && part.id !== undefined && part.title) {
          return <AudioTransmissionCard key={i} id={part.id} title={part.title} />;
        }
        return null;
      })}
    </>
  );
};

// ── Main Chat Window ───────────────────────────
interface VastuChatWindowProps {
  messages: VastuMessage[];
  onSendMessage: (text: string, images?: string[]) => void;
  isThinking: boolean;
}

export const VastuChatWindow: React.FC<VastuChatWindowProps> = ({
  messages,
  onSendMessage,
  isThinking,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // ── Form handlers: LOGIC UNCHANGED ──
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
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#050505',
        overflow: 'hidden',
      }}
    >
      {/* ── Messages scroll area ── */}
      <div
        ref={scrollRef}
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          scrollbarWidth: 'none',
        }}
      >
        {/* ── Welcome screen ── */}
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '48px 24px',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            {/* Yantra */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(212,175,55,0.15)',
                  animation: 'sqiBreathe 4s ease infinite',
                }}
              >
                <span style={{ fontSize: '44px' }}>🕉</span>
              </div>
            </div>

            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '28px',
                fontWeight: 300,
                fontStyle: 'italic',
                color: '#fff',
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
              }}
            >
              The Siddha Architect
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.8,
                margin: '0 0 36px',
                maxWidth: '400px',
              }}
            >
              Welcome, Initiate. We do not just decorate; we consecrate. Prepare to align
              your physical realm with the currents of cosmic abundance.
            </p>

            {/* CTA cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '480px',
              }}
            >
              {[
                {
                  label: 'Initiate Path →',
                  title: 'The Living Field',
                  desc: "Begin Module 1: Overview of your home's energetic anatomy.",
                  msg: 'Architect, I am ready to begin the transformation. Open the first module.',
                },
                {
                  label: 'Third Eye Audit →',
                  title: '360° Diagnostic',
                  desc: 'Upload multiple photos for complete spatial synthesis.',
                  msg: 'I have photos of my room from multiple angles. I request a holistic Diagnostic Darshan.',
                },
              ].map((card) => (
                <button
                  key={card.label}
                  onClick={() => onSendMessage(card.msg)}
                  style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(212,175,55,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(212,175,55,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 0 30px rgba(212,175,55,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.02)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '8px',
                      fontWeight: 800,
                      letterSpacing: '0.45em',
                      textTransform: 'uppercase',
                      color: '#D4AF37',
                      marginBottom: '8px',
                    }}
                  >
                    {card.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '-0.02em',
                      marginBottom: '6px',
                    }}
                  >
                    {card.title}
                  </span>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Message bubbles ── */}
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: '12px',
            }}
          >
            {/* Model avatar */}
            {msg.role === 'model' && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                  boxShadow: '0 0 14px rgba(212,175,55,0.1)',
                }}
              >
                🕉
              </div>
            )}

            {/* Bubble */}
            <div
              style={{
                maxWidth: '82%',
                padding: '18px 22px',
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))'
                    : 'rgba(255,255,255,0.03)',
                border:
                  msg.role === 'user'
                    ? '1px solid rgba(212,175,55,0.2)'
                    : '1px solid rgba(255,255,255,0.05)',
                borderRadius:
                  msg.role === 'user'
                    ? '22px 22px 4px 22px'
                    : '22px 22px 22px 4px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow:
                  msg.role === 'user'
                    ? '0 4px 20px rgba(212,175,55,0.08)'
                    : '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              {/* Image previews */}
              {msg.images && msg.images.length > 0 && (
                <div
                  style={{
                    marginBottom: '14px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                  }}
                >
                  {msg.images.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid rgba(212,175,55,0.15)',
                      }}
                    >
                      <img
                        src={img}
                        alt={`Space ${i + 1}`}
                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Content */}
              <div>
                {msg.role === 'user' ? (
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.85)',
                      margin: 0,
                      lineHeight: 1.7,
                    }}
                  >
                    {msg.text}
                  </p>
                ) : (
                  renderMessageContent(msg.text)
                )}
              </div>

              {/* Timestamp */}
              <div
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.2)',
                  textAlign: 'right',
                  marginTop: '10px',
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · Transmission
              </div>
            </div>
          </motion.div>
        ))}

        {/* ── Thinking indicator ── */}
        {isThinking && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Loader2
                style={{
                  width: '16px',
                  height: '16px',
                  color: '#D4AF37',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
            <div
              style={{
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '20px 20px 20px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#D4AF37',
                      animation: `sqiBounce 0.8s ${delay}s ease infinite`,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Siddha Third Eye is analyzing your field…
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Input area ── */}
      <div
        style={{
          padding: '16px 20px 20px',
          background: 'rgba(255,255,255,0.015)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Image preview strip */}
          {selectedImages.length > 0 && (
            <div
              style={{
                marginBottom: '12px',
                background: 'rgba(212,175,55,0.04)',
                border: '1px solid rgba(212,175,55,0.12)',
                borderRadius: '18px',
                padding: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <p
                  style={{
                    fontSize: '8px',
                    fontWeight: 800,
                    letterSpacing: '0.45em',
                    textTransform: 'uppercase',
                    color: '#D4AF37',
                    margin: 0,
                  }}
                >
                  Multi-View Diagnostic Ready
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedImages([])}
                  style={{
                    fontSize: '8px',
                    fontWeight: 800,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'rgba(239,68,68,0.8)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Clear All
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedImages.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(212,175,55,0.2)',
                    }}
                  >
                    <img
                      src={img}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt="Selected"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.opacity = '1')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.opacity = '0')
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    border: '1px dashed rgba(212,175,55,0.25)',
                    background: 'rgba(212,175,55,0.04)',
                    color: 'rgba(212,175,55,0.5)',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Main input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload room photos for diagnostic"
              style={{
                flexShrink: 0,
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(212,175,55,0.08)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(212,175,55,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(255,255,255,0.08)';
              }}
            >
              📷
            </button>

            {/* Text input */}
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Direct your inquiry to the Architect…"
                disabled={isThinking}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '14px 60px 14px 20px',
                  fontSize: '13px',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    'rgba(212,175,55,0.3)';
                  (e.target as HTMLInputElement).style.boxShadow =
                    '0 0 0 3px rgba(212,175,55,0.06)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    'rgba(255,255,255,0.08)';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                disabled={
                  (!inputValue.trim() && selectedImages.length === 0) || isThinking
                }
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '8px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background:
                    !inputValue.trim() && selectedImages.length === 0
                      ? 'rgba(255,255,255,0.05)'
                      : 'linear-gradient(135deg, #D4AF37, #b8962a)',
                  border: 'none',
                  color:
                    !inputValue.trim() && selectedImages.length === 0
                      ? 'rgba(255,255,255,0.2)'
                      : '#050505',
                  cursor:
                    !inputValue.trim() && selectedImages.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: '16px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow:
                    !inputValue.trim() && selectedImages.length === 0
                      ? 'none'
                      : '0 0 16px rgba(212,175,55,0.3)',
                }}
              >
                ↑
              </button>
            </div>
          </div>

          {/* Directional hints — preserved exactly */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              marginTop: '10px',
              overflowX: 'auto',
            }}
          >
            {[
              { icon: '💧', label: 'Wealth (North)', color: '#60a5fa' },
              { icon: '🔥', label: 'Energy (SE)', color: '#f87171' },
              { icon: '⛰', label: 'Stability (SW)', color: '#D4AF37' },
              { icon: '☀️', label: 'Grace (NE)', color: '#fbbf24' },
            ].map((h) => (
              <div
                key={h.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  opacity: 0.4,
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.opacity = '0.9')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.opacity = '0.4')
                }
              >
                <span style={{ fontSize: '11px', color: h.color }}>{h.icon}</span>
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 800,
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {h.label}
                </span>
              </div>
            ))}
          </div>
        </form>

        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes sqiBreathe {
          0%,100% { transform: scale(1); box-shadow: 0 0 30px rgba(212,175,55,0.15); }
          50%      { transform: scale(1.04); box-shadow: 0 0 50px rgba(212,175,55,0.3); }
        }
        @keyframes sqiBounce {
          0%,100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes sqiPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
