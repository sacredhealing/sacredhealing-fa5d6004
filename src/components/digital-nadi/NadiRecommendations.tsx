/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  NADI RECOMMENDATIONS — SQI-2050                                 ║
 * ║  Live Supabase-connected audio recommendations for Digital Nāḍī  ║
 * ║  Drop into: src/components/digital-nadi/NadiRecommendations.tsx  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Queries: meditations, mantras, healing_audio, music_tracks
 * Player:  useMusicPlayer → playUniversalAudio / playTrack
 * Logic:   BPM + dosha → category/mood/energy filters → ranked results
 * UX:      Inline player stays inside Digital Nāḍī (no navigation)
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Play, Pause, Clock, Loader2, ExternalLink, RefreshCw, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMusicPlayer, UniversalAudioItem, type Track } from '@/contexts/MusicPlayerContext';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

type Dosha = 'Pitta' | 'Kapha' | 'Vāta' | 'Balanced';

type NadiCategory = 'meditation' | 'mantra' | 'healing' | 'music';

interface NadiTrack {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  audio_url: string;
  shc_reward: number;
  category: NadiCategory;
  // For music tracks
  artist?: string;
  full_audio_url?: string;
  preview_url?: string;
  genre?: string;
  bpm?: number | null;
  mood?: string | null;
  energy_level?: string | null;
  best_time_of_day?: string | null;
  spiritual_path?: string | null;
  /** Row from `music_tracks` for `playTrack` */
  _rawTrack?: Track;
}

interface Props {
  bpm: number | null;
  hrv: number | null;
  dosha: Dosha;
  stress: number; // 0–100
}

// ─── Dosha → Query Config ─────────────────────────────────────────────────────

function getDoshaConfig(dosha: Dosha, stress: number, _bpm: number | null) {
  // Returns filter hints per table
  const highStress = stress > 60;
  const midStress = stress > 35;

  const configs: Record<NadiCategory, {
    limit: number;
    meditationCategories?: string[];
    mantraCategories?: string[];
    healingCategories?: string[];
    musicMoods?: string[];
    musicEnergyLevels?: string[];
    musicBestTime: string;
    sectionLabel: string;
    sectionReason: string;
    color: string;
    icon: string;
  }> = {
    meditation: {
      limit: 3,
      meditationCategories: highStress
        ? ['Healing', 'Relaxation', 'Stress', 'Sleep', 'Yoga Nidra']
        : midStress
        ? ['Mindfulness', 'Healing', 'Relaxation', 'Breathing']
        : ['Manifestation', 'Spiritual', 'Chakra', 'Mindfulness'],
      sectionLabel: 'Dhyāna · Meditation',
      sectionReason: highStress
        ? 'Deep rest for your nervous system'
        : midStress
        ? 'Balance and centre your mind'
        : 'Deepen your stillness',
      color: '#B084FF',
      icon: '◎',
    },
    mantra: {
      limit: 3,
      mantraCategories: dosha === 'Pitta'
        ? ['Cooling', 'Peace', 'Shiva', 'Moon']
        : dosha === 'Kapha'
        ? ['Energising', 'Fire', 'Sun', 'Activation']
        : dosha === 'Vāta'
        ? ['Grounding', 'Earth', 'Root', 'Stability']
        : ['Universal', 'OM', 'Heart', 'Love'],
      sectionLabel: 'Mantra · Sacred Sound',
      sectionReason: dosha === 'Pitta'
        ? 'Cooling vibrations to pacify inner fire'
        : dosha === 'Kapha'
        ? 'Activating frequencies to awaken your fire'
        : dosha === 'Vāta'
        ? 'Grounding tones to anchor scattered energy'
        : 'Harmonising vibrations for your natural state',
      color: '#FFB84A',
      icon: 'ॐ',
    },
    healing: {
      limit: 3,
      healingCategories: highStress
        ? ['Stress', 'Anxiety', 'Nervous System', 'Relaxation', '432Hz', 'Sleep']
        : dosha === 'Pitta'
        ? ['Cooling', 'Heart', 'Anti-inflammatory', 'Peace']
        : dosha === 'Kapha'
        ? ['Energy', 'Motivation', 'Lymphatic', 'Activation']
        : dosha === 'Vāta'
        ? ['Grounding', 'Nervous System', 'Root', 'Stability']
        : ['Balance', 'Chakra', 'DNA', 'Frequency'],
      sectionLabel: 'Healing Audio · Scalar Waves',
      sectionReason: highStress
        ? 'Restore your bioenergetic field'
        : 'Fine-tune your frequency today',
      color: '#5AE4A8',
      icon: '∿',
    },
    music: {
      limit: 3,
      musicMoods: highStress
        ? ['calm', 'peaceful', 'soothing', 'relaxing']
        : midStress
        ? ['uplifting', 'balanced', 'meditative']
        : ['joyful', 'devotional', 'blissful', 'uplifting'],
      musicEnergyLevels: highStress ? ['low', 'gentle'] : midStress ? ['medium', 'gentle'] : ['medium', 'high'],
      musicBestTime: getBestTime(),
      sectionLabel: 'Sacred Music · Nāda Yoga',
      sectionReason: 'Resonant frequencies aligned to your pulse',
      color: '#FF6B4A',
      icon: '♪',
    },
  };

  return configs;
}

function getBestTime(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'night';
  if (hour < 10) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`;
}

// ─── Supabase Fetchers ────────────────────────────────────────────────────────

async function fetchMeditations(categories: string[], limit: number): Promise<NadiTrack[]> {
  try {
    const { data, error } = await supabase
      .from('meditations')
      .select('id, title, description, cover_image_url, duration_minutes, audio_url, shc_reward, category, language')
      .eq('language', 'en')
      .limit(limit * 4); // fetch more, filter client-side

    if (error || !data) return [];

    // Score by category match
    const scored = data.map(m => {
      const catLower = (m.category || '').toLowerCase();
      const score = categories.some(c => catLower.includes(c.toLowerCase())) ? 2 : 1;
      return { ...m, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);

    return scored.slice(0, limit).map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      cover_image_url: m.cover_image_url,
      duration_seconds: (m.duration_minutes || 0) * 60,
      audio_url: m.audio_url,
      shc_reward: m.shc_reward || 0,
      category: 'meditation' as NadiCategory,
    }));
  } catch {
    return [];
  }
}

async function fetchMantras(categories: string[], limit: number): Promise<NadiTrack[]> {
  try {
    const { data, error } = await supabase
      .from('mantras')
      .select('id, title, description, cover_image_url, duration_seconds, audio_url, shc_reward, category, is_active')
      .eq('is_active', true)
      .limit(limit * 4);

    if (error || !data) return [];

    const scored = data.map(m => {
      const catLower = (m.category || '').toLowerCase();
      const score = categories.some(c => catLower.includes(c.toLowerCase())) ? 2 : 1;
      return { ...m, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);

    return scored.slice(0, limit).map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      cover_image_url: m.cover_image_url,
      duration_seconds: m.duration_seconds || 0,
      audio_url: m.audio_url,
      shc_reward: m.shc_reward || 0,
      category: 'mantra' as NadiCategory,
    }));
  } catch {
    return [];
  }
}

async function fetchHealingAudios(categories: string[], limit: number): Promise<NadiTrack[]> {
  try {
    const { data, error } = await supabase
      .from('healing_audio')
      .select('id, title, description, cover_image_url, duration_seconds, audio_url, price_shc, category, tags, is_free')
      .limit(limit * 4);

    if (error || !data) return [];

    const scored = data.map(m => {
      const catLower = (m.category || '').toLowerCase();
      const tagsLower = (m.tags || []).map((t: string) => t.toLowerCase());
      const catMatch = categories.some(c => catLower.includes(c.toLowerCase()));
      const tagMatch = categories.some(c =>
        tagsLower.some((t: string) => t.includes(c.toLowerCase()))
      );
      const score = catMatch ? 3 : tagMatch ? 2 : 1;
      return { ...m, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);

    return scored.slice(0, limit).map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      cover_image_url: m.cover_image_url,
      duration_seconds: m.duration_seconds || 0,
      audio_url: m.audio_url,
      shc_reward: m.price_shc || 0,
      category: 'healing' as NadiCategory,
    }));
  } catch {
    return [];
  }
}

async function fetchMusicTracks(
  moods: string[],
  energyLevels: string[],
  bestTime: string,
  limit: number
): Promise<NadiTrack[]> {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('id, title, artist, description, cover_image_url, duration_seconds, full_audio_url, preview_url, shc_reward, genre, bpm, mood, energy_level, best_time_of_day, spiritual_path, price_usd, play_count, release_date, created_at, affirmation, creator_notes, spiritual_description, auto_generated_description, auto_generated_affirmation, analysis_status, intended_use, rhythm_type, vocal_type, frequency_band')
      .limit(limit * 4);

    if (error || !data) return [];

    const scored = data.map(t => {
      const moodLower = (t.mood || '').toLowerCase();
      const energyLower = (t.energy_level || '').toLowerCase();
      const timeLower = (t.best_time_of_day || '').toLowerCase();
      const moodScore = moods.some(m => moodLower.includes(m)) ? 3 : 0;
      const energyScore = energyLevels.some(e => energyLower.includes(e)) ? 2 : 0;
      const timeScore = timeLower.includes(bestTime) ? 2 : 0;
      return { ...t, _score: moodScore + energyScore + timeScore };
    });

    scored.sort((a, b) => b._score - a._score);

    return scored.slice(0, limit).map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || t.spiritual_description || t.auto_generated_description,
      cover_image_url: t.cover_image_url,
      duration_seconds: t.duration_seconds || 0,
      audio_url: t.full_audio_url,
      shc_reward: t.shc_reward || 0,
      category: 'music' as NadiCategory,
      artist: t.artist,
      full_audio_url: t.full_audio_url,
      preview_url: t.preview_url,
      genre: t.genre,
      bpm: t.bpm,
      mood: t.mood,
      energy_level: t.energy_level,
      best_time_of_day: t.best_time_of_day,
      spiritual_path: t.spiritual_path,
      _rawTrack: t,
    }));
  } catch {
    return [];
  }
}

// ─── Section Component ────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  track: NadiTrack;
  color: string;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
  onNavigate: () => void;
  navigatePath: string;
}> = ({ track, color, isPlaying, isCurrentTrack, onPlay, onNavigate, navigatePath }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: isCurrentTrack
          ? `${color}0f`
          : 'rgba(255,255,255,0.015)',
        border: `1px solid ${isCurrentTrack ? color + '30' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 16,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Active glow line */}
      {isCurrentTrack && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: `linear-gradient(180deg, ${color}88, ${color}22)`,
          borderRadius: '3px 0 0 3px',
        }} />
      )}

      {/* Cover */}
      <div
        style={{
          width: 46, height: 46, borderRadius: 10, flexShrink: 0,
          background: `${color}18`,
          border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}
        onClick={onPlay}
      >
        {track.cover_image_url ? (
          <img
            src={track.cover_image_url}
            alt={track.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
          />
        ) : (
          <span style={{ fontSize: 18, color }}>{
            track.category === 'meditation' ? '◎'
            : track.category === 'mantra' ? 'ॐ'
            : track.category === 'healing' ? '∿'
            : '♪'
          }</span>
        )}
        {/* Play overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isCurrentTrack ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
          className="track-play-overlay"
        >
          {isPlaying && isCurrentTrack
            ? <Pause size={16} color="#fff" fill="#fff" />
            : <Play size={16} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
          }
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={onPlay}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700, fontSize: 13,
          color: isCurrentTrack ? '#fff' : 'rgba(255,255,255,0.85)',
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {track.title}
        </p>
        {track.artist && (
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11, color: 'rgba(255,255,255,0.35)',
            margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {track.artist}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Clock size={10} color={color} style={{ opacity: 0.6 }} />
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          }}>
            {formatDuration(track.duration_seconds)}
          </span>
          {isCurrentTrack && isPlaying && (
            <span style={{
              display: 'flex', gap: 2, alignItems: 'flex-end', height: 12,
            }}>
              {[1,2,3].map(i => (
                <span key={i} style={{
                  width: 2, borderRadius: 1,
                  background: color,
                  height: `${6 + i * 2}px`,
                  animation: `nadi-bar-${i} 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                  display: 'inline-block',
                }} />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Play button + navigate */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={onPlay}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: isCurrentTrack ? color : `${color}18`,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {isPlaying && isCurrentTrack
            ? <Pause size={13} color={isCurrentTrack ? '#050505' : color} fill={isCurrentTrack ? '#050505' : color} />
            : <Play size={13} color={isCurrentTrack ? '#050505' : color} fill={isCurrentTrack ? '#050505' : color} style={{ marginLeft: 2 }} />
          }
        </button>
        <button
          onClick={onNavigate}
          title={`Open in ${navigatePath.replace('/', '')}`}
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ExternalLink size={10} color="rgba(255,255,255,0.3)" />
        </button>
      </div>
    </div>
  );
};

// ─── Section Group ────────────────────────────────────────────────────────────

const NadiSection: React.FC<{
  icon: string;
  label: string;
  reason: string;
  color: string;
  tracks: NadiTrack[];
  loading: boolean;
  currentAudioId: string | null;
  isPlaying: boolean;
  onPlay: (track: NadiTrack) => void;
  navigatePath: string;
  onNavigate: (path: string) => void;
}> = ({ icon, label, reason, color, tracks, loading, currentAudioId, isPlaying, onPlay, navigatePath, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      padding: '18px 20px',
      background: 'rgba(255,255,255,0.015)',
      border: `1px solid rgba(255,255,255,0.04)`,
      borderRadius: 24,
      marginBottom: 12,
    }}>
      {/* Section header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: expanded || loading ? 16 : 0, cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ fontSize: 20, color, filter: `drop-shadow(0 0 8px ${color}66)` }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9, fontWeight: 800, letterSpacing: '0.35em',
            textTransform: 'uppercase', color: color + 'cc',
            margin: 0, marginBottom: 2,
          }}>{label}</p>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12, fontWeight: 400, lineHeight: 1.5,
            color: 'rgba(255,255,255,0.45)', margin: 0,
          }}>{reason}</p>
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.3s',
        }}>▾</div>
      </div>

      {/* Tracks — show first one always when loaded, rest on expand */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
          <Loader2 size={14} color={color} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Scanning Akasha Archive…
          </span>
        </div>
      ) : tracks.length === 0 ? (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
          No transmissions found — more content arriving soon.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Always show first track */}
          <SectionCard
            track={tracks[0]}
            color={color}
            isCurrentTrack={currentAudioId === tracks[0].id}
            isPlaying={isPlaying && currentAudioId === tracks[0].id}
            onPlay={() => onPlay(tracks[0])}
            onNavigate={() => onNavigate(navigatePath)}
            navigatePath={navigatePath}
          />
          {/* Expand button if more tracks */}
          {tracks.length > 1 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 800, letterSpacing: '0.25em',
                textTransform: 'uppercase', color: color + '88',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 0', textAlign: 'left',
              }}
            >
              + {tracks.length - 1} more transmissions
            </button>
          )}
          {/* Remaining tracks */}
          {expanded && tracks.slice(1).map(t => (
            <SectionCard
              key={t.id}
              track={t}
              color={color}
              isCurrentTrack={currentAudioId === t.id}
              isPlaying={isPlaying && currentAudioId === t.id}
              onPlay={() => onPlay(t)}
              onNavigate={() => onNavigate(navigatePath)}
              navigatePath={navigatePath}
            />
          ))}
          {/* Navigate to full page */}
          <button
            onClick={() => onNavigate(navigatePath)}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10, fontWeight: 800, letterSpacing: '0.25em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 0', textAlign: 'left', display: 'flex',
              alignItems: 'center', gap: 4, marginTop: 2,
            }}
          >
            <ExternalLink size={10} /> Open full {navigatePath.replace('/', '')} library
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const NadiRecommendations: React.FC<Props> = ({ bpm, hrv: _hrv, dosha, stress }) => {
  const { playUniversalAudio, playTrack, currentAudio, currentTrack, isPlaying, stopTrack } = useMusicPlayer();
  const navigate = useNavigate();

  const [meditations, setMeditations] = useState<NadiTrack[]>([]);
  const [mantras, setMantras] = useState<NadiTrack[]>([]);
  const [healingAudios, setHealingAudios] = useState<NadiTrack[]>([]);
  const [musicTracks, setMusicTracks] = useState<NadiTrack[]>([]);

  const [loadingMed, setLoadingMed] = useState(true);
  const [loadingMan, setLoadingMan] = useState(true);
  const [loadingHeal, setLoadingHeal] = useState(true);
  const [loadingMusic, setLoadingMusic] = useState(true);

  const config = useMemo(() => getDoshaConfig(dosha, stress, bpm), [dosha, stress, bpm]);

  const loadAll = useCallback(async () => {
    setLoadingMed(true); setLoadingMan(true);
    setLoadingHeal(true); setLoadingMusic(true);

    // Parallel fetch all 4 tables
    const [meds, mans, heals, music] = await Promise.all([
      fetchMeditations(config.meditation.meditationCategories!, config.meditation.limit),
      fetchMantras(config.mantra.mantraCategories!, config.mantra.limit),
      fetchHealingAudios(config.healing.healingCategories!, config.healing.limit),
      fetchMusicTracks(
        config.music.musicMoods!,
        config.music.musicEnergyLevels!,
        config.music.musicBestTime,
        config.music.limit
      ),
    ]);

    setMeditations(meds); setLoadingMed(false);
    setMantras(mans); setLoadingMan(false);
    setHealingAudios(heals); setLoadingHeal(false);
    setMusicTracks(music); setLoadingMusic(false);
  }, [config]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Current playing ID (works for both universal audio and music tracks)
  const currentPlayingId = currentAudio?.id || currentTrack?.id || null;

  const handlePlay = useCallback((track: NadiTrack) => {
    if (track.category === 'music' && track._rawTrack) {
      playTrack(track._rawTrack as Track);
    } else {
      // Use playUniversalAudio for meditation/mantra/healing
      const contentType =
        track.category === 'meditation' ? 'meditation'
        : track.category === 'healing' ? 'healing'
        : 'meditation'; // mantras use meditation type for SHC logic

      const universalItem: UniversalAudioItem = {
        id: track.id,
        title: track.title,
        artist: track.artist || 'Sacred Healing',
        audio_url: track.audio_url,
        preview_url: null,
        cover_image_url: track.cover_image_url,
        duration_seconds: track.duration_seconds,
        shc_reward: track.shc_reward,
        contentType,
        originalData: track,
      };
      playUniversalAudio(universalItem);
    }
  }, [playTrack, playUniversalAudio]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // ─── Ordered sections by dosha priority ─────────────────────────────────
  const SECTION_ORDER: Array<{
    key: NadiCategory;
    tracks: NadiTrack[];
    loading: boolean;
    navigatePath: string;
  }> = dosha === 'Pitta'
    ? [
        { key: 'mantra', tracks: mantras, loading: loadingMan, navigatePath: '/mantras' },
        { key: 'healing', tracks: healingAudios, loading: loadingHeal, navigatePath: '/healing' },
        { key: 'meditation', tracks: meditations, loading: loadingMed, navigatePath: '/meditations' },
        { key: 'music', tracks: musicTracks, loading: loadingMusic, navigatePath: '/music' },
      ]
    : dosha === 'Kapha'
    ? [
        { key: 'music', tracks: musicTracks, loading: loadingMusic, navigatePath: '/music' },
        { key: 'mantra', tracks: mantras, loading: loadingMan, navigatePath: '/mantras' },
        { key: 'healing', tracks: healingAudios, loading: loadingHeal, navigatePath: '/healing' },
        { key: 'meditation', tracks: meditations, loading: loadingMed, navigatePath: '/meditations' },
      ]
    : stress > 60
    ? [
        { key: 'healing', tracks: healingAudios, loading: loadingHeal, navigatePath: '/healing' },
        { key: 'meditation', tracks: meditations, loading: loadingMed, navigatePath: '/meditations' },
        { key: 'mantra', tracks: mantras, loading: loadingMan, navigatePath: '/mantras' },
        { key: 'music', tracks: musicTracks, loading: loadingMusic, navigatePath: '/music' },
      ]
    : [
        { key: 'meditation', tracks: meditations, loading: loadingMed, navigatePath: '/meditations' },
        { key: 'mantra', tracks: mantras, loading: loadingMan, navigatePath: '/mantras' },
        { key: 'healing', tracks: healingAudios, loading: loadingHeal, navigatePath: '/healing' },
        { key: 'music', tracks: musicTracks, loading: loadingMusic, navigatePath: '/music' },
      ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes nadi-bar-1 { from { height: 4px; } to { height: 10px; } }
        @keyframes nadi-bar-2 { from { height: 7px; } to { height: 14px; } }
        @keyframes nadi-bar-3 { from { height: 3px; } to { height: 8px; } }
        .track-play-overlay { opacity: 0 !important; }
        div:hover > .track-play-overlay { opacity: 1 !important; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9, fontWeight: 800, letterSpacing: '0.4em',
            textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)',
            margin: 0, marginBottom: 4,
          }}>
            Akasha-Neural Recommendations
          </p>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13, color: 'rgba(255,255,255,0.55)',
            margin: 0, lineHeight: 1.5,
          }}>
            Curated from your live Nāḍī reading
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(currentAudio || currentTrack) && (
            <button
              type="button"
              onClick={() => stopTrack()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(248,113,113,0.95)',
              }}
              title="Stop playback and clear the player"
            >
              <Square size={10} fill="currentColor" />
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={loadAll}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Refresh recommendations"
          >
            <RefreshCw size={13} color="rgba(212,175,55,0.5)" />
          </button>
        </div>
      </div>

      {/* Sections */}
      {SECTION_ORDER.map(({ key, tracks, loading, navigatePath }) => {
        const cfg = config[key];
        return (
          <NadiSection
            key={key}
            icon={cfg.icon}
            label={cfg.sectionLabel}
            reason={cfg.sectionReason}
            color={cfg.color}
            tracks={tracks}
            loading={loading}
            currentAudioId={currentPlayingId}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            navigatePath={navigatePath}
            onNavigate={handleNavigate}
          />
        );
      })}
    </div>
  );
};
