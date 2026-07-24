import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';

// XHR (not fetch) is what gives us real upload progress — the supabase-js SDK's
// .upload() is fetch-based under the hood and exposes no progress at all, which
// is why a large file just sat on "Uploading…" with zero feedback before.
function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  accessToken: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || 'unknown error'}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload — check your connection and try again'));
    xhr.send(file);
  });
}

// Safety valve: a plain single-request upload (progress bar or not) is still
// not resumable — a dropped connection at 95% means starting over. Large
// video files should be compressed first; this is a soft warning, not a hard
// block, since some admins may have a fast enough connection to push through.
const LARGE_FILE_WARNING_BYTES = 300 * 1024 * 1024; // 300MB

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

interface VaultItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  price_cents: number;
  currency: string;
  tier_required: string;
  is_published: boolean;
  created_at: string;
  thumbnail_url: string | null;
  room_id: string | null;
}

interface RoomOption {
  id: string;
  name: string;
}

const TIER_OPTIONS = [
  { value: '', label: 'Never free — purchase only' },
  { value: 'free', label: 'Free tier and up' },
  { value: 'prana-flow', label: 'Prana-Flow and up' },
  { value: 'siddha-quantum', label: 'Siddha-Quantum and up' },
  { value: 'akasha-infinity', label: 'Akasha-Infinity only' },
];

// Where each category actually lives. 'song' and 'beat' go to the existing
// Music Store (music_tracks, its own purchase flow via purchase-music /
// music_purchases). 'meditation' goes to the existing Meditations page.
// 'healing' goes to the existing Healing Blessings page. Only 'video' has no
// existing home, so it's the one category that stays on Content Vault's own
// content_vault table + purchase flow + drop card.
type Destination = 'music_tracks' | 'meditations' | 'healing_audio' | 'divine_transmissions' | 'mantras' | 'content_vault';

const CATEGORY_CONFIG: Record<string, { label: string; destination: Destination; genre?: string }> = {
  song: { label: 'Song', destination: 'music_tracks', genre: 'devotional' },
  beat: { label: 'Beat', destination: 'music_tracks', genre: 'beat' },
  'instrumental-meditation': { label: 'Instrumental Meditation Music', destination: 'music_tracks', genre: 'instrumental' },
  meditation: { label: 'Meditation', destination: 'meditations' },
  healing: { label: 'Healing Audio (Sonic Treatments)', destination: 'healing_audio' },
  'divine-transmission': { label: 'Divine Transmission', destination: 'divine_transmissions' },
  mantra: { label: 'Mantra', destination: 'mantras' },
  video: { label: 'Video', destination: 'content_vault' },
};
const CATEGORIES = Object.keys(CATEGORY_CONFIG);

// divine_transmissions.required_tier AND mantras.required_tier are both plain
// numbers (0-3), not the text slug used everywhere else in this form.
const TIER_SLUG_TO_RANK: Record<string, number> = {
  '': 3, free: 0, 'prana-flow': 1, 'siddha-quantum': 2, 'akasha-infinity': 3,
};

export default function AdminContentVault() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<VaultItem[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('meditation');
  const [priceEuros, setPriceEuros] = useState('11');
  const [tierRequired, setTierRequired] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [useYoutubeEmbed, setUseYoutubeEmbed] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // The ONLY channels that actually exist in the visible Nexus UI — mirrors
  // Community.tsx's CHANNELS list exactly. chat_rooms has other rows (test
  // duplicates, dead aliases like "Community Lounge", old circle names) that
  // are never shown to members anywhere; this keeps the picker to just these 8.
  const VISIBLE_CHANNELS = [
    { id: 'divine-sangha', name: 'Divine Sangha' },
    { id: 'bhagavad-gita', name: 'Bhagavad Gita' },
    { id: 'sacred-mantras', name: 'Sacred Mantras' },
    { id: 'healing-circle', name: 'Healing Blessings' },
    { id: 'siddha-masters', name: 'Siddha Masters' },
    { id: 'bhakti-algorithm-lab', name: 'Bhakti Algorithm Lab' },
    { id: 'stargate', name: 'Stargate' },
    { id: 'sadhana', name: 'Sadhana' },
  ];

  const fetchAll = async () => {
    setIsLoading(true);
    const [{ data: vaultData }, { data: allRooms }] = await Promise.all([
      (supabase as any)
        .from('content_vault')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('chat_rooms').select('id, name, type').eq('is_active', true),
    ]);
    setItems((vaultData as VaultItem[]) || []);

    // Same name-matching rules as Community.tsx's room resolution, so this
    // picker can never show a room the real chat UI wouldn't also resolve.
    const resolved: RoomOption[] = [];
    (allRooms || []).forEach((room: any) => {
      const matched = VISIBLE_CHANNELS.find((ch) => ch.name === room.name);
      if (matched && !resolved.find((r) => r.id === matched.id)) {
        resolved.push({ id: room.id, name: matched.name });
      } else if (room.type === 'sadhana' && !resolved.find((r) => r.id === 'sadhana')) {
        resolved.push({ id: room.id, name: 'Sadhana' });
      } else if (room.type === 'stargate' && !resolved.find((r) => r.id === 'stargate')) {
        resolved.push({ id: room.id, name: 'Stargate' });
      } else if (room.name?.includes('Divine Sangha') && !resolved.find((r) => r.name === 'Divine Sangha')) {
        resolved.push({ id: room.id, name: 'Divine Sangha' });
      } else if (room.name?.includes('Sacred Mantra') && !resolved.find((r) => r.name === 'Sacred Mantras')) {
        resolved.push({ id: room.id, name: 'Sacred Mantras' });
      } else if (room.name?.includes('Healing') && !resolved.find((r) => r.name === 'Healing Blessings')) {
        resolved.push({ id: room.id, name: 'Healing Blessings' });
      }
    });
    setRooms(resolved);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('meditation');
    setPriceEuros('11');
    setTierRequired('');
    setDurationSeconds('');
    setRoomId('');
    setMediaFile(null);
    setThumbnailFile(null);
    setYoutubeUrl('');
    setUseYoutubeEmbed(false);
  };

  const handleUploadAndPublish = async (publishToChat: boolean) => {
    if (!user) return;
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    const youtubeId = useYoutubeEmbed ? extractYoutubeId(youtubeUrl) : null;
    if (useYoutubeEmbed && !youtubeId) {
      toast({ title: "Couldn't read a video ID from that URL", variant: 'destructive' });
      return;
    }
    if (!useYoutubeEmbed && !mediaFile) {
      toast({ title: 'Select the media file first', variant: 'destructive' });
      return;
    }
    if (publishToChat && !roomId) {
      toast({ title: 'Pick a room to post the drop in', variant: 'destructive' });
      return;
    }
    if (!useYoutubeEmbed && mediaFile && mediaFile.size > LARGE_FILE_WARNING_BYTES) {
      const proceed = window.confirm(
        `That file is ${(mediaFile.size / (1024 * 1024)).toFixed(0)}MB. This upload isn't resumable — if your connection drops partway, you'll need to start over. Compress it smaller if you can. Continue anyway?`
      );
      if (!proceed) return;
    }

    const config = CATEGORY_CONFIG[category];

    setIsSaving(true);
    setUploadProgress(0);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Not signed in');

      let mediaPath = '';
      let bucket = '';
      let thumbnailUrl: string | null = null;

      if (!useYoutubeEmbed && mediaFile) {
        const ext = mediaFile.name.split('.').pop();
        const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

        // Music goes to the same public 'songs' bucket AdminMusic.tsx already uses,
        // so it's playable the exact same way the Music Store already plays tracks.
        // Everything else uses the private content-vault bucket (signed-URL only).
        bucket =
          config.destination === 'music_tracks' ? 'songs' :
          config.destination === 'divine_transmissions' || config.destination === 'mantras' ? 'audio' :
          'content-vault';
        mediaPath =
          config.destination === 'music_tracks' || config.destination === 'divine_transmissions' || config.destination === 'mantras'
            ? uniqueName
            : `${user.id}/${uniqueName}`;

        await uploadWithProgress(bucket, mediaPath, mediaFile, accessToken, setUploadProgress);
      }
      // YouTube embed mode: no file to upload, nothing to store — only the
      // video ID gets saved (in the insert branch below), used to build the
      // official YouTube embed URL. The video itself always stays hosted on
      // YouTube; nothing is downloaded or re-hosted.

      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split('.').pop();
        const thumbPath = `${user.id}/thumb-${crypto.randomUUID()}.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from('chat-storage')
          .upload(thumbPath, thumbnailFile, { upsert: false });
        if (thumbError) throw thumbError;
        const { data: pub } = supabase.storage.from('chat-storage').getPublicUrl(thumbPath);
        thumbnailUrl = pub.publicUrl;
      }

      let deepLink = '';
      let contentIdForChat: string | null = null;
      let isLockedDrop = false;

      if (config.destination === 'music_tracks') {
        const fullUrl = supabase.storage.from('songs').getPublicUrl(mediaPath).data.publicUrl;
        const { error: insertError } = await supabase.from('music_tracks').insert({
          title: title.trim(),
          artist: 'Sacred Healing',
          description: description.trim() || null,
          genre: config.genre || 'devotional',
          duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : 0,
          preview_url: fullUrl,
          full_audio_url: fullUrl,
          cover_image_url: thumbnailUrl,
          price_usd: parseFloat(priceEuros || '0'),
          bpm: null,
          shc_reward: 5,
          analysis_status: 'pending',
          auto_analysis_data: { access_tier: tierRequired || 'free' },
        } as any);
        if (insertError) throw insertError;
        deepLink = '/music';
      } else if (config.destination === 'meditations') {
        const publicUrl = supabase.storage.from('content-vault').getPublicUrl(mediaPath).data.publicUrl;
        const { error: insertError } = await supabase.from('meditations').insert({
          title: title.trim(),
          description: description.trim() || null,
          audio_url: publicUrl,
          duration_minutes: durationSeconds ? Math.round(parseInt(durationSeconds, 10) / 60) : 10,
          category: 'general',
          is_premium: tierRequired !== '' && tierRequired !== 'free',
          shc_reward: 5,
          language: 'en',
        } as any);
        if (insertError) throw insertError;
        deepLink = '/meditations';
      } else if (config.destination === 'healing_audio') {
        const publicUrl = supabase.storage.from('content-vault').getPublicUrl(mediaPath).data.publicUrl;
        const { error: insertError } = await supabase.from('healing_audio').insert({
          title: title.trim(),
          description: description.trim() || null,
          audio_url: publicUrl,
          preview_url: null,
          duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : 0,
          is_free: !tierRequired || tierRequired === 'free',
          required_tier: tierRequired || 'free',
          price_usd: parseFloat(priceEuros || '0'),
          price_shc: 0,
          category: 'general',
          script_text: null,
          language: 'en',
        } as any);
        if (insertError) throw insertError;
        deepLink = '/healing';
      } else if (config.destination === 'divine_transmissions') {
        const publicUrl = supabase.storage.from('audio').getPublicUrl(mediaPath).data.publicUrl;
        const rank = TIER_SLUG_TO_RANK[tierRequired] ?? 3;
        const { error: insertError } = await (supabase.from('divine_transmissions' as any).insert({
          title: title.trim(),
          description: description.trim() || null,
          category: 'general',
          audio_url_en: publicUrl,
          audio_url_sv: null,
          content_type: 'audio',
          video_url_en: null,
          video_url_sv: null,
          price_usd: parseFloat(priceEuros || '0') || null,
          cover_image_url: thumbnailUrl,
          duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : 0,
          is_free: !tierRequired || tierRequired === 'free',
          required_tier: rank,
          series_name: null,
          series_order: null,
          published: true,
        }) as any);
        if (insertError) throw insertError;
        deepLink = '/explore-akasha';
      } else if (config.destination === 'mantras') {
        const publicUrl = supabase.storage.from('audio').getPublicUrl(mediaPath).data.publicUrl;
        const rank = TIER_SLUG_TO_RANK[tierRequired] ?? 3;
        const { error: insertError } = await (supabase.from('mantras' as any).insert({
          title: title.trim(),
          description: description.trim() || null,
          audio_url: publicUrl,
          cover_image_url: thumbnailUrl,
          duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : 180,
          shc_reward: 111,
          is_active: true,
          is_premium: !!tierRequired && tierRequired !== 'free',
          required_tier: rank,
          category: 'general',
          planet_type: null,
          price_usd: parseFloat(priceEuros || '0') || 0,
        }) as any);
        if (insertError) throw insertError;
        deepLink = '/mantras';
      } else {
        // video — no existing home, stays on Content Vault's own table + purchase flow
        const { data: inserted, error: insertError } = await (supabase as any)
          .from('content_vault')
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            content_type: 'video',
            storage_path: useYoutubeEmbed ? '' : mediaPath,
            thumbnail_url: thumbnailUrl,
            duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
            price_cents: Math.round(parseFloat(priceEuros || '0') * 100),
            currency: 'eur',
            tier_required: tierRequired || 'free',
            is_published: true,
            owner_id: user.id,
            metadata: useYoutubeEmbed ? { category, source: 'youtube', youtube_id: youtubeId } : { category },
          })
          .select()
          .single();
        if (insertError) throw insertError;
        contentIdForChat = inserted.id;
        isLockedDrop = true;
        deepLink = '/videos';
      }

      if (publishToChat) {
        if (isLockedDrop && contentIdForChat) {
          const { error: msgError } = await (supabase as any).from('chat_messages').insert({
            room_id: roomId,
            user_id: user.id,
            content: title.trim(),
            message_type: 'content_drop',
            content_id: contentIdForChat,
          });
          if (msgError) throw msgError;
        } else {
          // Already purchasable/playable on its own native page (Music/Meditations/
          // Healing) with that page's own existing flow — chat gets a plain
          // announcement pointing there, not a second parallel unlock mechanism.
          const { error: msgError } = await (supabase as any).from('chat_messages').insert({
            room_id: roomId,
            user_id: user.id,
            content: `🎁 New ${config.label.toLowerCase()} added — "${title.trim()}". Find it on ${deepLink === '/music' ? 'the Music page' : deepLink === '/meditations' ? 'the Meditations page' : deepLink === '/healing' ? 'Sonic Treatments on the Healing page' : deepLink === '/mantras' ? 'the Mantras page' : 'Explore Akasha'}.`,
            message_type: 'text',
          });
          if (msgError) throw msgError;
        }
      }

      toast({ title: publishToChat ? `Uploaded — live on ${deepLink}, posted to chat` : `Uploaded — live on ${deepLink}` });
      resetForm();
      fetchAll();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '20px 16px 60px' }}>
      <button
        onClick={() => navigate('/admin')}
        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', padding: '8px 14px', fontSize: 12, marginBottom: 16, cursor: 'pointer' }}
      >
        ← Admin
      </button>

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Content Vault</h1>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 24 }}>
        Upload paid meditations, audio, video, songs and beats. Publishing to a room drops a locked
        card in that chat that members can unlock with a one-time payment, or that's free at the tier you set.
      </p>

      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 20, marginBottom: 32 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {CATEGORIES.map((t) => (
                <option key={t} value={t}>{CATEGORY_CONFIG[t].label}</option>
              ))}
            </select>
            <input
              placeholder="Duration (seconds)"
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(34,211,238,.8)', marginTop: -4 }}>
            → Will appear on {
              CATEGORY_CONFIG[category].destination === 'music_tracks' ? 'the Music page (its own purchase flow)' :
              CATEGORY_CONFIG[category].destination === 'meditations' ? 'the Meditations page' :
              CATEGORY_CONFIG[category].destination === 'healing_audio' ? 'Sonic Treatments on the Healing page' :
              CATEGORY_CONFIG[category].destination === 'divine_transmissions' ? 'Explore Akasha (Divine Transmissions)' :
              CATEGORY_CONFIG[category].destination === 'mantras' ? 'the Mantras page' :
              'the new Videos page (Content Vault purchase flow)'
            }
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            <input
              placeholder="Price in €"
              type="number"
              step="0.5"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select value={tierRequired} onChange={(e) => setTierRequired(e.target.value)} style={{ ...inputStyle, flex: 2 }}>
              {TIER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {category === 'video' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setUseYoutubeEmbed(false)}
                style={{ ...toggleBtnStyle, ...(useYoutubeEmbed ? {} : toggleBtnActiveStyle) }}
              >
                Upload file
              </button>
              <button
                type="button"
                onClick={() => setUseYoutubeEmbed(true)}
                style={{ ...toggleBtnStyle, ...(useYoutubeEmbed ? toggleBtnActiveStyle : {}) }}
              >
                Embed YouTube video
              </button>
            </div>
          )}

          {useYoutubeEmbed ? (
            <div>
              <label style={labelStyle}>YouTube URL</label>
              <input
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                style={inputStyle}
              />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
                Video stays hosted on YouTube — embedded via YouTube's own player, nothing is downloaded or copied.
              </div>
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Media file (audio/video — private, never public)</label>
              <input type="file" accept="audio/*,video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} style={fileInputStyle} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Thumbnail (optional — shown on the locked card)</label>
            <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} style={fileInputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Post as a drop card in</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={inputStyle}>
              <option value="">— don't post to chat —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {isSaving && (
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #D4AF37, #F4D35E)',
                    transition: 'width .2s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(212,175,55,.7)', marginTop: 4, fontWeight: 700 }}>
                {uploadProgress > 0 ? `${uploadProgress}% uploaded` : 'Preparing upload…'}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button disabled={isSaving} onClick={() => handleUploadAndPublish(false)} style={secondaryBtnStyle}>
              {isSaving ? `${uploadProgress}%` : 'Save to vault only'}
            </button>
            <button disabled={isSaving} onClick={() => handleUploadAndPublish(true)} style={primaryBtnStyle}>
              {isSaving ? `${uploadProgress}%` : 'Upload & post to chat'}
            </button>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,.6)', marginBottom: 12 }}>
        Vault ({items.length})
      </h2>
      {isLoading ? (
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Nothing uploaded yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((it) => (
            <div key={it.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{it.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                  {it.content_type} · €{(it.price_cents / 100).toFixed(2)}
                  {it.tier_required !== 'free' ? ` · included from ${it.tier_required}` : it.price_cents > 0 ? ' · purchase only' : ' · free'}
                </div>
              </div>
              <div style={{ fontSize: 10, color: it.is_published ? '#22D3EE' : 'rgba(255,255,255,.3)', fontWeight: 800, flexShrink: 0 }}>
                {it.is_published ? 'PUBLISHED' : 'DRAFT'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
};

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '8px 10px',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: 'rgba(212,175,55,.5)',
  display: 'block',
  marginBottom: 6,
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'radial-gradient(circle at 30% 30%, #F4D35E, #D4AF37 75%)',
  color: '#1a1300',
  border: 'none',
  borderRadius: 12,
  padding: '12px',
  fontWeight: 900,
  fontSize: 13,
  cursor: 'pointer',
};

const toggleBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,.04)',
  color: 'rgba(255,255,255,.5)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10,
  padding: '9px',
  fontWeight: 700,
  fontSize: 11.5,
  cursor: 'pointer',
};

const toggleBtnActiveStyle: React.CSSProperties = {
  background: 'rgba(212,175,55,.15)',
  color: '#D4AF37',
  border: '1px solid rgba(212,175,55,.4)',
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,.05)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 12,
  padding: '12px',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
};
