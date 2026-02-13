import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Music, Trash2, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AudioUpload from '@/components/admin/AudioUpload';

interface Mantra {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  shc_reward: number;
  is_active: boolean;
  category: string;
  planet_type: string | null;
}

const AdminMantras = () => {
  const navigate = useNavigate();
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audio_url: '',
    cover_image_url: '',
    duration_seconds: 180,
    shc_reward: 111,
    is_active: true,
    category: 'general',
    planet_type: null as string | null,
  });

  useEffect(() => {
    fetchMantras();
  }, []);

  const fetchMantras = async () => {
    const { data, error } = await supabase
      .from('mantras')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setMantras(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      audio_url: '',
      cover_image_url: '',
      duration_seconds: 180,
      shc_reward: 111,
      is_active: true,
      category: 'general',
      planet_type: null,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (mantra: Mantra) => {
    setFormData({
      title: mantra.title,
      description: mantra.description || '',
      audio_url: mantra.audio_url,
      cover_image_url: mantra.cover_image_url || '',
      duration_seconds: mantra.duration_seconds,
      shc_reward: mantra.shc_reward,
      is_active: mantra.is_active,
      category: mantra.category || 'general',
      planet_type: mantra.planet_type || null,
    });
    setEditingId(mantra.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.audio_url || !formData.category) {
      toast.error('Please fill in required fields');
      return;
    }

    const saveData: any = {
      title: formData.title,
      description: formData.description || null,
      audio_url: formData.audio_url,
      cover_image_url: formData.cover_image_url || null,
      duration_seconds: formData.duration_seconds,
      shc_reward: formData.shc_reward,
      is_active: formData.is_active,
      category: formData.category,
    };

    // Only include planet_type if category is 'planet'
    if (formData.category === 'planet' && formData.planet_type) {
      saveData.planet_type = formData.planet_type;
    } else {
      saveData.planet_type = null;
    }

    if (editingId) {
      const { error } = await supabase
        .from('mantras')
        .update(saveData)
        .eq('id', editingId);

      if (error) {
        toast.error('Failed to update mantra');
      } else {
        toast.success('Mantra updated');
        resetForm();
        fetchMantras();
      }
    } else {
      const { error } = await supabase
        .from('mantras')
        .insert(saveData);

      if (error) {
        toast.error('Failed to add mantra');
      } else {
        toast.success('Mantra added');
        resetForm();
        fetchMantras();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mantra?')) return;

    const { error } = await supabase
      .from('mantras')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete mantra');
    } else {
      toast.success('Mantra deleted');
      fetchMantras();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('mantras')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (!error) {
      fetchMantras();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manage Mantras</h1>
            <p className="text-sm text-muted-foreground">{mantras.length} mantras</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Add Button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full mb-4">
            <Plus className="w-4 h-4 mr-2" />
            Add New Mantra
          </Button>
        )}

        {/* Form */}
        {showForm && (
          <Card className="p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{editingId ? 'Edit Mantra' : 'Add Mantra'}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Om Namah Shivaya"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A powerful mantra for..."
                />
              </div>

              <div>
                <Label>Mantra Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value, planet_type: value !== 'planet' ? null : formData.planet_type })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planet">Planet</SelectItem>
                    <SelectItem value="deity">Deity</SelectItem>
                    <SelectItem value="intention">Intention</SelectItem>
                    <SelectItem value="karma">Karma</SelectItem>
                    <SelectItem value="wealth">Wealth</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="peace">Peace of Mind</SelectItem>
                    <SelectItem value="protection">Protection</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.category === 'planet' && (
                <div>
                  <Label>Planet Type (optional)</Label>
                  <Select
                    value={formData.planet_type || ''}
                    onValueChange={(value) => setFormData({ ...formData, planet_type: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select planet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sun">Sun</SelectItem>
                      <SelectItem value="moon">Moon</SelectItem>
                      <SelectItem value="mars">Mars</SelectItem>
                      <SelectItem value="mercury">Mercury</SelectItem>
                      <SelectItem value="jupiter">Jupiter</SelectItem>
                      <SelectItem value="venus">Venus</SelectItem>
                      <SelectItem value="saturn">Saturn</SelectItem>
                      <SelectItem value="rahu">Rahu</SelectItem>
                      <SelectItem value="ketu">Ketu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <AudioUpload
                value={formData.audio_url}
                onChange={(url) => setFormData({ ...formData, audio_url: url })}
                folder="mantras"
                label="Audio File *"
              />

              <div>
                <Label>Cover Image URL</Label>
                <Input
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 180 })}
                  />
                </div>
                <div>
                  <Label>SHC Reward</Label>
                  <Input
                    type="number"
                    value={formData.shc_reward}
                    onChange={(e) => setFormData({ ...formData, shc_reward: parseInt(e.target.value) || 111 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Save'} Mantra
              </Button>
            </div>
          </Card>
        )}

        {/* List */}
        <div className="space-y-3">
          {mantras.map((mantra) => (
            <Card key={mantra.id} className={`p-4 ${!mantra.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{mantra.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(mantra.duration_seconds / 60)}:{(mantra.duration_seconds % 60).toString().padStart(2, '0')} • {mantra.shc_reward} SHC
                    {mantra.category && ` • ${mantra.category.charAt(0).toUpperCase() + mantra.category.slice(1)}${mantra.planet_type ? ` (${mantra.planet_type})` : ''}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(mantra)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(mantra.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMantras;
