import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, Eye, EyeOff,
  Music, RefreshCw, Upload, ExternalLink, Sparkles, Zap,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/* ─── SQI 2050 Design Tokens ─────────────────────────────────────── */
const GOLD = '#D4AF37';
const CYAN = '#22D3EE';
const BLACK = '#050505';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');

  .sqi-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${BLACK};
    min-height: 100vh;
  }
  .sqi-label {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.6);
  }
  .glass-card {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 40px;
  }
  .gold-glow {
    color: ${GOLD};
    text-shadow: 0 0 20px rgba(212,175,55,0.35);
  }
  .gold-btn {
    background: linear-gradient(135deg, #D4AF37 0%, #B8960C 50%, #D4AF37 100%);
    background-size: 200% 200%;
    color: #050505;
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border-radius: 100px;
    border: none;
    padding: 14px 28px;
    cursor: pointer;
    transition: all 0.4s ease;
    box-shadow: 0 0 30px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .gold-btn:hover:not(:disabled) {
    box-shadow: 0 0 50px rgba(212,175,55,0.45), inset 0 1px 0 rgba(255,255,255,0.4);
    background-position: right center;
    transform: translateY(-1px);
  }
  .gold-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .sqi-input {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 16px !important;
    color: rgba(255,255,255,0.85) !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 14px !important;
    padding: 12px 16px !important;
    transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
  }
  .sqi-input:focus {
    border-color: rgba(212,175,55,0.35) !important;
    box-shadow: 0 0 0 3px rgba(212,175,55,0.08) !important;
    outline: none !important;
  }
  .sqi-input::placeholder { color: rgba(255,255,255,0.2) !important; }
  .sqi-select-trigger {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 16px !important;
    color: rgba(255,255,255,0.85) !important;
  }
  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .ann-card {
    background: rgba(255,255,255,0.018);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 28px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .ann-card:hover { border-color: rgba(212,175,55,0.2); box-shadow: 0 0 20px rgba(212,175,55,0.06); }
  .ann-card.inactive { opacity: 0.45; }
  .icon-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    cursor: pointer;
    transition: all 0.25s ease;
    color: rgba(255,255,255,0.5);
  }
  .icon-btn:hover { background: rgba(255,255,255,0.08); color: ${GOLD}; border-color: rgba(212,175,55,0.25); }
  .icon-btn.danger:hover { color: #ef4444; border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); }
  .direct-link-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 100px;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.3);
    color: ${GOLD};
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;
  }
  .direct-link-btn:hover { background: rgba(212,175,55,0.2); box-shadow: 0 0 14px rgba(212,175,55,0.2); }
  .upload-zone {
    border: 1.5px dashed rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255,255,255,0.01);
    color: rgba(255,255,255,0.3);
    font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
  }
  .upload-zone:hover { border-color: rgba(212,175,55,0.35); background: rgba(212,175,55,0.04); color: ${GOLD}; }
  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%;
    box-shadow: 0 0 8px ${CYAN};
    animation: pulse-sqi 2s infinite;
    display: inline-block;
    margin-right: 6px;
  }
  @keyframes pulse-sqi {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.75); }
  }
  .section-title {
    font-size: 10px; font-weight: 800; letter-spacing: 0.3em;
    text-transform: uppercase; color: rgba(212,175,55,0.5);
    margin-bottom: 20px;
  }
  .smart-logic-banner {
    background: linear-gradient(135deg, rgba(34,211,238,0.06), rgba(212,175,55,0.06));
    border: 1px solid rgba(34,211,238,0.15);
    border-radius: 20px;
    padding: 14px 18px;
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 12px; color: rgba(255,255,255,0.55);
    line-height: 1.6;
  }
`;

/* ─── Types ───────────────────────────────────────────────────────── */
interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  image_url: string | null;
  link_url: string | null;
  audio_url: string | null;
  recurring: string | null;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
const TYPE_META: Record<string, { bg: string; color: string; label: string }> = {
  info: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'INFO' },
  success: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'SUCCESS' },
  warning: { bg: 'rgba(234,179,8,0.15)', color: '#facc15', label: 'WARNING' },
  promotion: { bg: 'rgba(212,175,55,0.15)', color: '#D4AF37', label: 'PROMOTION' },
};
function typeMeta(t: string) {
  return TYPE_META[t] ?? TYPE_META.info;
}

/* ─── Component ───────────────────────────────────────────────────── */
export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [expiresIn, setExpiresIn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [recurring, setRecurring] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let expires_at = null;
      if (expiresIn) {
        const hours = parseInt(expiresIn, 10);
        expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }
      const starts_at = startsAt ? new Date(startsAt).toISOString() : new Date().toISOString();
      const { data: saved, error } = await supabase
        .from('announcements')
        .insert({
          title,
          message,
          type,
          expires_at,
          starts_at,
          image_url: imageUrl || null,
          link_url: linkUrl || null,
          audio_url: audioUrl || null,
          recurring: recurring || null,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Auto-translate title + message into sv, no, es
      if (saved?.id) {
        supabase.functions.invoke('translate-announcement', {
          body: { announcement_id: saved.id, title, content: message },
        }).then(({ error: trErr }) => {
          if (trErr) console.error('translate-announcement:', trErr);
        });
      }

      let emailBlastFailed = false;
      if (saved?.id) {
        const { error: emailFnError } = await supabase.functions.invoke('send-announcement-email', {
          body: { announcement_id: saved.id },
        });
        if (emailFnError) {
          console.error('send-announcement-email:', emailFnError);
          emailBlastFailed = true;
        }
      }

      return { emailBlastFailed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setTitle('');
      setMessage('');
      setType('info');
      setExpiresIn('');
      setImageUrl('');
      setLinkUrl('');
      setLinkLabel('');
      setAudioUrl('');
      setRecurring('');
      setStartsAt('');
      toast({
        title: '✦ Prema-Pulse Transmitted',
        description: data.emailBlastFailed
          ? 'In-app notice is live. The email blast could not be started (check Edge Functions / Resend).'
          : 'In-app notice is live; announcement emails are being sent to all accounts.',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Transmission Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('announcements').update({ is_active: !is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast({ title: 'Transmission Dissolved' });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `announcements/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('public-media').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('public-media').getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast({ title: '✦ Image Uploaded' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sqi-root" style={{ padding: '16px 16px 112px', color: 'rgba(255,255,255,0.85)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
            <button type="button" className="icon-btn" onClick={() => navigate('/admin')} style={{ flexShrink: 0 }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1 }}>
                <span className="gold-glow">PREMA-PULSE</span> TRANSMISSIONS
              </div>
              <div className="sqi-label" style={{ marginTop: 4 }}>
                Broadcast Vedic Light-Codes to your community
              </div>
            </div>
          </div>

          <div className="smart-logic-banner" style={{ marginBottom: 28 }}>
            <div style={{ marginTop: 2 }}>
              <span className="pulse-dot" style={{ background: CYAN }} />
            </div>
            <div>
              <span style={{ color: CYAN, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }}>
                BHAKTI-ALGORITHM ACTIVE
              </span>
              <br />
              Each user sees only the{' '}
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>single newest active announcement</strong> — once.
              After clicking it&apos;s marked read and never shown again. A user logging in after a month still sees only
              one transmission — the latest. No spam. Pure signal.
            </div>
          </div>

          <div className="glass-card" style={{ padding: '32px 28px', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} color={GOLD} />
              </div>
              <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: 15 }}>New Transmission</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div className="sqi-label" style={{ marginBottom: 8 }}>
                  Title
                </div>
                <input
                  className="sqi-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="29 New Meditations on SOMA just dropped..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <div className="sqi-label" style={{ marginBottom: 8 }}>
                  Message
                </div>
                <textarea
                  className="sqi-input"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 100 }}
                  placeholder="Describe what's new, what energy is being transmitted..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div
                style={{
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.15)',
                  borderRadius: 20,
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <ExternalLink size={14} color={GOLD} />
                  <span
                    style={{
                      color: GOLD,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Direct Link — User Clicks → Goes There
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div className="sqi-label" style={{ marginBottom: 6 }}>
                      Destination URL
                    </div>
                    <input
                      className="sqi-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="https://sacredhealing.lovable.app/meditations"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="sqi-label" style={{ marginBottom: 6 }}>
                      Button Label (optional)
                    </div>
                    <input
                      className="sqi-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="Explore 29 SOMA Meditations →"
                      value={linkLabel}
                      onChange={(e) => setLinkLabel(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="sqi-label" style={{ marginBottom: 8 }}>
                  Image (optional)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label className="upload-zone" style={{ display: 'block', cursor: 'pointer', margin: 0 }}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                    <Upload size={18} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.5 }} />
                    {uploading ? 'Uploading...' : 'Tap to upload from phone / computer'}
                  </label>
                  <div className="sqi-label" style={{ textAlign: 'center' }}>
                    — or paste URL —
                  </div>
                  <input
                    className="sqi-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl && (
                    <img src={imageUrl} alt="" style={{ borderRadius: 16, maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                  )}
                </div>
              </div>

              <div>
                <div className="sqi-label" style={{ marginBottom: 8 }}>
                  Audio URL (optional)
                </div>
                <input
                  className="sqi-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="https://example.com/audio.mp3"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div className="sqi-label" style={{ marginBottom: 8 }}>
                    Type
                  </div>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="sqi-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="sqi-label" style={{ marginBottom: 8 }}>
                    Recurring
                  </div>
                  <Select value={recurring || 'none'} onValueChange={(v) => setRecurring(v === 'none' ? '' : v)}>
                    <SelectTrigger className="sqi-select-trigger">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div className="sqi-label" style={{ marginBottom: 8 }}>
                    Publish Date / Time
                  </div>
                  <input
                    className="sqi-input"
                    type="datetime-local"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <div className="sqi-label" style={{ marginBottom: 8 }}>
                    Expires After
                  </div>
                  <Select value={expiresIn || 'never'} onValueChange={(v) => setExpiresIn(v === 'never' ? '' : v)}>
                    <SelectTrigger className="sqi-select-trigger">
                      <SelectValue placeholder="Never" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                type="button"
                className="gold-btn"
                onClick={() => createMutation.mutate()}
                disabled={!title || !message || createMutation.isPending}
                style={{ marginTop: 8 }}
              >
                <Zap size={15} />
                {createMutation.isPending ? 'TRANSMITTING...' : 'ACTIVATE TRANSMISSION'}
              </button>
            </div>
          </div>

          <div>
            <div className="section-title">✦ Active Transmissions Archive</div>

            {isLoading ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>
                <span className="pulse-dot" style={{ background: CYAN }} />
                Scanning Akasha-Archive...
              </div>
            ) : announcements?.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 40, fontSize: 13 }}>
                No transmissions found in the Archive.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {announcements?.map((ann, idx) => {
                  const meta = typeMeta(ann.type);
                  const isNewest = idx === 0;
                  return (
                    <div key={ann.id} className={`ann-card${!ann.is_active ? ' inactive' : ''}`} style={{ padding: '20px 22px', position: 'relative' }}>
                      {isNewest && ann.is_active && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -10,
                            left: 22,
                            background: GOLD,
                            color: '#050505',
                            fontSize: 7,
                            fontWeight: 900,
                            letterSpacing: '0.25em',
                            padding: '3px 10px',
                            borderRadius: 100,
                          }}
                        >
                          ACTIVE · USERS SEE THIS
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            <span className="type-badge" style={{ background: meta.bg, color: meta.color }}>
                              {meta.label}
                            </span>
                            {ann.recurring && (
                              <span className="type-badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                                <RefreshCw size={8} /> {ann.recurring}
                              </span>
                            )}
                            {!ann.is_active && (
                              <span
                                className="type-badge"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
                              >
                                INACTIVE
                              </span>
                            )}
                          </div>

                          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em', marginBottom: 6 }}>{ann.title}</div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{ann.message}</div>

                          {ann.image_url && (
                            <img
                              src={ann.image_url}
                              alt=""
                              style={{ marginTop: 12, borderRadius: 14, maxHeight: 110, objectFit: 'cover', width: '100%' }}
                            />
                          )}

                          {ann.link_url && (
                            <a
                              href={ann.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="direct-link-btn"
                              style={{ marginTop: 14, display: 'inline-flex' }}
                            >
                              <ExternalLink size={11} />
                              Open Link →
                            </a>
                          )}

                          {ann.audio_url && (
                            <div
                              style={{
                                marginTop: 10,
                                fontSize: 11,
                                color: 'rgba(255,255,255,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <Music size={10} /> Audio transmission attached
                            </div>
                          )}

                          <div style={{ marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                            Published: {new Date(ann.starts_at).toLocaleString()}
                            {ann.expires_at && (
                              <span style={{ marginLeft: 10 }}>· Dissolves: {new Date(ann.expires_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => toggleMutation.mutate({ id: ann.id, is_active: ann.is_active })}
                            title={ann.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {ann.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => deleteMutation.mutate(ann.id)}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
