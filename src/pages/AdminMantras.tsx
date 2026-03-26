/**
 * SQI-2050 Admin — Nada-Vault (visual layer synced with /mantras sovereign aesthetic).
 * Functional logic: unchanged (Supabase RPC, payloads, AudioUpload, toggles).
 */

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

const ADMIN_MANTRA_SQI_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  .sqi-admin-mantras {
    font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
    background: #050505;
    color: rgba(255, 255, 255, 0.92);
    min-height: 100vh;
  }
  .sqi-admin-mantras .am-glass {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 40px;
    box-shadow: 0 0 40px rgba(212, 175, 55, 0.04);
  }
  .sqi-admin-mantras .am-glass:hover {
    border-color: rgba(212, 175, 55, 0.12);
  }
  .sqi-admin-mantras .am-gold-glow {
    color: #D4AF37;
    text-shadow: 0 0 15px rgba(212, 175, 55, 0.35);
  }
  .sqi-admin-mantras .am-kicker {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
  }
  .sqi-admin-mantras .am-h1 {
    font-weight: 900;
    letter-spacing: -0.05em;
    color: #D4AF37;
    line-height: 1.1;
  }
  .sqi-admin-mantras .am-body {
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.6);
  }
  .sqi-admin-mantras .am-input,
  .sqi-admin-mantras .am-select {
    border-radius: 40px !important;
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: rgba(255, 255, 255, 0.88) !important;
  }
  .sqi-admin-mantras .am-input:focus-visible,
  .sqi-admin-mantras .am-select:focus-visible {
    border-color: rgba(212, 175, 55, 0.35) !important;
    box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.2);
  }
  .sqi-admin-mantras .am-textarea {
    border-radius: 24px !important;
    min-height: 100px;
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: rgba(255, 255, 255, 0.88) !important;
  }
  .sqi-admin-mantras .am-btn-primary {
    border-radius: 40px;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.95), rgba(160, 124, 16, 0.95));
    color: #050505;
    font-weight: 800;
    letter-spacing: 0.02em;
    box-shadow: 0 0 24px rgba(212, 175, 55, 0.25);
  }
  .sqi-admin-mantras .am-btn-primary:hover {
    box-shadow: 0 0 32px rgba(212, 175, 55, 0.4);
  }
  .sqi-admin-mantras .am-icon-tile {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.04));
    border: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D4AF37;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.12);
  }
  .sqi-admin-mantras .am-header-bar {
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }
`;

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
    // Fetch using explicit column selection to bypass schema cache
    const { data, error } = await supabase
      .from('mantras' as any)
      .select('id, title, description, audio_url, cover_image_url, duration_seconds, shc_reward, is_active, is_premium, category, planet_type, created_at')
      .order('created_at', { ascending: false });

    if (data) {
      setMantras(data as unknown as Mantra[]);
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
      duration_seconds: mantra.duration_seconds ?? 180,
      shc_reward: mantra.shc_reward,
      is_active: mantra.is_active,
      is_premium: mantra.is_premium ?? false,
    });
    setCategory((mantra as any).category || 'general');
    setPlanetType((mantra as any).planet_type || '');
    setEditingId(mantra.id);
    setShowForm(true);
  };

  const buildMantraPayload = () => {
    const shc = Number(formData.shc_reward);
    const durationSeconds = Number.isFinite(formData.duration_seconds) && formData.duration_seconds > 0
      ? formData.duration_seconds : 180;
    return {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      audio_url: formData.audio_url.trim(),
      cover_image_url: formData.cover_image_url?.trim() || null,
      duration_seconds: durationSeconds,
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
      const { data, error } = await supabase
        .rpc('update_mantra_admin' as any, { data: { ...payload, id: editingId } });

      if (error) {
        console.error('Mantra update error:', error);
        toast.error(error.message || 'Failed to update mantra');
      } else if (data && typeof data === 'object' && 'success' in data && !data.success) {
        toast.error((data as any).error || 'Failed to update mantra');
      } else {
        toast.success('Mantra updated');
        resetForm();
        fetchMantras();
      }
    } else {
      const { data, error } = await supabase
        .rpc('insert_mantra_admin' as any, { data: payload });

      if (error) {
        console.error('Mantra insert error:', error);
        toast.error(error.message || 'Failed to add mantra');
      } else if (data && typeof data === 'object' && 'success' in data && !data.success) {
        toast.error((data as any).error || 'Failed to add mantra');
      } else {
        toast.success('Mantra added successfully!');
        resetForm();
        fetchMantras();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mantra?')) return;
    const { error } = await supabase
      .from('mantras' as any)
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
    await supabase
      .rpc('update_mantra_admin' as any, { data: { id, is_active: !isActive } });
    fetchMantras();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_MANTRA_SQI_CSS }} />
      <div className="sqi-admin-mantras pb-28">
        <div className="am-header-bar px-4 py-5">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="rounded-full text-white/70 hover:text-[#D4AF37] hover:bg-white/5 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="am-kicker mb-1">NADA · ADMIN VAULT</p>
              <h1 className="am-h1 text-xl sm:text-2xl truncate">Manage Mantras</h1>
              <p className="am-body text-sm mt-1">
                <span className="text-[#22D3EE]/90 font-semibold tabular-nums">{mantras.length}</span>{' '}
                Bhakti-Algorithms indexed
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 max-w-2xl mx-auto">
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full mb-6 am-btn-primary h-12 border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Mantra
            </Button>
          )}

          {showForm && (
            <Card className="p-5 sm:p-6 mb-6 am-glass border-0 shadow-none bg-transparent">
              <div className="flex justify-between items-start mb-6 gap-2">
                <div>
                  <p className="am-kicker mb-2">PREMA-PULSE FORM</p>
                  <h3 className="am-h1 text-lg sm:text-xl">
                    {editingId ? 'Edit Mantra' : 'Add Mantra'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  className="rounded-full shrink-0 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="am-kicker block mb-2">Title *</Label>
                  <Input
                    className="am-input h-11"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Om Namah Shivaya"
                  />
                </div>

                <div>
                  <Label className="am-kicker block mb-2">Category</Label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value !== 'planet') setPlanetType('');
                    }}
                    className="am-select flex h-11 w-full min-w-0 max-w-full px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                  >
                    {ADMIN_MANTRA_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {category === 'planet' && (
                  <div>
                    <Label className="am-kicker block mb-2">Planet Type</Label>
                    <select
                      value={planetType}
                      onChange={(e) => setPlanetType(e.target.value)}
                      className="am-select flex h-11 w-full min-w-0 max-w-full px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                    >
                      <option value="">Select planet...</option>
                      {PLANET_TYPES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label className="am-kicker block mb-2">Description</Label>
                  <Textarea
                    className="am-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A powerful mantra for..."
                  />
                </div>

                <div className="am-glass p-4 border border-white/[0.06]">
                  <AudioUpload
                    value={formData.audio_url}
                    onChange={(url) => setFormData({ ...formData, audio_url: url })}
                    folder="mantras"
                    label="Audio File *"
                  />
                </div>

                <div>
                  <Label className="am-kicker block mb-2">Cover Image URL</Label>
                  <Input
                    className="am-input h-11"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="am-kicker block mb-2">Duration (minutes)</Label>
                    <Input
                      className="am-input h-11"
                      type="number"
                      min={0.5}
                      step={0.5}
                      placeholder="Duration in minutes"
                      value={formData.duration_seconds / 60}
                      onChange={(e) => {
                        const seconds = parseFloat(e.target.value) * 60;
                        setFormData({ ...formData, duration_seconds: Number.isFinite(seconds) ? seconds : 180 });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="am-kicker block mb-2">SHC Reward</Label>
                    <Input
                      className="am-input h-11"
                      type="number"
                      value={formData.shc_reward}
                      onChange={(e) => setFormData({ ...formData, shc_reward: parseInt(e.target.value) || 111 })}
                    />
                  </div>
                </div>

                <div className="am-glass p-4">
                  <Label className="am-kicker block mb-3">Access (membership)</Label>
                  <div className="flex flex-wrap gap-6 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer am-body text-sm">
                      <input
                        type="radio"
                        name="access"
                        checked={!formData.is_premium}
                        onChange={() => setFormData({ ...formData, is_premium: false })}
                        className="rounded-full border-white/20 accent-[#D4AF37]"
                      />
                      <Unlock className="w-4 h-4 text-white/50" />
                      <span className="text-white/85">Free</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer am-body text-sm">
                      <input
                        type="radio"
                        name="access"
                        checked={formData.is_premium}
                        onChange={() => setFormData({ ...formData, is_premium: true })}
                        className="rounded-full border-white/20 accent-[#D4AF37]"
                      />
                      <Lock className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-[#D4AF37]/95">Premium</span>
                    </label>
                  </div>
                  <p className="text-xs am-body mt-3">
                    Premium mantras are only available to app members.
                  </p>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    className="data-[state=checked]:bg-[#D4AF37]"
                  />
                  <Label className="am-body text-sm text-white/80 cursor-pointer">Active</Label>
                </div>

                <Button onClick={handleSave} className="w-full am-btn-primary h-12 border-0">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Update' : 'Save'} Mantra
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {loading && (
              <p className="am-body text-center text-sm py-8">Loading Vedic Light-Codes…</p>
            )}
            {!loading && mantras.map((mantra) => (
              <Card
                key={mantra.id}
                className={`p-4 sm:p-5 am-glass border-0 shadow-none bg-transparent transition-opacity ${!mantra.is_active ? 'opacity-[0.45]' : ''}`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="am-icon-tile shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl">
                    <Music className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black tracking-tight text-white/95 truncate text-[15px] sm:text-base am-gold-glow">
                        {mantra.title}
                      </h4>
                      {mantra.is_premium && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25">
                          <Lock className="w-3 h-3" />
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm am-body mt-1">
                      {Math.floor(mantra.duration_seconds / 60)}:{(mantra.duration_seconds % 60).toString().padStart(2, '0')} • {mantra.shc_reward} SHC
                      {(mantra as any).category && (
                        <span className="ml-2 text-white/45">
                          • {ADMIN_MANTRA_CATEGORIES.find(c => c.id === (mantra as any).category)?.label}
                          {(mantra as any).planet_type && <span> ({(mantra as any).planet_type})</span>}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(mantra)}
                      className="rounded-full text-white/55 hover:text-[#D4AF37] hover:bg-white/5"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(mantra.id)}
                      className="rounded-full text-red-400/90 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminMantras;
