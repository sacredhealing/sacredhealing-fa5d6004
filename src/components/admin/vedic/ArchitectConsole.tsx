import React, { useState, useRef, useEffect } from 'react';
import { Interaction, ProjectState, VedicBook } from '@/types/vedicTranslation';
import { generateVedicResponse } from '@/services/vedicGeminiService';

interface Props {
  state: ProjectState;
  interactions: Interaction[];
  onAddInteractions: (newOnes: Interaction[]) => void;
  onStateChange: (newState: Partial<ProjectState>) => void;
  onArchiveUpdate: (type: 'TITLE' | 'SUMMARY' | 'COMMENTARY', content: string) => void;
}

export const ArchitectConsole: React.FC<Props> = ({ state, interactions, onAddInteractions, onStateChange, onArchiveUpdate }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [interactions]);

  const processResponseTags = (response: string) => {
    const titleMatch = response.match(/\[\[ARCHIVE_SET_TITLE\]\]([\s\S]*?)\[\[\/ARCHIVE_SET_TITLE\]\]/);
    if (titleMatch) onArchiveUpdate('TITLE', titleMatch[1].trim());

    const summaryMatch = response.match(/\[\[ARCHIVE_SET_SUMMARY\]\]([\s\S]*?)\[\[\/ARCHIVE_SET_SUMMARY\]\]/);
    if (summaryMatch) onArchiveUpdate('SUMMARY', summaryMatch[1].trim());

    const commentaryMatch = response.match(/\[\[ARCHIVE_APPEND_COMMENTARY\]\]([\s\S]*?)\[\[\/ARCHIVE_APPEND_COMMENTARY\]\]/);
    if (commentaryMatch) onArchiveUpdate('COMMENTARY', commentaryMatch[1].trim());

    const oldMatch = response.match(/\[\[ARCHIVE_APPEND\]\]([\s\S]*?)\[\[\/ARCHIVE_APPEND\]\]/);
    if (oldMatch) onArchiveUpdate('COMMENTARY', oldMatch[1].trim());

    return response
      .replace(/\[\[ARCHIVE_SET_TITLE\]\][\s\S]*?\[\[\/ARCHIVE_SET_TITLE\]\]/g, '')
      .replace(/\[\[ARCHIVE_SET_SUMMARY\]\][\s\S]*?\[\[\/ARCHIVE_SET_SUMMARY\]\]/g, '')
      .replace(/\[\[ARCHIVE_APPEND_COMMENTARY\]\][\s\S]*?\[\[\/ARCHIVE_APPEND_COMMENTARY\]\]/g, '')
      .replace(/\[\[ARCHIVE_APPEND\]\][\s\S]*?\[\[\/ARCHIVE_APPEND\]\]/g, '')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userInteraction: Interaction = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      metadata: { book: state.currentBook, chapter: state.chapter, verse: state.verse }
    };

    onAddInteractions([userInteraction]);
    setInput('');
    setLoading(true);

    const response = await generateVedicResponse(input, [...interactions, userInteraction], state);
    const cleanedContent = processResponseTags(response);

    const architectInteraction: Interaction = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: cleanedContent,
      timestamp: new Date(),
      metadata: { book: state.currentBook, chapter: state.chapter, verse: state.verse }
    };

    onAddInteractions([architectInteraction]);
    setLoading(false);
    onStateChange({ interactionCount: state.interactionCount + 1 });

    const upper = input.toUpperCase();
    if (upper.includes('SWITCH TO')) {
      if (upper.includes('BHAGAVAD GITA')) onStateChange({ currentBook: VedicBook.BHAGAVAD_GITA, chapter: 1, verse: 1 });
      else if (upper.includes('GURU GITA')) onStateChange({ currentBook: VedicBook.GURU_GITA, chapter: 1, verse: 1 });
      else if (upper.includes('SHREEMAD BHAGAVATAM')) onStateChange({ currentBook: VedicBook.SHREEMAD_BHAGAVATAM, chapter: 1, verse: 1 });
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^\[.*\]$/)) {
        return (
          <div key={i} className="flex flex-col items-center my-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-[10px] cinzel tracking-[0.6em] text-amber-500/60 mb-2 font-bold uppercase">Archive Record</span>
            <h2 className="cinzel text-xl text-white font-bold tracking-[0.4em] px-8 py-3 border border-amber-500/20 rounded-lg bg-amber-500/5">
              {trimmedLine.replace(/[\[\]]/g, '')}
            </h2>
          </div>
        );
      }
      if (trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 3) {
        return (
          <h3 key={i} className="cinzel text-2xl sacred-gold font-bold text-center my-14 tracking-[0.25em] flex justify-center items-center gap-6 uppercase sacred-gold-glow">
            {trimmedLine.replace(/🕉️/g, '').trim()}
          </h3>
        );
      }
      if (trimmedLine.startsWith('>') || (trimmedLine.startsWith('*') && trimmedLine.endsWith('*')) || (trimmedLine.startsWith('**') && trimmedLine.endsWith('**'))) {
        return (
          <div key={i} className="text-center my-8 relative py-6 bg-white/5 rounded-xl border-x border-amber-500/20 shadow-inner">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 bg-slate-950 text-[8px] cinzel text-amber-500 font-bold tracking-[0.8em] uppercase">Sacred Connect</div>
            <p className={`text-xl leading-relaxed ${trimmedLine.includes('**') ? 'font-bold text-amber-100' : 'italic text-amber-200/80'}`}>
              {trimmedLine.replace(/[>*]/g, '')}
            </p>
          </div>
        );
      }
      if (trimmedLine === '---') {
        return <div key={i} className="flex justify-center my-16 opacity-30"><div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" /></div>;
      }
      if (trimmedLine.includes('KOMMENTAR') || trimmedLine.includes('🔱') || trimmedLine.includes('🕯️')) {
        return (
          <div key={i} className="flex flex-col items-center mb-10">
            <h4 className="cinzel text-[10px] font-bold text-amber-500 tracking-[0.5em] text-center uppercase">
              {trimmedLine}
            </h4>
            <div className="h-6 w-[1px] bg-amber-500/30 mt-3" />
          </div>
        );
      }
      if (!trimmedLine) return <div key={i} className="h-4" />;
      return (
        <p key={i} className="mb-8 text-slate-100/90 leading-[2] text-lg text-justify max-w-2xl mx-auto font-light first-letter:text-4xl first-letter:font-cinzel first-letter:text-amber-400 first-letter:mr-3 first-letter:float-left">
          {trimmedLine}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[75vh] royal-card rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-16 md:px-24 space-y-4 bg-gradient-to-b from-slate-900/50 to-transparent"
      >
        {interactions.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-60">
            <div>
              <h2 className="cinzel text-3xl text-white mb-3 font-bold tracking-[0.3em] uppercase">{state.currentBook}</h2>
              <div className="h-[1px] w-12 bg-amber-500/40 mx-auto mb-4" />
              <p className="text-amber-100/40 max-w-xs mx-auto italic font-light tracking-widest text-[10px] uppercase">
                Awaiting Manuscript Ingestion
              </p>
            </div>
          </div>
        )}
        {interactions.map(item => (
          <div key={item.id} className={`mb-20 ${item.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
            <div className={`w-full ${item.role === 'user' ? 'max-w-md bg-white/5 p-8 rounded-2xl border border-white/10 italic text-amber-100 text-right backdrop-blur-md' : 'max-w-4xl mx-auto'}`}>
              {item.role === 'assistant' ? formatContent(item.content) : <p className="text-lg leading-relaxed">{item.content}</p>}
              {item.role === 'assistant' && (
                <div className="mt-16 flex flex-col items-center opacity-10">
                  <div className="h-16 w-[1px] bg-gradient-to-b from-amber-400 to-transparent mb-4" />
                  <span className="cinzel text-[8px] tracking-[1em] text-amber-100 font-bold uppercase">Shanti</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 border-2 border-amber-500/10 rounded-full" />
                <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin" />
              </div>
              <span className="cinzel text-[10px] tracking-[0.6em] text-amber-400 font-bold uppercase animate-pulse">Archiving Sacred Truths...</span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-10 bg-black/60 border-t border-white/10 backdrop-blur-2xl">
        <div className="flex gap-6 max-w-5xl mx-auto items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Upload manuscript or issue command..."
            className="flex-1 py-5 px-8 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white/5 text-white placeholder-amber-100/10 font-light tracking-wide transition-all text-lg"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-14 py-5 rounded-2xl cinzel font-bold transition-all shadow-xl hover:shadow-amber-500/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
          >
            Process
          </button>
        </div>
      </form>
    </div>
  );
};
