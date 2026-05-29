import { useState, useEffect } from 'react';
import { BookOpen, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ADMIN_UUID = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';

export default function BooksV2DashboardWidget() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [codexCount, setCodexCount] = useState(0);
  const [lifeCount, setLifeCount]   = useState(0);
  const [codexRecent, setCodexRecent] = useState('');
  const [lifeRecent, setLifeRecent]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isAdmin = user.id === ADMIN_UUID;

      if (!isAdmin) {
        // Check tier
        const { data: profile } = await supabase
          .from('profiles')
          .select('membership_tier')
          .eq('id', user.id)
          .single();
        const tier = profile?.membership_tier?.toLowerCase() || '';
        const hasBooks = tier.includes('akasha') || tier.includes('infinity');
        if (!hasBooks) return; // Don't show widget for other tiers
      }

      setVisible(true);

      // Load MY entry counts only (RLS enforces user_id filter)
      const [{ count: cc, data: cd }, { count: lc, data: ld }] = await Promise.all([
        supabase.from('book_entries')
          .select('title', { count: 'exact' })
          .eq('book_type', 'akashic_codex')
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase.from('book_entries')
          .select('title', { count: 'exact' })
          .eq('book_type', 'life_book')
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      setCodexCount(cc || 0);
      setLifeCount(lc || 0);
      setCodexRecent(cd?.[0]?.title || '');
      setLifeRecent(ld?.[0]?.title || '');
      setLoading(false);
    };
    init();
  }, []);

  if (!visible) return null;

  return (
    <div className="mt-6">
      <p className="text-[rgba(255,255,255,0.3)] uppercase mb-3 px-1"
        style={{ fontSize: '8px', letterSpacing: '0.35em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
        ⟁ Your Living Books
      </p>

      <div className="grid grid-cols-2 gap-3">

        {/* Akashic Codex */}
        <button onClick={() => navigate('/akashic-codex-v2')}
          className="group relative rounded-[28px] p-4 text-left transition-all duration-300 hover:scale-[1.01] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,175,55,0.1)',
          }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[28px] pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.05) 0%, transparent 70%)' }} />

          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <BookOpen size={13} className="text-[#D4AF37]" />
          </div>

          <p className="text-white font-black leading-none"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', letterSpacing: '-0.02em' }}>
            Akashic Codex
          </p>
          <p className="text-[rgba(255,255,255,0.3)] uppercase mt-0.5"
            style={{ fontSize: '7px', letterSpacing: '0.2em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Universal Teachings
          </p>

          <p className="text-[#D4AF37] font-black mt-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', letterSpacing: '-0.04em' }}>
            {loading ? '—' : codexCount}
          </p>

          {codexRecent && (
            <p className="text-[rgba(255,255,255,0.3)] truncate mt-0.5"
              style={{ fontSize: '10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {codexRecent}
            </p>
          )}

          <ArrowRight size={12} className="absolute bottom-4 right-4 text-[rgba(212,175,55,0.3)] group-hover:text-[#D4AF37] transition-colors" />
        </button>

        {/* Life Book */}
        <button onClick={() => navigate('/life-book')}
          className="group relative rounded-[28px] p-4 text-left transition-all duration-300 hover:scale-[1.01] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[28px] pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />

          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <User size={13} className="text-[rgba(255,255,255,0.5)]" />
          </div>

          <p className="text-white font-black leading-none"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', letterSpacing: '-0.02em' }}>
            Life Book
          </p>
          <p className="text-[rgba(255,255,255,0.3)] uppercase mt-0.5"
            style={{ fontSize: '7px', letterSpacing: '0.2em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Personal Record
          </p>

          <p className="text-white font-black mt-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', letterSpacing: '-0.04em' }}>
            {loading ? '—' : lifeCount}
          </p>

          {lifeRecent && (
            <p className="text-[rgba(255,255,255,0.3)] truncate mt-0.5"
              style={{ fontSize: '10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {lifeRecent}
            </p>
          )}

          <ArrowRight size={12} className="absolute bottom-4 right-4 text-[rgba(255,255,255,0.2)] group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}
