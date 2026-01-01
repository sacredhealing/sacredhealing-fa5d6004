import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Tag, FileText, CheckSquare, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Setting {
  id: string;
  category: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

interface SettingValue {
  items?: string[];
  templates?: Record<string, string[]>;
  [key: string]: unknown;
}

const defaultSettings: Record<string, SettingValue> = {
  project_types: { items: ['general', 'development', 'marketing', 'content', 'design', 'research'] },
  task_templates: { 
    templates: {
      development: ['Setup Repository', 'Design Architecture', 'Implementation', 'Testing', 'Code Review', 'Deployment'],
      marketing: ['Research', 'Strategy', 'Content Creation', 'Review', 'Launch'],
      content: ['Planning', 'Draft', 'Review', 'Publish'],
      design: ['Research', 'Wireframes', 'Mockups', 'Prototype', 'Review'],
      general: ['Planning', 'Execution', 'Review'],
      research: ['Define Scope', 'Gather Data', 'Analysis', 'Report'],
    }
  },
  status_labels: { items: ['pending', 'in-progress', 'review', 'completed', 'blocked', 'cancelled'] },
  content_types: { items: ['document', 'image', 'video', 'audio', 'link', 'other'] },
};

const AdminSettingsTab = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [activeTab, setActiveTab] = useState('project_types');
  const [newItem, setNewItem] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('general');
  const [newTaskTemplate, setNewTaskTemplate] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    value: '{}',
  });

  const settingCategories = [
    { id: 'project_types', label: 'Project Types', icon: Palette },
    { id: 'task_templates', label: 'Task Templates', icon: CheckSquare },
    { id: 'status_labels', label: 'Status Labels', icon: Tag },
    { id: 'content_types', label: 'Content Types', icon: FileText },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .order('category');

    if (error) {
      toast.error('Failed to fetch settings');
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  };

  const getSettingValue = (category: string): SettingValue => {
    const setting = settings.find(s => s.category === category);
    if (setting) return setting.value as SettingValue;
    return defaultSettings[category] || { items: [] };
  };

  const getSettingItems = (category: string): string[] => {
    const value = getSettingValue(category);
    return value.items || [];
  };

  const getTaskTemplates = (): Record<string, string[]> => {
    const value = getSettingValue('task_templates');
    return value.templates || defaultSettings.task_templates.templates || {};
  };

  const getProjectTypes = (): string[] => {
    return getSettingItems('project_types');
  };

  const handleAddItem = async (category: string) => {
    if (!newItem.trim()) return;

    const existingSetting = settings.find(s => s.category === category);
    const currentItems = getSettingItems(category);
    
    if (currentItems.includes(newItem.trim())) {
      toast.error('Item already exists');
      return;
    }

    const newValue = { items: [...currentItems, newItem.trim()] };

    if (existingSetting) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: newValue })
        .eq('id', existingSetting.id);

      if (error) {
        toast.error('Failed to add item');
      } else {
        toast.success('Item added');
        fetchSettings();
      }
    } else {
      const { error } = await supabase
        .from('admin_settings')
        .insert([{ category, value: newValue }]);

      if (error) {
        toast.error('Failed to add item');
      } else {
        toast.success('Item added');
        fetchSettings();
      }
    }

    setNewItem('');
  };

  const handleRemoveItem = async (category: string, item: string) => {
    const existingSetting = settings.find(s => s.category === category);
    const currentItems = getSettingItems(category);
    const newValue = { items: currentItems.filter(i => i !== item) };

    if (existingSetting) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: newValue })
        .eq('id', existingSetting.id);

      if (error) {
        toast.error('Failed to remove item');
      } else {
        toast.success('Item removed');
        fetchSettings();
      }
    }
  };

  const handleAddTaskTemplate = async () => {
    if (!newTaskTemplate.trim()) return;

    const existingSetting = settings.find(s => s.category === 'task_templates');
    const currentTemplates = getTaskTemplates();
    const currentTasks = currentTemplates[selectedProjectType] || [];

    if (currentTasks.includes(newTaskTemplate.trim())) {
      toast.error('Task already exists for this project type');
      return;
    }

    const newTemplates = {
      ...currentTemplates,
      [selectedProjectType]: [...currentTasks, newTaskTemplate.trim()],
    };

    const newValue = { templates: newTemplates };

    if (existingSetting) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: newValue })
        .eq('id', existingSetting.id);

      if (error) {
        toast.error('Failed to add task template');
      } else {
        toast.success('Task template added');
        fetchSettings();
      }
    } else {
      const { error } = await supabase
        .from('admin_settings')
        .insert([{ category: 'task_templates', value: newValue }]);

      if (error) {
        toast.error('Failed to add task template');
      } else {
        toast.success('Task template added');
        fetchSettings();
      }
    }

    setNewTaskTemplate('');
  };

  const handleRemoveTaskTemplate = async (projectType: string, task: string) => {
    const existingSetting = settings.find(s => s.category === 'task_templates');
    const currentTemplates = getTaskTemplates();
    const currentTasks = currentTemplates[projectType] || [];

    const newTemplates = {
      ...currentTemplates,
      [projectType]: currentTasks.filter(t => t !== task),
    };

    const newValue = { templates: newTemplates };

    if (existingSetting) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: newValue })
        .eq('id', existingSetting.id);

      if (error) {
        toast.error('Failed to remove task template');
      } else {
        toast.success('Task template removed');
        fetchSettings();
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }

    let parsedValue;
    try {
      parsedValue = JSON.parse(formData.value);
    } catch {
      toast.error('Invalid JSON value');
      return;
    }

    const payload = {
      category: formData.category,
      value: parsedValue,
    };

    if (editingSetting) {
      const { error } = await supabase
        .from('admin_settings')
        .update(payload)
        .eq('id', editingSetting.id);

      if (error) {
        toast.error('Failed to update setting');
      } else {
        toast.success('Setting updated');
        fetchSettings();
      }
    } else {
      const { error } = await supabase
        .from('admin_settings')
        .insert([payload]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Category already exists');
        } else {
          toast.error('Failed to create setting');
        }
      } else {
        toast.success('Setting created');
        fetchSettings();
      }
    }

    resetForm();
  };

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting);
    setFormData({
      category: setting.category,
      value: JSON.stringify(setting.value, null, 2),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;

    const { error } = await supabase
      .from('admin_settings')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete setting');
    } else {
      toast.success('Setting deleted');
      fetchSettings();
    }
  };

  const resetForm = () => {
    setFormData({ category: '', value: '{}' });
    setEditingSetting(null);
    setDialogOpen(false);
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading settings...</p>;
  }

  const projectTypes = getProjectTypes();
  const taskTemplates = getTaskTemplates();

  return (
    <div className="space-y-6">
      {/* Quick Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              {settingCategories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1">
                  <cat.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Project Types, Status Labels, Content Types */}
            {settingCategories.filter(cat => cat.id !== 'task_templates').map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add new ${cat.label.toLowerCase().slice(0, -1)}...`}
                    value={activeTab === cat.id ? newItem : ''}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(cat.id)}
                  />
                  <Button onClick={() => handleAddItem(cat.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getSettingItems(cat.id).map((item) => (
                    <Badge key={item} variant="secondary" className="px-3 py-1 text-sm">
                      {item}
                      <button
                        onClick={() => handleRemoveItem(cat.id, item)}
                        className="ml-2 text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            ))}

            {/* Task Templates - Special handling */}
            <TabsContent value="task_templates" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define tasks that are automatically created when a project of each type is created.
              </p>
              
              <div className="flex gap-2">
                <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Project Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Add task template..."
                  value={newTaskTemplate}
                  onChange={(e) => setNewTaskTemplate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTaskTemplate()}
                  className="flex-1"
                />
                <Button onClick={handleAddTaskTemplate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-4">
                {projectTypes.map((projectType) => {
                  const tasks = taskTemplates[projectType] || [];
                  if (tasks.length === 0) return null;
                  
                  return (
                    <div key={projectType} className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2 capitalize">{projectType}</h4>
                      <div className="flex flex-wrap gap-2">
                        {tasks.map((task, idx) => (
                          <Badge key={`${task}-${idx}`} variant="outline" className="px-3 py-1 text-sm">
                            {task}
                            <button
                              onClick={() => handleRemoveTaskTemplate(projectType, task)}
                              className="ml-2 text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Advanced Settings</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Setting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSetting ? 'Edit Setting' : 'New Setting'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., app_config, feature_flags"
                    disabled={!!editingSetting}
                  />
                </div>
                <div>
                  <Label>Value (JSON)</Label>
                  <Textarea
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button onClick={handleSubmit}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingSetting ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-muted-foreground">No custom settings yet</p>
          ) : (
            <div className="space-y-3">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium font-mono">{setting.category}</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(setting)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(setting.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <pre className="text-sm bg-muted p-3 rounded overflow-x-auto max-h-32">
                    {JSON.stringify(setting.value as object, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsTab;
