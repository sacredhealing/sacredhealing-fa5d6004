import { useState, useEffect } from 'react';
import { Plus, FolderKanban, CheckSquare, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  status: string;
  type: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string | null;
}

interface Event {
  id: string;
  title: string;
  event_type: string;
  date_time: string;
  status: string;
}

const AdminDashboardTab = () => {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick add dialogs
  const [quickAddType, setQuickAddType] = useState<'project' | 'task' | 'event' | 'content' | null>(null);
  const [quickAddData, setQuickAddData] = useState({ title: '', type: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const [projectsRes, tasksRes, eventsRes] = await Promise.all([
      supabase
        .from('admin_projects')
        .select('id, title, status, type')
        .eq('archived', false)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('admin_tasks')
        .select('id, title, status, priority, project_id')
        .eq('status', 'in-progress')
        .order('priority', { ascending: false })
        .limit(5),
      supabase
        .from('admin_events')
        .select('id, title, event_type, date_time, status')
        .gte('date_time', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('date_time', { ascending: true })
        .limit(5),
    ]);

    setActiveProjects(projectsRes.data || []);
    setInProgressTasks(tasksRes.data || []);
    setUpcomingEvents(eventsRes.data || []);
    setLoading(false);
  };

  const handleQuickAdd = async () => {
    if (!quickAddData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    let error;
    switch (quickAddType) {
      case 'project':
        ({ error } = await supabase.from('admin_projects').insert([{ 
          title: quickAddData.title, 
          type: quickAddData.type || 'general' 
        }]));
        break;
      case 'task':
        ({ error } = await supabase.from('admin_tasks').insert([{ 
          title: quickAddData.title 
        }]));
        break;
      case 'event':
        ({ error } = await supabase.from('admin_events').insert([{ 
          title: quickAddData.title,
          date_time: new Date().toISOString(),
          event_type: quickAddData.type || 'meeting'
        }]));
        break;
      case 'content':
        ({ error } = await supabase.from('admin_content').insert([{ 
          title: quickAddData.title,
          content_type: quickAddData.type || 'document'
        }]));
        break;
    }

    if (error) {
      toast.error(`Failed to create ${quickAddType}`);
    } else {
      toast.success(`${quickAddType} created`);
      fetchDashboardData();
    }

    setQuickAddType(null);
    setQuickAddData({ title: '', type: '' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      'in-progress': 'bg-blue-500/10 text-blue-500',
      scheduled: 'bg-purple-500/10 text-purple-500',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-slate-500/10 text-slate-500',
      medium: 'bg-blue-500/10 text-blue-500',
      high: 'bg-orange-500/10 text-orange-500',
      urgent: 'bg-red-500/10 text-red-500',
    };
    return colors[priority] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Add Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Add</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(['project', 'task', 'event', 'content'] as const).map((type) => (
              <Dialog 
                key={type}
                open={quickAddType === type} 
                onOpenChange={(open) => {
                  setQuickAddType(open ? type : null);
                  if (!open) setQuickAddData({ title: '', type: '' });
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Quick Add {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={quickAddData.title}
                        onChange={(e) => setQuickAddData({ ...quickAddData, title: e.target.value })}
                        placeholder={`${type} title`}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                      />
                    </div>
                    {type === 'project' && (
                      <div>
                        <Label>Type</Label>
                        <Select 
                          value={quickAddData.type} 
                          onValueChange={(v) => setQuickAddData({ ...quickAddData, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {['general', 'development', 'marketing', 'content', 'design'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {type === 'event' && (
                      <div>
                        <Label>Event Type</Label>
                        <Select 
                          value={quickAddData.type} 
                          onValueChange={(v) => setQuickAddData({ ...quickAddData, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {['meeting', 'deadline', 'launch', 'live', 'release'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {type === 'content' && (
                      <div>
                        <Label>Content Type</Label>
                        <Select 
                          value={quickAddData.type} 
                          onValueChange={(v) => setQuickAddData({ ...quickAddData, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {['document', 'image', 'video', 'audio', 'link'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setQuickAddType(null)}>Cancel</Button>
                      <Button onClick={handleQuickAdd}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active projects</p>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      <Badge variant="outline" className="text-xs">{project.type}</Badge>
                    </div>
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks In Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Tasks In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks in progress</p>
            ) : (
              <div className="space-y-3">
                {inProgressTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate flex-1 mr-2">{task.title}</p>
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id}>
                    <p className="font-medium text-sm">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(event.date_time), 'MMM d, HH:mm')}</span>
                      <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardTab;
