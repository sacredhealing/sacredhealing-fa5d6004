import React, { useState } from 'react';
import { Sparkles, Check, RefreshCw, AlertCircle, Clock, Zap, Brain, Moon, Leaf, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration_seconds: number;
  bpm?: number;
  description?: string;
  energy_level?: string;
  rhythm_type?: string;
  vocal_type?: string;
  frequency_band?: string;
  best_time_of_day?: string;
  mood?: string;
  spiritual_path?: string;
  intended_use?: string;
  affirmation?: string;
  creator_notes?: string;
  spiritual_description?: string;
  auto_generated_description?: string;
  auto_generated_affirmation?: string;
  analysis_status?: string;
  analysis_completed_at?: string;
}

interface TrackAnalysisSectionProps {
  track: Track;
  onUpdate: () => void;
}

const MOODS = ['calm', 'grounding', 'energizing', 'healing', 'focused'];
const TIMES = ['morning', 'midday', 'evening', 'sleep', 'anytime'];
const PATHS = ['inner_peace', 'focus_mastery', 'sleep_sanctuary', 'deep_healing', 'awakening'];
const ENERGY_LEVELS = ['low', 'medium', 'high'];
const RHYTHM_TYPES = ['steady', 'flowing', 'dynamic'];
const VOCAL_TYPES = ['instrumental', 'mantra', 'lyrics', 'spoken'];
const FREQUENCY_BANDS = ['low', 'balanced', 'high'];

export const TrackAnalysisSection: React.FC<TrackAnalysisSectionProps> = ({ track, onUpdate }) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [mood, setMood] = useState(track.mood || '');
  const [bestTime, setBestTime] = useState(track.best_time_of_day || '');
  const [spiritualPath, setSpiritualPath] = useState(track.spiritual_path || '');
  const [energyLevel, setEnergyLevel] = useState(track.energy_level || '');
  const [rhythmType, setRhythmType] = useState(track.rhythm_type || '');
  const [vocalType, setVocalType] = useState(track.vocal_type || '');
  const [frequencyBand, setFrequencyBand] = useState(track.frequency_band || '');
  const [spiritualDescription, setSpiritualDescription] = useState(
    track.spiritual_description || track.auto_generated_description || ''
  );
  const [affirmation, setAffirmation] = useState(
    track.affirmation || track.auto_generated_affirmation || ''
  );
  const [creatorNotes, setCreatorNotes] = useState(track.creator_notes || '');

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('analyze-music-track', {
        body: {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          duration_seconds: track.duration_seconds,
          bpm: track.bpm,
          description: track.description,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: 'Analysis Complete',
        description: 'AI has generated spiritual metadata for this track.',
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze track',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAndApprove = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('music_tracks')
        .update({
          mood,
          best_time_of_day: bestTime,
          spiritual_path: spiritualPath,
          energy_level: energyLevel,
          rhythm_type: rhythmType,
          vocal_type: vocalType,
          frequency_band: frequencyBand,
          spiritual_description: spiritualDescription,
          affirmation,
          creator_notes: creatorNotes,
          analysis_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', track.id);

      if (error) throw error;

      toast({
        title: 'Saved & Approved',
        description: 'Track spiritual metadata has been approved.',
      });

      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (track.analysis_status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400"><Check className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'completed':
        return <Badge className="bg-amber-500/20 text-amber-400"><AlertCircle className="w-3 h-3 mr-1" /> Needs Review</Badge>;
      case 'analyzing':
        return <Badge className="bg-blue-500/20 text-blue-400"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analyzing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const getMoodIcon = (m: string) => {
    switch (m) {
      case 'calm': return <Moon className="w-4 h-4" />;
      case 'energizing': return <Zap className="w-4 h-4" />;
      case 'healing': return <Sparkles className="w-4 h-4" />;
      case 'focused': return <Brain className="w-4 h-4" />;
      case 'grounding': return <Leaf className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-4 bg-muted/30 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Spiritual Context</h3>
          {getStatusBadge()}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={runAnalysis}
            disabled={isAnalyzing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {track.analysis_status === 'pending' ? 'Analyze' : 'Re-analyze'}
          </Button>
          {!isEditing && (track.analysis_status === 'completed' || track.analysis_status === 'approved') && (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Auto-generated content display (when not editing) */}
      {!isEditing && track.auto_generated_description && (
        <div className="space-y-4 mb-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-Generated Description
            </p>
            <p className="text-sm">{track.auto_generated_description}</p>
          </div>
          
          {track.auto_generated_affirmation && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                <Quote className="w-3 h-3" /> Auto-Generated Affirmation
              </p>
              <p className="text-sm italic">"{track.auto_generated_affirmation}"</p>
            </div>
          )}
        </div>
      )}

      {/* Current approved values (when not editing) */}
      {!isEditing && track.analysis_status === 'approved' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {track.mood && (
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Mood</p>
              <div className="flex items-center justify-center gap-1">
                {getMoodIcon(track.mood)}
                <span className="text-sm capitalize">{track.mood}</span>
              </div>
            </div>
          )}
          {track.best_time_of_day && (
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Best Time</p>
              <span className="text-sm capitalize">{track.best_time_of_day}</span>
            </div>
          )}
          {track.energy_level && (
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Energy</p>
              <span className="text-sm capitalize">{track.energy_level}</span>
            </div>
          )}
          {track.spiritual_path && (
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Path</p>
              <span className="text-sm capitalize">{track.spiritual_path.replace('_', ' ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <div className="space-y-4">
          {/* Row 1: Core attributes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mood</label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map(m => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Best Time</label>
              <Select value={bestTime} onValueChange={setBestTime}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIMES.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Spiritual Path</label>
              <Select value={spiritualPath} onValueChange={setSpiritualPath}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select path" />
                </SelectTrigger>
                <SelectContent>
                  {PATHS.map(p => (
                    <SelectItem key={p} value={p} className="capitalize">{p.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Energy Level</label>
              <Select value={energyLevel} onValueChange={setEnergyLevel}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select energy" />
                </SelectTrigger>
                <SelectContent>
                  {ENERGY_LEVELS.map(e => (
                    <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Technical attributes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rhythm Type</label>
              <Select value={rhythmType} onValueChange={setRhythmType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select rhythm" />
                </SelectTrigger>
                <SelectContent>
                  {RHYTHM_TYPES.map(r => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Vocal Type</label>
              <Select value={vocalType} onValueChange={setVocalType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select vocal" />
                </SelectTrigger>
                <SelectContent>
                  {VOCAL_TYPES.map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frequency Band</label>
              <Select value={frequencyBand} onValueChange={setFrequencyBand}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_BANDS.map(f => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spiritual Description */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Spiritual Description</label>
            <Textarea
              value={spiritualDescription}
              onChange={(e) => setSpiritualDescription(e.target.value)}
              placeholder="1-2 sentences about the track's purpose and healing qualities..."
              rows={2}
            />
            {track.auto_generated_description && spiritualDescription !== track.auto_generated_description && (
              <button
                className="text-xs text-amber-400 mt-1 hover:underline"
                onClick={() => setSpiritualDescription(track.auto_generated_description || '')}
              >
                ↩ Use AI suggestion
              </button>
            )}
          </div>

          {/* Affirmation */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Affirmation</label>
            <Input
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              placeholder="A powerful affirmation for this track..."
            />
            {track.auto_generated_affirmation && affirmation !== track.auto_generated_affirmation && (
              <button
                className="text-xs text-purple-400 mt-1 hover:underline"
                onClick={() => setAffirmation(track.auto_generated_affirmation || '')}
              >
                ↩ Use AI suggestion
              </button>
            )}
          </div>

          {/* Creator Notes */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Creator Notes (visible to users)</label>
            <Textarea
              value={creatorNotes}
              onChange={(e) => setCreatorNotes(e.target.value)}
              placeholder="Share the inspiration or story behind this track..."
              rows={2}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={saveAndApprove} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Save & Approve
            </Button>
          </div>
        </div>
      )}

      {/* Prompt to analyze if pending */}
      {track.analysis_status === 'pending' && !isAnalyzing && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Click "Analyze" to generate spiritual context using AI
        </p>
      )}
    </Card>
  );
};