import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Archive, ArchiveRestore, Eye, Filter } from 'lucide-react';
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
import ProjectDetailDialog from './ProjectDetailDialog';

// Default workflow stages for all projects
export const DEFAULT_PROJECT_WORKFLOW = {
  idea: false,
  finished_coding: false,
  integrated_into_app: false,
  added_to_affiliate: false,
  bought_domain: false,
  released_into_app: false,
};

export const PROJECT_WORKFLOW_LABELS: Record<string, string> = {
  idea: 'Idea',
  finished_coding: 'Finished Coding',
  integrated_into_app: 'Integrated into the App',
  added_to_affiliate: 'Added to Affiliate',
  bought_domain: 'Bought Domain',
  released_into_app: 'Released into the App',
};

export interface ProjectWorkflowStages {
  idea: boolean;
  finished_coding: boolean;
  integrated_into_app: boolean;
  added_to_affiliate: boolean;
  bought_domain: boolean;
  released_into_app: boolean;
}

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  owner: string | null;
  description: string | null;
  archived: boolean;
  created_at: string;
  workflow_stages?: ProjectWorkflowStages;
}

const AdminProjectsTab = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'general',
    status: 'active',
    description: '',
  });

  const projectTypes = ['general', 'development', 'marketing', 'content', 'design', 'research', 'music'];
  const projectStatuses = ['active', 'planning', 'on-hold', 'completed', 'cancelled'];

  useEffect(() => {
    fetchProjects();
  }, [showArchived]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('admin_projects')
      .select('*')
      .eq('archived', showArchived)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch projects');
    } else {
      const typedProjects = (data || []).map(p => ({
        ...p,
        workflow_stages: p.workflow_stages as unknown as ProjectWorkflowStages | undefined,
      }));
      setProjects(typedProjects);
    }
    setLoading(false);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesType = filterType === 'all' || project.type === filterType;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const createTasksFromTemplate = async (projectId: string, projectType: string) => {
    // Fetch task_templates from settings
    const { data: settingsData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('category', 'task_templates')
      .single();

    let templates: Record<string, string[]> = {};
    
    if (settingsData?.value) {
      const value = settingsData.value as { templates?: Record<string, string[]> };
      templates = value.templates || {};
    } else {
      // Default templates if no settings exist
      templates = {
        development: ['Setup Repository', 'Design Architecture', 'Implementation', 'Testing', 'Code Review', 'Deployment'],
        marketing: ['Research', 'Strategy', 'Content Creation', 'Review', 'Launch'],
        content: ['Planning', 'Draft', 'Review', 'Publish'],
        design: ['Research', 'Wireframes', 'Mockups', 'Prototype', 'Review'],
        general: ['Planning', 'Execution', 'Review'],
        research: ['Define Scope', 'Gather Data', 'Analysis', 'Report'],
      };
    }

    const taskTitles = templates[projectType] || templates['general'] || [];
    
    if (taskTitles.length > 0) {
      const tasks = taskTitles.map((title) => ({
        title,
        project_id: projectId,
        status: 'pending',
        priority: 'medium',
      }));

      const { error } = await supabase.from('admin_tasks').insert(tasks);
      
      if (error) {
        console.error('Failed to create tasks from template:', error);
      } else {
        toast.success(`Created ${tasks.length} tasks from template`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingProject) {
      const { error } = await supabase
        .from('admin_projects')
        .update(formData)
        .eq('id', editingProject.id);

      if (error) {
        toast.error('Failed to update project');
      } else {
        toast.success('Project updated');
        fetchProjects();
      }
    } else {
      const { data, error } = await supabase
        .from('admin_projects')
        .insert([{ ...formData, workflow_stages: DEFAULT_PROJECT_WORKFLOW }])
        .select()
        .single();

      if (error) {
        toast.error('Failed to create project');
      } else {
        toast.success('Project created');
        // Auto-create tasks from template
        if (data) {
          await createTasksFromTemplate(data.id, formData.type);
        }
        fetchProjects();
      }
    }

    resetForm();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      type: project.type,
      status: project.status,
      description: project.description || '',
    });
    setDialogOpen(true);
  };

  const handleViewDetail = (project: Project) => {
    setSelectedProject(project);
    setDetailOpen(true);
  };

  const handleArchive = async (project: Project) => {
    const { error } = await supabase
      .from('admin_projects')
      .update({ archived: !project.archived })
      .eq('id', project.id);

    if (error) {
      toast.error('Failed to update project');
    } else {
      toast.success(project.archived ? 'Project restored' : 'Project archived');
      fetchProjects();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabase
      .from('admin_projects')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted');
      fetchProjects();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', type: 'general', status: 'active', description: '' });
    setEditingProject(null);
    setDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      planning: 'bg-blue-500/10 text-blue-500',
      'on-hold': 'bg-yellow-500/10 text-yellow-500',
      completed: 'bg-purple-500/10 text-purple-500',
      cancelled: 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Projects</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {projectStatuses.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
          </div>
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {projectTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {projectStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-muted-foreground">No {showArchived ? 'archived' : 'active'} projects</p>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(project)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{project.title}</h3>
                      <Badge variant="outline">{project.type}</Badge>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetail(project)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleArchive(project)}>
                      {project.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectDetailDialog
        project={selectedProject}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
};

export default AdminProjectsTab;
