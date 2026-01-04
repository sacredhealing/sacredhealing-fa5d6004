import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Filter, FileText, Image, Video, Music, Link, File } from 'lucide-react';
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

interface Content {
  id: string;
  project_id: string | null;
  title: string;
  content_type: string;
  file_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
}

const AdminContentTab = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    content_type: 'document',
    file_url: '',
    status: 'draft',
    notes: '',
  });

  const contentTypes = ['document', 'image', 'video', 'audio', 'link', 'other'];
  const contentStatuses = ['draft', 'review', 'approved', 'published', 'archived'];

  const getContentIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      document: <FileText className="h-4 w-4" />,
      image: <Image className="h-4 w-4" />,
      video: <Video className="h-4 w-4" />,
      audio: <Music className="h-4 w-4" />,
      link: <Link className="h-4 w-4" />,
      other: <File className="h-4 w-4" />,
    };
    return icons[type] || <File className="h-4 w-4" />;
  };

  useEffect(() => {
    fetchContents();
    fetchProjects();
  }, []);

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from('admin_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch content');
    } else {
      setContents(data || []);
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

  const filteredContents = contents.filter((content) => {
    const matchesType = filterType === 'all' || content.content_type === filterType;
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus;
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const payload = {
      ...formData,
      project_id: formData.project_id || null,
      file_url: formData.file_url || null,
    };

    if (editingContent) {
      const { error } = await supabase
        .from('admin_content')
        .update(payload)
        .eq('id', editingContent.id);

      if (error) {
        toast.error('Failed to update content');
      } else {
        toast.success('Content updated');
        fetchContents();
      }
    } else {
      const { error } = await supabase
        .from('admin_content')
        .insert([payload]);

      if (error) {
        toast.error('Failed to create content');
      } else {
        toast.success('Content created');
        fetchContents();
      }
    }

    resetForm();
  };

  const handleEdit = (content: Content) => {
    setEditingContent(content);
    setFormData({
      project_id: content.project_id || '',
      title: content.title,
      content_type: content.content_type,
      file_url: content.file_url || '',
      status: content.status,
      notes: content.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    const { error } = await supabase
      .from('admin_content')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete content');
    } else {
      toast.success('Content deleted');
      fetchContents();
    }
  };

  const resetForm = () => {
    setFormData({ project_id: '', title: '', content_type: 'document', file_url: '', status: 'draft', notes: '' });
    setEditingContent(null);
    setDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-500/10 text-slate-500',
      review: 'bg-yellow-500/10 text-yellow-500',
      approved: 'bg-blue-500/10 text-blue-500',
      published: 'bg-green-500/10 text-green-500',
      archived: 'bg-red-500/10 text-red-500',
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
        <CardTitle>Content Library</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingContent ? 'Edit Content' : 'New Content'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Content title"
                />
              </div>
              <div>
                <Label>Project</Label>
                <Select
                  value={formData.project_id || "none"}
                  onValueChange={(v) => setFormData({ ...formData, project_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.content_type} onValueChange={(v) => setFormData({ ...formData, content_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((t) => (
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
                      {contentStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>File URL</Label>
                <Input
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Content notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingContent ? 'Update' : 'Create'}
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
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {contentTypes.map((t) => (
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
              {contentStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredContents.length === 0 ? (
          <p className="text-muted-foreground">No content found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContents.map((content) => (
              <div
                key={content.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getContentIcon(content.content_type)}
                    <Badge variant="outline">{content.content_type}</Badge>
                  </div>
                  <Badge className={getStatusColor(content.status)}>{content.status}</Badge>
                </div>
                <h3 className="font-medium mb-1 line-clamp-1">{content.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{getProjectTitle(content.project_id)}</p>
                <div className="flex gap-2">
                  {content.file_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={content.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(content)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(content.id)}>
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

export default AdminContentTab;
