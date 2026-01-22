import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AudioUpload from '@/components/admin/AudioUpload';

const AdminHealingEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioUrl: '',
    previewUrl: '',
    durationMinutes: 3,
    isFree: false,
    priceUsd: 4.99,
    category: 'healing',
    scriptText: '',
  });

  useEffect(() => {
    if (id) {
      fetchAudio();
    }
  }, [id]);

  const fetchAudio = async () => {
    try {
      const { data, error } = await supabase
        .from('healing_audio')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          description: data.description || '',
          audioUrl: data.audio_url,
          previewUrl: data.preview_url || '',
          durationMinutes: Math.floor(data.duration_seconds / 60),
          isFree: data.is_free,
          priceUsd: data.price_usd,
          category: data.category,
          scriptText: (data as any).script_text || '',
        });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      navigate('/admin/healing');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('healing_audio')
        .update({
          title: formData.title,
          description: formData.description || null,
          audio_url: formData.audioUrl,
          preview_url: formData.previewUrl || null,
          duration_seconds: formData.durationMinutes * 60,
          is_free: formData.isFree,
          price_usd: formData.priceUsd,
          price_shc: 0,
          category: formData.category,
          script_text: formData.scriptText || null,
        } as any)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Healing audio updated successfully!' });
      navigate('/admin/healing');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getScriptTemplate = (category: string, title: string): string => {
    const templates: Record<string, string> = {
      'chakra': `Chakra Healing Meditation: ${title}

Welcome to this sacred healing space. Find a comfortable position where you won't be disturbed. Close your eyes gently. Take three deep breaths, inhaling peace and exhaling any tension.

Bring your awareness to your energy centers. Visualize a beautiful, spinning wheel of light at your [chakra location]. This is your [chakra name] chakra, the center of [chakra purpose].

As you breathe, imagine a warm, [color] light flowing into this chakra. Feel it expanding, clearing, and balancing. Any blockages or stored emotions begin to dissolve in this healing light.

With each breath, this chakra becomes more vibrant, more open, more aligned. Feel the energy flowing freely, connecting you to your highest self.

Rest in this healing energy. Allow the frequency to work on all levels - physical, emotional, mental, and spiritual. You are safe. You are healing. You are whole.

When you are ready, gently bring your awareness back to your body. Take a deep breath, and open your eyes, feeling refreshed and balanced.`,

      'emotional': `Emotional Healing Meditation: ${title}

Welcome to a safe space for deep emotional healing. Find a comfortable position. Close your eyes. Take several deep, cleansing breaths.

Bring your awareness to your heart center. Notice any emotions that are present - sadness, anger, fear, or pain. Acknowledge them without judgment. They are valid. They are part of your journey.

Now, imagine a warm, golden light surrounding your heart. This is the light of unconditional love and acceptance. As you breathe, this light gently penetrates any emotional wounds, any stored pain, any old patterns.

Feel the light dissolving layers of hurt, releasing what no longer serves you. With each breath, you are creating space for new emotions - peace, joy, love, compassion.

Visualize any difficult emotions being transformed into wisdom, into strength, into understanding. You are not your pain. You are the awareness that observes it. You are the light that heals it.

Rest in this healing space. Allow yourself to feel whatever needs to be felt. You are safe. You are supported. You are loved.

When you are ready, gently return to the present moment, carrying this healing energy with you.`,

      'sleep': `Sleep Healing Meditation: ${title}

Welcome to your sleep sanctuary. Lie down comfortably. Close your eyes. Let go of the day.

Take a deep breath in through your nose... hold for a moment... and release slowly through your mouth. Repeat this three times, feeling your body begin to relax.

Starting from your toes, consciously relax each part of your body. Your feet... your legs... your hips... your stomach... your chest... your arms... your shoulders... your neck... your face. Let all tension melt away.

Now, imagine yourself in a peaceful, safe place - perhaps a quiet beach at sunset, or a serene forest, or a cozy room. Feel the peace of this place. You are completely safe here.

As you rest, feel healing energy flowing through your entire being. Your nervous system is calming. Your mind is quieting. Your body is preparing for deep, restorative sleep.

With each breath, you sink deeper into relaxation. Any worries or thoughts gently drift away like clouds in the sky. You are letting go. You are surrendering to rest.

You are safe. You are loved. You are ready for peaceful sleep. Allow yourself to drift into deep, healing slumber.`,
    };

    const lowerTitle = title.toLowerCase();
    const lowerCategory = category.toLowerCase();

    if (lowerTitle.includes('chakra') || lowerCategory.includes('chakra')) {
      return templates['chakra'];
    } else if (lowerTitle.includes('sleep') || lowerTitle.includes('rest') || lowerCategory.includes('sleep')) {
      return templates['sleep'];
    } else {
      return templates['emotional'];
    }
  };

  const handleGenerateScript = () => {
    if (!formData.title) {
      toast({ title: 'Error', description: 'Please enter a title first', variant: 'destructive' });
      return;
    }
    const template = getScriptTemplate(formData.category, formData.title);
    setFormData({ ...formData, scriptText: template });
    toast({ title: 'Script Generated', description: 'A template script has been generated' });
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/healing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Healing Audio</h1>
            <p className="text-muted-foreground">Update the details for this healing track</p>
          </div>
        </div>

        {/* Edit Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AudioUpload
                value={formData.audioUrl}
                onChange={(url) => setFormData({ ...formData, audioUrl: url })}
                folder="healing"
                label="Full Audio File *"
              />
              <AudioUpload
                value={formData.previewUrl}
                onChange={(url) => setFormData({ ...formData, previewUrl: url })}
                folder="healing/previews"
                label="Preview Audio (30s)"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 1 })}
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
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="healing, chakra, frequency, sleep, emotional, etc."
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="scriptText">Meditation Script</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateScript}
                  disabled={!formData.title}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Generate Template
                </Button>
              </div>
              <Textarea
                id="scriptText"
                value={formData.scriptText}
                onChange={(e) => setFormData({ ...formData, scriptText: e.target.value })}
                placeholder="Enter the meditation script here..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-4">
              <Link to="/admin/healing" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminHealingEdit;
