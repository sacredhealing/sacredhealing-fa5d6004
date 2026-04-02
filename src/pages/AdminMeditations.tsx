import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2, Pencil, Loader2, Music, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AudioUpload from '@/components/admin/AudioUpload';

interface Meditation {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  duration_minutes: number;
  category: string;
  is_premium: boolean;
  shc_reward: number;
  language?: string;
  created_at: string;
}

const CATEGORIES = [
  'morning',
  'sleep',
  'healing',
  'focus',
  'nature',
  'general',
  'manifestation',
  'abundance',
  'protection',
  'heart',
  'breathwork',
];

const AdminMeditations: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioUrl: '',
    durationMinutes: 10,
    category: 'general',
    isPremium: false,
    shcReward: 5,
    language: 'en' as 'en' | 'sv',
  });

  useEffect(() => { fetchMeditations(); }, []);

  const fetchMeditations = async () => {
    const { data, error } = await supabase
      .from('meditations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meditations:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setMeditations((data || []).map((m: any) => ({
      ...m,
      language: m.language || 'en',
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.audioUrl) {
      toast({ title: 'Missing fields', description: 'Title and audio are required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('meditations').insert({
        title: formData.title,
        description: formData.description || null,
        audio_url: formData.audioUrl,
        duration_minutes: formData.durationMinutes,
        category: formData.category,
        is_premium: formData.isPremium,
        shc_reward: formData.shcReward,
        language: formData.language,
      } as any);

      if (error) throw error;

      toast({ title: 'Success', description: 'Meditation added!' });
      setFormData({ title: '', description: '', audioUrl: '', durationMinutes: 10, category: 'general', isPremium: false, shcReward: 5, language: 'en' });
      fetchMeditations();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this meditation?')) return;
    const { error } = await supabase.from('meditations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetchMeditations();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#D4AF37]/25 transition"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-black tracking-[-0.05em] text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)]">
              Meditations
            </h1>
            <p className="text-white/55 leading-[1.6]">
              Prema‑Pulse Transmissions · curated for spiritual growth and self‑mastery
            </p>
          </div>
        </div>

        {/* ADD FORM */}
        <div className="bg-white/[0.02] backdrop-blur-[40px] border border-white/[0.05] rounded-[40px] p-6 mb-8">
          <h2 className="text-xl font-heading font-black tracking-[-0.03em] text-white/90 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-[#D4AF37]" /> Add New Meditation
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] tracking-[0.5em] uppercase text-white/60 font-extrabold mb-2">Title *</label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Morning Calm"
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 rounded-[28px] focus-visible:ring-[#D4AF37]/20 focus-visible:border-[#D4AF37]/35"
                />
              </div>
              <div>
                <label className="block text-[8px] tracking-[0.5em] uppercase text-white/60 font-extrabold mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-4 rounded-[28px] bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] tracking-[0.5em] uppercase text-white/60 font-extrabold mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={e => setFormData(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 0 }))}
                  className="bg-white/[0.03] border-white/[0.08] text-white rounded-[28px] focus-visible:ring-[#D4AF37]/20 focus-visible:border-[#D4AF37]/35"
                />
              </div>
              <div>
                <label className="block text-[8px] tracking-[0.5em] uppercase text-white/60 font-extrabold mb-2">SHC Reward</label>
                <Input
                  type="number"
                  value={formData.shcReward}
                  onChange={e => setFormData(p => ({ ...p, shcReward: parseInt(e.target.value) || 0 }))}
                  className="bg-white/[0.03] border-white/[0.08] text-white rounded-[28px] focus-visible:ring-[#D4AF37]/20 focus-visible:border-[#D4AF37]/35"
                />
              </div>
              <div>
                <label className="block text-[8px] tracking-[0.5em] uppercase text-white/60 font-extrabold mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={e => setFormData(p => ({ ...p, language: e.target.value as 'en' | 'sv' }))}
                  className="w-full h-10 px-4 rounded-[28px] bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  <option value="en">English</option>
                  <option value="sv">Svenska</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[8px] tracking-[0.5em] uppercase text-white/60 font-extrabold mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="A calming meditation for..."
                rows={2}
                className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 rounded-[28px] focus-visible:ring-[#D4AF37]/20 focus-visible:border-[#D4AF37]/35"
              />
            </div>
            <AudioUpload value={formData.audioUrl} onChange={url => setFormData(p => ({ ...p, audioUrl: url }))} folder="meditations" label="Audio File *" />
            <div className="flex items-center gap-2">
              <Switch id="is-premium" checked={formData.isPremium} onCheckedChange={v => setFormData(p => ({ ...p, isPremium: v }))} />
              <Label htmlFor="is-premium" className="text-white/70">Premium Only</Label>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[40px] border border-[#D4AF37]/40 bg-gradient-to-b from-[#F5E17A] via-[#D4AF37] to-[#A07C10] text-[#050505] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_12px_40px_rgba(212,175,55,0.25)] hover:shadow-[0_16px_48px_rgba(212,175,55,0.35)]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
              Upload Meditation
            </Button>
          </form>
        </div>

        {/* LIST */}
        <h2 className="text-xl font-heading font-black tracking-[-0.03em] text-white/90 mb-4">
          All Meditations ({meditations.length})
        </h2>
        {meditations.length === 0 ? (
          <p className="text-center text-white/55 py-8">No meditations yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {meditations.map(m => (
              <div key={m.id} className="bg-white/[0.02] backdrop-blur-[40px] border border-white/[0.05] rounded-[28px] p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_24px_rgba(212,175,55,0.12)]">
                  <Music size={20} className="text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white/90 truncate">{m.title}</h3>
                  <p className="text-sm text-white/55">
                    {m.category} · {m.duration_minutes} min · {m.shc_reward} SHC
                    {m.is_premium && ' · Premium'}
                    {m.language === 'sv' ? ' · 🇸🇪' : ' · 🇬🇧'}
                  </p>
                </div>
                {m.audio_url && <audio src={m.audio_url} controls className="h-8 max-w-[120px] hidden sm:block" />}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/admin/meditations/${m.id}`)}
                  className="rounded-2xl hover:bg-white/[0.05] hover:text-[#D4AF37] text-white/70"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(m.id)}
                  className="rounded-2xl text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMeditations;
