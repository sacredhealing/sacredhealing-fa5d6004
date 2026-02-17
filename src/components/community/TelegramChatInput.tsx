import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, Mic, Paperclip, Image as ImageIcon, File, X, 
  Loader2, Waveform, Check, Clock, AlertCircle
} from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useFileUpload } from '@/hooks/useFileUpload';
import { motion, AnimatePresence } from 'framer-motion';

interface TelegramChatInputProps {
  onSendText: (text: string) => Promise<void>;
  onSendVoice: (audioBlob: Blob, duration: number, fileData: any) => Promise<void>;
  onSendFile: (file: File, fileData: any) => Promise<void>;
  roomId: string;
  disabled?: boolean;
  placeholder?: string;
}

export const TelegramChatInput = ({
  onSendText,
  onSendVoice,
  onSendFile,
  roomId,
  disabled = false,
  placeholder = "Share from presence..."
}: TelegramChatInputProps) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isRecording, 
    duration, 
    audioBlob, 
    audioUrl, 
    startRecording, 
    stopRecording, 
    reset 
  } = useVoiceRecorder();
  
  const { uploadFile, uploadVoiceNote, uploading } = useFileUpload();

  const handleSendText = async () => {
    if (!text.trim() || isSending || disabled) return;
    setIsSending(true);
    await onSendText(text.trim());
    setText('');
    setIsSending(false);
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendVoice = async () => {
    if (!audioBlob || !duration) return;
    
    setIsSending(true);
    const uploaded = await uploadVoiceNote(audioBlob, roomId, duration);
    
    if (uploaded) {
      await onSendVoice(audioBlob, duration, {
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
        file_size: uploaded.file_size,
        mime_type: uploaded.mime_type,
        duration
      });
      reset();
    }
    setIsSending(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    const uploaded = await uploadFile(file, roomId);
    
    if (uploaded) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      await onSendFile(file, {
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
        file_size: uploaded.file_size,
        mime_type: uploaded.mime_type,
        thumbnail_url: uploaded.thumbnail_url
      });
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    setIsSending(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate simple waveform bars for visualization
  const generateWaveform = () => {
    const bars = 20;
    return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
  };

  return (
    <div className="relative">
      {/* Liquid Glass Input Bar */}
      <div className="relative bg-background/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
        <AnimatePresence>
          {isRecording ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 bg-destructive/20 rounded-xl mb-2"
            >
              <div className="flex-1 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {generateWaveform().map((height, i) => (
                    <div
                      key={i}
                      className="w-1 bg-destructive rounded-full animate-pulse"
                      style={{ height: `${height * 100}%`, minHeight: '8px' }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-destructive">
                  {formatDuration(duration)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleSendVoice}
                disabled={!audioBlob || uploading}
                className="bg-primary"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          ) : audioBlob && audioUrl ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2"
            >
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <audio src={audioUrl} controls className="flex-1 h-8" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* File Upload Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending}
              className="h-10 w-10 rounded-full shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Image Upload Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isSending}
              className="h-10 w-10 rounded-full shrink-0"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Text Input */}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
            placeholder={placeholder}
            disabled={disabled || isSending || isRecording}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-32 resize-none"
          />

          {/* Voice Record Button */}
          {!text.trim() ? (
            <Button
              variant={isRecording ? "destructive" : "ghost"}
              size="icon"
              onMouseDown={handleVoiceRecord}
              onMouseUp={isRecording ? handleVoiceRecord : undefined}
              onTouchStart={handleVoiceRecord}
              onTouchEnd={isRecording ? handleVoiceRecord : undefined}
              disabled={disabled || isSending}
              className="h-10 w-10 rounded-full shrink-0"
            >
              {isRecording ? (
                <Waveform className="h-5 w-5 animate-pulse" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSendText}
              disabled={!text.trim() || isSending || disabled}
              className="h-10 w-10 rounded-full shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
