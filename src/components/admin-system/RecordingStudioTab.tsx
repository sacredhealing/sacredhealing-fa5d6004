import React, { useState, useEffect } from 'react';
import { Mic, CheckCircle2, ArrowRight, ArrowLeft, FileText, Clock, Target, Sparkles, Loader2, Upload, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContentTask {
  id: string;
  title: string;
  category: 'daily_ritual' | 'path' | 'premium_healing' | 'course' | 'meditation';
  source_type: string;
  source_id: string | null;
  path_id: string | null;
  path_day_number: number | null;
  length_target_minutes: number | null;
  access_level: 'free' | 'premium';
  status: 'not_recorded' | 'recorded' | 'uploaded';
  destination_path: string;
  recording_notes: string | null;
  script_text: string | null;
  completed_at: string | null;
  created_at: string;
}

const RecordingStudioTab: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scriptText, setScriptText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAdminLoading && isAdmin) {
      fetchTasks();
    }
  }, [isAdmin, isAdminLoading, categoryFilter]);

  useEffect(() => {
    if (tasks.length > 0 && currentTaskIndex < tasks.length) {
      const task = tasks[currentTaskIndex];
      setScriptText(task.script_text || getDefaultScript(task));
    }
  }, [currentTaskIndex, tasks]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('content_tasks')
        .select('*')
        .eq('status', 'not_recorded')
        .order('created_at', { ascending: true });

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort by priority: daily_ritual > path > premium_healing > course > meditation
      const priority: Record<string, number> = {
        daily_ritual: 1,
        path: 2,
        premium_healing: 3,
        course: 4,
        meditation: 5,
      };

      const sortedTasks = (data || []).sort((a, b) => {
        return (priority[a.category] || 99) - (priority[b.category] || 99);
      });

      setTasks(sortedTasks);
      if (sortedTasks.length > 0 && currentTaskIndex >= sortedTasks.length) {
        setCurrentTaskIndex(0);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultScript = (task: ContentTask): string => {
    const category = task.category;
    const title = task.title.toLowerCase();

    // Daily Ritual Scripts
    if (category === 'daily_ritual') {
      if (title.includes('morning') || title.includes('grounding')) {
        return `🌅 MORNING GROUNDING & INTENTION

[Opening - 30 seconds]
Welcome to this morning practice. Find a comfortable position, either sitting or lying down. Close your eyes gently, or soften your gaze.

[Breath Awareness - 1 minute]
Take three deep breaths. Inhale slowly through your nose... and exhale fully through your mouth. Let your body settle into this moment.

[Grounding - 2 minutes]
Feel your body connecting with the earth beneath you. Notice the support. You are held, you are safe. Let this sense of grounding anchor you for the day ahead.

[Intention Setting - 2 minutes]
As you breathe, set a gentle intention for your day. What quality would you like to bring forward? Perhaps it's presence, kindness, or courage. Let this intention rest in your heart.

[Closing - 30 seconds]
Take one more deep breath. When you're ready, gently open your eyes. Carry this sense of grounding and intention with you throughout your day.`;
      }

      if (title.includes('evening') || title.includes('release')) {
        return `🌙 EVENING RELEASE & REST

[Opening - 30 seconds]
Welcome to this evening practice. Find a comfortable position, perhaps lying down. Let your body fully relax into the support beneath you.

[Body Scan - 3 minutes]
Slowly scan through your body from head to toe. Notice any areas of tension or holding. As you breathe, invite these areas to soften and release.

[Release the Day - 2 minutes]
Let go of anything from today that no longer serves you. Thoughts, emotions, experiences. Breathe them out. You are complete, just as you are.

[Gratitude - 1 minute]
Take a moment to acknowledge one thing you're grateful for from today. Let this feeling of gratitude fill your heart.

[Closing - 30 seconds]
Allow your body to settle into deep rest. You've done enough. You can let go now.`;
      }

      return `🧘 GUIDED MEDITATION

[Opening - 30 seconds]
Welcome. Find a comfortable position and close your eyes gently.

[Main Practice - 5-8 minutes]
[Customize based on specific meditation type]

[Closing - 30 seconds]
Take a deep breath. When you're ready, gently return your awareness to the room.`;
    }

    // Path Scripts
    if (category === 'path') {
      return `🪷 SPIRITUAL PATH MEDITATION

[Opening - 30 seconds]
Welcome to Day ${task.path_day_number || 'X'} of your journey. Find a comfortable position and allow yourself to arrive fully in this moment.

[Theme Introduction - 1 minute]
Today we explore [theme based on path day]. This practice will support you in [benefit].

[Guided Practice - 8-12 minutes]
[Customize based on path day content]

[Integration - 1 minute]
Take a moment to feel how this practice has landed in your body. Notice any shifts, any sense of peace or clarity.

[Closing - 30 seconds]
Carry this awareness with you as you move through your day. You are supported on this path.`;
    }

    // Premium Healing Scripts
    if (category === 'premium_healing') {
      return `🌙 DEEP HEALING MEDITATION

[Opening - 30 seconds]
Welcome to this healing practice. Create a safe, sacred space for yourself. You are held, you are supported.

[Safety & Grounding - 2 minutes]
Feel your body connecting with the earth. You are safe here. This is a space of healing and transformation.

[Healing Practice - 10-15 minutes]
[Customize based on specific healing focus: emotional wounds, inner child, forgiveness, nervous system healing]

[Integration - 2 minutes]
Allow the healing energy to integrate. Feel it moving through your body, your heart, your being.

[Closing - 30 seconds]
Take your time returning. You've done important work. Be gentle with yourself.`;
    }

    // Course Scripts
    if (category === 'course') {
      return `🎓 COURSE LESSON MEDITATION

[Opening - 30 seconds]
Welcome to this lesson. Today we'll explore [lesson topic].

[Teaching Moment - 2-3 minutes]
[Brief teaching or explanation]

[Practice - 8-12 minutes]
[Guided practice related to the teaching]

[Integration - 1 minute]
Take a moment to reflect on what you've learned and experienced.

[Closing - 30 seconds]
Carry this understanding with you.`;
    }

    return `🧘 MEDITATION SCRIPT

[Opening]
Welcome to this practice.

[Main Practice]
[Customize based on meditation type]

[Closing]
Take your time returning.`;
  };

  const currentTask = tasks[currentTaskIndex] || null;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? ((currentTaskIndex + 1) / totalTasks) * 100 : 0;

  const handleSaveScript = async () => {
    if (!currentTask) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('content_tasks')
        .update({ script_text: scriptText })
        .eq('id', currentTask.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Script saved successfully',
      });

      // Update local state
      const updatedTasks = [...tasks];
      updatedTasks[currentTaskIndex] = { ...currentTask, script_text: scriptText };
      setTasks(updatedTasks);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkRecorded = async () => {
    if (!currentTask) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('content_tasks')
        .update({ status: 'recorded' })
        .eq('id', currentTask.id);

      if (error) throw error;

      toast({
        title: 'Marked as Recorded',
        description: 'Great work! Now upload the file to complete.',
      });

      // Remove from list and move to next
      const newTasks = tasks.filter(t => t.id !== currentTask.id);
      setTasks(newTasks);
      
      if (currentTaskIndex >= newTasks.length && newTasks.length > 0) {
        setCurrentTaskIndex(newTasks.length - 1);
      } else if (newTasks.length === 0) {
        setCurrentTaskIndex(0);
      }

      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkUploaded = async () => {
    if (!currentTask) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('content_tasks')
        .update({ 
          status: 'uploaded',
          completed_at: new Date().toISOString()
        })
        .eq('id', currentTask.id);

      if (error) throw error;

      toast({
        title: 'Completed!',
        description: 'Task marked as uploaded and removed from list.',
      });

      // Remove from list and move to next
      const newTasks = tasks.filter(t => t.id !== currentTask.id);
      setTasks(newTasks);
      
      if (currentTaskIndex >= newTasks.length && newTasks.length > 0) {
        setCurrentTaskIndex(newTasks.length - 1);
      } else if (newTasks.length === 0) {
        setCurrentTaskIndex(0);
      }

      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      daily_ritual: '✅',
      path: '🪷',
      premium_healing: '🌙',
      course: '🎓',
      meditation: '🧘',
    };
    return emojis[category] || '📝';
  };

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Admin access required</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎉 All Done!</CardTitle>
          <CardDescription>No tasks remaining. Great work!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              All recording tasks are complete. New tasks will appear here automatically when you create new content.
            </p>
            <Button onClick={fetchTasks} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-6 h-6" />
                Recording Studio
              </CardTitle>
              <CardDescription>Focus on one task at a time</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="daily_ritual">✅ Daily Ritual</SelectItem>
                  <SelectItem value="path">🪷 Spiritual Path</SelectItem>
                  <SelectItem value="premium_healing">🌙 Premium Healing</SelectItem>
                  <SelectItem value="course">🎓 Course</SelectItem>
                  <SelectItem value="meditation">🧘 Meditation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Task {currentTaskIndex + 1} of {totalTasks}
              </span>
              <span className="font-medium">{Math.round(progress)}% through queue</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Task Focus View */}
      {currentTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{currentTask.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">
                      {getCategoryEmoji(currentTask.category)} {currentTask.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant={currentTask.access_level === 'premium' ? 'default' : 'secondary'}>
                      {currentTask.access_level}
                    </Badge>
                    {currentTask.length_target_minutes && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {currentTask.length_target_minutes} min
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Destination
                </p>
                <p className="text-sm text-muted-foreground">{currentTask.destination_path}</p>
              </div>

              {currentTask.recording_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Recording Notes</p>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {currentTask.recording_notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkRecorded}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Mark Recorded
                </Button>
                <Button
                  onClick={handleMarkUploaded}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Mark Uploaded
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Script Editor Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Meditation Script
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveScript}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Save Script
                </Button>
              </div>
              <CardDescription>
                Pre-written script for this meditation. Edit as needed, then save.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Script will appear here..."
                className="min-h-[500px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentTaskIndex(Math.max(0, currentTaskIndex - 1))}
              disabled={currentTaskIndex === 0 || isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentTaskIndex + 1} of {totalTasks}
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentTaskIndex(Math.min(totalTasks - 1, currentTaskIndex + 1))}
              disabled={currentTaskIndex >= totalTasks - 1 || isLoading}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordingStudioTab;

