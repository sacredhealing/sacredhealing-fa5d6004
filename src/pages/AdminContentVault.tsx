import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface VaultItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  price_cents: number;
  currency: string;
  included_min_tier_rank: number | null;
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
  { value: '0', label: 'Free tier and up' },
  { value: '1', label: 'Prana-Flow and up' },
  { value: '2', label: 'Siddha-Quantum and up' },
  { value: '3', label: 'Akasha-Infinity only' },
];

const MEDIA_TYPES = ['audio', 'video', 'meditation', 'song', 'beat'];

export default function AdminContentVault() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<VaultItem[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('meditation');
  const [priceEuros, setPriceEuros] = useState('11');
  const [tierRank, setTierRank] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    const [{ data: vaultData }, { data: roomData }] = await Promise.all([
      (supabase as any)
        .from('content_vault')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('chat_rooms').select('id, name').eq('is_active', true),
    ]);
    setItems((vaultData as VaultItem[]) || []);
    setRooms((roomData as RoomOption[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMediaType('meditation');
    setPriceEuros('11');
    setTierRank('');
    setDurationSeconds('');
    setRoomId('');
    setMediaFile(null);
    setThumbnailFile(null);
  };

  const handleUploadAndPublish = async (publishToChat: boolean) => {
    if (!user) return;
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    if (!mediaFile) {
      toast({ title: 'Select the media file first', variant: 'destructive' });
      return;
    }
    if (publishToChat && !roomId) {
      toast({ title: 'Pick a room to post the drop in', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const ext = mediaFile.name.split('.').pop();
      const mediaPath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('content-vault')
        .upload(mediaPath, mediaFile, { upsert: false });
      if (uploadError) throw uploadError;

      let thumbnailUrl: string | null = null;
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

      const { data: inserted, error: insertError } = await (supabase as any)
        .from('content_vault')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          media_type: mediaType,
          media_path: mediaPath,
          thumbnail_url: thumbnailUrl,
          duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
          price_cents: Math.round(parseFloat(priceEuros || '0') * 100),
          currency: 'eur',
          included_min_tier_rank: tierRank === '' ? null : parseInt(tierRank, 10),
          room_id: publishToChat ? roomId : null,
          is_published: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (publishToChat) {
        const { data: msg, error: msgError } = await (supabase as any)
          .from('chat_messages')
          .insert({
            room_id: roomId,
            user_id: user.id,
            content: title.trim(),
            message_type: 'content_drop',
            content_id: inserted.id,
          })
          .select()
          .single();
        if (msgError) throw msgError;

        await (supabase as any)
          .from('content_vault')
          .update({ drop_message_id: msg.id })
          .eq('id', inserted.id);
      }

      toast({ title: publishToChat ? 'Uploaded and posted to chat' : 'Uploaded to the vault' });
      resetForm();
      fetchAll();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
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
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {MEDIA_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            <input
              placeholder="Price in €"
              type="number"
              step="0.5"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select value={tierRank} onChange={(e) => setTierRank(e.target.value)} style={{ ...inputStyle, flex: 2 }}>
              {TIER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Media file (audio/video — private, never public)</label>
            <input type="file" accept="audio/*,video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} style={fileInputStyle} />
          </div>
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

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button disabled={isSaving} onClick={() => handleUploadAndPublish(false)} style={secondaryBtnStyle}>
              {isSaving ? 'Uploading…' : 'Save to vault only'}
            </button>
            <button disabled={isSaving} onClick={() => handleUploadAndPublish(true)} style={primaryBtnStyle}>
              {isSaving ? 'Uploading…' : 'Upload & post to chat'}
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
                  {it.media_type} · €{(it.price_cents / 100).toFixed(2)}
                  {it.included_min_tier_rank !== null ? ` · free from tier ${it.included_min_tier_rank}` : ' · purchase only'}
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
