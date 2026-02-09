import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VedicHeader } from '@/components/admin/vedic/VedicHeader';
import { ArchitectConsole } from '@/components/admin/vedic/ArchitectConsole';
import { StateMonitor } from '@/components/admin/vedic/StateMonitor';
import { ArchiveModal } from '@/components/admin/vedic/ArchiveModal';
import { ProjectState, VedicBook, LibraryArchive } from '@/types/vedicTranslation';
import { INITIAL_ARCHIVE } from '@/data/vedicManuscript';
import { downloadVedicManuscript } from '@/utils/vedicExport';
import { useToast } from '@/hooks/use-toast';

const AdminVedicTranslation: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ProjectState>({
    currentBook: VedicBook.BHAGAVAD_GITA,
    chapter: 1,
    verse: 13,
    interactionCount: 0,
    mode: 'INGESTION'
  });

  const [archive, setArchive] = useState<LibraryArchive>(INITIAL_ARCHIVE);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [allInteractions, setAllInteractions] = useState<Parameters<typeof ArchitectConsole>[0]['interactions']>([]);

  useEffect(() => {
    const root = document.documentElement;
    switch (state.currentBook) {
      case VedicBook.BHAGAVAD_GITA:
        root.style.setProperty('--theme-bg', 'radial-gradient(circle at center, #1e3a8a 0%, #1e1b4b 70%, #020617 100%)');
        root.style.setProperty('--theme-accent', '#b48c35');
        root.style.setProperty('--theme-glow', 'rgba(180, 140, 53, 0.25)');
        break;
      case VedicBook.GURU_GITA:
        root.style.setProperty('--theme-bg', 'radial-gradient(circle at center, #ea580c 0%, #991b1b 60%, #450a0a 100%)');
        root.style.setProperty('--theme-accent', '#f43f5e');
        root.style.setProperty('--theme-glow', 'rgba(244, 63, 94, 0.4)');
        break;
      case VedicBook.SHREEMAD_BHAGAVATAM:
        root.style.setProperty('--theme-bg', 'radial-gradient(circle at center, #0d9488 0%, #115e59 70%, #042f2e 100%)');
        root.style.setProperty('--theme-accent', '#fcd34d');
        root.style.setProperty('--theme-glow', 'rgba(252, 211, 77, 0.25)');
        break;
    }
  }, [state.currentBook]);

  const handleStateUpdate = (newState: Partial<ProjectState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const handleUpdateManuscript = (newManuscript: LibraryArchive[VedicBook]) => {
    setArchive(prev => ({
      ...prev,
      [state.currentBook]: newManuscript
    }));
  };

  const handleArchiveUpdate = (type: 'TITLE' | 'SUMMARY' | 'COMMENTARY', content: string, chapter?: number) => {
    const ch = chapter ?? state.chapter;
    setArchive(prev => {
      const manuscript = JSON.parse(JSON.stringify(prev[state.currentBook]));
      const getChapter = (n: number): typeof manuscript.chapter1 => {
        if (n === 1) return manuscript.chapter1 ?? { title: '', summary: '', verses: [] };
        if (!manuscript.chapters) manuscript.chapters = {};
        if (!manuscript.chapters[n]) manuscript.chapters[n] = { title: '', summary: '', verses: [] };
        return manuscript.chapters[n];
      };
      const currentChapter = getChapter(ch);

      if (type === 'TITLE') currentChapter.title = content;
      else if (type === 'SUMMARY') currentChapter.summary = content;
      else if (type === 'COMMENTARY') {
        currentChapter.commentaries = [...(currentChapter.commentaries || []), content];
      }

      if (ch === 1) manuscript.chapter1 = currentChapter;
      else (manuscript.chapters = manuscript.chapters || {})[ch] = currentChapter;
      return { ...prev, [state.currentBook]: manuscript };
    });
  };

  const currentInteractions = allInteractions.filter(i => i.metadata?.book === state.currentBook);

  const handleExportToFile = () => {
    downloadVedicManuscript(archive, 'vedicManuscript.ts');
    toast({
      title: 'File downloaded',
      description: 'Replace src/data/vedicManuscript.ts with the downloaded file. Then run: git add . && git commit -m "Vedic translation update" && git push',
      duration: 8000
    });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-white transition-colors duration-1000 vedic-translation" style={{ background: 'var(--theme-bg)' }}>
      <div className="absolute top-4 left-4 z-50">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <VedicHeader currentBook={state.currentBook} />

      {archiveVisible && (
        <ArchiveModal
          manuscript={archive[state.currentBook]}
          onUpdateManuscript={handleUpdateManuscript}
          onClose={() => setArchiveVisible(false)}
        />
      )}

      <nav className="max-w-7xl w-full mx-auto px-6 mb-8">
        <div className="flex justify-center space-x-4 md:space-x-8">
          {Object.values(VedicBook).map((book) => {
            const isActive = state.currentBook === book;
            const icon = book === VedicBook.BHAGAVAD_GITA ? '📖' : book === VedicBook.GURU_GITA ? '💠' : '🕉️';
            return (
              <button
                key={book}
                type="button"
                onClick={() => handleStateUpdate({ currentBook: book, chapter: 1, verse: 1 })}
                className={`flex items-center space-x-2 py-3 px-6 rounded-xl cinzel text-[10px] md:text-xs tracking-[0.2em] font-bold transition-all border ${isActive ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60 hover:border-white/10'} uppercase`}
              >
                <span>{icon}</span>
                <span>{book}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1 space-y-8">
          <StateMonitor state={state} onOpenArchive={() => setArchiveVisible(true)} onExportToFile={handleExportToFile} />
          <div className="bg-gradient-to-br from-black/40 to-black/60 p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--theme-accent)] to-transparent opacity-50" />
            <h3 className="cinzel font-bold mb-6 flex items-center text-[var(--theme-accent)] tracking-widest text-sm uppercase">
              <span className="mr-3 opacity-80">🕯️</span> Devotee&apos;s Oath
            </h3>
            <p className="text-sm italic leading-relaxed text-slate-300 opacity-80">
              &quot;To preserve the dharma through precision. To translate with the heart of a devotee. To build a library that transcends time.&quot;
            </p>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--theme-accent)' }} />
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: 'var(--theme-accent)' }} />
              </span>
              <h2 className="cinzel text-xl font-bold uppercase tracking-[0.3em] text-white">Presence Active</h2>
            </div>
            <div className="text-[10px] text-white/40 font-mono flex flex-wrap gap-6 tracking-widest uppercase">
              <span className="border-b border-white/5 pb-1">MANUSCRIPT: {state.currentBook}</span>
              <span className="border-b border-white/5 pb-1">VERSION: 2025</span>
            </div>
          </div>

          <ArchitectConsole
            state={state}
            interactions={currentInteractions}
            onAddInteractions={(newOnes) => setAllInteractions(prev => [...prev, ...newOnes])}
            onStateChange={handleStateUpdate}
            onArchiveUpdate={handleArchiveUpdate}
          />
        </section>
      </main>

      <footer className="py-12 mt-20 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center text-slate-500 text-[10px] tracking-[0.3em] uppercase font-bold">
          <div className="flex items-center gap-4">
            <p>© 2025 Paramahamsa Vishwananda</p>
            <span className="opacity-20">|</span>
            <p className="sacred-gold">Powered by Just Love & AI</p>
          </div>
          <div className="flex space-x-8 mt-6 md:mt-0 opacity-60">
            <span className="hover:text-amber-400 cursor-pointer transition-colors">Dharma Protocol</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors">Archival Ethics</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors">Metadata</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminVedicTranslation;
