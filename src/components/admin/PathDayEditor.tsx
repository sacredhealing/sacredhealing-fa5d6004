import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PathDay {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  morning_meditation_id: string | null;
  evening_meditation_id: string | null;
  affirmation: string | null;
  journal_prompt: string | null;
  mantra_text: string | null;
  breathing_description: string | null;
  shc_reward: number;
}

interface Meditation {
  id: string;
  title: string;
  category: string;
}

interface PathDayEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathDay: PathDay | null;
  meditations: Meditation[];
  onSave: () => void;
}

const PathDayEditor: React.FC<PathDayEditorProps> = ({
  open,
  onOpenChange,
  pathDay,
  meditations,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<PathDay>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pathDay) {
      setFormData({
        title: pathDay.title,
        description: pathDay.description || '',
        morning_meditation_id: pathDay.morning_meditation_id || '',
        evening_meditation_id: pathDay.evening_meditation_id || '',
        affirmation: pathDay.affirmation || '',
        journal_prompt: pathDay.journal_prompt || '',
        mantra_text: pathDay.mantra_text || '',
        breathing_description: pathDay.breathing_description || '',
        shc_reward: pathDay.shc_reward
      });
    }
  }, [pathDay]);

  const handleSave = async () => {
    if (!pathDay) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('spiritual_path_days')
        .update({
          title: formData.title,
          description: formData.description || null,
          morning_meditation_id: formData.morning_meditation_id || null,
          evening_meditation_id: formData.evening_meditation_id || null,
          affirmation: formData.affirmation || null,
          journal_prompt: formData.journal_prompt || null,
          mantra_text: formData.mantra_text || null,
          breathing_description: formData.breathing_description || null,
          shc_reward: formData.shc_reward || 15
        })
        .eq('id', pathDay.id);

      if (error) throw error;
      
      toast.success('Path day updated successfully');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating path day:', error);
      toast.error('Failed to update path day');
    } finally {
      setSaving(false);
    }
  };

  if (!pathDay) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Day {pathDay.day_number}: {pathDay.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Day title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the day's focus"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Morning Meditation</Label>
              <Select
                value={formData.morning_meditation_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, morning_meditation_id: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meditation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {meditations.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title} ({m.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Evening Meditation</Label>
              <Select
                value={formData.evening_meditation_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, evening_meditation_id: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meditation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {meditations.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title} ({m.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="affirmation">Affirmation</Label>
            <Textarea
              id="affirmation"
              value={formData.affirmation || ''}
              onChange={(e) => setFormData({ ...formData, affirmation: e.target.value })}
              placeholder="Today's affirmation..."
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="journal_prompt">Journal Prompt</Label>
            <Textarea
              id="journal_prompt"
              value={formData.journal_prompt || ''}
              onChange={(e) => setFormData({ ...formData, journal_prompt: e.target.value })}
              placeholder="What would you like the user to reflect on?"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mantra_text">Mantra Text</Label>
            <Textarea
              id="mantra_text"
              value={formData.mantra_text || ''}
              onChange={(e) => setFormData({ ...formData, mantra_text: e.target.value })}
              placeholder="Today's sacred mantra..."
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="breathing_description">Breathing Practice</Label>
            <Textarea
              id="breathing_description"
              value={formData.breathing_description || ''}
              onChange={(e) => setFormData({ ...formData, breathing_description: e.target.value })}
              placeholder="Describe the breathing exercise..."
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shc_reward">SHC Reward</Label>
            <Input
              id="shc_reward"
              type="number"
              value={formData.shc_reward || 15}
              onChange={(e) => setFormData({ ...formData, shc_reward: parseInt(e.target.value) || 15 })}
              min={0}
              max={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PathDayEditor;
