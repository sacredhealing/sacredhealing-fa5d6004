import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2, Music, Check, Loader2, FileText, Edit2, Save, X, Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AudioUpload from '@/components/admin/AudioUpload';

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
  script_text?: string | null;
  created_at: string;
}

const AdminHealing: React.FC = () => {
  const { toast } = useToast();
  const [audios, setAudios] = useState<HealingAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingScript, setEditingScript] = useState<{ id: string; script: string } | null>(null);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
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
    scriptText: '',
  });

  useEffect(() => {
    fetchAudios();
  }, []);

  const fetchAudios = async () => {
    try {
      // Try to fetch with script_text first, fallback to * if column doesn't exist
      let query = supabase
        .from('healing_audio')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audios:', error);
        // Check if error is about missing column - try without script_text
        if (error.message.includes('script_text') || error.message.includes('schema cache')) {
          console.log('script_text column not found, fetching without it...');
          // Try again without script_text
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('healing_audio')
            .select('id, title, description, audio_url, preview_url, duration_seconds, is_free, price_usd, price_shc, category, created_at')
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            toast({ 
              title: 'Error', 
              description: `Failed to load healing audio: ${fallbackError.message}`, 
              variant: 'destructive' 
            });
            return;
          }
          
          if (fallbackData) {
            setAudios(fallbackData.map(item => ({
              ...item,
              script_text: null // Set to null if column doesn't exist
            })) as HealingAudio[]);
            toast({ 
              title: 'Migration Required', 
              description: 'The script_text column is missing. Click "Run Migration" button above to fix this automatically.', 
              variant: 'default',
              duration: 10000
            });
          }
          return;
        } else {
          toast({ 
            title: 'Error', 
            description: `Failed to load healing audio: ${error.message}`, 
            variant: 'destructive' 
          });
          return;
        }
      }

      if (data) {
        console.log('Fetched healing audios:', data.length);
        // Ensure script_text is included even if types are outdated
        setAudios(data.map(item => ({
          ...item,
          script_text: (item as any).script_text || null
        })) as HealingAudio[]);
      } else {
        console.log('No healing audio data returned');
        setAudios([]);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching audios:', err);
      toast({ 
        title: 'Error', 
        description: `Unexpected error: ${err.message}`, 
        variant: 'destructive' 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use type assertion to include script_text even if types are outdated
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
        script_text: formData.scriptText || null,
      } as any);

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
        scriptText: '',
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

  const handleEditScript = (audio: HealingAudio) => {
    setEditingScript({ id: audio.id, script: audio.script_text || '' });
    setScriptDialogOpen(true);
  };

  const handleSaveScript = async () => {
    if (!editingScript) return;

    setIsLoading(true);
    try {
      // Trim the script text to remove extra whitespace
      const scriptText = editingScript.script.trim() || null;
      
      // Use type assertion to bypass TypeScript type checking for script_text
      // This allows us to update the column even if types haven't been regenerated
      const { data, error } = await supabase
        .from('healing_audio')
        .update({ script_text: scriptText } as any)
        .eq('id', editingScript.id)
        .select('id, script_text');

      if (error) {
        console.error('Error saving script:', error);
        // Check if error is about missing column
        if (error.message.includes('script_text') || error.message.includes('schema cache')) {
          throw new Error('The script_text column does not exist. Please run migration: 20260109000001_add_script_text_to_healing_audio.sql');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from update. You may not have permission to update healing audio.');
      }

      toast({ title: 'Success', description: 'Script saved successfully!' });
      setScriptDialogOpen(false);
      setEditingScript(null);
      fetchAudios();
    } catch (error: any) {
      console.error('Failed to save script:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save script. Please check your admin permissions and ensure the migration has been run.', 
        variant: 'destructive' 
      });
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

      'frequency': `Frequency Healing: ${title}

Welcome to this frequency healing session. Find a comfortable position. Close your eyes. Take a few deep breaths to center yourself.

The healing frequency you are about to receive works on a cellular level, harmonizing your energy field and promoting natural healing. Simply allow yourself to receive.

As the frequency plays, feel it resonating through your body. Notice any areas that respond - perhaps a gentle vibration, a sense of warmth, or a feeling of release.

This frequency is designed to [specific healing purpose]. Trust the process. Your body knows how to heal. Your energy knows how to balance.

Breathe naturally. There's nothing you need to do. Just be present. Just receive. The frequency is doing the work.

Rest in this healing space. Allow the vibrations to penetrate every cell, every tissue, every energy center. You are being harmonized. You are being healed.

When the session ends, take a moment to notice how you feel. Gently open your eyes when you're ready, carrying this healing energy with you.`,

      'energy_clearing': `Energy Clearing Meditation: ${title}

Welcome to this powerful energy clearing session. Sit or lie comfortably. Close your eyes. Take three deep, cleansing breaths.

Visualize yourself surrounded by a beautiful, protective bubble of white light. This is your sacred space. Nothing can harm you here.

Now, imagine roots growing from your feet deep into the earth. You are grounded. You are connected to the earth's healing energy.

As you breathe, visualize any negative energy, any attachments, any lower vibrations being drawn down through your body, through your roots, and into the earth, where it is transformed into pure light.

Feel your energy field becoming lighter, clearer, brighter. Any energetic cords or attachments are being released. Any heavy emotions are being cleared.

Now, imagine a beautiful waterfall of white light flowing from above, through the crown of your head, washing through your entire being, clearing and purifying every cell, every chakra, every energy center.

Feel yourself becoming lighter, more aligned, more connected to your highest self. You are clear. You are protected. You are free.

Rest in this cleared, purified state. When you're ready, gently return to the present moment, feeling refreshed and energetically clean.`,
    };

    // Match category to template
    const lowerTitle = title.toLowerCase();
    const lowerCategory = category.toLowerCase();

    if (lowerTitle.includes('chakra') || lowerCategory.includes('chakra')) {
      return templates['chakra'];
    } else if (lowerTitle.includes('sleep') || lowerTitle.includes('rest') || lowerCategory.includes('sleep')) {
      return templates['sleep'];
    } else if (lowerTitle.includes('frequency') || lowerTitle.includes('hz') || lowerCategory.includes('frequency')) {
      return templates['frequency'];
    } else if (lowerTitle.includes('clear') || lowerTitle.includes('energy') || lowerCategory.includes('clearing')) {
      return templates['energy_clearing'];
    } else {
      return templates['emotional']; // Default to emotional healing
    }
  };

  const handleGenerateScript = () => {
    if (!formData.title) {
      toast({ title: 'Error', description: 'Please enter a title first', variant: 'destructive' });
      return;
    }
    const template = getScriptTemplate(formData.category, formData.title);
    setFormData({ ...formData, scriptText: template });
    toast({ title: 'Script Generated', description: 'A template script has been generated based on your title and category' });
  };

  const migrationSQL = `-- Add script_text column to healing_audio table
-- Copy this entire SQL and run it in Supabase SQL Editor

ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text 
ON public.healing_audio(script_text) 
WHERE script_text IS NOT NULL;

ALTER TABLE public.healing_audio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can insert healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can delete healing audio" ON public.healing_audio;

CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert healing audio"
ON public.healing_audio
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete healing audio"
ON public.healing_audio
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));`;

  const handleCopyMigrationSQL = async () => {
    try {
      await navigator.clipboard.writeText(migrationSQL);
      toast({ 
        title: 'SQL Copied!', 
        description: 'Paste it into Supabase SQL Editor and click Run. Then refresh this page.', 
        variant: 'default' 
      });
    } catch (error) {
      toast({ 
        title: 'Copy Failed', 
        description: 'Please manually copy the SQL below', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
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
          <Button
            onClick={() => setShowMigrationDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Migration SQL
          </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="healing, chakra, frequency, sleep, emotional, etc."
              />
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
                placeholder="Enter the meditation script here, or click 'Generate Template' to create a template based on title and category..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This script will be used for recording. Generate a template or write your own.
              </p>
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
                  className="p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{audio.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {Math.floor(audio.duration_seconds / 60)}:{(audio.duration_seconds % 60).toString().padStart(2, '0')} •{' '}
                        {audio.category} •{' '}
                        {audio.is_free ? (
                          <span className="text-green-500">FREE</span>
                        ) : (
                          <span>{audio.price_shc} SHC / ${audio.price_usd}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={audio.script_text ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleEditScript(audio)}
                        className={audio.script_text ? "bg-primary" : ""}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        {audio.script_text ? 'View/Edit Script' : 'Add Script'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(audio.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    {audio.script_text ? (
                      <div className="p-3 bg-background rounded border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-primary">✓ Script Available</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScript(audio)}
                            className="text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Full Script
                          </Button>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{audio.script_text}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/20 rounded border border-dashed border-muted-foreground/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          No script yet - Click "Add Script" to create one
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Script Editor Dialog */}
        <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingScript && audios.find(a => a.id === editingScript.id)?.title}
              </DialogTitle>
              <DialogDescription>
                Meditation Script - Write or edit the script for recording. This will be used as your guide during recording.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="script">Script Text</Label>
                  {editingScript && !editingScript.script && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const audio = audios.find(a => a.id === editingScript.id);
                        if (audio) {
                          const template = getScriptTemplate(audio.category, audio.title);
                          setEditingScript({ ...editingScript, script: template });
                        }
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Generate Template
                    </Button>
                  )}
                </div>
                <Textarea
                  id="script"
                  value={editingScript?.script || ''}
                  onChange={(e) => setEditingScript(editingScript ? { ...editingScript, script: e.target.value } : null)}
                  rows={20}
                  className="font-mono text-sm whitespace-pre-wrap"
                  placeholder="Enter your meditation script here, or click 'Generate Template' to create one based on the title and category..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editingScript?.script ? `${editingScript.script.length} characters` : 'No script yet'}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScriptDialogOpen(false);
                    setEditingScript(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveScript} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Script
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Migration SQL Dialog */}
        <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Database Migration SQL</DialogTitle>
              <DialogDescription>
                Copy this SQL and run it in Supabase SQL Editor to add the script_text column
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Steps: 1) Copy SQL below → 2) Go to Supabase Dashboard → SQL Editor → 3) Paste & Run → 4) Refresh this page
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(migrationSQL);
                        toast({ 
                          title: 'SQL Copied!', 
                          description: 'Now paste it into Supabase SQL Editor', 
                          variant: 'default' 
                        });
                      } catch (error) {
                        toast({ 
                          title: 'Copy Failed', 
                          description: 'Please manually select and copy the SQL', 
                          variant: 'destructive' 
                        });
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy SQL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open SQL Editor
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Textarea
                  value={migrationSQL}
                  readOnly
                  className="font-mono text-xs h-[400px] bg-muted"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>After running the SQL:</strong> Refresh this page and the script_text column will be available. 
                  You'll be able to add and save scripts for your healing audio entries.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMigrationDialog(false);
                    setTimeout(() => fetchAudios(), 1000);
                  }}
                >
                  Done - Refresh Page
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminHealing;
