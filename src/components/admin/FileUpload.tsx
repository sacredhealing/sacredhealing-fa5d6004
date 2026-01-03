import React, { useState, useRef } from 'react';
import { Upload, X, FileAudio, FileText, Download, Loader2, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type FileType = 'audio' | 'document' | 'all';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  fileType?: FileType;
  label?: string;
  accept?: string;
}

const FILE_TYPE_CONFIG: Record<FileType, { accept: string; mimeTypes: string[]; icon: React.ReactNode }> = {
  audio: {
    accept: '.m4a,.mp3,.wav,.aiff,.aif',
    mimeTypes: ['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aiff', 'audio/x-aiff'],
    icon: <FileAudio className="w-5 h-5 text-primary flex-shrink-0" />,
  },
  document: {
    accept: '.pdf,.docx,.doc,.txt',
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ],
    icon: <FileText className="w-5 h-5 text-primary flex-shrink-0" />,
  },
  all: {
    accept: '.m4a,.mp3,.wav,.aiff,.aif,.pdf,.docx,.doc,.txt',
    mimeTypes: [
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/aiff',
      'audio/x-aiff',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ],
    icon: <File className="w-5 h-5 text-primary flex-shrink-0" />,
  },
};

const FileUpload = ({
  value,
  onChange,
  folder = 'uploads',
  fileType = 'all',
  label = 'File',
  accept,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = FILE_TYPE_CONFIG[fileType];
  const finalAccept = accept || config.accept;

  const isAudioFile = (filename: string): boolean => {
    const audioExtensions = ['.m4a', '.mp3', '.wav', '.aiff', '.aif'];
    return audioExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidType = config.mimeTypes.some(
      (mime) => file.type === mime || file.type === '' // Some browsers don't detect .m4a/.aiff correctly
    );
    
    // Fallback to extension check
    const hasValidExtension = finalAccept.split(',').some((ext) =>
      file.name.toLowerCase().endsWith(ext.trim())
    );

    if (!isValidType && !hasValidExtension) {
      toast.error(`Invalid file type. Supported formats: ${finalAccept}`);
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be less than 100MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Determine bucket based on file type
      const bucket = isAudioFile(file.name) ? 'audio' : 'community-uploads';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

      onChange(urlData.publicUrl);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFile = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!value) return;
    window.open(value, '_blank');
  };

  const getFileName = (url: string): string => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1] || 'file';
    } catch {
      return 'file';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      {value ? (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          {config.icon}
          <span className="text-sm truncate flex-1" title={getFileName(value)}>
            {getFileName(value)}
          </span>
          {isAudioFile(value) && (
            <audio src={value} controls className="h-8 max-w-[150px]" />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={clearFile}>
            <X className="w-4 h-4" />
          </Button>
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
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              URL
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={finalAccept}
            onChange={handleFileUpload}
            className="hidden"
          />

          {showUrlInput && (
            <Input
              placeholder="Or paste file URL..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}

          <p className="text-xs text-muted-foreground">
            Supported: {finalAccept}
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
