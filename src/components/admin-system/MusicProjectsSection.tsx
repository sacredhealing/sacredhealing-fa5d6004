import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Music, Check, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface WorkflowStages {
  idea: boolean;
  arrangement: boolean;
  record: boolean;
  mix: boolean;
  master: boolean;
  cover: boolean;
  release: boolean;
}

interface MusicProject {
  id: string;
  title: string;
  type: string;
  music_type: string | null;
  status: string;
  description: string | null;
  workflow_stages: WorkflowStages;
  distrokid_released: boolean;
  added_to_app: boolean;
  created_at: string;
}

const MUSIC_TYPES = [
  { value: 'album', label: 'Album' },
  { value: 'single', label: 'Single' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'beats', label: 'Beats' },
  { value: 'light_language', label: 'Light Language' },
  { value: 'frequency', label: 'Frequency' },
  { value: 'affirmations', label: 'Affirmations' },
  { value: 'mantra', label: 'Mantra' },
];

const WORKFLOW_STAGES = [
  { key: 'idea', label: 'Idea' },
  { key: 'arrangement', label: 'Arrangement' },
  { key: 'record', label: 'Record' },
  { key: 'mix', label: 'Mix' },
  { key: 'master', label: 'Master' },
  { key: 'cover', label: 'Cover' },
  { key: 'release', label: 'Release' },
] as const;

const DEFAULT_WORKFLOW: WorkflowStages = {
  idea: false,
  arrangement: false,
  record: false,
  mix: false,
  master: false,
  cover: false,
  release: false,
};

const MusicProjectsSection = () => {
  const [projects, setProjects] = useState<MusicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<MusicProject | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    music_type: 'single',
    description: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('admin_projects')
      .select('*')
      .eq('type', 'music')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch music projects');
    } else {
      const parsed = (data || []).map((p) => ({
        ...p,
        workflow_stages: typeof p.workflow_stages === 'object' && p.workflow_stages !== null 
          ? { ...DEFAULT_WORKFLOW, ...(p.workflow_stages as object) }
          : DEFAULT_WORKFLOW,
      })) as MusicProject[];
      setProjects(parsed);
    }
    setLoading(false);
  };

  const calculateProgress = (project: MusicProject): number => {
    const stages = project.workflow_stages;
    const releaseComplete = stages.release && project.distrokid_released && project.added_to_app;
    const completedStages = [
      stages.idea,
      stages.arrangement,
      stages.record,
      stages.mix,
      stages.master,
      stages.cover,
      releaseComplete,
    ].filter(Boolean).length;
    return Math.round((completedStages / 7) * 100);
  };

  const isProjectFinished = (project: MusicProject): boolean => {
    return calculateProgress(project) === 100;
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const workflowJson = JSON.parse(JSON.stringify(DEFAULT_WORKFLOW));

    if (editingProject) {
      const { error } = await supabase
        .from('admin_projects')
        .update({
          title: formData.title,
          music_type: formData.music_type,
          description: formData.description,
        })
        .eq('id', editingProject.id);

      if (error) {
        toast.error('Failed to update project');
      } else {
        toast.success('Music project updated');
        fetchProjects();
      }
    } else {
      const { error } = await supabase
        .from('admin_projects')
        .insert([{
          title: formData.title,
          type: 'music',
          music_type: formData.music_type,
          description: formData.description,
          status: 'active',
          workflow_stages: workflowJson,
          distrokid_released: false,
          added_to_app: false,
        }]);

      if (error) {
        toast.error('Failed to create project');
      } else {
        toast.success('Music project created');
        fetchProjects();
      }
    }

    resetForm();
  };

  const handleStageToggle = async (projectId: string, stageKey: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedStages = {
      ...project.workflow_stages,
      [stageKey]: !project.workflow_stages[stageKey as keyof WorkflowStages],
    };

    // Check if project should be marked as finished
    const releaseComplete = updatedStages.release && project.distrokid_released && project.added_to_app;
    const allComplete = updatedStages.idea && updatedStages.arrangement && updatedStages.record &&
      updatedStages.mix && updatedStages.master && updatedStages.cover && releaseComplete;

    const { error } = await supabase
      .from('admin_projects')
      .update({ 
        workflow_stages: updatedStages,
        status: allComplete ? 'completed' : 'active',
      })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update stage');
    } else {
      fetchProjects();
      if (allComplete) {
        toast.success('🎉 Project marked as Finished!');
      }
    }
  };

  const handleReleaseToggle = async (projectId: string, field: 'distrokid_released' | 'added_to_app') => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newValue = !project[field];
    const updates: Record<string, unknown> = { [field]: newValue };

    // Check if project should be marked as finished
    const distrokid = field === 'distrokid_released' ? newValue : project.distrokid_released;
    const inApp = field === 'added_to_app' ? newValue : project.added_to_app;
    const stages = project.workflow_stages;
    const releaseComplete = stages.release && distrokid && inApp;
    const allComplete = stages.idea && stages.arrangement && stages.record &&
      stages.mix && stages.master && stages.cover && releaseComplete;

    updates.status = allComplete ? 'completed' : 'active';

    const { error } = await supabase
      .from('admin_projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update release status');
    } else {
      fetchProjects();
      if (allComplete) {
        toast.success('🎉 Project marked as Finished!');
      }
    }
  };

  const handleEdit = (project: MusicProject) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      music_type: project.music_type || 'single',
      description: project.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this music project?')) return;

    const { error } = await supabase
      .from('admin_projects')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Music project deleted');
      fetchProjects();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', music_type: 'single', description: '' });
    setEditingProject(null);
    setDialogOpen(false);
  };

  const getMusicTypeLabel = (type: string | null) => {
    return MUSIC_TYPES.find((t) => t.value === type)?.label || type || 'Unknown';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <CardTitle>Music Projects</CardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Music Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Music Project' : 'New Music Project'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Project title"
                />
              </div>
              <div>
                <Label>Music Type</Label>
                <Select value={formData.music_type} onValueChange={(v) => setFormData({ ...formData, music_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSIC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingProject ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground">No music projects yet</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const progress = calculateProgress(project);
              const isFinished = isProjectFinished(project);
              const isExpanded = expandedProject === project.id;
              const stages = project.workflow_stages;
              const releaseComplete = stages.release && project.distrokid_released && project.added_to_app;

              return (
                <div
                  key={project.id}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{project.title}</h3>
                        <Badge variant="outline">{getMusicTypeLabel(project.music_type)}</Badge>
                        {isFinished ? (
                          <Badge className="bg-green-500/10 text-green-500">Finished</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-500">In Progress</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={progress} className="w-32 h-2" />
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-4">
                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}

                      {/* Workflow Stages */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Workflow Stages</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                          {WORKFLOW_STAGES.map((stage) => {
                            const isChecked = stages[stage.key];
                            const isRelease = stage.key === 'release';

                            return (
                              <div
                                key={stage.key}
                                className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                  isChecked
                                    ? isRelease && !releaseComplete
                                      ? 'bg-yellow-500/10 border-yellow-500/30'
                                      : 'bg-green-500/10 border-green-500/30'
                                    : 'bg-background hover:bg-muted/50'
                                }`}
                                onClick={() => handleStageToggle(project.id, stage.key)}
                              >
                                {isChecked ? (
                                  <Check className={`h-5 w-5 mb-1 ${
                                    isRelease && !releaseComplete ? 'text-yellow-500' : 'text-green-500'
                                  }`} />
                                ) : (
                                  <Circle className="h-5 w-5 mb-1 text-muted-foreground" />
                                )}
                                <span className="text-xs text-center">{stage.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Release Requirements */}
                      {stages.release && (
                        <div className="border rounded-lg p-4 bg-background">
                          <h4 className="text-sm font-medium mb-3">Release Requirements</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`distrokid-${project.id}`}
                                checked={project.distrokid_released}
                                onCheckedChange={() => handleReleaseToggle(project.id, 'distrokid_released')}
                              />
                              <Label htmlFor={`distrokid-${project.id}`} className="cursor-pointer">
                                Distributed via DistroKid
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`inapp-${project.id}`}
                                checked={project.added_to_app}
                                onCheckedChange={() => handleReleaseToggle(project.id, 'added_to_app')}
                              />
                              <Label htmlFor={`inapp-${project.id}`} className="cursor-pointer">
                                Added inside the app
                              </Label>
                            </div>
                            {!releaseComplete && stages.release && (
                              <p className="text-xs text-yellow-500">
                                Both requirements must be completed to finish the Release stage
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MusicProjectsSection;
