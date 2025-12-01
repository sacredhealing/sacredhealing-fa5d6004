import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2, Music, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealingAudio {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  preview_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  price_usd: number;
  price_shc: number;
  category: string;
  created_at: string;
}

const AdminHealing: React.FC = () => {
  const { toast } = useToast();
  const [audios, setAudios] = useState<HealingAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioUrl: '',
    previewUrl: '',
    durationSeconds: 180,
    isFree: false,
    priceUsd: 4.99,
    priceShc: 50,
    category: 'healing',
  });

  useEffect(() => {
    fetchAudios();
  }, []);

  const fetchAudios = async () => {
    const { data, error } = await supabase
      .from('healing_audio')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAudios(data);
    if (error) console.error('Error fetching audios:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from('healing_audio').insert({
        title: formData.title,
        description: formData.description || null,
        audio_url: formData.audioUrl,
        preview_url: formData.previewUrl || null,
        duration_seconds: formData.durationSeconds,
        is_free: formData.isFree,
        price_usd: formData.priceUsd,
        price_shc: formData.priceShc,
        category: formData.category,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Healing audio added successfully!' });
      setFormData({
        title: '',
        description: '',
        audioUrl: '',
        previewUrl: '',
        durationSeconds: 180,
        isFree: false,
        priceUsd: 4.99,
        priceShc: 50,
        category: 'healing',
      });
      fetchAudios();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audio?')) return;

    const { error } = await supabase.from('healing_audio').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Audio removed successfully' });
      fetchAudios();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Healing Audio Manager</h1>
            <p className="text-muted-foreground">Add and manage healing audio tracks</p>
          </div>
        </div>

        {/* Add Audio Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Add New Healing Audio
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="432Hz Heart Chakra Healing"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A gentle healing frequency to open and balance your heart chakra..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audioUrl">Full Audio URL *</Label>
                <Input
                  id="audioUrl"
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="previewUrl">Preview URL (30s)</Label>
                <Input
                  id="previewUrl"
                  value={formData.previewUrl}
                  onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationSeconds}
                  onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="priceUsd">Price (USD)</Label>
                <Input
                  id="priceUsd"
                  type="number"
                  step="0.01"
                  value={formData.priceUsd}
                  onChange={(e) => setFormData({ ...formData, priceUsd: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="priceShc">Price (SHC)</Label>
                <Input
                  id="priceShc"
                  type="number"
                  value={formData.priceShc}
                  onChange={(e) => setFormData({ ...formData, priceShc: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="healing, chakra, frequency, etc."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
              />
              <Label htmlFor="isFree">Free audio (no purchase required)</Label>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add Healing Audio
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Existing Audios */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5" />
            Existing Healing Audio ({audios.length})
          </h2>

          {audios.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No healing audio added yet</p>
          ) : (
            <div className="space-y-3">
              {audios.map((audio) => (
                <div
                  key={audio.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-foreground">{audio.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      {Math.floor(audio.duration_seconds / 60)}:{(audio.duration_seconds % 60).toString().padStart(2, '0')} •{' '}
                      {audio.is_free ? (
                        <span className="text-green-500">FREE</span>
                      ) : (
                        <span>{audio.price_shc} SHC / ${audio.price_usd}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(audio.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminHealing;
