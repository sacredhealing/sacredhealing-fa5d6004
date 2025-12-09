import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Image, Music, X, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Album {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  cover_image_url: string | null;
  price_usd: number;
  release_date: string | null;
}

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
}

interface AlbumTrack {
  track_id: string;
  order_index: number;
}

const AlbumManager: React.FC = () => {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Sacred Healing');
  const [description, setDescription] = useState('');
  const [priceUsd, setPriceUsd] = useState('9.99');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  
  // Edit state
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editSelectedTracks, setEditSelectedTracks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch albums
    const { data: albumsData } = await supabase
      .from('music_albums')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Fetch all tracks for selection
    const { data: tracksData } = await supabase
      .from('music_tracks')
      .select('id, title, artist, duration_seconds')
      .order('title');
    
    setAlbums(albumsData || []);
    setTracks(tracksData || []);
    setIsLoading(false);
  };

  const fetchAlbumTracks = async (albumId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('album_tracks')
      .select('track_id')
      .eq('album_id', albumId)
      .order('order_index');
    
    return data?.map(t => t.track_id) || [];
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2);
    const ext = file.name.split('.').pop();
    const fileName = `album-covers/${timestamp}-${randomId}.${ext}`;
    
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || selectedTracks.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please provide title and select at least one track",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        coverUrl = await uploadImage(coverFile);
      }

      // Create album
      const { data: album, error: albumError } = await supabase
        .from('music_albums')
        .insert({
          title,
          artist,
          description: description || null,
          price_usd: parseFloat(priceUsd),
          cover_image_url: coverUrl
        })
        .select()
        .single();

      if (albumError) throw albumError;

      // Add tracks to album
      const albumTracks = selectedTracks.map((trackId, index) => ({
        album_id: album.id,
        track_id: trackId,
        order_index: index
      }));

      const { error: tracksError } = await supabase
        .from('album_tracks')
        .insert(albumTracks);

      if (tracksError) throw tracksError;

      toast({ title: "Album created!", description: `"${title}" with ${selectedTracks.length} tracks` });

      // Reset form
      setTitle('');
      setArtist('Sacred Healing');
      setDescription('');
      setPriceUsd('9.99');
      setCoverFile(null);
      setSelectedTracks([]);
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = async (album: Album) => {
    setEditingAlbum(album);
    setEditTitle(album.title);
    setEditArtist(album.artist);
    setEditDescription(album.description || '');
    setEditPrice(album.price_usd.toString());
    setEditCoverFile(null);
    
    const trackIds = await fetchAlbumTracks(album.id);
    setEditSelectedTracks(trackIds);
  };

  const cancelEditing = () => {
    setEditingAlbum(null);
    setEditCoverFile(null);
    setEditSelectedTracks([]);
  };

  const saveEdit = async () => {
    if (!editingAlbum) return;
    setIsSaving(true);

    try {
      let coverUrl = editingAlbum.cover_image_url;
      if (editCoverFile) {
        coverUrl = await uploadImage(editCoverFile);
      }

      // Update album
      const { error: updateError } = await supabase
        .from('music_albums')
        .update({
          title: editTitle,
          artist: editArtist,
          description: editDescription || null,
          price_usd: parseFloat(editPrice),
          cover_image_url: coverUrl
        })
        .eq('id', editingAlbum.id);

      if (updateError) throw updateError;

      // Update tracks: delete existing and insert new
      await supabase
        .from('album_tracks')
        .delete()
        .eq('album_id', editingAlbum.id);

      if (editSelectedTracks.length > 0) {
        const albumTracks = editSelectedTracks.map((trackId, index) => ({
          album_id: editingAlbum.id,
          track_id: trackId,
          order_index: index
        }));

        await supabase.from('album_tracks').insert(albumTracks);
      }

      toast({ title: "Album updated!" });
      cancelEditing();
      fetchData();
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
    if (!confirm('Are you sure you want to delete this album?')) return;

    try {
      const { error } = await supabase
        .from('music_albums')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Album deleted" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleTrack = (trackId: string, isEditing: boolean) => {
    if (isEditing) {
      setEditSelectedTracks(prev => 
        prev.includes(trackId) 
          ? prev.filter(id => id !== trackId)
          : [...prev, trackId]
      );
    } else {
      setSelectedTracks(prev => 
        prev.includes(trackId) 
          ? prev.filter(id => id !== trackId)
          : [...prev, trackId]
      );
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create Album Form */}
      <div className="bg-gradient-card border border-border/50 rounded-2xl p-6">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus size={20} />
          Create New Album
        </h2>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Album Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sacred Healing Vol. 1"
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
              <label className="block text-sm text-muted-foreground mb-1">Cover Image</label>
              <label className="flex items-center justify-center gap-2 h-10 border border-dashed border-border/50 rounded-md cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Image size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {coverFile ? coverFile.name : 'Upload cover'}
                </span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of healing frequencies..."
              className="bg-muted/50"
            />
          </div>
          
          {/* Track Selection */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Select Tracks * ({selectedTracks.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-border/50 rounded-lg p-2 space-y-1">
              {tracks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tracks available. Upload tracks first.
                </p>
              ) : (
                tracks.map(track => (
                  <div
                    key={track.id}
                    onClick={() => toggleTrack(track.id, false)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTracks.includes(track.id) 
                        ? 'bg-primary/20 border border-primary/50' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedTracks.includes(track.id) 
                        ? 'bg-primary border-primary' 
                        : 'border-border'
                    }`}>
                      {selectedTracks.includes(track.id) && <Check size={14} className="text-primary-foreground" />}
                    </div>
                    <Music size={14} className="text-muted-foreground" />
                    <span className="flex-1 text-sm">{track.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDuration(track.duration_seconds)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Album
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Albums List */}
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
          Your Albums ({albums.length})
        </h2>
        
        {albums.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No albums yet. Create your first one above!
          </p>
        ) : (
          <div className="space-y-3">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-gradient-card border border-border/50 rounded-xl overflow-hidden"
              >
                {editingAlbum?.id === album.id ? (
                  // Edit mode
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-primary">Editing Album</span>
                      <Button variant="ghost" size="icon" onClick={cancelEditing}>
                        <X size={16} />
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
                      <Input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Price"
                        className="bg-muted/50"
                      />
                      <label className="flex items-center gap-2 h-10 px-3 border border-dashed border-border/50 rounded-md cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <Image size={16} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">
                          {editCoverFile ? editCoverFile.name : 'New cover'}
                        </span>
                      </label>
                    </div>
                    
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      className="bg-muted/50"
                    />
                    
                    {/* Track Selection for Edit */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        Tracks ({editSelectedTracks.length} selected)
                      </label>
                      <div className="max-h-36 overflow-y-auto border border-border/50 rounded-lg p-2 space-y-1">
                        {tracks.map(track => (
                          <div
                            key={track.id}
                            onClick={() => toggleTrack(track.id, true)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              editSelectedTracks.includes(track.id) 
                                ? 'bg-primary/20 border border-primary/50' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              editSelectedTracks.includes(track.id) 
                                ? 'bg-primary border-primary' 
                                : 'border-border'
                            }`}>
                              {editSelectedTracks.includes(track.id) && <Check size={14} className="text-primary-foreground" />}
                            </div>
                            <span className="flex-1 text-sm">{track.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} disabled={isSaving} className="flex-1">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center gap-4 p-4">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Music size={24} className="text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{album.title}</h3>
                      <p className="text-sm text-muted-foreground">{album.artist}</p>
                      <p className="text-sm text-primary font-medium">${album.price_usd}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEditing(album)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(album.id)} className="text-destructive">
                        <Trash2 size={16} />
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
  );
};

export default AlbumManager;
