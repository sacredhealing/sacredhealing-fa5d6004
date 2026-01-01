import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Setting {
  id: string;
  category: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

const AdminSettingsTab = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    value: '{}',
  });

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Settings</CardTitle>
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
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : settings.length === 0 ? (
          <p className="text-muted-foreground">No settings yet</p>
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
                <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(setting.value as object, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSettingsTab;
