import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Music, Loader2, ArrowLeft, Edit2, X, Image, Check } from 'lucide-react';
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
  play_count: number;
  bpm: number | null;
  description: string | null;
  cover_image_url: string | null;
  preview_url: string;
  full_audio_url: string;
}

const GENRES = ['beats', 'meditation', 'mystic', 'reggae', 'hip-hop', 'reggaeton', 'indian', 'shamanic'];

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
  
  // Form state
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
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Edit state
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editBpm, setEditBpm] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const uploadImage = async (file: File): Promise<string | null> => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2);
    const ext = file.name.split('.').pop();
    const fileName = `covers/${timestamp}-${randomId}.${ext}`;
    
    const { error } = await supabase.storage
      .from('songs')
      .upload(fileName, file, { 
        cacheControl: '3600', 
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('songs')
      .getPublicUrl(fileName);

    return publicUrl;
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
      
      // Upload preview
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

      // Upload full track
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

      // Upload cover image if provided
      let coverUrl: string | null = null;
      if (coverFile) {
        coverUrl = await uploadImage(coverFile);
      }

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
          cover_image_url: coverUrl,
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
      setCoverFile(null);
      
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

  const startEditing = (track: MusicTrack) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditDescription(track.description || '');
    setEditGenre(track.genre);
    setEditDuration(formatDuration(track.duration_seconds));
    setEditPrice(track.price_usd.toString());
    setEditBpm(track.bpm?.toString() || '');
    setEditCoverFile(null);
  };

  const cancelEditing = () => {
    setEditingTrack(null);
    setEditCoverFile(null);
  };

  const saveEdit = async () => {
    if (!editingTrack) return;
    setIsSaving(true);

    try {
      let coverUrl = editingTrack.cover_image_url;
      
      if (editCoverFile) {
        coverUrl = await uploadImage(editCoverFile);
      }

      const { error } = await supabase
        .from('music_tracks')
        .update({
          title: editTitle,
          artist: editArtist,
          description: editDescription || null,
          genre: editGenre,
          duration_seconds: parseDuration(editDuration),
          price_usd: parseFloat(editPrice),
          bpm: editBpm ? parseInt(editBpm) : null,
          cover_image_url: coverUrl
        })
        .eq('id', editingTrack.id);

      if (error) throw error;

      toast({ title: "Track updated!" });
      cancelEditing();
      fetchTracks();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Cover Image</label>
                <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Image size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate px-2">
                    {coverFile ? coverFile.name : 'Album cover'}
                  </span>
                </label>
              </div>
              
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
                  <span className="text-sm text-muted-foreground truncate px-2">
                    {previewFile ? previewFile.name : 'Preview (30s)'}
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
                  <span className="text-sm text-muted-foreground truncate px-2">
                    {fullFile ? fullFile.name : 'Full audio'}
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
                  className="bg-gradient-card border border-border/50 rounded-xl overflow-hidden"
                >
                  {editingTrack?.id === track.id ? (
                    // Edit mode
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Edit Track</span>
                        <Button variant="ghost" size="icon" onClick={cancelEditing}>
                          <X size={18} />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title"
                          className="bg-muted/50"
                        />
                        <Input
                          value={editArtist}
                          onChange={(e) => setEditArtist(e.target.value)}
                          placeholder="Artist"
                          className="bg-muted/50"
                        />
                        <select
                          value={editGenre}
                          onChange={(e) => setEditGenre(e.target.value)}
                          className="h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                        >
                          {GENRES.map(g => (
                            <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}</option>
                          ))}
                        </select>
                        <Input
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          placeholder="Duration (mm:ss)"
                          className="bg-muted/50"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="Price USD"
                          className="bg-muted/50"
                        />
                        <Input
                          type="number"
                          value={editBpm}
                          onChange={(e) => setEditBpm(e.target.value)}
                          placeholder="BPM"
                          className="bg-muted/50"
                        />
                      </div>
                      
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        className="bg-muted/50"
                      />
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <Image size={16} />
                            <span className="text-sm">{editCoverFile ? editCoverFile.name : 'Change cover'}</span>
                          </div>
                        </label>
                        
                        {track.cover_image_url && (
                          <img src={track.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} disabled={isSaving} className="flex-1">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        {track.cover_image_url ? (
                          <img src={track.cover_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={20} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{track.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artist} • {track.genre.replace('-', ' ')} • {formatDuration(track.duration_seconds)}
                        </p>
                        <p className="text-xs text-accent">
                          ${track.price_usd} • {track.purchase_count} sales • {track.play_count || 0} plays
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(track)}
                        >
                          <Edit2 size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(track.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  )}
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