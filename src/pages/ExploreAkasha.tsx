import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Pause, Lock, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { getTierRank, hasFeatureAccess, getSalesPageForRank } from '@/lib/tierAccess';

interface Transmission {
  id: string;
  title: string;
  description: string | null;
  category: string;
  audio_url_en: string | null;
  audio_url_sv: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  required_tier: number;
  series_name: string | null;
  series_order: number | null;
  published: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  divine_transmissions: '🔱',
  oracle_talks: '🔮',
  nadi_series: '🌊',
  frequency_teachings: '🎵',
  siddha_wisdom: '📿',
  kundalini_talks: '🔥',
};

const fmtDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function ExploreAkasha() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const userRank = getTierRank(tier);

  const [items, setItems] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'sv'>('en');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase
        .from('divine_transmissions' as any)
        .select('*')
        .eq('published', true)
        .order('category')
        .order('series_order', { ascending: true })
        .order('created_at', { ascending: false }) as any);
      if (!error) setItems((data as Transmission[]) || []);
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Transmission[]>();
    items.forEach(t => {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    });
    return map;
  }, [items]);

  const canAccess = useCallback((t: Transmission): boolean => {
    if (t.is_free) return true;
    return hasFeatureAccess(isAdmin, tier, t.required_tier);
  }, [isAdmin, tier]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (progressInterval.current) clearInterval(progressInterval.current);
    setPlayingId(null);
    setProgress(0);
  }, []);

  const playAudio = useCallback((t: Transmission) => {
    if (!canAccess(t)) {
      if (!user) { navigate('/auth'); return; }
      navigate(getSalesPageForRank(t.required_tier));
      return;
    }

    if (playingId === t.id) { stopAudio(); return; }

    stopAudio();

    const url = lang === 'sv' && t.audio_url_sv ? t.audio_url_sv
      : t.audio_url_en ? t.audio_url_en
      : t.audio_url_sv;

    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(t.id);
    audio.play().catch(() => {});

    progressInterval.current = setInterval(() => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    }, 250);

    audio.addEventListener('ended', () => stopAudio());
  }, [playingId, lang, canAccess, stopAudio, user, navigate]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const gold = (a: number) => `rgba(212,175,55,${a})`;
  const white = (a: number) => `rgba(255,255,255,${a})`;

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 104 }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '52px 20px 0', animation: 'sqFadeUp 0.35s ease both' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: gold(0.5), cursor: 'pointer', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Montserrat',sans-serif", fontSize: 11, letterSpacing: '0.15em' }}>
          <ArrowLeft size={14} /> {t('exploreAkasha.back')}
        </button>
        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: gold(0.3), marginBottom: 6 }}>{t('exploreAkasha.headerMicro')}</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.1rem', fontWeight: 600, color: white(0.9), lineHeight: 1.1, margin: 0 }}>{t('exploreAkasha.title')}</h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.95rem', color: white(0.28), marginTop: 7 }}>{t('exploreAkasha.subtitle')}</p>
      </div>

      {/* ── LANGUAGE TOGGLE ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '20px 16px 4px', animation: 'sqFadeUp 0.4s 0.05s ease both' }}>
        {(['en', 'sv'] as const).map(l => (
          <button
            key={l}
            onClick={() => { stopAudio(); setLang(l); }}
            style={{
              fontFamily: "'Montserrat',sans-serif",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              border: `1px solid ${lang === l ? gold(0.5) : gold(0.12)}`,
              background: lang === l ? gold(0.1) : 'transparent',
              color: lang === l ? gold(0.85) : white(0.35),
              borderRadius: 30,
              padding: '6px 16px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Globe size={12} />
            {l === 'en' ? t('exploreAkasha.langEn') : t('exploreAkasha.langSv')}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${gold(0.15)}`, borderTopColor: gold(0.6), borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.1rem', color: white(0.3) }}>{t('exploreAkasha.archivePreparing')}</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([cat, catItems], ci) => (
          <div key={cat} style={{ animation: `sqFadeUp 0.4s ${0.1 + ci * 0.06}s ease both` }}>
            {/* Category header */}
            <div style={{ padding: '28px 20px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat] || '📖'}</span>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: gold(0.4) }}>
                {t(`exploreAkasha.cat_${cat}`, { defaultValue: cat })}
              </span>
            </div>

            {/* Vertical cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
              {catItems.map((item, i) => {
                const locked = !canAccess(item);
                const isPlaying = playingId === item.id;
                const hasLangAudio = lang === 'sv' ? !!item.audio_url_sv : !!item.audio_url_en;
                const fallbackAvailable = lang === 'sv' ? !!item.audio_url_en : !!item.audio_url_sv;

                return (
                  <div
                    key={item.id}
                    onClick={() => playAudio(item)}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      background: isPlaying
                        ? `linear-gradient(135deg,${gold(0.12)} 0%,${gold(0.04)} 100%)`
                        : `linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)`,
                      border: `1px solid ${isPlaying ? gold(0.35) : gold(0.1)}`,
                      borderRadius: 18,
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'stretch',
                      minHeight: 80,
                    }}
                  >
                    {/* Progress bar */}
                    {isPlaying && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0,
                        height: 2,
                        width: `${progress}%`,
                        background: `linear-gradient(90deg,${gold(0.8)},${gold(0.4)})`,
                        borderRadius: 1,
                        transition: 'width 0.25s linear',
                      }} />
                    )}

                    {/* Cover */}
                    <div style={{
                      width: 80, minHeight: 80, flexShrink: 0,
                      background: item.cover_image_url ? `url(${item.cover_image_url}) center/cover` : gold(0.06),
                      borderRadius: '18px 0 0 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {!item.cover_image_url && <span style={{ fontSize: 28, opacity: 0.5 }}>🔱</span>}
                      {locked && (
                        <div style={{
                          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                          borderRadius: '18px 0 0 18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Lock size={20} color={gold(0.6)} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 700, color: white(0.88), lineHeight: 1.3 }}>
                          {item.series_order != null && <span style={{ color: gold(0.6), marginRight: 4 }}>#{item.series_order}</span>}
                          {item.title}
                        </span>
                      </div>
                      {item.description && (
                        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.78rem', color: white(0.35), lineHeight: 1.4, margin: 0 }}>
                          {item.description.length > 80 ? item.description.slice(0, 80) + '...' : item.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 9, color: white(0.3) }}>{fmtDuration(item.duration_seconds)}</span>
                        {item.is_free && <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', background: 'rgba(80,200,120,0.15)', color: 'rgba(80,200,120,0.85)', padding: '1px 6px', borderRadius: 8 }}>{t('exploreAkasha.free')}</span>}
                        {!hasLangAudio && fallbackAvailable && (
                          <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, color: gold(0.4) }}>
                            {lang === 'sv' ? t('exploreAkasha.audioEnglishOnly') : t('exploreAkasha.audioSwedishOnly')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Play button */}
                    <div style={{ display: 'flex', alignItems: 'center', paddingRight: 14, flexShrink: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: isPlaying ? gold(0.2) : gold(0.08),
                        border: `1px solid ${isPlaying ? gold(0.5) : gold(0.2)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.25s ease',
                      }}>
                        {isPlaying
                          ? <Pause size={16} color={gold(0.9)} fill={gold(0.9)} />
                          : locked
                            ? <Lock size={14} color={gold(0.5)} />
                            : <Play size={16} color={gold(0.9)} fill={gold(0.9)} style={{ marginLeft: 2 }} />
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <style>{`
        @keyframes sqFadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
