import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Languages, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface ArchiveEntry {
  id: string;
  subject?: string;
  title?: string;
  category?: string;
  content?: string;
  raw_text?: string;
  translated_content?: string;
  style_version?: string;
  created_at: string;
}

type ArchiveTable = 'akashic_archive_v1' | 'portrait_archive_v1';

export default function BookTranslatorPanel() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ArchiveTable>('akashic_archive_v1');
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const loadEntries = async (table: ArchiveTable) => {
    setLoading(true);
    const { data } = await supabase
      .from(table)
      .select('id,subject,title,category,content,raw_text,translated_content,style_version,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadEntries(activeTab);
  }, [open, activeTab]);

  const translateBatch = async () => {
    const untranslated = entries.filter(e => !e.translated_content);
    if (untranslated.length === 0) {
      toast({ title: 'All entries already translated in sacred language' });
      return;
    }

    setTranslating(true);
    setProgress({ done: 0, total: untranslated.length });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Process in batches of 5
    for (let i = 0; i < untranslated.length; i += 5) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-translate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              table: activeTab,
              batch_size: 5,
            }),
          }
        );
        const data = await res.json();
        if (data.success) {
          setProgress(p => ({ ...p, done: Math.min(p.done + 5, p.total) }));
        }
        // Wait between batches to respect rate limits
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error('Batch failed:', err);
      }
    }

    setTranslating(false);
    loadEntries(activeTab);
    toast({ title: '⟁ Sacred translation complete' });
  };

  const translateSingle = async (entryId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-translate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ table: activeTab, entry_id: entryId }),
      }
    );
    const data = await res.json();
    if (data.success) {
      toast({ title: '✦ Entry translated' });
      loadEntries(activeTab);
    }
  };

  const totalCount = entries.length;
  const translatedCount = entries.filter(e => e.translated_content).length;

  return (
    <div className="rounded-[32px] overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Header toggle */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-all">
        <Languages size={16} className="text-[rgba(212,175,55,0.5)] shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-[rgba(255,255,255,0.7)] font-bold"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', letterSpacing: '-0.01em' }}>
            Sacred Archive V1 — Old Books
          </p>
          <p className="text-[rgba(255,255,255,0.3)] uppercase mt-0.5"
            style={{ fontSize: '8px', letterSpacing: '0.25em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Original Akashic Codex · Living Portrait · Translate to V2
          </p>
        </div>
        <span className="text-[rgba(255,255,255,0.3)]">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {(['akashic_archive_v1', 'portrait_archive_v1'] as ArchiveTable[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.12em', fontSize: '9px',
                  background: activeTab === tab ? 'rgba(212,175,55,0.15)' : 'transparent',
                  border: `1px solid ${activeTab === tab ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: activeTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                }}>
                {tab === 'akashic_archive_v1' ? '⟁ Akashic Codex' : '✦ Living Portrait'}
              </button>
            ))}
          </div>

          {/* Translation progress */}
          {totalCount > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[rgba(255,255,255,0.4)] uppercase"
                  style={{ fontSize: '8px', letterSpacing: '0.2em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {translatedCount}/{totalCount} translated to sacred language
                </span>
                {translatedCount < totalCount && !translating && (
                  <button onClick={translateBatch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.8), rgba(212,175,55,0.5))',
                      color: '#050505', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.1em',
                      fontSize: '9px',
                    }}>
                    <Languages size={10} />
                    TRANSLATE ALL
                  </button>
                )}
                {translating && (
                  <span className="text-[rgba(212,175,55,0.6)] flex items-center gap-1"
                    style={{ fontSize: '9px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <RefreshCw size={10} className="animate-spin" />
                    {progress.done}/{progress.total}
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalCount > 0 ? (translatedCount / totalCount) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, rgba(212,175,55,0.8), rgba(212,175,55,0.4))',
                  }} />
              </div>
            </div>
          )}

          {/* Entries list */}
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.02)' }} />)}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {entries.length === 0 && (
                <p className="text-[rgba(255,255,255,0.3)] text-xs text-center py-8">No archive entries found</p>
              )}
              {entries.map(entry => {
                const label = entry.subject || entry.title || entry.category || 'Untitled';
                const hasTranslation = !!entry.translated_content;
                return (
                  <div key={entry.id} className="rounded-2xl px-4 py-3 space-y-2"
                    style={{
                      background: hasTranslation ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${hasTranslation ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[rgba(255,255,255,0.7)] text-xs font-medium truncate"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {label}
                        </p>
                        {hasTranslation ? (
                          <p className="text-[rgba(212,175,55,0.5)] text-xs italic line-clamp-2 mt-1"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '11px' }}>
                            {entry.translated_content?.slice(0, 120)}...
                          </p>
                        ) : (
                          <p className="text-[rgba(255,255,255,0.3)] text-xs line-clamp-1 mt-0.5"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '11px' }}>
                            {(entry.content || entry.raw_text || '').slice(0, 80)}...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasTranslation ? (
                          <span className="text-[rgba(212,175,55,0.5)] uppercase"
                            style={{ fontSize: '7px', letterSpacing: '0.2em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            ✦ V2
                          </span>
                        ) : (
                          <button onClick={() => translateSingle(entry.id)}
                            className="px-2 py-1 rounded-full border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-[#D4AF37] hover:border-[rgba(212,175,55,0.3)] transition-all"
                            style={{ fontSize: '8px', letterSpacing: '0.1em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            TRANSLATE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
