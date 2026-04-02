import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Music, Loader2, ArrowLeft, Edit2, X, Image, Check, Disc, Sparkles, AlertCircle, Clock, RefreshCw, Filter, CheckSquare, Square, Eye } from 'lucide-react';
import AlbumManager from '@/components/admin/AlbumManager';
import { TrackAnalysisSection } from '@/components/admin/TrackAnalysisSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  auto_analysis_data?: any | null;
  // Analysis fields
  mood?: string | null;
  spiritual_path?: string | null;
  intended_use?: string | null;
  affirmation?: string | null;
  creator_notes?: string | null;
  energy_level?: string | null;
  rhythm_type?: string | null;
  vocal_type?: string | null;
  frequency_band?: string | null;
  best_time_of_day?: string | null;
  spiritual_description?: string | null;
  auto_generated_description?: string | null;
  auto_generated_affirmation?: string | null;
  analysis_status?: string | null;
  analysis_completed_at?: string | null;
}

const GENRES = ['beats', 'meditation', 'mystic', 'reggae', 'hip-hop', 'reggaeton', 'indian', 'shamanic'];
const ACCESS_TIERS = [
  { value: 'prana_flow', label: 'Prana Flow' },
  { value: 'siddha_quantum', label: 'Siddha Quantum' },
  { value: 'akashainfinity', label: 'AkashaInfinity' },
] as const;

type AccessTier = typeof ACCESS_TIERS[number]['value'];

const getTrackAccessTier = (track: MusicTrack): AccessTier => {
  const v = track?.auto_analysis_data?.access_tier as string | undefined;
  if (v === 'prana_flow' || v === 'siddha_quantum' || v === 'akashainfinity') return v;
  return 'prana_flow';
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Tracks' },
  { value: 'pending', label: 'Pending Analysis' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'completed', label: 'Needs Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'failed', label: 'Failed' },
];

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
  
  // Filter and selection state
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [previewTrack, setPreviewTrack] = useState<MusicTrack | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Siddha Quantum Nexus');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('beats');
  const [durationInput, setDurationInput] = useState('3:00');
  const [priceUsd, setPriceUsd] = useState('2.99');
  const [bpm, setBpm] = useState('');
  const [shcReward, setShcReward] = useState('10');
  const [accessTier, setAccessTier] = useState<AccessTier>('prana_flow');
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
  const [editAccessTier, setEditAccessTier] = useState<AccessTier>('prana_flow');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editPreviewFile, setEditPreviewFile] = useState<File | null>(null);
  const [editFullFile, setEditFullFile] = useState<File | null>(null);
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

  const filteredTracks = tracks.filter(track => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return !track.analysis_status || track.analysis_status === 'pending';
    return track.analysis_status === statusFilter;
  });

  const toggleTrackSelection = (trackId: string) => {
    const newSelection = new Set(selectedTracks);
    if (newSelection.has(trackId)) {
      newSelection.delete(trackId);
    } else {
      newSelection.add(trackId);
    }
    setSelectedTracks(newSelection);
  };

  const selectAllVisible = () => {
    const newSelection = new Set(filteredTracks.map(t => t.id));
    setSelectedTracks(newSelection);
  };

  const clearSelection = () => {
    setSelectedTracks(new Set());
  };

  const triggerAnalysis = async (track: MusicTrack) => {
    try {
      const response = await supabase.functions.invoke('analyze-music-track', {
        body: {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          duration_seconds: track.duration_seconds,
          bpm: track.bpm,
          description: track.description,
        },
      });

      if (response.error) throw response.error;
      return true;
    } catch (error) {
      console.error('Analysis failed for track:', track.id, error);
      return false;
    }
  };

  const bulkAnalyze = async () => {
    if (selectedTracks.size === 0) return;
    setIsBulkProcessing(true);

    const tracksToAnalyze = tracks.filter(t => selectedTracks.has(t.id));
    let successCount = 0;

    for (const track of tracksToAnalyze) {
      const success = await triggerAnalysis(track);
      if (success) successCount++;
    }

    toast({
      title: 'Bulk Analysis Started',
      description: `Started analysis for ${successCount}/${tracksToAnalyze.length} tracks`,
    });

    setIsBulkProcessing(false);
    clearSelection();
    fetchTracks();
  };

  const bulkApprove = async () => {
    if (selectedTracks.size === 0) return;
    setIsBulkProcessing(true);

    const { error } = await supabase
      .from('music_tracks')
      .update({ 
        analysis_status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .in('id', Array.from(selectedTracks))
      .eq('analysis_status', 'completed');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Approved', description: `Approved ${selectedTracks.size} tracks` });
    }

    setIsBulkProcessing(false);
    clearSelection();
    fetchTracks();
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
    
    if (!title || (!previewFile && !fullFile)) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and at least one audio file (preview or full)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).slice(2);
      
      let previewUrl: string | null = null;
      let fullUrl: string | null = null;

      // Upload preview if provided
      if (previewFile) {
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
        previewUrl = supabase.storage.from('songs').getPublicUrl(previewName).data.publicUrl;
      }

      // Upload full track if provided
      if (fullFile) {
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
        fullUrl = supabase.storage.from('songs').getPublicUrl(fullName).data.publicUrl;
      }

      // If only one file was provided, reuse it for the other
      if (!previewUrl && fullUrl) previewUrl = fullUrl;
      if (!fullUrl && previewUrl) fullUrl = previewUrl;

      // Upload cover image if provided
      let coverUrl: string | null = null;
      if (coverFile) {
        coverUrl = await uploadImage(coverFile);
      }

      // Insert track record with pending analysis status
      const { data: insertedTrack, error: insertError } = await supabase
        .from('music_tracks')
        .insert({
          title,
          artist,
          description: description || null,
          genre,
          duration_seconds: parseDuration(durationInput),
          preview_url: previewUrl!,
          full_audio_url: fullUrl!,
          cover_image_url: coverUrl,
          price_usd: parseFloat(priceUsd),
          bpm: bpm ? parseInt(bpm) : null,
          shc_reward: parseInt(shcReward),
          analysis_status: 'pending',
          auto_analysis_data: { access_tier: accessTier },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Track added!",
        description: `"${title}" has been uploaded. Starting AI analysis...`
      });

      // Auto-trigger AI analysis
      if (insertedTrack) {
        try {
          await supabase.functions.invoke('analyze-music-track', {
            body: {
              trackId: insertedTrack.id,
              title: insertedTrack.title,
              artist: insertedTrack.artist,
              genre: insertedTrack.genre,
              duration_seconds: insertedTrack.duration_seconds,
              bpm: insertedTrack.bpm,
              description: insertedTrack.description,
            },
          });
          toast({
            title: "Analysis Started",
            description: "AI is generating spiritual metadata for your track"
          });
        } catch (analysisError) {
          console.error('Auto-analysis failed:', analysisError);
          toast({
            title: "Analysis Pending",
            description: "Track uploaded. You can manually trigger analysis later.",
            variant: "default"
          });
        }
      }

      // Reset form
      setTitle('');
      setArtist('Siddha Quantum Nexus');
      setDescription('');
      setGenre('beats');
      setDurationInput('3:00');
      setPriceUsd('2.99');
      setBpm('');
      setShcReward('10');
      setAccessTier('prana_flow');
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
    setEditAccessTier(getTrackAccessTier(track));
    setEditCoverFile(null);
  };

  const cancelEditing = () => {
    setEditingTrack(null);
    setEditCoverFile(null);
    setEditPreviewFile(null);
    setEditFullFile(null);
  };

  const uploadAudioFile = async (file: File, suffix: string): Promise<string> => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2);
    const ext = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomId}-${suffix}.${ext}`;
    
    const { error } = await supabase.storage
      .from('songs')
      .upload(fileName, file, { 
        cacheControl: '3600', 
        upsert: false,
        contentType: file.type || 'audio/mpeg'
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('songs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const saveEdit = async () => {
    if (!editingTrack) return;
    setIsSaving(true);

    try {
      let coverUrl = editingTrack.cover_image_url;
      let previewUrl = editingTrack.preview_url;
      let fullUrl = editingTrack.full_audio_url;
      
      if (editCoverFile) {
        coverUrl = await uploadImage(editCoverFile);
      }

      if (editPreviewFile) {
        previewUrl = await uploadAudioFile(editPreviewFile, 'preview');
      }

      if (editFullFile) {
        fullUrl = await uploadAudioFile(editFullFile, 'full');
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
          cover_image_url: coverUrl,
          preview_url: previewUrl,
          full_audio_url: fullUrl,
          auto_analysis_data: {
            ...(editingTrack.auto_analysis_data || {}),
            access_tier: editAccessTier,
          },
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

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: tracks.length,
      pending: 0,
      analyzing: 0,
      completed: 0,
      approved: 0,
      failed: 0,
    };

    tracks.forEach(track => {
      const status = track.analysis_status || 'pending';
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts.pending++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Music Manager</h1>
            <p className="text-muted-foreground">Upload tracks & albums for sale</p>
          </div>
        </div>

        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tracks" className="flex items-center gap-2">
              <Music size={16} />
              Tracks
            </TabsTrigger>
            <TabsTrigger value="albums" className="flex items-center gap-2">
              <Disc size={16} />
              Albums
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks">
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
                  placeholder="Siddha Quantum Nexus"
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
                <label className="block text-sm text-muted-foreground mb-1">Portal / Tier</label>
                <select
                  value={accessTier}
                  onChange={(e) => setAccessTier(e.target.value as AccessTier)}
                  className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                >
                  {ACCESS_TIERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
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
                <label className="block text-sm text-muted-foreground mb-1">30-Second Preview (optional)</label>
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
            
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Auto-Analysis:</strong> After upload, AI will automatically generate mood, spiritual path, intended use, and affirmation for this track.
              </p>
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

        {/* Filters and Bulk Actions */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(filter => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className="text-xs"
                >
                  {filter.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {statusCounts[filter.value] || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTracks.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/50">
              <span className="text-sm font-medium">{selectedTracks.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkAnalyze}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles size={14} className="mr-1" />}
                Analyze Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkApprove}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
                Approve Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
          )}

          {filteredTracks.length > 0 && selectedTracks.size === 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={selectAllVisible}>
                <CheckSquare size={14} className="mr-1" />
                Select All Visible ({filteredTracks.length})
              </Button>
            </div>
          )}
        </div>

        {/* Tracks List */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
            {statusFilter === 'all' ? 'All Tracks' : STATUS_FILTERS.find(f => f.value === statusFilter)?.label} ({filteredTracks.length})
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredTracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {statusFilter === 'all' ? 'No tracks yet. Upload your first one above!' : `No tracks with status "${statusFilter}"`}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className={`bg-gradient-card border rounded-xl overflow-hidden transition-colors ${
                    selectedTracks.has(track.id) ? 'border-primary' : 'border-border/50'
                  }`}
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
                        <select
                          value={editAccessTier}
                          onChange={(e) => setEditAccessTier(e.target.value as AccessTier)}
                          className="h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                        >
                          {ACCESS_TIERS.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
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
                      
                      <div className="flex flex-wrap items-center gap-3">
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
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setEditPreviewFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <Upload size={16} />
                            <span className="text-sm">{editPreviewFile ? editPreviewFile.name : 'Change preview'}</span>
                          </div>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setEditFullFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <Upload size={16} />
                            <span className="text-sm">{editFullFile ? editFullFile.name : 'Change full track'}</span>
                          </div>
                        </label>
                        
                        {track.cover_image_url && (
                          <img src={track.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        )}
                      </div>
                      
                      {/* Spiritual Context Analysis Section */}
                      <TrackAnalysisSection 
                        track={track} 
                        onUpdate={fetchTracks} 
                      />
                      
                      <div className="flex gap-2 mt-4">
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
                      {/* Selection checkbox */}
                      <button
                        onClick={() => toggleTrackSelection(track.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {selectedTracks.has(track.id) ? (
                          <CheckSquare size={20} className="text-primary" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                      
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
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-accent">
                            ${track.price_usd} • {track.purchase_count} sales
                          </span>
                        <Badge variant="secondary" className="text-xs">
                          {ACCESS_TIERS.find(t => t.value === getTrackAccessTier(track))?.label ?? 'Prana Flow'}
                        </Badge>
                          {/* Analysis status badge */}
                          {track.analysis_status === 'approved' && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs"><Check className="w-3 h-3 mr-1" />Approved</Badge>
                          )}
                          {track.analysis_status === 'completed' && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-xs"><AlertCircle className="w-3 h-3 mr-1" />Needs Review</Badge>
                          )}
                          {track.analysis_status === 'analyzing' && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Analyzing</Badge>
                          )}
                          {track.analysis_status === 'failed' && (
                            <Badge className="bg-red-500/20 text-red-400 text-xs"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>
                          )}
                          {(!track.analysis_status || track.analysis_status === 'pending') && (
                            <Badge className="bg-muted text-muted-foreground text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                          )}
                          {/* Path badge */}
                          {track.spiritual_path && (
                            <Badge variant="outline" className="text-xs">{track.spiritual_path}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Quick preview button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewTrack(track)}
                          title="Quick Preview"
                        >
                          <Eye size={18} />
                        </Button>
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
          </TabsContent>

          <TabsContent value="albums">
            <AlbumManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Preview Dialog */}
      <Dialog open={!!previewTrack} onOpenChange={() => setPreviewTrack(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Preview</DialogTitle>
          </DialogHeader>
          {previewTrack && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {previewTrack.cover_image_url ? (
                  <img src={previewTrack.cover_image_url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <Music size={24} className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{previewTrack.title}</h3>
                  <p className="text-sm text-muted-foreground">{previewTrack.artist}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {previewTrack.mood && <Badge variant="secondary" className="text-xs">{previewTrack.mood}</Badge>}
                    {previewTrack.spiritual_path && <Badge variant="outline" className="text-xs">{previewTrack.spiritual_path}</Badge>}
                    {previewTrack.intended_use && <Badge variant="outline" className="text-xs">{previewTrack.intended_use}</Badge>}
                  </div>
                </div>
              </div>

              {previewTrack.auto_generated_description && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">AI-Generated Description</p>
                  <p className="text-sm">{previewTrack.auto_generated_description}</p>
                </div>
              )}

              {previewTrack.auto_generated_affirmation && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Affirmation</p>
                  <p className="text-sm italic">"{previewTrack.auto_generated_affirmation}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Energy:</span>{' '}
                  <span className="capitalize">{previewTrack.energy_level || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Best Time:</span>{' '}
                  <span className="capitalize">{previewTrack.best_time_of_day || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rhythm:</span>{' '}
                  <span className="capitalize">{previewTrack.rhythm_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vocal:</span>{' '}
                  <span className="capitalize">{previewTrack.vocal_type || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => { setPreviewTrack(null); startEditing(previewTrack); }}>
                  <Edit2 size={16} className="mr-1" />
                  Edit Full Details
                </Button>
                {previewTrack.analysis_status === 'completed' && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase
                        .from('music_tracks')
                        .update({ analysis_status: 'approved', approved_at: new Date().toISOString() })
                        .eq('id', previewTrack.id);
                      setPreviewTrack(null);
                      fetchTracks();
                    }}
                  >
                    <Check size={16} className="mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMusic;
