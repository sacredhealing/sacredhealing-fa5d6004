import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, FileText, Pencil } from 'lucide-react';
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

const categories = ['morning', 'sleep', 'healing', 'focus', 'nature', 'general'];

const AdminMeditationEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioUrl: '',
    durationMinutes: 10,
    category: 'general',
    isPremium: false,
    shcReward: 5,
    scriptText: '',
    language: 'en' as 'en' | 'sv',
  });

  useEffect(() => {
    if (id) {
      fetchMeditation();
    }
  }, [id]);

  const fetchMeditation = async () => {
    try {
      const { data, error } = await supabase
        .from('meditations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          description: data.description || '',
          audioUrl: data.audio_url,
          durationMinutes: data.duration_minutes,
          category: data.category,
          isPremium: data.is_premium,
          shcReward: data.shc_reward,
          scriptText: (data as any).script_text || '',
          language: ((data as any).language === 'sv' ? 'sv' : 'en') as 'en' | 'sv',
        });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      navigate('/admin/meditations');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('meditations')
        .update({
          title: formData.title,
          description: formData.description || null,
          audio_url: formData.audioUrl,
          duration_minutes: formData.durationMinutes,
          category: formData.category,
          is_premium: formData.isPremium,
          shc_reward: formData.shcReward,
          script_text: formData.scriptText || null,
          language: formData.language,
        } as any)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Meditation updated successfully!' });
      navigate('/admin/meditations');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getScriptTemplate = (category: string, title: string): string => {
    const templates: Record<string, string> = {
      'morning': `Morning Meditation: ${title}

Welcome to this beautiful morning practice. Find a comfortable seated position. Close your eyes gently. Take three deep, cleansing breaths, inhaling fresh morning energy and exhaling any lingering sleep or tension.

Feel your body awakening. Notice the gentle light behind your closed eyelids. This is the light of a new day, full of possibilities, full of potential.

As you breathe, imagine golden morning light flowing into your body with each inhale. This light fills you with clarity, with purpose, with gentle energy.

Set an intention for this day. What quality do you want to carry with you? Peace? Joy? Focus? Love? Whatever it is, feel it now, in this moment.

When you're ready, gently open your eyes, carrying this morning energy with you throughout your day.`,

      'sleep': `Sleep Meditation: ${title}

Welcome to your sleep sanctuary. Lie down comfortably in your bed. Close your eyes. Let go of the day.

Take a deep breath in through your nose... hold for a moment... and release slowly through your mouth. Repeat this three times.

Starting from your toes, consciously relax each part of your body. Your feet... your legs... your hips... your stomach... your chest... your arms... your shoulders... your neck... your face.

Imagine yourself in a peaceful, safe place. Feel the peace of this place. You are completely safe here.

You are safe. You are loved. You are ready for peaceful sleep.`,

      'healing': `Healing Meditation: ${title}

Welcome to this sacred healing space. Find a comfortable position. Close your eyes gently. Take three deep breaths.

Bring your awareness to your heart center. Notice any areas calling for healing. Acknowledge them with compassion.

Imagine a warm, golden light surrounding your entire being. This is the light of unconditional love and healing.

Feel the light dissolving layers of hurt, releasing what no longer serves you. You are healing. You are whole.

When you are ready, gently return to the present moment, carrying this healing energy with you.`,

      'focus': `Focus Meditation: ${title}

Welcome to this focus practice. Sit comfortably with your back straight but relaxed. Close your eyes. Take three deep breaths.

Bring your attention to your breath. Notice the natural rhythm - the inhale, the pause, the exhale.

Choose a point of focus. When thoughts arise, simply notice them without judgment, then gently return to your focus.

Feel your mind becoming clearer, sharper, more focused. You are training your mind to stay present.

When you're ready, gently open your eyes, carrying this clarity and focus with you.`,
    };

    const lowerTitle = title.toLowerCase();
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('morning') || lowerTitle.includes('morning')) {
      return templates['morning'];
    } else if (lowerCategory.includes('sleep') || lowerTitle.includes('sleep')) {
      return templates['sleep'];
    } else if (lowerCategory.includes('healing') || lowerTitle.includes('healing')) {
      return templates['healing'];
    } else if (lowerCategory.includes('focus') || lowerTitle.includes('focus')) {
      return templates['focus'];
    } else {
      return templates['healing'];
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
          <Link to="/admin/meditations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Edit Meditation
            </h1>
            <p className="text-muted-foreground">Update the details for this meditation</p>
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
                placeholder="Morning Awakening"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A gentle meditation to start your day..."
                rows={3}
              />
            </div>

            <div>
              <AudioUpload
                value={formData.audioUrl}
                onChange={(url) => setFormData({ ...formData, audioUrl: url })}
                folder="meditations"
                label="Audio File *"
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
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="language">Meditation language</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'sv' })}
                className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground mt-2"
              >
                <option value="en">English</option>
                <option value="sv">Svenska</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Controls which language filter shows this meditation on /meditations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="shcReward">SHC Reward</Label>
                <Input
                  id="shcReward"
                  type="number"
                  min="0"
                  value={formData.shcReward}
                  onChange={(e) => setFormData({ ...formData, shcReward: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="isPremium"
                  checked={formData.isPremium}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                />
                <Label htmlFor="isPremium">Premium meditation (requires membership)</Label>
              </div>
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
              <Link to="/admin/meditations" className="flex-1">
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

export default AdminMeditationEdit;
