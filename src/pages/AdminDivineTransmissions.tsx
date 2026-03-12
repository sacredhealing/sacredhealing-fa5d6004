import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AudioUpload from '@/components/admin/AudioUpload';

interface Transmission {
  id: string;
  title: string;
  description: string | null;
  category: string;
  audio_url_en: string | null;
  audio_url_sv: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  required_tier: number;
  series_name: string | null;
  series_order: number | null;
  published: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'divine_transmissions', label: 'Divine Transmissions' },
  { value: 'oracle_talks', label: 'Oracle Talks' },
  { value: 'nadi_series', label: 'The 7 Nadis Series' },
  { value: 'frequency_teachings', label: 'Frequency Teachings' },
  { value: 'siddha_wisdom', label: 'Siddha Wisdom' },
  { value: 'kundalini_talks', label: 'Kundalini Talks' },
];

const TIERS = [
  { value: 0, label: 'Free (Atma-Seed)' },
  { value: 1, label: 'Prana-Flow (€19/mo)' },
  { value: 2, label: 'Siddha-Quantum (€45/mo)' },
  { value: 3, label: 'Akasha-Infinity (€1111)' },
];

const parseDuration = (str: string): number => {
  const parts = str.split(':').map(p => parseInt(p) || 0);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(str) || 0;
};

const formatDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const AdminDivineTransmissions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('divine_transmissions');
  const [audioUrlEn, setAudioUrlEn] = useState('');
  const [audioUrlSv, setAudioUrlSv] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [durationInput, setDurationInput] = useState('0:00');
  const [isFree, setIsFree] = useState(false);
  const [requiredTier, setRequiredTier] = useState(0);
  const [seriesName, setSeriesName] = useState('');
  const [seriesOrder, setSeriesOrder] = useState('');
  const [published, setPublished] = useState(false);

  const fetch = useCallback(async () => {
    const { data, error } = await (supabase
      .from('divine_transmissions' as any)
      .select('*')
      .order('created_at', { ascending: false }) as any);
    if (error) {
      console.error('Error loading transmissions:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setItems((data as Transmission[] | null) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetch(); }, [fetch]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('divine_transmissions');
    setAudioUrlEn(''); setAudioUrlSv(''); setCoverUrl('');
    setDurationInput('0:00'); setIsFree(false); setRequiredTier(0);
    setSeriesName(''); setSeriesOrder(''); setPublished(false);
    setEditingId(null);
  };

  const startEdit = (t: Transmission) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description || '');
    setCategory(t.category);
    setAudioUrlEn(t.audio_url_en || '');
    setAudioUrlSv(t.audio_url_sv || '');
    setCoverUrl(t.cover_image_url || '');
    setDurationInput(formatDuration(t.duration_seconds));
    setIsFree(t.is_free);
    setRequiredTier(t.required_tier);
    setSeriesName(t.series_name || '');
    setSeriesOrder(t.series_order?.toString() || '');
    setPublished(t.published);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: 'Missing title', variant: 'destructive' });
      return;
    }
    if (!audioUrlEn && !audioUrlSv) {
      toast({ title: 'Upload at least one audio file (English or Swedish)', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      audio_url_en: audioUrlEn || null,
      audio_url_sv: audioUrlSv || null,
      cover_image_url: coverUrl || null,
      duration_seconds: parseDuration(durationInput),
      is_free: isFree,
      required_tier: isFree ? 0 : requiredTier,
      series_name: seriesName.trim() || null,
      series_order: seriesOrder ? parseInt(seriesOrder) : null,
      published,
    };

    try {
      if (editingId) {
        const { error } = await (supabase
          .from('divine_transmissions' as any)
          .update(payload)
          .eq('id', editingId) as any);
        if (error) throw error;
        toast({ title: 'Updated!' });
      } else {
        const { error } = await (supabase
          .from('divine_transmissions' as any)
          .insert(payload) as any);
        if (error) throw error;
        toast({ title: 'Created!', description: `"${title}" added to Akasha archive` });
      }
      resetForm();
      await fetch();
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transmission?')) return;
    const { error } = await (supabase.from('divine_transmissions' as any).delete().eq('id', id) as any);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetch();
    }
  };

  const togglePublished = async (id: string, current: boolean) => {
    await (supabase.from('divine_transmissions' as any).update({ published: !current }).eq('id', id) as any);
    fetch();
  };

  const uploadCoverImage = async (file: File) => {
    const ext = file.name.split('.').pop();
    const name = `divine-transmissions/covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('audio').upload(name, file, { contentType: file.type });
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return; }
    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(name);
    setCoverUrl(publicUrl);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Divine Transmissions</h1>
            <p className="text-muted-foreground">Explore Akasha — Wisdom Archive audio talks</p>
          </div>
        </div>

        {/* ── FORM ── */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus size={20} />
            {editingId ? 'Edit Transmission' : 'Add New Transmission'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="The Quantum Self" className="bg-muted/50" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Duration (mm:ss)</label>
                <Input value={durationInput} onChange={e => setDurationInput(e.target.value)} placeholder="12:30" className="bg-muted/50" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Required Tier</label>
                <select value={requiredTier} onChange={e => setRequiredTier(parseInt(e.target.value))} disabled={isFree} className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground disabled:opacity-50">
                  {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Series Name (optional)</label>
                <Input value={seriesName} onChange={e => setSeriesName(e.target.value)} placeholder="The 7 Nadis Series" className="bg-muted/50" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Episode # (optional)</label>
                <Input type="number" value={seriesOrder} onChange={e => setSeriesOrder(e.target.value)} placeholder="1" className="bg-muted/50" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="A deep exploration of..." rows={3} className="bg-muted/50" />
            </div>

            {/* Audio uploads (EN + SV) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AudioUpload value={audioUrlEn} onChange={setAudioUrlEn} folder="divine-transmissions/en" label="🇬🇧 English Audio" />
              <AudioUpload value={audioUrlSv} onChange={setAudioUrlSv} folder="divine-transmissions/sv" label="🇸🇪 Swedish Audio" />
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Cover Image</label>
              {coverUrl ? (
                <div className="flex items-center gap-3">
                  <img src={coverUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCoverUrl('')}><X size={14} /> Remove</Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) uploadCoverImage(e.target.files[0]); }} className="hidden" />
                  <span className="text-sm text-muted-foreground">Upload cover image</span>
                </label>
              )}
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="is-free" checked={isFree} onCheckedChange={setIsFree} />
                <Label htmlFor="is-free">Free for everyone</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is-published" checked={published} onCheckedChange={setPublished} />
                <Label htmlFor="is-published">Published</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
                {editingId ? 'Save Changes' : 'Create Transmission'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              )}
            </div>
          </form>
        </div>

        {/* ── LIST ── */}
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
          All Transmissions ({items.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No transmissions yet. Create your first one above.</p>
        ) : (
          <div className="space-y-3">
            {items.map(t => (
              <div key={t.id} className="bg-gradient-card border border-border/50 rounded-xl p-4 flex items-center gap-4">
                {t.cover_image_url ? (
                  <img src={t.cover_image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-2xl">🔱</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{t.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                    {t.series_name && ` · ${t.series_name} #${t.series_order || '?'}`}
                    {' · '}{formatDuration(t.duration_seconds)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {t.is_free && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Free</span>}
                    {!t.is_free && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{TIERS.find(x => x.value === t.required_tier)?.label}</span>}
                    {t.audio_url_en && <span className="text-xs text-muted-foreground">🇬🇧</span>}
                    {t.audio_url_sv && <span className="text-xs text-muted-foreground">🇸🇪</span>}
                    {!t.published && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Draft</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => togglePublished(t.id, t.published)} title={t.published ? 'Unpublish' : 'Publish'}>
                    {t.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(t)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDivineTransmissions;
