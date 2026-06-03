import React, { useState, useRef } from 'react';
import { Upload, X, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface AudioUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

/**
 * SQI Admin Audio Upload — uploads directly to Cloudflare R2 via /api/audio-upload.
 * Returns the R2 public CDN URL (pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev/…).
 * The audio proxy at /api/audio/* handles CORS for playback.
 */
const AudioUpload = ({ value, onChange, folder = 'meditations', label = 'Audio File' }: AudioUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size must be less than 500MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/audio-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await response.json();
      onChange(url);
      toast.success('Audio uploaded to SQI Cloud ✓');
    } catch (error: any) {
      console.error('[SQI] Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearAudio = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {value ? (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center p-3 bg-muted rounded-lg">
            <Music className="w-5 h-5 text-primary flex-shrink-0 hidden sm:block" />
            <span className="text-sm truncate flex-1 min-w-0" title={value}>
              {value.split('/').pop()}
            </span>
            <audio src={value} controls className="h-8 w-full max-w-[min(100%,220px)] sm:max-w-[200px]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fileInputRef.current?.click();
              }}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading…' : 'Replace file'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowUrlInput(v => !v)}>
              {showUrlInput ? 'Hide URL' : 'Edit URL'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearAudio}>
              <X className="w-4 h-4 mr-1" />Remove
            </Button>
          </div>
          {showUrlInput && (
            <Input
              placeholder="Paste new audio URL…"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="font-mono text-xs"
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading to R2…' : 'Upload File'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowUrlInput(!showUrlInput)}>
              URL
            </Button>
          </div>
          {showUrlInput && (
            <Input
              placeholder="Or paste R2 audio URL..."
              value={value}
              onChange={e => onChange(e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AudioUpload;
