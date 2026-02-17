import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FileUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export interface UploadedFile {
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  thumbnail_url?: string;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const [state, setState] = useState<FileUploadState>({
    uploading: false,
    progress: 0,
    error: null
  });

  const uploadFile = useCallback(async (
    file: File,
    roomId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return null;
    }

    setState({ uploading: true, progress: 0, error: null });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${roomId}/${Date.now()}.${fileExt}`;
      const filePath = `chat-storage/${fileName}`;

      // Determine file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      // Upload file
      const { data, error: uploadError } = await supabase.storage
        .from('chat-storage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-storage')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      let thumbnailUrl: string | undefined;

      // Generate thumbnail for images/videos
      if (isImage || isVideo) {
        thumbnailUrl = urlData.publicUrl; // For now, use same URL; can add thumbnail generation later
      }

      const uploadedFile: UploadedFile = {
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        thumbnail_url: thumbnailUrl
      };

      setState({ uploading: false, progress: 100, error: null });
      return uploadedFile;

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error.message || 'Upload failed'
      }));
      return null;
    }
  }, [user]);

  const uploadVoiceNote = useCallback(async (
    audioBlob: Blob,
    roomId: string,
    duration: number
  ): Promise<UploadedFile | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return null;
    }

    setState({ uploading: true, progress: 0, error: null });

    try {
      const fileName = `${user.id}/${roomId}/voice/${Date.now()}.webm`;
      const filePath = `chat-storage/${fileName}`;

      // Upload audio blob
      const { data, error: uploadError } = await supabase.storage
        .from('chat-storage')
        .upload(filePath, audioBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'audio/webm'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-storage')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      const uploadedFile: UploadedFile = {
        file_url: urlData.publicUrl,
        file_name: `voice-${Date.now()}.webm`,
        file_size: audioBlob.size,
        mime_type: 'audio/webm'
      };

      setState({ uploading: false, progress: 100, error: null });
      return uploadedFile;

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error.message || 'Voice upload failed'
      }));
      return null;
    }
  }, [user]);

  return {
    ...state,
    uploadFile,
    uploadVoiceNote
  };
};
