import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, CheckCircle2, Circle, Radio, Sparkles, Loader2, TrendingUp, Calendar, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Progress } from '@/components/ui/progress';

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
  completed_at: string | null;
  created_at: string;
}

interface ProgressStats {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

const AdminContentRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ContentTask[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<ContentTask | null>(null);
  const [notes, setNotes] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [priorityView, setPriorityView] = useState(false);

  useEffect(() => {
    if (!isAdminLoading && isAdmin) {
      fetchTasks();
      fetchProgress();
    }
  }, [isAdmin, isAdminLoading]);

  useEffect(() => {
    applyFilters();
  }, [tasks, statusFilter, categoryFilter, accessFilter, priorityView]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase.rpc('get_content_roadmap_progress');
      if (error) throw error;
      setProgressStats(data || []);
    } catch (error: any) {
      console.error('Error fetching progress:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Access level filter
    if (accessFilter !== 'all') {
      filtered = filtered.filter(t => t.access_level === accessFilter);
    }

    // Priority view: show only not_recorded, sorted by priority
    if (priorityView) {
      filtered = filtered.filter(t => t.status === 'not_recorded');
      // Sort by priority: daily_ritual > path > premium_healing > course
      filtered.sort((a, b) => {
        const priority: Record<string, number> = {
          daily_ritual: 1,
          path: 2,
          premium_healing: 3,
          course: 4,
          meditation: 5,
        };
        return (priority[a.category] || 99) - (priority[b.category] || 99);
      });
      // Limit to top 3
      filtered = filtered.slice(0, 3);
    }

    setFilteredTasks(filtered);
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'not_recorded' | 'recorded' | 'uploaded') => {
    try {
      const { error } = await supabase
        .from('content_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'uploaded' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Updated',
        description: 'Task status updated',
      });

      fetchTasks();
      fetchProgress();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!editingTask) return;

    try {
      const { error } = await supabase
        .from('content_tasks')
        .update({ recording_notes: notes })
        .eq('id', editingTask.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Recording notes saved',
      });

      setEditingTask(null);
      setNotes('');
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'recorded':
        return <Radio className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      daily_ritual: '✅ Daily Ritual',
      path: '🪷 Spiritual Path',
      premium_healing: '🌙 Premium Healing',
      course: '🎓 Course',
      meditation: '🧘 Meditation',
    };
    return labels[category] || category;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin')} className="w-full">
              Return to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const notRecordedCount = tasks.filter(t => t.status === 'not_recorded').length;
  const recordedCount = tasks.filter(t => t.status === 'recorded').length;
  const uploadedCount = tasks.filter(t => t.status === 'uploaded').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Content Roadmap</h1>
              <p className="text-muted-foreground">Track and manage all recording tasks</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setPriorityView(!priorityView);
              if (!priorityView) {
                setStatusFilter('all');
                setCategoryFilter('all');
                setAccessFilter('all');
              }
            }}
            variant={priorityView ? 'default' : 'outline'}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {priorityView ? 'Show All Tasks' : "What should I record today?"}
          </Button>
        </div>

        {/* Progress Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Track completion across all content categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {progressStats.map((stat) => (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {getCategoryEmoji(stat.category)} {stat.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stat.completed} / {stat.total}
                    </span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{stat.percentage.toFixed(1)}% complete</p>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{notRecordedCount}</div>
                <div className="text-sm text-muted-foreground">Not Recorded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{recordedCount}</div>
                <div className="text-sm text-muted-foreground">Recorded (Not Uploaded)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{uploadedCount}</div>
                <div className="text-sm text-muted-foreground">Uploaded</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="not_recorded">⏳ Not Recorded</SelectItem>
                    <SelectItem value="recorded">🎙 Recorded</SelectItem>
                    <SelectItem value="uploaded">✅ Uploaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
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

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Access Level</label>
                <Select value={accessFilter} onValueChange={setAccessFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Access Levels</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setAccessFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No tasks found</p>
                  <p className="text-sm mt-2">All tasks are complete or try adjusting your filters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{getCategoryLabel(task.category)}</Badge>
                            <Badge variant={task.access_level === 'premium' ? 'default' : 'secondary'}>
                              {task.access_level === 'premium' ? 'Premium' : 'Free'}
                            </Badge>
                            {task.length_target_minutes && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.length_target_minutes} min
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          {task.destination_path}
                        </p>
                      </div>

                      {task.recording_notes && (
                        <div className="text-sm bg-muted/50 p-3 rounded-lg">
                          <p className="font-medium mb-1">Recording Notes:</p>
                          <p className="text-muted-foreground">{task.recording_notes}</p>
                        </div>
                      )}

                      {task.completed_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Completed: {new Date(task.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Select
                        value={task.status}
                        onValueChange={(value: 'not_recorded' | 'recorded' | 'uploaded') =>
                          handleUpdateStatus(task.id, value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_recorded">⏳ Not Recorded</SelectItem>
                          <SelectItem value="recorded">🎙 Recorded</SelectItem>
                          <SelectItem value="uploaded">✅ Uploaded</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTask(task);
                          setNotes(task.recording_notes || '');
                        }}
                      >
                        {task.recording_notes ? 'Edit Notes' : 'Add Notes'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Notes Dialog */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Recording Notes</CardTitle>
              <CardDescription>{editingTask.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add tone reminders, script notes, or recording instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setEditingTask(null);
                  setNotes('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminContentRoadmap;

