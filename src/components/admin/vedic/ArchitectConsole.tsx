import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { Interaction, ProjectState, VedicBook } from '@/types/vedicTranslation';
import { generateVedicResponse } from '@/services/vedicGeminiService';

interface Props {
  state: ProjectState;
  interactions: Interaction[];
  onAddInteractions: (newOnes: Interaction[]) => void;
  onStateChange: (newState: Partial<ProjectState>) => void;
  onArchiveUpdate: (type: 'TITLE' | 'SUMMARY' | 'COMMENTARY', content: string, chapter?: number) => void;
}

export const ArchitectConsole: React.FC<Props> = ({
  state,
  interactions,
  onAddInteractions,
  onStateChange,
  onArchiveUpdate,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [localInteractions, setLocalInteractions] = useState<Interaction[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const allInteractions = [...interactions, ...localInteractions];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [allInteractions, loading]);

  const addInteraction = (items: Interaction[]) => {
    setLocalInteractions((prev) => [...prev, ...items]);
    onAddInteractions(items);
  };

  // ── Audio helpers ──────────────────────────────────────────────────────────
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const startRecording = async () => {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setRecordingError(err instanceof Error ? err.message : 'Mikrofonåtkomst nekad');
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      setIsRecording(false);
      if (chunksRef.current.length === 0) return;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      const base64 = await blobToBase64(blob);
      await submit('[Röstinspelning]', base64, blob.type);
    };
    recorder.stop();
  };

  // ── Response tag parser ────────────────────────────────────────────────────
  const processResponseTags = (response: string): string => {
    const parseChapter = (attrs: string): number => {
      const m = attrs?.match(/chapter\s*=\s*(\d+)/i);
      return m ? parseInt(m[1], 10) : state.chapter;
    };
    const titleRe = /\[\[ARCHIVE_SET_TITLE(\s+[^\]]*)?\]\]([\s\S]*?)\[\[\/ARCHIVE_SET_TITLE\]\]/g;
    let m;
    while ((m = titleRe.exec(response)) !== null) onArchiveUpdate('TITLE', m[2].trim(), parseChapter(m[1]));
    const summaryRe = /\[\[ARCHIVE_SET_SUMMARY(\s+[^\]]*)?\]\]([\s\S]*?)\[\[\/ARCHIVE_SET_SUMMARY\]\]/g;
    while ((m = summaryRe.exec(response)) !== null) onArchiveUpdate('SUMMARY', m[2].trim(), parseChapter(m[1]));
    const commentaryRe = /\[\[ARCHIVE_APPEND_COMMENTARY(\s+[^\]]*)?\]\]([\s\S]*?)\[\[\/ARCHIVE_APPEND_COMMENTARY\]\]/g;
    while ((m = commentaryRe.exec(response)) !== null) onArchiveUpdate('COMMENTARY', m[2].trim(), parseChapter(m[1]));
    const oldRe = /\[\[ARCHIVE_APPEND\]\]([\s\S]*?)\[\[\/ARCHIVE_APPEND\]\]/g;
    while ((m = oldRe.exec(response)) !== null) onArchiveUpdate('COMMENTARY', m[1].trim(), state.chapter);

    return response
      .replace(/\[\[ARCHIVE_SET_TITLE[^\]]*\]\][\s\S]*?\[\[\/ARCHIVE_SET_TITLE\]\]/g, '')
      .replace(/\[\[ARCHIVE_SET_SUMMARY[^\]]*\]\][\s\S]*?\[\[\/ARCHIVE_SET_SUMMARY\]\]/g, '')
      .replace(/\[\[ARCHIVE_APPEND_COMMENTARY[^\]]*\]\][\s\S]*?\[\[\/ARCHIVE_APPEND_COMMENTARY\]\]/g, '')
      .replace(/\[\[ARCHIVE_APPEND\]\][\s\S]*?\[\[\/ARCHIVE_APPEND\]\]/g, '')
      .trim();
  };

  // ── Core submit ────────────────────────────────────────────────────────────
  const submit = async (displayText: string, audioBase64?: string, mimeType?: string) => {
    const userInteraction: Interaction = {
      id: Date.now().toString(),
      role: 'user',
      content: displayText,
      timestamp: new Date(),
      metadata: { book: state.currentBook, chapter: state.chapter, verse: state.verse },
    };
    addInteraction([userInteraction]);
    setInput('');
    setLoading(true);

    const history = [...allInteractions, userInteraction];
    const audio = audioBase64 && mimeType ? { data: audioBase64, mimeType } : undefined;
    const response = await generateVedicResponse(displayText === '[Röstinspelning]' ? '' : displayText, history, state, audio);
    const cleaned = processResponseTags(response);

    const aiInteraction: Interaction = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: cleaned,
      timestamp: new Date(),
      metadata: { book: state.currentBook, chapter: state.chapter, verse: state.verse },
    };
    addInteraction([aiInteraction]);
    setLoading(false);
    onStateChange({ interactionCount: state.interactionCount + 1 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    await submit(input.trim());
  };

  // ── Render response ────────────────────────────────────────────────────────
  const renderResponse = (content: string) => {
    return content.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} style={{ height: 8 }} />;

      // Section headers (### Vers X)
      if (t.startsWith('### ')) {
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '24px 0 12px',
            }}
          >
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.15)' }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.7)',
              }}
            >
              {t.replace('### ', '')}
            </span>
            <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.15)' }} />
          </div>
        );
      }

      // Bold labels (**🕉️ Sanskrit:**)
      if (t.startsWith('**') && t.endsWith('**')) {
        return (
          <p
            key={i}
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(212,175,55,0.8)',
              marginTop: 16,
              marginBottom: 4,
            }}
          >
            {t.replace(/\*\*/g, '')}
          </p>
        );
      }

      // Horizontal rule
      if (t === '---' || t === '🔱') {
        return (
          <div
            key={i}
            style={{
              height: 1,
              background: 'rgba(212,175,55,0.1)',
              margin: '20px 0',
            }}
          />
        );
      }

      // Status line [BOK: ...]
      if (t.startsWith('[BOK:') || t.startsWith('[WORKING BOOK:')) {
        return (
          <p
            key={i}
            style={{
              fontSize: 10,
              color: 'rgba(212,175,55,0.4)',
              fontFamily: 'monospace',
              marginBottom: 16,
            }}
          >
            {t}
          </p>
        );
      }

      // Normal text
      return (
        <p
          key={i}
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.75)',
            marginBottom: 4,
          }}
        >
          {t}
        </p>
      );
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Empty state */}
        {allInteractions.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 16,
              opacity: 0.5,
              padding: '60px 24px',
            }}
          >
            <span style={{ fontSize: 48 }}>📖</span>
            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                }}
              >
                Klistra in text nedan
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 360 }}>
                Klistra in text från Bhagavad Gita, Vishwanandas kommentar eller
                förord — på engelska eller svenska. AI:n ger dig automatiskt
                Sanskrit + svensk översättning + kommentar.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {allInteractions.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {item.role === 'user' ? (
              <div
                style={{
                  maxWidth: '60%',
                  padding: '12px 16px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.6)',
                  fontStyle: 'italic',
                }}
              >
                {item.content}
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '90%',
                  padding: '24px',
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  width: '100%',
                }}
              >
                {renderResponse(item.content)}
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <Loader2
              size={16}
              style={{ color: '#D4AF37', animation: 'spin 1s linear infinite' }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.6)',
              }}
            >
              Siddha-Scribe arbetar...
            </span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {recordingError && (
          <p
            style={{
              fontSize: 12,
              color: 'rgba(244,63,94,0.8)',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {recordingError}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}
        >
          {/* Mic button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 14,
              border: `1px solid ${isRecording ? 'rgba(244,63,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
              background: isRecording ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
              color: isRecording ? '#f43f5e' : 'rgba(212,175,55,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Textarea */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any);
            }}
            placeholder="Klistra in text från Gita, Vishwanandas kommentar, förord... (Cmd+Enter för att skicka)"
            rows={3}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 14,
              border: '1px solid rgba(212,175,55,0.3)',
              background:
                !loading && input.trim()
                  ? 'rgba(212,175,55,0.15)'
                  : 'rgba(255,255,255,0.02)',
              color:
                !loading && input.trim()
                  ? '#D4AF37'
                  : 'rgba(255,255,255,0.2)',
              cursor: !loading && input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <Send size={16} />
          </button>
        </form>

        <p
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          Varje inlägg sparas automatiskt i arkivet · Cmd+Enter för att skicka
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};
