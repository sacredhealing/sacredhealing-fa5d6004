import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Music, Loader2, ArrowLeft, FileText, Save, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Meditation {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  audio_url: string;
  category: string;
  is_premium: boolean;
  shc_reward: number;
  script_text?: string | null;
}

const categories = ['morning', 'sleep', 'healing', 'focus', 'nature', 'general'];

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingScript, setEditingScript] = useState<{ id: string; script: string } | null>(null);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('10');
  const [category, setCategory] = useState('general');
  const [isPremium, setIsPremium] = useState(false);
  const [shcReward, setShcReward] = useState('5');
  const [language, setLanguage] = useState<'en' | 'sv'>('en');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    try {
      // Try to fetch with script_text first, fallback to * if column doesn't exist
      let query = supabase
        .from('meditations')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching meditations:', error);
        // Check if error is about missing column - try without script_text
        if (error.message.includes('script_text') || error.message.includes('schema cache')) {
          console.log('script_text column not found, fetching without it...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('meditations')
            .select('id, title, description, duration_minutes, audio_url, category, is_premium, shc_reward, created_at')
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            toast({ 
              title: 'Error', 
              description: `Failed to load meditations: ${fallbackError.message}`, 
              variant: 'destructive' 
            });
            return;
          }
          
          if (fallbackData) {
            setMeditations(fallbackData.map(item => ({
              ...item,
              script_text: null
            })) as Meditation[]);
            toast({ 
              title: 'Migration Required', 
              description: 'The script_text column is missing. Please run migration: 20260111130000_add_script_text_to_meditations.sql', 
              variant: 'default',
              duration: 10000
            });
          }
          return;
        } else {
          toast({ 
            title: 'Error', 
            description: `Failed to load meditations: ${error.message}`, 
            variant: 'destructive' 
          });
          return;
        }
      }

      if (data) {
        setMeditations(data.map(item => ({
          ...item,
          script_text: (item as any).script_text || null
        })) as Meditation[]);
      } else {
        setMeditations([]);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching meditations:', err);
      toast({ 
        title: 'Error', 
        description: `Unexpected error: ${err.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !title) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and audio file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload audio file
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('meditations')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meditations')
        .getPublicUrl(fileName);

      // Insert meditation record
      const { error: insertError } = await supabase
        .from('meditations')
        .insert({
          title,
          description: description || null,
          duration_minutes: parseInt(duration),
          audio_url: publicUrl,
          category,
          is_premium: isPremium,
          shc_reward: parseInt(shcReward),
          language,
        } as any);

      if (insertError) throw insertError;

      toast({
        title: "Meditation added!",
        description: `"${title}" has been uploaded successfully`
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDuration('10');
      setCategory('general');
      setIsPremium(false);
      setShcReward('5');
      setLanguage('en');
      setAudioFile(null);
      
      // Refresh list
      fetchMeditations();

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, audioUrl: string) => {
    if (!confirm('Are you sure you want to delete this meditation?')) return;

    try {
      // Extract filename from URL
      const fileName = audioUrl.split('/').pop();
      
      // Delete from storage
      if (fileName) {
        await supabase.storage.from('meditations').remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('meditations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Meditation removed successfully"
      });

      fetchMeditations();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditScript = (meditation: Meditation) => {
    setEditingScript({ id: meditation.id, script: meditation.script_text || '' });
    setScriptDialogOpen(true);
  };

  const handleSaveScript = async () => {
    if (!editingScript) return;

    setIsLoading(true);
    try {
      const scriptText = editingScript.script.trim() || null;
      
      const { data, error } = await supabase
        .from('meditations')
        .update({ script_text: scriptText } as any)
        .eq('id', editingScript.id)
        .select('id, script_text');

      if (error) {
        console.error('Error saving script:', error);
        if (error.message.includes('script_text') || error.message.includes('schema cache')) {
          throw new Error('The script_text column does not exist. Please run migration: 20260111130000_add_script_text_to_meditations.sql');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from update. You may not have permission to update meditations.');
      }

      toast({ title: 'Success', description: 'Script saved successfully!' });
      setScriptDialogOpen(false);
      setEditingScript(null);
      fetchMeditations();
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

  const getScriptTemplate = (category: string, title: string, duration: number): string => {
    const templates: Record<string, string> = {
      'morning': `Morning Meditation: ${title}

Welcome to this beautiful morning practice. Find a comfortable seated position. Close your eyes gently. Take three deep, cleansing breaths, inhaling fresh morning energy and exhaling any lingering sleep or tension.

Feel your body awakening. Notice the gentle light behind your closed eyelids. This is the light of a new day, full of possibilities, full of potential.

As you breathe, imagine golden morning light flowing into your body with each inhale. This light fills you with clarity, with purpose, with gentle energy. Feel it spreading through your entire being - your head, your heart, your belly, your limbs.

Set an intention for this day. What quality do you want to carry with you? Peace? Joy? Focus? Love? Whatever it is, feel it now, in this moment. Let it settle into your heart.

Take a moment to feel gratitude. Gratitude for this new day, for your breath, for this moment of stillness. Gratitude opens your heart and aligns you with abundance.

Now, as you continue to breathe naturally, feel yourself becoming more present, more awake, more aligned with your highest self. You are ready for this day. You are clear. You are centered.

When you're ready, gently open your eyes, carrying this morning energy with you throughout your day.`,

      'sleep': `Sleep Meditation: ${title}

Welcome to your sleep sanctuary. Lie down comfortably in your bed. Close your eyes. Let go of the day.

Take a deep breath in through your nose... hold for a moment... and release slowly through your mouth. Repeat this three times, feeling your body begin to relax.

Starting from your toes, consciously relax each part of your body. Your toes... your feet... your ankles... your calves... your knees... your thighs... your hips... your stomach... your chest... your shoulders... your arms... your hands... your neck... your face. Let all tension melt away.

Now, imagine yourself in a peaceful, safe place - perhaps a quiet beach at sunset, or a serene forest, or floating on gentle clouds. Feel the peace of this place. You are completely safe here.

As you rest, feel healing energy flowing through your entire being. Your nervous system is calming. Your mind is quieting. Your body is preparing for deep, restorative sleep.

With each breath, you sink deeper into relaxation. Any worries or thoughts gently drift away like clouds in the sky. You are letting go. You are surrendering to rest.

You are safe. You are loved. You are ready for peaceful sleep. Allow yourself to drift into deep, healing slumber.`,

      'healing': `Healing Meditation: ${title}

Welcome to this sacred healing space. Find a comfortable position where you won't be disturbed. Close your eyes gently. Take three deep breaths, inhaling peace and exhaling any tension.

Bring your awareness to your heart center. Notice any areas in your body, mind, or spirit that are calling for healing. Acknowledge them with compassion. They are valid. They are part of your journey.

Now, imagine a warm, golden light surrounding your entire being. This is the light of unconditional love and healing. As you breathe, this light gently penetrates any wounds, any stored pain, any old patterns.

Feel the light dissolving layers of hurt, releasing what no longer serves you. With each breath, you are creating space for new energy - peace, joy, love, wholeness.

Visualize any difficult emotions or physical sensations being transformed into wisdom, into strength, into understanding. You are not your pain. You are the awareness that observes it. You are the light that heals it.

Rest in this healing space. Allow yourself to feel whatever needs to be felt. You are safe. You are supported. You are loved. You are healing.

When you are ready, gently return to the present moment, carrying this healing energy with you.`,

      'focus': `Focus Meditation: ${title}

Welcome to this focus practice. Sit comfortably with your back straight but relaxed. Close your eyes. Take three deep breaths to center yourself.

Bring your attention to your breath. Notice the natural rhythm - the inhale, the pause, the exhale. There's nowhere to go, nothing to do. Just breathe.

Now, choose a point of focus. It could be your breath, a word or phrase, or a visualization. Whatever you choose, gently return to it whenever your mind wanders.

When thoughts arise - and they will - simply notice them without judgment, then gently return to your point of focus. Each return is a moment of strengthening your concentration.

Feel your mind becoming clearer, sharper, more focused. Like a laser beam, your attention is becoming concentrated and powerful.

With each breath, you are training your mind to stay present, to stay focused. This is a skill that will serve you in all areas of your life.

Rest in this focused state. When you're ready, gently open your eyes, carrying this clarity and focus with you.`,

      'anxiety': `Anxiety Relief Meditation: ${title}

Welcome to this safe space for anxiety relief. Find a comfortable position. Close your eyes. Take several deep, slow breaths.

Notice any anxiety or worry in your body. Where do you feel it? In your chest? Your stomach? Your shoulders? Acknowledge it without judgment. It's okay to feel this way.

Now, imagine your breath as a gentle wave, washing through the areas where you feel anxiety. With each exhale, feel the tension releasing, the worry softening.

Place one hand on your heart and one on your belly. Feel the warmth of your hands. This is self-compassion. This is self-care. You are here for yourself.

Now, imagine yourself in a safe, peaceful place - perhaps a quiet garden, a calm beach, or a cozy room. Feel the safety of this place. You are completely protected here.

As you breathe, feel your nervous system calming. Your heart rate slowing. Your muscles relaxing. You are safe. You are okay. This moment is manageable.

With each breath, you are creating space between yourself and the anxiety. You are the awareness that observes it, not the anxiety itself. You have the power to calm yourself.

Rest in this peaceful state. When you're ready, gently open your eyes, knowing you can return to this calm place anytime.`,
    };

    const lowerCategory = category.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerCategory.includes('morning') || lowerTitle.includes('morning') || lowerTitle.includes('awakening') || lowerTitle.includes('dawn') || lowerTitle.includes('sunrise')) {
      return templates['morning'];
    } else if (lowerCategory.includes('sleep') || lowerTitle.includes('sleep') || lowerTitle.includes('rest') || lowerTitle.includes('night') || lowerTitle.includes('midnight') || lowerTitle.includes('starlight')) {
      return templates['sleep'];
    } else if (lowerCategory.includes('healing') || lowerTitle.includes('healing') || lowerTitle.includes('chakra') || lowerTitle.includes('child') || lowerTitle.includes('forgiveness') || lowerTitle.includes('ancestral')) {
      return templates['healing'];
    } else if (lowerCategory.includes('focus') || lowerTitle.includes('focus') || lowerTitle.includes('clarity') || lowerTitle.includes('work') || lowerTitle.includes('flow')) {
      return templates['focus'];
    } else if (lowerCategory.includes('anxiety') || lowerTitle.includes('anxiety') || lowerTitle.includes('panic') || lowerTitle.includes('worry') || lowerTitle.includes('calm')) {
      return templates['anxiety'];
    } else {
      return templates['morning']; // Default template
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Meditations</h1>
            <p className="text-muted-foreground">Upload and manage meditation content</p>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus size={20} />
            Add New Meditation
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Morning Awakening"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Duration (minutes)</label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">SHC Reward</label>
                <Input
                  type="number"
                  value={shcReward}
                  onChange={(e) => setShcReward(e.target.value)}
                  min="0"
                  className="bg-muted/50"
                />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'sv')}
                className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
              >
                <option value="en">English</option>
                <option value="sv">Svenska</option>
              </select>
            </div>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A gentle meditation to start your day..."
                className="bg-muted/50"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">Premium content</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Audio File *</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 h-20 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {audioFile ? audioFile.name : 'Click to upload MP3, WAV, etc.'}
                  </span>
                </label>
              </div>
            </div>
            
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Meditation
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Meditations List */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
            Your Meditations ({meditations.length})
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : meditations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No meditations yet. Upload your first one above!
            </p>
          ) : (
            <div className="space-y-3">
              {meditations.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{med.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {med.duration_minutes} min • {med.category} • +{med.shc_reward} SHC
                        {med.is_premium && ' • Premium'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/meditations/${med.id}`)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant={med.script_text ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleEditScript(med)}
                        className={med.script_text ? "bg-primary" : ""}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        {med.script_text ? 'View/Edit Script' : 'Add Script'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(med.id, med.audio_url)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    {med.script_text ? (
                      <div className="p-3 bg-background rounded border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-primary">✓ Script Available</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScript(med)}
                            className="text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Full Script
                          </Button>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{med.script_text}</p>
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
        </div>

        {/* Script Editor Dialog */}
        <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingScript && meditations.find(m => m.id === editingScript.id)?.title}
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
                        const meditation = meditations.find(m => m.id === editingScript.id);
                        if (meditation) {
                          const template = getScriptTemplate(meditation.category, meditation.title, meditation.duration_minutes);
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
      </div>
    </div>
  );
};

export default Admin;
