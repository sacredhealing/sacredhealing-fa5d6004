import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Music, Loader2, ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration_seconds: number;
  price_usd: number;
  price_shc: number;
  purchase_count: number;
}

const GENRES = ['beats', 'meditation', 'mystic', 'reggae', 'hip-hop', 'reggaeton', 'indian', 'shamanic'];

// Helper functions for duration conversion
const parseDuration = (timeStr: string): number => {
  const parts = timeStr.split(':').map(p => parseInt(p) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AdminMusic: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Sacred Healing');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('beats');
  const [durationInput, setDurationInput] = useState('3:00');
  const [priceUsd, setPriceUsd] = useState('2.99');
  const [bpm, setBpm] = useState('');
  const [shcReward, setShcReward] = useState('10');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [fullFile, setFullFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tracks:', error);
    } else {
      setTracks(data || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!previewFile || !fullFile || !title) {
      toast({
        title: "Missing fields",
        description: "Please provide title, preview, and full audio files",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).slice(2);
      
      // Upload preview to songs bucket
      const previewExt = previewFile.name.split('.').pop();
      const previewName = `${timestamp}-${randomId}-preview.${previewExt}`;
      
      const { error: previewError } = await supabase.storage
        .from('songs')
        .upload(previewName, previewFile, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: previewFile.type || 'audio/mpeg'
        });

      if (previewError) throw previewError;

      // Upload full track to songs bucket
      const fullExt = fullFile.name.split('.').pop();
      const fullName = `${timestamp}-${randomId}-full.${fullExt}`;
      
      const { error: fullError } = await supabase.storage
        .from('songs')
        .upload(fullName, fullFile, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: fullFile.type || 'audio/mpeg'
        });

      if (fullError) throw fullError;

      // Get public URLs
      const { data: { publicUrl: previewUrl } } = supabase.storage
        .from('songs')
        .getPublicUrl(previewName);

      const { data: { publicUrl: fullUrl } } = supabase.storage
        .from('songs')
        .getPublicUrl(fullName);

      // Insert track record
      const { error: insertError } = await supabase
        .from('music_tracks')
        .insert({
          title,
          artist,
          description: description || null,
          genre,
          duration_seconds: parseDuration(durationInput),
          preview_url: previewUrl,
          full_audio_url: fullUrl,
          price_usd: parseFloat(priceUsd),
          bpm: bpm ? parseInt(bpm) : null,
          shc_reward: parseInt(shcReward)
        });

      if (insertError) throw insertError;

      toast({
        title: "Track added!",
        description: `"${title}" has been uploaded successfully`
      });

      // Reset form
      setTitle('');
      setArtist('Sacred Healing');
      setDescription('');
      setGenre('beats');
      setDurationInput('3:00');
      setPriceUsd('2.99');
      setBpm('');
      setShcReward('10');
      setPreviewFile(null);
      setFullFile(null);
      
      fetchTracks();

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;

    try {
      const { error } = await supabase
        .from('music_tracks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Track removed successfully"
      });

      fetchTracks();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Music Manager</h1>
            <p className="text-muted-foreground">Upload beats & songs for sale</p>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus size={20} />
            Add New Track
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Healing Frequencies 432Hz"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Artist</label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Sacred Healing"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                >
                  {GENRES.map(g => (
                    <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Duration (mm:ss)</label>
                <Input
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="3:42"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Price (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  min="0"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">BPM (optional)</label>
                <Input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  min="40"
                  max="300"
                  placeholder="120"
                  className="bg-muted/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A powerful healing track with 432Hz frequencies..."
                className="bg-muted/50"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">30-Second Preview *</label>
                <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Upload size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {previewFile ? previewFile.name : 'Preview clip (30s)'}
                  </span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Full Track *</label>
                <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setFullFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Upload size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {fullFile ? fullFile.name : 'Full audio file'}
                  </span>
                </label>
              </div>
            </div>
            
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Track
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Tracks List */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
            Your Tracks ({tracks.length})
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tracks yet. Upload your first one above!
            </p>
          ) : (
            <div className="space-y-3">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-4 bg-gradient-card border border-border/50 rounded-xl"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Music size={20} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{track.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {track.artist} • {track.genre} • {formatDuration(track.duration_seconds)}
                    </p>
                    <p className="text-xs text-accent">
                      ${track.price_usd} • {track.purchase_count} sales • {(track as any).play_count || 0} plays
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(track.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMusic;
