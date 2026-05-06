import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  title?: string;
}

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string | null): string | null => {
  if (!url) return null;
  
  // Handle youtube.com/embed/ format
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  
  // Handle youtube.com/watch?v= format
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  
  // Handle youtu.be/ format
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  
  // Handle youtube.com/v/ format
  const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/);
  if (vMatch) return vMatch[1];
  
  // If it's already just an ID
  if (/^[a-zA-Z0-9_-]+$/.test(url)) return url;
  
  return null;
};

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title = 'Course Lesson',
}) => {
  // If it's not a YouTube URL (e.g. a Supabase signed URL for an MP4), play natively.
  const videoId = extractYouTubeId(videoUrl);
  const isDirectVideo = !!videoUrl && !videoId;

  if (!videoUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Video URL is not valid or not available.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isDirectVideo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <video src={videoUrl!} controls playsInline className="w-full max-h-[80vh] bg-black" />
        </DialogContent>
      </Dialog>
    );
  }

  // Build proper YouTube embed URL with origin parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&origin=${window.location.origin}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerModal;
