import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Music, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Meditation {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  audio_url: string;
  category: string;
  is_premium: boolean;
  shc_reward: number;
}

const categories = ['morning', 'sleep', 'healing', 'focus', 'nature', 'general'];

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('10');
  const [category, setCategory] = useState('general');
  const [isPremium, setIsPremium] = useState(false);
  const [shcReward, setShcReward] = useState('5');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    const { data, error } = await supabase
      .from('meditations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meditations:', error);
    } else {
      setMeditations(data || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !title) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and audio file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload audio file
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('meditations')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meditations')
        .getPublicUrl(fileName);

      // Insert meditation record
      const { error: insertError } = await supabase
        .from('meditations')
        .insert({
          title,
          description: description || null,
          duration_minutes: parseInt(duration),
          audio_url: publicUrl,
          category,
          is_premium: isPremium,
          shc_reward: parseInt(shcReward)
        });

      if (insertError) throw insertError;

      toast({
        title: "Meditation added!",
        description: `"${title}" has been uploaded successfully`
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDuration('10');
      setCategory('general');
      setIsPremium(false);
      setShcReward('5');
      setAudioFile(null);
      
      // Refresh list
      fetchMeditations();

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

  const handleDelete = async (id: string, audioUrl: string) => {
    if (!confirm('Are you sure you want to delete this meditation?')) return;

    try {
      // Extract filename from URL
      const fileName = audioUrl.split('/').pop();
      
      // Delete from storage
      if (fileName) {
        await supabase.storage.from('meditations').remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('meditations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Meditation removed successfully"
      });

      fetchMeditations();
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your content</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => {}}
          >
            <Music size={24} className="text-primary" />
            <span>Meditations</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate('/admin/music')}
          >
            <Music size={24} className="text-accent" />
            <span>Music Store</span>
          </Button>
        </div>

        {/* Upload Form */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus size={20} />
            Add New Meditation
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Morning Awakening"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Duration (minutes)</label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">SHC Reward</label>
                <Input
                  type="number"
                  value={shcReward}
                  onChange={(e) => setShcReward(e.target.value)}
                  min="0"
                  className="bg-muted/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A gentle meditation to start your day..."
                className="bg-muted/50"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">Premium content</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Audio File *</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 h-20 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {audioFile ? audioFile.name : 'Click to upload MP3, WAV, etc.'}
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
                  Upload Meditation
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Meditations List */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
            Your Meditations ({meditations.length})
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : meditations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No meditations yet. Upload your first one above!
            </p>
          ) : (
            <div className="space-y-3">
              {meditations.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center gap-4 p-4 bg-gradient-card border border-border/50 rounded-xl"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Music size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{med.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {med.duration_minutes} min • {med.category} • +{med.shc_reward} SHC
                      {med.is_premium && ' • Premium'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(med.id, med.audio_url)}
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

export default Admin;
