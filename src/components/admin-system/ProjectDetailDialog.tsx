import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, FileText, Calendar, MessageSquare, ExternalLink, ListChecks, Check, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
  workflow_stages?: Record<string, boolean>;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  status: string;
  file_url: string | null;
}

interface Event {
  id: string;
  title: string;
  event_type: string;
  date_time: string;
  status: string;
}

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDetailDialog = ({ project, open, onOpenChange }: ProjectDetailDialogProps) => {
  const { getStagesForType, createDefaultWorkflow } = useWorkflowTemplates();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflowStages, setWorkflowStages] = useState<Record<string, boolean>>({});

  // Get workflow stages from templates
  const projectStages = getStagesForType('project');

  useEffect(() => {
    if (project && open) {
      fetchLinkedData();
      fetchWorkflowStages();
      setNotes(project.description || '');
    }
  }, [project, open]);

  const fetchWorkflowStages = async () => {
    if (!project) return;
    
    const defaultWorkflow = createDefaultWorkflow('project');
    
    const { data, error } = await supabase
      .from('admin_projects')
      .select('workflow_stages')
      .eq('id', project.id)
      .single();
    
    if (!error && data) {
      const stages = data.workflow_stages as Record<string, boolean>;
      setWorkflowStages({ ...defaultWorkflow, ...(stages || {}) });
    } else {
      setWorkflowStages({ ...defaultWorkflow, ...(project.workflow_stages || {}) });
    }
  };

  const calculateWorkflowProgress = () => {
    if (!workflowStages) return 0;
    const stageKeys = projectStages.map(s => s.key);
    const completedStages = stageKeys.filter(key => workflowStages[key]).length;
    return stageKeys.length > 0 ? Math.round((completedStages / stageKeys.length) * 100) : 0;
  };

  const isProjectFinished = () => {
    const stageKeys = projectStages.map(s => s.key);
    return stageKeys.every(key => workflowStages[key]);
  };

  const toggleWorkflowStage = async (stageKey: string) => {
    if (!project) return;
    
    const updatedStages = {
      ...workflowStages,
      [stageKey]: !workflowStages[stageKey],
    };
    
    setWorkflowStages(updatedStages);
    
    const { error } = await supabase
      .from('admin_projects')
      .update({ workflow_stages: updatedStages })
      .eq('id', project.id);
      
    if (error) {
      toast.error('Failed to update workflow');
      setWorkflowStages(workflowStages);
    }
  };

  const fetchLinkedData = async () => {
    if (!project) return;
    setLoading(true);

    const [tasksRes, contentsRes, eventsRes] = await Promise.all([
      supabase
        .from('admin_tasks')
        .select('id, title, status, priority')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('admin_content')
        .select('id, title, content_type, status, file_url')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('admin_events')
        .select('id, title, event_type, date_time, status')
        .eq('project_id', project.id)
        .order('date_time', { ascending: true }),
    ]);

    setTasks(tasksRes.data || []);
    setContents(contentsRes.data || []);
    setEvents(eventsRes.data || []);
    setLoading(false);
  };

  const handleSaveNotes = async () => {
    if (!project) return;
    
    const { error } = await supabase
      .from('admin_projects')
      .update({ description: notes })
      .eq('id', project.id);

    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      'in-progress': 'bg-blue-500/10 text-blue-500',
      completed: 'bg-green-500/10 text-green-500',
      scheduled: 'bg-purple-500/10 text-purple-500',
      draft: 'bg-slate-500/10 text-slate-500',
      published: 'bg-green-500/10 text-green-500',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {project.title}
            <Badge variant="outline">{project.type}</Badge>
            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Content ({contents.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Events ({events.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{project.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{project.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(project.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Linked Items</p>
                  <p className="font-medium">{tasks.length + contents.length + events.length} items</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Workflow Progress</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Progress value={calculateWorkflowProgress()} className="flex-1" />
                    <span className="text-sm font-medium">{calculateWorkflowProgress()}%</span>
                    {isProjectFinished() && (
                      <Badge className="bg-green-500/10 text-green-500">Finished</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Project Workflow</span>
                  <div className="flex items-center gap-2">
                    <Progress value={calculateWorkflowProgress()} className="w-32 h-2" />
                    <span className="text-sm font-normal">{calculateWorkflowProgress()}%</span>
                    {isProjectFinished() && (
                      <Badge className="bg-green-500/10 text-green-500">Finished</Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {projectStages.map((stage) => {
                    const isChecked = workflowStages[stage.key];
                    return (
                      <div
                        key={stage.key}
                        className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                          isChecked
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => toggleWorkflowStage(stage.key)}
                      >
                        {isChecked ? (
                          <Check className="h-4 w-4 mb-1 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 mb-1 text-muted-foreground" />
                        )}
                        <span className="text-center">{stage.label}</span>
                      </div>
                    );
                  })}
                </div>
                {isProjectFinished() && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <Badge className="bg-green-500 text-white">Project Finished</Badge>
                    <p className="text-sm text-muted-foreground mt-2">All workflow stages have been completed!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No linked tasks</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium text-sm">{task.title}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{task.priority}</Badge>
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : contents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No linked content</p>
            ) : (
              <div className="space-y-2">
                {contents.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{content.title}</span>
                      <Badge variant="outline">{content.content_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(content.status)}>{content.status}</Badge>
                      {content.file_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={content.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-sm">No linked events</p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium text-sm">{event.title}</span>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.date_time), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{event.event_type}</Badge>
                      <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Project notes..."
              rows={8}
            />
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;
