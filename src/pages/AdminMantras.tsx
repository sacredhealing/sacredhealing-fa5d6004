import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Music, Trash2, Edit, Save, X, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AudioUpload from '@/components/admin/AudioUpload';

/** Exact category list for Admin form only. DB stores category id. */
const ADMIN_MANTRA_CATEGORIES = [
  { id: 'planet', label: 'Planets' },
  { id: 'deity', label: 'Deity' },
  { id: 'intention', label: 'Intention' },
  { id: 'karma', label: 'Karma & Healing' },
  { id: 'wealth', label: 'Wealth & Abundance' },
  { id: 'health', label: 'Health & Vitality' },
  { id: 'peace', label: 'Peace & Calm' },
  { id: 'protection', label: 'Protection & Power' },
  { id: 'spiritual', label: 'Spiritual Growth' },
  { id: 'general', label: 'General' },
] as const;

const PLANET_TYPES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;

interface Mantra {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  shc_reward: number;
  is_active: boolean;
  category?: string | null;
  planet_type?: string | null;
  is_premium?: boolean;
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
    is_premium: false,
  });
  const [category, setCategory] = useState('general');
  const [planetType, setPlanetType] = useState('');

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
      is_premium: false,
    });
    setCategory('general');
    setPlanetType('');
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
      is_premium: mantra.is_premium ?? false,
    });
    setCategory((mantra as { category?: string }).category || 'general');
    setPlanetType((mantra as { planet_type?: string | null }).planet_type || '');
    setEditingId(mantra.id);
    setShowForm(true);
  };

  const buildMantraPayload = () => {
    const duration = Number(formData.duration_seconds);
    const shc = Number(formData.shc_reward);
    return {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      audio_url: formData.audio_url.trim(),
      cover_image_url: formData.cover_image_url?.trim() || null,
      duration_seconds: Number.isFinite(duration) && duration > 0 ? duration : 180,
      shc_reward: Number.isFinite(shc) && shc >= 0 ? shc : 111,
      is_active: Boolean(formData.is_active),
      category: category || 'general',
      planet_type: category === 'planet' && planetType?.trim() ? planetType.trim() : null,
      is_premium: Boolean(formData.is_premium),
    };
  };

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.audio_url?.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const payload = buildMantraPayload();

    if (editingId) {
      const { error } = await supabase
        .from('mantras')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        console.error('Mantra update error:', error);
        toast.error(error.message || 'Failed to update mantra');
      } else {
        toast.success('Mantra updated');
        resetForm();
        fetchMantras();
      }
    } else {
      const { error } = await supabase
        .from('mantras')
        .insert(payload);

      if (error) {
        console.error('Mantra insert error:', error);
        toast.error(error.message || 'Failed to add mantra');
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
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== 'planet') setPlanetType('');
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                >
                  {ADMIN_MANTRA_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {category === 'planet' && (
                <div>
                  <Label>Planet Type</Label>
                  <select
                    value={planetType}
                    onChange={(e) => setPlanetType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                  >
                    <option value="">Select planet...</option>
                    {PLANET_TYPES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A powerful mantra for..."
                />
              </div>

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

              <div>
                <Label>Access (membership)</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="access"
                      checked={!formData.is_premium}
                      onChange={() => setFormData({ ...formData, is_premium: false })}
                      className="rounded-full border-input"
                    />
                    <Unlock className="w-4 h-4 text-muted-foreground" />
                    <span>Free</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="access"
                      checked={formData.is_premium}
                      onChange={() => setFormData({ ...formData, is_premium: true })}
                      className="rounded-full border-input"
                    />
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Premium</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Premium mantras are only available to app members.</p>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-foreground truncate">{mantra.title}</h4>
                    {mantra.is_premium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Lock className="w-3 h-3" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(mantra.duration_seconds / 60)}:{(mantra.duration_seconds % 60).toString().padStart(2, '0')} • {mantra.shc_reward} SHC
                    {mantra.category && (
                      <span className="ml-2 text-xs text-muted-foreground/80">
                        • {ADMIN_MANTRA_CATEGORIES.find(c => c.id === mantra.category)?.label}
                        {mantra.planet_type && <span> ({mantra.planet_type})</span>}
                      </span>
                    )}
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
