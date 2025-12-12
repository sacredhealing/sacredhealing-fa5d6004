import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Music, 
  Video, 
  FileIcon, 
  Radio, 
  Upload, 
  Loader2,
  Send 
} from 'lucide-react';

interface AdminPostCreatorProps {
  onPostCreated: () => void;
}

const AdminPostCreator = ({ onPostCreated }: AdminPostCreatorProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const audioRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLiveRecording, setIsLiveRecording] = useState(false);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('community-uploads')
      .upload(filePath, file, { contentType: file.type });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('community-uploads')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;
    
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let audioUrl = null;
      let videoUrl = null;
      let pdfUrl = null;
      let imageUrl = null;

      // Upload files based on post type
      if (postType === 'audio' && audioFile) {
        setUploadProgress(25);
        audioUrl = await uploadFile(audioFile, 'audio');
      } else if ((postType === 'video' || postType === 'live') && videoFile) {
        setUploadProgress(25);
        videoUrl = await uploadFile(videoFile, 'videos');
      } else if (postType === 'pdf' && pdfFile) {
        setUploadProgress(25);
        pdfUrl = await uploadFile(pdfFile, 'documents');
      }

      // Upload optional image
      if (imageFile) {
        setUploadProgress(50);
        imageUrl = await uploadFile(imageFile, 'images');
      }

      setUploadProgress(75);

      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          post_type: postType === 'live' ? 'video' : postType,
          audio_url: audioUrl,
          video_url: videoUrl,
          pdf_url: pdfUrl,
          image_url: imageUrl,
          is_live_recording: postType === 'live' || isLiveRecording,
          live_recording_title: (postType === 'live' || isLiveRecording) ? title : null,
          live_recording_description: (postType === 'live' || isLiveRecording) ? description : null,
        });

      if (error) throw error;

      setUploadProgress(100);
      toast({ title: 'Success', description: 'Post created successfully!' });
      
      // Reset form
      setContent('');
      setTitle('');
      setDescription('');
      setAudioFile(null);
      setVideoFile(null);
      setPdfFile(null);
      setImageFile(null);
      setIsLiveRecording(false);
      
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Admin Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={postType} onValueChange={setPostType}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-1">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-1">
              <FileIcon className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-1">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Live</span>
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {/* Live Recording Fields */}
            {postType === 'live' && (
              <>
                <Input
                  placeholder="Recording Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                  placeholder="Recording Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </>
            )}

            {/* Content textarea */}
            <Textarea
              placeholder="Write your post content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
            />

            {/* File upload sections */}
            <TabsContent value="audio" className="mt-0">
              <div className="space-y-2">
                <input
                  ref={audioRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                />
                <Button
                  variant="outline"
                  onClick={() => audioRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {audioFile ? audioFile.name : 'Upload Audio File'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <div className="space-y-2">
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                <Button
                  variant="outline"
                  onClick={() => videoRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {videoFile ? videoFile.name : 'Upload Video File'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pdf" className="mt-0">
              <div className="space-y-2">
                <input
                  ref={pdfRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <Button
                  variant="outline"
                  onClick={() => pdfRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {pdfFile ? pdfFile.name : 'Upload PDF File'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="live" className="mt-0">
              <div className="space-y-2">
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                <Button
                  variant="outline"
                  onClick={() => videoRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {videoFile ? videoFile.name : 'Upload Live Recording'}
                </Button>
              </div>
            </TabsContent>

            {/* Optional image upload for all types */}
            <div className="space-y-2">
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => imageRef.current?.click()}
                className="text-muted-foreground"
              >
                <Upload className="h-4 w-4 mr-2" />
                {imageFile ? imageFile.name : 'Add Cover Image (optional)'}
              </Button>
            </div>

            {/* Upload progress */}
            {uploadProgress > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={!content.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post
              </Button>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPostCreator;
