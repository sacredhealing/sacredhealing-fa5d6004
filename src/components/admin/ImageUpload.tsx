/**
 * ImageUpload — SQI-2050 admin image uploader.
 * Uploads to Supabase Storage `songs` bucket (same as album covers).
 * Shows a live preview, supports drag-and-drop, paste URL fallback.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;           // current public URL (or empty string)
  onChange: (url: string) => void;
  folder?: string;         // subfolder inside the bucket, e.g. "mantra-covers"
  label?: string;
  aspectRatio?: string;    // css aspect-ratio, default "16/9"
}

const ImageUpload = ({
  value,
  onChange,
  folder = 'mantra-covers',
  label = 'Cover Image',
  aspectRatio = '16/9',
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('community-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('community-uploads').getPublicUrl(fileName);
      onChange(publicUrl);
      toast.success('Image uploaded');
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast.error('Upload failed: ' + (err?.message ?? 'unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, []);

  const handlePasteUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const clear = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowUrlInput(false);
    setUrlInput('');
  };

  /* ── styles ── */
  const goldBorder = 'rgba(212,175,55,0.3)';
  const glassBg = 'rgba(255,255,255,0.02)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* label */}
      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>
        {label}
      </div>

      {value ? (
        /* ── Preview state ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* live preview */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${goldBorder}`, aspectRatio }}>
            <img
              src={value}
              alt="Cover preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
            />
            {/* remove button top-right */}
            <button
              type="button"
              onClick={clear}
              title="Remove image"
              style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,.65)', border: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,.7)' }}
            >
              <X size={12} />
            </button>
          </div>

          {/* action row */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={uploading}
              onClick={() => { if (fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); }}
              style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 100, background: 'linear-gradient(135deg,rgba(212,175,55,.9),rgba(160,124,16,.9))', color: '#050505', border: 'none', cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={11} />}
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(v => !v)}
              style={{ fontSize: 10, fontWeight: 700, padding: '6px 12px', borderRadius: 100, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
            >
              <Link size={10} /> URL
            </button>
          </div>

          {showUrlInput && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="Paste image URL…"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasteUrl()}
                style={{ flex: 1, height: 36, borderRadius: 100, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.88)', padding: '0 14px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="button" onClick={handlePasteUrl} style={{ height: 36, padding: '0 14px', borderRadius: 100, background: 'rgba(212,175,55,.15)', border: '1px solid rgba(212,175,55,.3)', color: '#D4AF37', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Set
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty / drop zone state ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              aspectRatio,
              borderRadius: 16,
              border: `1px dashed ${dragging ? 'rgba(212,175,55,.7)' : 'rgba(255,255,255,.12)'}`,
              background: dragging ? 'rgba(212,175,55,.05)' : glassBg,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, cursor: uploading ? 'wait' : 'pointer',
              transition: 'all .2s',
              userSelect: 'none',
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={22} style={{ color: '#D4AF37', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Uploading…</span>
              </>
            ) : (
              <>
                <ImageIcon size={22} style={{ color: 'rgba(212,175,55,.5)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>Click or drag & drop</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>JPG · PNG · WebP · max 10 MB</div>
                </div>
              </>
            )}
          </div>

          {/* paste URL fallback */}
          <button
            type="button"
            onClick={() => setShowUrlInput(v => !v)}
            style={{ fontSize: 10, fontWeight: 700, padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content', fontFamily: 'inherit' }}
          >
            <Link size={10} /> Paste URL instead
          </button>

          {showUrlInput && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasteUrl()}
                style={{ flex: 1, height: 36, borderRadius: 100, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.88)', padding: '0 14px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="button" onClick={handlePasteUrl} style={{ height: 36, padding: '0 14px', borderRadius: 100, background: 'rgba(212,175,55,.15)', border: '1px solid rgba(212,175,55,.3)', color: '#D4AF37', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Set
              </button>
            </div>
          )}
        </div>
      )}

      {/* spinner keyframe (needs to be injected once) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ImageUpload;
