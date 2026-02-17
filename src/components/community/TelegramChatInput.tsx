import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, Mic, Paperclip, Image as ImageIcon, File, X, 
  Loader2, Radio, Check, Clock, AlertCircle
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
    waveform,
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

  return (
    <div className="relative">
      {/* Liquid Glass Input Bar - Telegram Style */}
      <div className="relative bg-gradient-to-r from-background/40 via-background/30 to-background/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl">
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
                  {waveform.map((height, i) => (
                    <div
                      key={i}
                      className="w-1 bg-destructive rounded-full animate-pulse"
                      style={{ height: `${height * 100}%`, minHeight: '8px' }}
                    />
                  ))}
                  <Radio className="h-4 w-4 text-destructive animate-pulse ml-1" />
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
          {/* File Upload Button - Telegram Style */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending}
              className="h-12 w-12 rounded-full shrink-0 bg-background/20 hover:bg-background/40 backdrop-blur-sm border border-white/10 transition-all"
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

          {/* Image Upload Button - Telegram Style */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isSending}
              className="h-12 w-12 rounded-full shrink-0 bg-background/20 hover:bg-background/40 backdrop-blur-sm border border-white/10 transition-all"
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

          {/* Text Input - Telegram Style */}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
            placeholder={placeholder}
            disabled={disabled || isSending || isRecording}
            className="flex-1 bg-background/20 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-0 min-h-[48px] max-h-32 resize-none text-base"
          />

          {/* Voice Record / Send Button - Telegram Style */}
          {!text.trim() ? (
            <Button
              variant={isRecording ? "destructive" : "ghost"}
              size="icon"
              onMouseDown={handleVoiceRecord}
              onMouseUp={isRecording ? handleVoiceRecord : undefined}
              onTouchStart={handleVoiceRecord}
              onTouchEnd={isRecording ? handleVoiceRecord : undefined}
              disabled={disabled || isSending}
              className="h-12 w-12 rounded-full shrink-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 backdrop-blur-sm border border-cyan-400/30 transition-all shadow-lg"
            >
              {isRecording ? (
                <Radio className="h-5 w-5 animate-pulse text-destructive" />
              ) : (
                <Mic className="h-5 w-5 text-cyan-400" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSendText}
              disabled={!text.trim() || isSending || disabled}
              className="h-12 w-12 rounded-full shrink-0 bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg transition-all"
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
