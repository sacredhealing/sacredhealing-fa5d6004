import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  workflow_stages: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

const COURSE_WORKFLOW_STAGES = [
  'Idea',
  'Arrangement',
  'PDF Text',
  'Audios',
  'Videos',
  'Cover',
  'Description'
];

const DEFAULT_WORKFLOW: Record<string, boolean> = COURSE_WORKFLOW_STAGES.reduce((acc, stage) => {
  acc[stage] = false;
  return acc;
}, {} as Record<string, boolean>);

const CoursesProjectsSection = () => {
  const [projects, setProjects] = useState<CourseProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CourseProject | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_projects')
        .select('*')
        .eq('type', 'course')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects = (data || []).map(project => ({
        ...project,
        workflow_stages: (project.workflow_stages as Record<string, boolean>) || DEFAULT_WORKFLOW
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching course projects:', error);
      toast.error('Failed to load course projects');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (workflow: Record<string, boolean>) => {
    const stages = COURSE_WORKFLOW_STAGES;
    const completed = stages.filter(stage => workflow[stage]).length;
    return Math.round((completed / stages.length) * 100);
  };

  const isProjectFinished = (workflow: Record<string, boolean>) => {
    return COURSE_WORKFLOW_STAGES.every(stage => workflow[stage]);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('admin_projects')
          .update({
            title: formData.title,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProject.id);

        if (error) throw error;
        toast.success('Course updated successfully');
      } else {
        const { error } = await supabase
          .from('admin_projects')
          .insert({
            title: formData.title,
            description: formData.description,
            type: 'course',
            status: 'planning',
            workflow_stages: DEFAULT_WORKFLOW
          });

        if (error) throw error;
        toast.success('Course created successfully');
      }

      setIsDialogOpen(false);
      setEditingProject(null);
      setFormData({ title: '', description: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    }
  };

  const handleEdit = (project: CourseProject) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('admin_projects')
        .update({ archived: true })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Course deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const toggleWorkflowStage = async (project: CourseProject, stage: string) => {
    const updatedWorkflow = {
      ...project.workflow_stages,
      [stage]: !project.workflow_stages[stage]
    };

    const isFinished = isProjectFinished(updatedWorkflow);

    try {
      const { error } = await supabase
        .from('admin_projects')
        .update({
          workflow_stages: updatedWorkflow,
          status: isFinished ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Failed to update stage');
    }
  };

  const openNewDialog = () => {
    setEditingProject(null);
    setFormData({ title: '', description: '' });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Course Projects
          </h2>
          <p className="text-sm text-muted-foreground">Manage course content with workflow tracking</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter course title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingProject ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No courses yet. Create your first course to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const progress = calculateProgress(project.workflow_stages);
            const finished = isProjectFinished(project.workflow_stages);

            return (
              <Card key={project.id} className={finished ? 'border-green-500/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {project.title}
                        {finished && (
                          <Badge variant="default" className="bg-green-500">
                            Finished
                          </Badge>
                        )}
                      </CardTitle>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Workflow Stages</p>
                    <div className="flex flex-wrap gap-2">
                      {COURSE_WORKFLOW_STAGES.map((stage) => {
                        const isCompleted = project.workflow_stages[stage];
                        return (
                          <button
                            key={stage}
                            onClick={() => toggleWorkflowStage(project, stage)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              isCompleted
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                            {stage}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesProjectsSection;
