import { useState, useEffect } from 'react';
import { Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ArchiveEntry {
  id: string;
  subject?: string;
  title?: string;
  content?: string;
  raw_text?: string;
  created_at: string;
}

interface PortraitEntry {
  id: string;
  category?: string;
  content: string;
  created_at: string;
}

export default function BookArchive() {
  const [open, setOpen] = useState(false);
  const [akashicV1, setAkashicV1] = useState<ArchiveEntry[]>([]);
  const [portraitV1, setPortraitV1] = useState<PortraitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'codex' | 'portrait'>('codex');

  const load = async () => {
    if (akashicV1.length > 0) return; // already loaded
    setLoading(true);
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('akashic_archive_v1').select('id,subject,content,raw_text,created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('portrait_archive_v1').select('id,category,content,created_at').order('created_at', { ascending: false }).limit(50),
    ]);
    setAkashicV1(a || []);
    setPortraitV1(p || []);
    setLoading(false);
  };

  const handleToggle = () => {
    setOpen(!open);
    if (!open) load();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div
      className="rounded-[32px] overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Toggle header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-all"
      >
        <Archive size={16} className="text-[rgba(212,175,55,0.5)] shrink-0" />
        <div className="flex-1 text-left">
          <p
            className="text-[rgba(255,255,255,0.7)] font-bold"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', letterSpacing: '-0.01em' }}
          >
            Sacred Archive V1
          </p>
          <p
            className="text-[rgba(255,255,255,0.3)] uppercase"
            style={{ fontSize: '8px', letterSpacing: '0.25em', marginTop: '2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Original Akashic Codex · Living Portrait
          </p>
        </div>
        <span className="text-[rgba(255,255,255,0.3)]">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['codex', 'portrait'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all`}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '0.15em',
                  fontSize: '9px',
                  background: activeTab === tab ? 'rgba(212,175,55,0.15)' : 'transparent',
                  border: `1px solid ${activeTab === tab ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: activeTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                }}
              >
                {tab === 'codex' ? '⟁ Akashic Codex' : '✦ Living Portrait'}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.02)' }} />
              ))}
            </div>
          )}

          {!loading && activeTab === 'codex' && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {akashicV1.length === 0 && (
                <p className="text-[rgba(255,255,255,0.3)] text-xs text-center py-8">No archive entries found</p>
              )}
              {akashicV1.map(entry => (
                <div
                  key={entry.id}
                  className="rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <p className="text-[rgba(255,255,255,0.7)] text-xs font-medium mb-0.5"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {entry.subject || entry.title || 'Untitled'}
                  </p>
                  <p className="text-[rgba(255,255,255,0.35)] text-xs leading-relaxed line-clamp-2">
                    {entry.content || entry.raw_text || '—'}
                  </p>
                  <p className="text-[rgba(255,255,255,0.2)] mt-1" style={{ fontSize: '9px' }}>
                    {formatDate(entry.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'portrait' && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {portraitV1.length === 0 && (
                <p className="text-[rgba(255,255,255,0.3)] text-xs text-center py-8">No portrait entries found</p>
              )}
              {portraitV1.map(entry => (
                <div
                  key={entry.id}
                  className="rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {entry.category && (
                    <p className="text-[rgba(212,175,55,0.5)] uppercase mb-0.5"
                      style={{ fontSize: '8px', letterSpacing: '0.2em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {entry.category}
                    </p>
                  )}
                  <p className="text-[rgba(255,255,255,0.6)] text-xs leading-relaxed line-clamp-3">
                    {entry.content}
                  </p>
                  <p className="text-[rgba(255,255,255,0.2)] mt-1" style={{ fontSize: '9px' }}>
                    {formatDate(entry.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Note */}
          <p className="mt-4 text-[rgba(255,255,255,0.2)] text-center" style={{ fontSize: '9px', letterSpacing: '0.1em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            V1 ARCHIVE · READ-ONLY · TRANSLATION TO V2 COMING IN NEXT PHASE
          </p>
        </div>
      )}
    </div>
  );
}
