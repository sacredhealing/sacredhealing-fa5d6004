import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Music, Trash2, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  category?: string;
  planet_type?: string | null;
  deity_name?: string | null;
  intention_type?: string | null;
  is_premium?: boolean;
  explanation?: string | null;
  recommended_duration?: string | null;
}

// Core mantra categories (add mantras/MP3s to each) (spiritually coherent, Jyotish-compatible)
const MANTRA_CATEGORIES = [
  { value: 'planet', label: 'Planetary (Jyotish)' },
  { value: 'deity', label: 'Deity' },
  { value: 'intention', label: 'Intention' },
  { value: 'karma', label: 'Karma & Healing' },
  { value: 'wealth', label: 'Wealth & Abundance' },
  { value: 'health', label: 'Health & Vitality' },
  { value: 'peace', label: 'Peace & Calm' },
  { value: 'protection', label: 'Protection & Power' },
  { value: 'spiritual', label: 'Spiritual Growth' },
  { value: 'general', label: 'General / Universal' },
] as const;

const PLANET_TYPES = [
  { value: 'sun', label: 'Sun (Surya)' },
  { value: 'moon', label: 'Moon (Chandra)' },
  { value: 'mars', label: 'Mars (Mangala)' },
  { value: 'mercury', label: 'Mercury (Budha)' },
  { value: 'jupiter', label: 'Jupiter (Guru)' },
  { value: 'venus', label: 'Venus (Shukra)' },
  { value: 'saturn', label: 'Saturn (Shani)' },
  { value: 'rahu', label: 'Rahu' },
  { value: 'ketu', label: 'Ketu' },
] as const;

const DEITY_NAMES = [
  { value: 'shiva', label: 'Shiva' },
  { value: 'vishnu', label: 'Vishnu' },
  { value: 'krishna', label: 'Krishna' },
  { value: 'rama', label: 'Rama' },
  { value: 'ganesha', label: 'Ganesha' },
  { value: 'lakshmi', label: 'Lakshmi' },
  { value: 'saraswati', label: 'Saraswati' },
  { value: 'durga', label: 'Durga' },
  { value: 'kali', label: 'Kali' },
  { value: 'hanuman', label: 'Hanuman' },
  { value: 'dattatreya', label: 'Dattatreya' },
  { value: 'guru', label: 'Guru / Lineage' },
] as const;

const INTENTION_TYPES = [
  { value: 'clarity', label: 'Clarity' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'focus', label: 'Focus' },
  { value: 'discipline', label: 'Discipline' },
  { value: 'letting_go', label: 'Letting Go' },
  { value: 'protection', label: 'Protection' },
  { value: 'manifestation', label: 'Manifestation' },
  { value: 'inner_strength', label: 'Inner Strength' },
] as const;

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
  });
  const [category, setCategory] = useState('general');
  const [planetType, setPlanetType] = useState<string | null>(null);
  const [deityName, setDeityName] = useState<string | null>(null);
  const [intentionType, setIntentionType] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [recommendedDuration, setRecommendedDuration] = useState('');

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
    });
    setCategory('general');
    setPlanetType(null);
    setDeityName(null);
    setIntentionType(null);
    setIsPremium(false);
    setExplanation('');
    setRecommendedDuration('');
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
    });
    setCategory(mantra.category || 'general');
    setPlanetType(mantra.planet_type ?? null);
    setDeityName(mantra.deity_name ?? null);
    setIntentionType(mantra.intention_type ?? null);
    setIsPremium(mantra.is_premium ?? false);
    setExplanation(mantra.explanation || '');
    setRecommendedDuration(mantra.recommended_duration || '');
    setEditingId(mantra.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.audio_url) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('mantras')
        .update({
          ...formData,
          category,
          planet_type: category === 'planet' ? planetType : null,
          deity_name: category === 'deity' ? deityName : null,
          intention_type: category === 'intention' ? intentionType : null,
          is_premium: isPremium,
          explanation: explanation || null,
          recommended_duration: recommendedDuration || null,
        })
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
        .insert({
          ...formData,
          category,
          planet_type: category === 'planet' ? planetType : null,
          deity_name: category === 'deity' ? deityName : null,
          intention_type: category === 'intention' ? intentionType : null,
          is_premium: isPremium,
          explanation: explanation || null,
          recommended_duration: recommendedDuration || null,
        });

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
          <Button type="button" onClick={() => setShowForm(true)} className="w-full mb-4">
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

              {/* Category — organized, contextual sub-selects only when needed */}
              <div className="space-y-3">
                <div>
                  <Label>Category</Label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPlanetType(null);
                      setDeityName(null);
                      setIntentionType(null);
                    }}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {MANTRA_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {category === 'planet' && (
                  <div>
                    <Label>Planet (for Jyotish)</Label>
                    <select
                      value={planetType ?? ''}
                      onChange={(e) => setPlanetType(e.target.value || null)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select planet</option>
                      {PLANET_TYPES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {category === 'deity' && (
                  <div>
                    <Label>Deity</Label>
                    <select
                      value={deityName ?? ''}
                      onChange={(e) => setDeityName(e.target.value || null)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select deity</option>
                      {DEITY_NAMES.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {category === 'intention' && (
                  <div>
                    <Label>Intention Type</Label>
                    <select
                      value={intentionType ?? ''}
                      onChange={(e) => setIntentionType(e.target.value || null)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select intention</option>
                      {INTENTION_TYPES.map((i) => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

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

              <div className="flex items-center gap-2">
                <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                <Label>Premium</Label>
              </div>

              <div>
                <Label>Explanation (shown to users)</Label>
                <Textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Long text explanation for this mantra..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Recommended duration</Label>
                <Input
                  value={recommendedDuration}
                  onChange={(e) => setRecommendedDuration(e.target.value)}
                  placeholder="13 Feb 2026 – 1 Apr 2026"
                />
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
                    {mantra.category && (
                      <span className="ml-2 text-xs uppercase text-muted-foreground/80">
                        • {MANTRA_CATEGORIES.find(c => c.value === mantra.category)?.label ?? mantra.category}
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
