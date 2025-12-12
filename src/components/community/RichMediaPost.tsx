import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Play, 
  Pause, 
  FileText, 
  Download,
  Radio,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  post_type: string;
  is_live_recording?: boolean;
  live_recording_title?: string | null;
  live_recording_description?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  user_liked?: boolean;
}

interface RichMediaPostProps {
  post: Post;
  onLike: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  isCommentsOpen: boolean;
  hasAvatar: boolean;
  children?: React.ReactNode;
}

const RichMediaPost = ({ 
  post, 
  onLike, 
  onToggleComments, 
  isCommentsOpen, 
  hasAvatar,
  children 
}: RichMediaPostProps) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {post.profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{post.profile?.full_name || 'Admin'}</p>
              {post.is_live_recording && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  Live Recording
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Live Recording Title */}
        {post.is_live_recording && post.live_recording_title && (
          <h3 className="font-semibold text-lg text-foreground mb-2">
            {post.live_recording_title}
          </h3>
        )}

        {/* Post Content */}
        <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>

        {/* Image */}
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post" 
            className="rounded-lg mb-4 max-h-96 w-full object-cover" 
          />
        )}

        {/* Audio Player */}
        {post.audio_url && (
          <div className="bg-muted rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleAudio}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-1" />
                )}
              </Button>
              <div className="flex-1">
                <audio
                  ref={(ref) => setAudioRef(ref)}
                  src={post.audio_url}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />
              </div>
            </div>
          </div>
        )}

        {/* Video Player */}
        {post.video_url && (
          <div className="mb-4">
            <video
              src={post.video_url}
              controls
              className="w-full rounded-lg max-h-96"
              poster={post.image_url || undefined}
            />
          </div>
        )}

        {/* PDF Link */}
        {post.pdf_url && (
          <a 
            href={post.pdf_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-muted rounded-lg p-4 mb-4 hover:bg-muted/80 transition-colors"
          >
            <div className="bg-primary/20 rounded-lg p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">PDF Document</p>
              <p className="text-sm text-muted-foreground">Click to view or download</p>
            </div>
            <div className="flex gap-2">
              <Download className="h-5 w-5 text-muted-foreground" />
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </div>
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => hasAvatar && onLike(post.id)}
            disabled={!hasAvatar}
            className={post.user_liked ? 'text-red-500' : 'text-muted-foreground'}
          >
            <Heart className={`h-4 w-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
            {post.likes_count}
          </Button>
          <Collapsible open={isCommentsOpen} onOpenChange={() => onToggleComments(post.id)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.comments_count}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {children}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default RichMediaPost;
