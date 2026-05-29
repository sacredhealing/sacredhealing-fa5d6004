import { useState } from 'react';
import { BookOpen, User, X, Check, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SaveToBookModalProps {
  rawResponse: string;       // The SQI/Apothecary response text
  rawPrompt?: string;        // What the user asked
  onClose: () => void;
  onSaved?: (bookType: string) => void;
}

interface DistilledEntry {
  book_type: 'life_book' | 'akashic_codex';
  chapter_suggestion: string;
  title: string;
  content: string;
  transmission_seal: string;
}

export default function SaveToBookModal({
  rawResponse,
  rawPrompt,
  onClose,
  onSaved,
}: SaveToBookModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'preview' | 'distilling' | 'review' | 'saving' | 'done'>('preview');
  const [distilled, setDistilled] = useState<DistilledEntry | null>(null);
  const [forceBook, setForceBook] = useState<'life_book' | 'akashic_codex' | null>(null);

  const distill = async (forcedBook?: 'life_book' | 'akashic_codex') => {
    setStep('distilling');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-curator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            raw_response: rawResponse,
            raw_prompt: rawPrompt,
            force_book_type: forcedBook || null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Distillation failed');

      // The edge function already saved — return the entry data for confirmation display
      setDistilled({
        book_type: data.book_type,
        chapter_suggestion: data.chapter_suggestion,
        title: data.entry.title,
        content: data.entry.content,
        transmission_seal: data.entry.transmission_seal,
      });
      setStep('done');
      onSaved?.(data.book_type);

    } catch (err: any) {
      toast({ title: 'Error sealing transmission', description: err.message, variant: 'destructive' });
      setStep('preview');
    }
  };

  const bookLabel = (type: 'life_book' | 'akashic_codex') =>
    type === 'life_book' ? 'Life Book' : 'Akashic Codex';

  const bookIcon = (type: 'life_book' | 'akashic_codex') =>
    type === 'life_book' ? <User size={14} /> : <BookOpen size={14} />;

  const truncated = rawResponse.length > 300
    ? rawResponse.slice(0, 300) + '...'
    : rawResponse;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-[40px] p-7 relative overflow-hidden"
        style={{
          background: 'rgba(10,10,10,0.98)',
          border: '1px solid rgba(212,175,55,0.15)',
          backdropFilter: 'blur(40px)',
        }}
      >
        {/* Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />

        <button onClick={onClose}
          className="absolute top-5 right-5 text-[rgba(255,255,255,0.3)] hover:text-white transition-colors">
          <X size={16} />
        </button>

        {/* ── STEP: PREVIEW ── */}
        {step === 'preview' && (
          <div className="space-y-5">
            <div>
              <p className="text-[#D4AF37] font-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', letterSpacing: '-0.03em' }}>
                ⟁ Seal in the Akashic Record
              </p>
              <p className="text-[rgba(255,255,255,0.4)] text-xs mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                This transmission will be distilled by the Akashic Curator and sealed into your personal book.
              </p>
            </div>

            {/* Preview of transmission */}
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[rgba(255,255,255,0.5)] text-xs leading-relaxed italic"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                "{truncated}"
              </p>
            </div>

            {/* Book choice */}
            <div>
              <p className="text-[rgba(255,255,255,0.3)] uppercase mb-2"
                style={{ fontSize: '8px', letterSpacing: '0.3em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
                Let the Curator decide, or choose:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => distill()}
                  className="col-span-3 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.9), rgba(212,175,55,0.6))',
                    color: '#050505',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    letterSpacing: '0.1em',
                  }}>
                  ⟁ AUTO-DISTILL & SEAL
                </button>

                <button onClick={() => distill('life_book')}
                  className="flex flex-col items-center gap-1 py-3 rounded-2xl text-[rgba(255,255,255,0.6)] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-all"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '10px' }}>
                  <User size={12} />
                  <span className="uppercase" style={{ letterSpacing: '0.1em', fontSize: '8px' }}>Life Book</span>
                </button>

                <button onClick={() => distill('akashic_codex')}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[rgba(212,175,55,0.7)] hover:text-[#D4AF37] border border-[rgba(212,175,55,0.15)] hover:border-[rgba(212,175,55,0.4)] transition-all"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '10px' }}>
                  <BookOpen size={12} />
                  <span className="uppercase" style={{ letterSpacing: '0.1em', fontSize: '8px' }}>Akashic Codex</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: DISTILLING ── */}
        {step === 'distilling' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <Loader size={20} className="text-[#D4AF37] animate-spin" />
              </div>
            </div>
            <p className="text-[#D4AF37] font-black text-center"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', letterSpacing: '-0.02em' }}>
              Akashic Curator is distilling...
            </p>
            <p className="text-[rgba(255,255,255,0.3)] text-xs text-center"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Classifying · Translating into sacred language · Generating transmission seal
            </p>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && distilled && (
          <div className="space-y-4">
            {/* Success */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                <Check size={16} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-white font-black"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', letterSpacing: '-0.02em' }}>
                  Sealed in the Akashic Record
                </p>
                <p className="text-[rgba(255,255,255,0.4)] text-xs"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Saved to your {bookLabel(distilled.book_type)} · {distilled.chapter_suggestion}
                </p>
              </div>
            </div>

            {/* Entry preview */}
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-center gap-2 text-[rgba(212,175,55,0.6)]"
                style={{ fontSize: '8px', letterSpacing: '0.25em', fontFamily: "'Plus Jakarta Sans', sans-serif', fontWeight: 800" }}>
                {bookIcon(distilled.book_type)}
                <span className="uppercase">{distilled.chapter_suggestion}</span>
              </div>
              <p className="text-white font-black"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', letterSpacing: '-0.02em' }}>
                {distilled.title}
              </p>
              <p className="text-[rgba(255,255,255,0.5)] text-xs leading-relaxed line-clamp-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {distilled.content}
              </p>
            </div>

            <button onClick={onClose}
              className="w-full py-3 rounded-2xl font-black text-xs"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.1em',
              }}>
              CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── The trigger button to embed in SQI/Apothecary chat ───────
export function SaveToBookButton({
  response,
  prompt,
}: {
  response: string;
  prompt?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <span className="flex items-center gap-1 text-[rgba(212,175,55,0.5)] cursor-default"
        style={{ fontSize: '10px', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.1em' }}>
        <Check size={10} /> SEALED IN AKASHA
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(212,175,55,0.25)] text-[rgba(212,175,55,0.6)] hover:text-[#D4AF37] hover:border-[rgba(212,175,55,0.5)] transition-all"
        style={{ fontSize: '9px', letterSpacing: '0.2em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
        title="Save this transmission to your Akashic book"
      >
        ⟁ SAVE TO BOOK
      </button>

      {open && (
        <SaveToBookModal
          rawResponse={response}
          rawPrompt={prompt}
          onClose={() => setOpen(false)}
          onSaved={() => { setSaved(true); setOpen(false); }}
        />
      )}
    </>
  );
}
