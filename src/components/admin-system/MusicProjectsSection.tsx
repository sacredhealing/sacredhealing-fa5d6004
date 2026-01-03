import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Music, Check, Circle, ChevronDown, ChevronRight, ListMusic } from 'lucide-react';
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

interface Song {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  workflow_stages: WorkflowStages;
  created_at: string;
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
  const [songs, setSongs] = useState<Record<string, Song[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<MusicProject | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    music_type: 'single',
    description: '',
  });

  const [songFormData, setSongFormData] = useState({
    title: '',
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
      
      // Fetch songs for all projects
      if (parsed.length > 0) {
        fetchAllSongs(parsed.map(p => p.id));
      }
    }
    setLoading(false);
  };

  const fetchAllSongs = async (projectIds: string[]) => {
    const { data, error } = await supabase
      .from('music_project_songs')
      .select('*')
      .in('project_id', projectIds)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Failed to fetch songs:', error);
      return;
    }

    const songsByProject: Record<string, Song[]> = {};
    (data || []).forEach((song) => {
      const parsed: Song = {
        ...song,
        workflow_stages: typeof song.workflow_stages === 'object' && song.workflow_stages !== null
          ? { ...DEFAULT_WORKFLOW, ...(song.workflow_stages as object) }
          : DEFAULT_WORKFLOW,
      };
      if (!songsByProject[song.project_id]) {
        songsByProject[song.project_id] = [];
      }
      songsByProject[song.project_id].push(parsed);
    });
    setSongs(songsByProject);
  };

  const calculateSongProgress = (song: Song): number => {
    const stages = song.workflow_stages;
    const completedStages = Object.values(stages).filter(Boolean).length;
    return Math.round((completedStages / 7) * 100);
  };

  const isSongFinished = (song: Song): boolean => {
    return calculateSongProgress(song) === 100;
  };

  const calculateProjectProgress = (project: MusicProject): number => {
    const projectSongs = songs[project.id] || [];
    
    // If project has songs, calculate based on songs
    if (projectSongs.length > 0) {
      const totalSongProgress = projectSongs.reduce((sum, song) => sum + calculateSongProgress(song), 0);
      const avgSongProgress = totalSongProgress / projectSongs.length;
      
      // Release stage depends on distrokid + app
      const releaseComplete = project.distrokid_released && project.added_to_app;
      const releaseProgress = releaseComplete ? 100 : 0;
      
      // 80% weight on songs, 20% on release
      return Math.round(avgSongProgress * 0.8 + releaseProgress * 0.2);
    }

    // Fallback to project-level workflow for single tracks
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
    const projectSongs = songs[project.id] || [];
    
    if (projectSongs.length > 0) {
      // All songs must be finished and release must be complete
      const allSongsFinished = projectSongs.every(isSongFinished);
      const releaseComplete = project.distrokid_released && project.added_to_app;
      return allSongsFinished && releaseComplete;
    }
    
    // Fallback for single tracks
    return calculateProjectProgress(project) === 100;
  };

  const updateProjectStatus = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const finished = isProjectFinished(project);
    const currentStatus = project.status;
    const newStatus = finished ? 'completed' : 'active';

    if (currentStatus !== newStatus) {
      await supabase
        .from('admin_projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (finished) {
        toast.success('🎉 Project marked as Finished!');
      }
      fetchProjects();
    }
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

  const handleSongSubmit = async () => {
    if (!songFormData.title.trim()) {
      toast.error('Song title is required');
      return;
    }

    if (editingSong) {
      const { error } = await supabase
        .from('music_project_songs')
        .update({ title: songFormData.title })
        .eq('id', editingSong.id);

      if (error) {
        toast.error('Failed to update song');
      } else {
        toast.success('Song updated');
        fetchProjects();
      }
    } else if (selectedProjectId) {
      const projectSongs = songs[selectedProjectId] || [];
      const workflowJson = JSON.parse(JSON.stringify(DEFAULT_WORKFLOW));
      const { error } = await supabase
        .from('music_project_songs')
        .insert([{
          project_id: selectedProjectId,
          title: songFormData.title,
          order_index: projectSongs.length,
          workflow_stages: workflowJson,
        }]);

      if (error) {
        toast.error('Failed to create song');
      } else {
        toast.success('Song created');
        fetchProjects();
      }
    }

    resetSongForm();
  };

  const handleSongStageToggle = async (song: Song, stageKey: string) => {
    const updatedStages = {
      ...song.workflow_stages,
      [stageKey]: !song.workflow_stages[stageKey as keyof WorkflowStages],
    };

    const { error } = await supabase
      .from('music_project_songs')
      .update({ workflow_stages: updatedStages })
      .eq('id', song.id);

    if (error) {
      toast.error('Failed to update song stage');
    } else {
      // Update local state and check project completion
      fetchProjects();
      setTimeout(() => updateProjectStatus(song.project_id), 500);
    }
  };

  const handleStageToggle = async (projectId: string, stageKey: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedStages = {
      ...project.workflow_stages,
      [stageKey]: !project.workflow_stages[stageKey as keyof WorkflowStages],
    };

    const { error } = await supabase
      .from('admin_projects')
      .update({ workflow_stages: updatedStages })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update stage');
    } else {
      fetchProjects();
    }
  };

  const handleReleaseToggle = async (projectId: string, field: 'distrokid_released' | 'added_to_app') => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newValue = !project[field];
    const { error } = await supabase
      .from('admin_projects')
      .update({ [field]: newValue })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update release status');
    } else {
      fetchProjects();
      setTimeout(() => updateProjectStatus(projectId), 500);
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

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setSongFormData({ title: song.title });
    setSongDialogOpen(true);
  };

  const handleAddSong = (projectId: string) => {
    setSelectedProjectId(projectId);
    setEditingSong(null);
    setSongFormData({ title: '' });
    setSongDialogOpen(true);
  };

  const handleDeleteSong = async (song: Song) => {
    if (!confirm('Are you sure you want to delete this song?')) return;

    const { error } = await supabase
      .from('music_project_songs')
      .delete()
      .eq('id', song.id);

    if (error) {
      toast.error('Failed to delete song');
    } else {
      toast.success('Song deleted');
      fetchProjects();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this music project? All songs will be deleted too.')) return;

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

  const resetSongForm = () => {
    setSongFormData({ title: '' });
    setEditingSong(null);
    setSelectedProjectId(null);
    setSongDialogOpen(false);
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
        {/* Song Dialog */}
        <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSong ? 'Edit Song' : 'Add New Song'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Song Title</Label>
                <Input
                  value={songFormData.title}
                  onChange={(e) => setSongFormData({ title: e.target.value })}
                  placeholder="Song title"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetSongForm}>Cancel</Button>
                <Button onClick={handleSongSubmit}>
                  {editingSong ? 'Update' : 'Add Song'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground">No music projects yet</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const progress = calculateProjectProgress(project);
              const finished = isProjectFinished(project);
              const isExpanded = expandedProject === project.id;
              const projectSongs = songs[project.id] || [];
              const hasSongs = projectSongs.length > 0;

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
                    <div className="flex items-center gap-2 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium">{project.title}</h3>
                          <Badge variant="outline">{getMusicTypeLabel(project.music_type)}</Badge>
                          {hasSongs && (
                            <Badge variant="secondary" className="gap-1">
                              <ListMusic className="h-3 w-3" />
                              {projectSongs.length} songs
                            </Badge>
                          )}
                          {finished ? (
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

                      {/* Songs Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <ListMusic className="h-4 w-4" />
                            Songs ({projectSongs.length})
                          </h4>
                          <Button size="sm" variant="outline" onClick={() => handleAddSong(project.id)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Song
                          </Button>
                        </div>

                        {projectSongs.length > 0 ? (
                          <div className="space-y-3">
                            {projectSongs.map((song) => {
                              const songProgress = calculateSongProgress(song);
                              const songFinished = isSongFinished(song);

                              return (
                                <div key={song.id} className="border rounded-lg p-3 bg-background">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{song.title}</span>
                                      {songFinished ? (
                                        <Badge className="bg-green-500/10 text-green-500 text-xs">Done</Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">{songProgress}%</Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => handleEditSong(song)}>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSong(song)}>
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Song Workflow Stages */}
                                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                                    {WORKFLOW_STAGES.map((stage) => {
                                      const isChecked = song.workflow_stages[stage.key];

                                      return (
                                        <div
                                          key={stage.key}
                                          className={`flex flex-col items-center p-2 rounded border cursor-pointer transition-all text-xs ${
                                            isChecked
                                              ? 'bg-green-500/10 border-green-500/30'
                                              : 'bg-muted/50 hover:bg-muted'
                                          }`}
                                          onClick={() => handleSongStageToggle(song, stage.key)}
                                        >
                                          {isChecked ? (
                                            <Check className="h-3 w-3 mb-0.5 text-green-500" />
                                          ) : (
                                            <Circle className="h-3 w-3 mb-0.5 text-muted-foreground" />
                                          )}
                                          <span className="text-center truncate w-full">{stage.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No songs yet. Add songs to track progress.</p>
                        )}
                      </div>

                      {/* Project Workflow for single tracks without songs */}
                      {!hasSongs && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">Workflow Stages</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {WORKFLOW_STAGES.map((stage) => {
                              const isChecked = project.workflow_stages[stage.key];

                              return (
                                <div
                                  key={stage.key}
                                  className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-green-500/10 border-green-500/30'
                                      : 'bg-background hover:bg-muted/50'
                                  }`}
                                  onClick={() => handleStageToggle(project.id, stage.key)}
                                >
                                  {isChecked ? (
                                    <Check className="h-5 w-5 mb-1 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 mb-1 text-muted-foreground" />
                                  )}
                                  <span className="text-xs text-center">{stage.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Release Requirements */}
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
                          {!(project.distrokid_released && project.added_to_app) && (
                            <p className="text-xs text-yellow-500">
                              Both requirements must be completed to finish the project
                            </p>
                          )}
                        </div>
                      </div>
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
