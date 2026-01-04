import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, CheckCircle2, Circle, Rocket, Loader2, Download } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import FileUpload from '@/components/admin/FileUpload';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import ItemWorkflowEditor from './ItemWorkflowEditor';

interface CourseProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  workflow_stages: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  added_to_app?: boolean;
  file_url?: string;
  file_urls?: string[];
}

const CoursesProjectsSection = () => {
  const { session } = useAuth();
  const { getStagesForType, createDefaultWorkflow, loading: templatesLoading } = useWorkflowTemplates();
  const [projects, setProjects] = useState<CourseProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CourseProject | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: ''
  });

  // Get workflow stages from templates
  const courseStages = getStagesForType('course');

  useEffect(() => {
    if (!templatesLoading) {
      fetchProjects();
    }
  }, [templatesLoading]);

  const fetchProjects = async () => {
    try {
      const defaultWorkflow = createDefaultWorkflow('course');
      
      const { data, error } = await supabase
        .from('admin_projects')
        .select('*')
        .eq('type', 'course')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects = (data || []).map(project => ({
        ...project,
        workflow_stages: { ...defaultWorkflow, ...(project.workflow_stages as Record<string, boolean>) },
        file_urls: Array.isArray(project.file_urls) 
          ? (project.file_urls as unknown as string[]) 
          : []
      })) as CourseProject[];

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching course projects:', error);
      toast.error('Failed to load course projects');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (workflow: Record<string, boolean>) => {
    // Include both template and custom stages
    const allStageKeys = Object.keys(workflow);
    const completed = allStageKeys.filter(key => workflow[key]).length;
    return allStageKeys.length > 0 ? Math.round((completed / allStageKeys.length) * 100) : 0;
  };

  const isProjectFinished = (workflow: Record<string, boolean>) => {
    const allStageKeys = Object.keys(workflow);
    return allStageKeys.length > 0 && allStageKeys.every(key => workflow[key]);
  };

  // Get custom stages (keys not in template)
  const getCustomStages = (workflow: Record<string, boolean>): { key: string; label: string }[] => {
    const templateKeys = courseStages.map(s => s.key);
    return Object.keys(workflow)
      .filter(key => !templateKeys.includes(key))
      .map(key => ({
        key,
        label: key.replace(/^custom_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }));
  };

  const handleCourseWorkflowUpdate = async (projectId: string, updatedWorkflow: Record<string, boolean>) => {
    const { error } = await supabase
      .from('admin_projects')
      .update({ workflow_stages: updatedWorkflow })
      .eq('id', projectId);
    
    if (error) throw error;
    fetchProjects();
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
            file_url: formData.file_url || null,
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
            workflow_stages: createDefaultWorkflow('course'),
            file_url: formData.file_url || null
          });

        if (error) throw error;
        toast.success('Course created successfully');
      }

      setIsDialogOpen(false);
      setEditingProject(null);
      setFormData({ title: '', description: '', file_url: '' });
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
      description: project.description || '',
      file_url: project.file_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleFileChange = async (projectId: string, fileUrl: string) => {
    const { error } = await supabase
      .from('admin_projects')
      .update({ file_url: fileUrl || null, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update file');
    } else {
      toast.success('File updated');
      fetchProjects();
    }
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
    setFormData({ title: '', description: '', file_url: '' });
    setIsDialogOpen(true);
  };

  // Publish course: create/update in courses table and send notifications
  const handlePublishCourse = async (project: CourseProject) => {
    if (!isProjectFinished(project.workflow_stages)) {
      toast.error('Complete all workflow stages before publishing');
      return;
    }

    setPublishingId(project.id);

    try {
      // Check if course already exists linked to this project
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('linked_project_id', project.id)
        .maybeSingle();

      if (existingCourse) {
        // Update existing course to published
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            title: project.title,
            description: project.description,
            is_published: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCourse.id);

        if (updateError) throw updateError;
      } else {
        // Create new course entry
        const { error: insertError } = await supabase
          .from('courses')
          .insert({
            title: project.title,
            description: project.description,
            is_published: true,
            linked_project_id: project.id,
            category: 'healing',
            difficulty_level: 'beginner',
            duration_hours: 1,
            lesson_count: 0,
            is_free: false,
            price_usd: 0,
            has_certificate: true
          });

        if (insertError) throw insertError;
      }

      // Mark project as added to app
      await supabase
        .from('admin_projects')
        .update({ 
          added_to_app: true,
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      // Send notifications to subscribers
      try {
        await supabase.functions.invoke('notify-course-release', {
          body: {
            courseId: project.id,
            courseTitle: project.title,
            courseDescription: project.description
          }
        });
        console.log('Notifications sent successfully');
      } catch (notifyError) {
        console.error('Failed to send notifications:', notifyError);
        // Don't fail the whole operation if notifications fail
      }

      toast.success('Course published successfully! Notifications sent to subscribers.');
      fetchProjects();
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Failed to publish course');
    } finally {
      setPublishingId(null);
    }
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
              <FileUpload
                value={formData.file_url}
                onChange={(url) => setFormData({ ...formData, file_url: url })}
                folder="courses"
                fileType="document"
                label="Course File (.pdf, .docx, .txt)"
              />
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
                        {finished && !project.added_to_app && (
                          <Badge variant="default" className="bg-amber-500">
                            Ready to Publish
                          </Badge>
                        )}
                        {project.added_to_app && (
                          <Badge variant="default" className="bg-green-500">
                            Published
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
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Workflow Stages</p>
                      <ItemWorkflowEditor
                        itemId={project.id}
                        itemType="course"
                        currentWorkflow={project.workflow_stages}
                        templateStages={courseStages}
                        onWorkflowUpdate={(workflow) => handleCourseWorkflowUpdate(project.id, workflow)}
                        onRefresh={fetchProjects}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {courseStages.map((stage) => {
                        const isCompleted = project.workflow_stages[stage.key];
                        return (
                          <button
                            key={stage.key}
                            onClick={() => toggleWorkflowStage(project, stage.key)}
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
                            {stage.label}
                          </button>
                        );
                      })}
                      {/* Custom stages */}
                      {getCustomStages(project.workflow_stages).map((stage) => {
                        const isCompleted = project.workflow_stages[stage.key];
                        return (
                          <button
                            key={stage.key}
                            onClick={() => toggleWorkflowStage(project, stage.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              isCompleted
                                ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                            {stage.label}
                            <Badge variant="secondary" className="text-[10px] py-0 px-1 ml-1">Custom</Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Course Files</p>
                      {project.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(project.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      )}
                    </div>
                    {!project.file_url && (
                      <FileUpload
                        value={project.file_url || ''}
                        onChange={(url) => handleFileChange(project.id, url)}
                        folder="courses"
                        fileType="document"
                        label="Upload Course File (.pdf, .docx, .txt)"
                      />
                    )}
                  </div>

                  {/* Finish & Publish Button - only show when all stages complete and not yet published */}
                  {finished && !project.added_to_app && (
                    <div className="pt-2 border-t border-border/50">
                      <Button 
                        onClick={() => handlePublishCourse(project)}
                        disabled={publishingId === project.id}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        {publishingId === project.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Finish & Publish Course
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        This will make the course visible on /courses and notify all subscribers
                      </p>
                    </div>
                  )}

                  {/* Already published indicator */}
                  {project.added_to_app && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Course is live on /courses
                      </div>
                    </div>
                  )}
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
