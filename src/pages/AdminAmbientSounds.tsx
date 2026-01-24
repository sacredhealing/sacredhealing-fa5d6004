import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, CloudRain, Gem, Circle, AudioLines, Save, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AmbientSound {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  audio_url: string | null;
  icon_name: string;
  is_active: boolean;
  order_index: number;
}

const iconOptions = [
  { value: 'cloud-rain', label: 'Rain', icon: CloudRain },
  { value: 'gem', label: 'Crystal', icon: Gem },
  { value: 'circle', label: 'Om', icon: Circle },
  { value: 'music', label: 'Music', icon: AudioLines },
];

const AdminAmbientSounds: React.FC = () => {
  const navigate = useNavigate();
  const [sounds, setSounds] = useState<AmbientSound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSound, setEditingSound] = useState<AmbientSound | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon_name: 'music',
    is_active: true,
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSounds();
  }, []);

  const fetchSounds = async () => {
    const { data, error } = await supabase
      .from('ambient_sounds')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sounds:', error);
      toast.error('Failed to load ambient sounds');
    } else {
      setSounds((data as AmbientSound[]) || []);
    }
    setIsLoading(false);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleFileUpload = async (file: File, soundId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `ambient/${soundId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('audio').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error('Please enter a name');
      return;
    }

    setIsUploading(true);
    try {
      const slug = formData.slug || generateSlug(formData.name);
      const maxOrder = Math.max(...sounds.map(s => s.order_index), -1);

      // First insert the sound without audio URL
      const { data: newSound, error } = await supabase
        .from('ambient_sounds')
        .insert({
          name: formData.name,
          slug,
          description: formData.description || null,
          icon_name: formData.icon_name,
          is_active: formData.is_active,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload audio if provided
      if (audioFile && newSound) {
        const audioUrl = await handleFileUpload(audioFile, (newSound as AmbientSound).id);
        if (audioUrl) {
          await supabase
            .from('ambient_sounds')
            .update({ audio_url: audioUrl })
            .eq('id', (newSound as AmbientSound).id);
        }
      }

      toast.success('Ambient sound added');
      setShowAddDialog(false);
      resetForm();
      fetchSounds();
    } catch (error) {
      console.error('Error adding sound:', error);
      toast.error('Failed to add ambient sound');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSound) return;

    setIsUploading(true);
    try {
      let audioUrl = editingSound.audio_url;

      // Upload new audio if provided
      if (audioFile) {
        const newUrl = await handleFileUpload(audioFile, editingSound.id);
        if (newUrl) audioUrl = newUrl;
      }

      const { error } = await supabase
        .from('ambient_sounds')
        .update({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description || null,
          icon_name: formData.icon_name,
          is_active: formData.is_active,
          audio_url: audioUrl,
        })
        .eq('id', editingSound.id);

      if (error) throw error;

      toast.success('Ambient sound updated');
      setEditingSound(null);
      resetForm();
      fetchSounds();
    } catch (error) {
      console.error('Error updating sound:', error);
      toast.error('Failed to update ambient sound');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ambient sound?')) return;

    const { error } = await supabase
      .from('ambient_sounds')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete sound');
    } else {
      toast.success('Ambient sound deleted');
      fetchSounds();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon_name: 'music',
      is_active: true,
    });
    setAudioFile(null);
  };

  const startEdit = (sound: AmbientSound) => {
    setEditingSound(sound);
    setFormData({
      name: sound.name,
      slug: sound.slug,
      description: sound.description || '',
      icon_name: sound.icon_name,
      is_active: sound.is_active,
    });
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option?.icon || AudioLines;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-heading font-bold">Ambient Sounds</h1>
            <p className="text-sm text-muted-foreground">Manage background audio loops</p>
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Sound
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ambient Sound</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Temple Rain"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Gentle rain for relaxation"
                  rows={2}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <Select
                  value={formData.icon_name}
                  onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audio File</Label>
                <div className="mt-1">
                  <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {audioFile ? audioFile.name : 'Choose audio file...'}
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAdd}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Uploading...' : 'Add Sound'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sound List */}
      <div className="space-y-3">
        {sounds.map((sound) => {
          const IconComponent = getIconComponent(sound.icon_name);
          
          return (
            <Card key={sound.id} className={!sound.is_active ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{sound.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {sound.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sound.audio_url ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {sound.audio_url ? 'Has Audio' : 'No Audio'}
                      </span>
                      {!sound.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(sound)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sound.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sounds.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AudioLines className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No ambient sounds yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Sound" to create your first ambient loop
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSound} onOpenChange={(open) => !open && setEditingSound(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ambient Sound</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Select
                value={formData.icon_name}
                onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Replace Audio File</Label>
              <div className="mt-1">
                <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {audioFile ? audioFile.name : editingSound?.audio_url ? 'Replace current audio...' : 'Choose audio file...'}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingSound(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAmbientSounds;
