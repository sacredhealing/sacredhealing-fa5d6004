import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Task {
  id: string;
  project_id: string | null;
  title: string;
  assigned_to: string | null;
  status: string;
  priority: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
}

const AdminTasksTab = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Filters
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    status: 'pending',
    priority: 'medium',
    notes: '',
  });

  const taskStatuses = ['pending', 'in-progress', 'review', 'completed', 'blocked'];
  const taskPriorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('admin_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch tasks');
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('admin_projects')
      .select('id, title')
      .eq('archived', false)
      .order('title');
    setProjects(data || []);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesProject = filterProject === 'all' || task.project_id === filterProject || (filterProject === 'none' && !task.project_id);
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesStatus && matchesPriority && matchesSearch;
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const payload = {
      ...formData,
      project_id: formData.project_id || null,
    };

    if (editingTask) {
      const { error } = await supabase
        .from('admin_tasks')
        .update(payload)
        .eq('id', editingTask.id);

      if (error) {
        toast.error('Failed to update task');
      } else {
        toast.success('Task updated');
        fetchTasks();
      }
    } else {
      const { error } = await supabase
        .from('admin_tasks')
        .insert([payload]);

      if (error) {
        toast.error('Failed to create task');
      } else {
        toast.success('Task created');
        fetchTasks();
      }
    }

    resetForm();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      project_id: task.project_id || '',
      title: task.title,
      status: task.status,
      priority: task.priority,
      notes: task.notes || '',
    });
    setDialogOpen(true);
  };

  const handleComplete = async (task: Task) => {
    const { error } = await supabase
      .from('admin_tasks')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to complete task');
    } else {
      toast.success('Task completed');
      fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const { error } = await supabase
      .from('admin_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete task');
    } else {
      toast.success('Task deleted');
      fetchTasks();
    }
  };

  const resetForm = () => {
    setFormData({ project_id: '', title: '', status: 'pending', priority: 'medium', notes: '' });
    setEditingTask(null);
    setDialogOpen(false);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500',
      'in-progress': 'bg-blue-500/10 text-blue-500',
      review: 'bg-purple-500/10 text-purple-500',
      completed: 'bg-green-500/10 text-green-500',
      blocked: 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getProjectTitle = (projectId: string | null) => {
    if (!projectId) return 'No Project';
    return projects.find(p => p.id === projectId)?.title || 'Unknown';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              <div>
                <Label>Project</Label>
                <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskPriorities.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Task notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingTask ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 h-8"
          />
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="none">No Project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {taskStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {taskPriorities.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-muted-foreground">No tasks found</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{getProjectTitle(task.project_id)}</p>
                  {task.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {task.status !== 'completed' && (
                    <Button variant="ghost" size="icon" onClick={() => handleComplete(task)}>
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTasksTab;
