import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface IncomeStream {
  id: string;
  title: string;
  description: string | null;
  link: string;
  category: string;
  potential_earnings: string | null;
  is_featured: boolean;
  is_active: boolean;
  image_url: string | null;
  order_index: number;
}

const emptyStream = {
  title: '',
  description: '',
  link: '',
  category: 'other',
  potential_earnings: '',
  is_featured: false,
  is_active: true,
  image_url: '',
  order_index: 0,
};

const AdminIncomeStreams: React.FC = () => {
  const navigate = useNavigate();
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<IncomeStream | null>(null);
  const [formData, setFormData] = useState(emptyStream);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    const { data, error } = await supabase
      .from('income_streams' as any)
      .select('*')
      .order('order_index', { ascending: true });

    if (data) setStreams(data as unknown as IncomeStream[]);
    if (error) console.error('Error fetching streams:', error);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.link) {
      toast.error('Please fill in title and link');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description || null,
      link: formData.link,
      category: formData.category,
      potential_earnings: formData.potential_earnings || null,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      image_url: formData.image_url || null,
      order_index: formData.order_index,
    };

    if (editingStream) {
      const { error } = await supabase
        .from('income_streams' as any)
        .update(payload)
        .eq('id', editingStream.id);

      if (error) {
        toast.error('Failed to update');
        return;
      }
      toast.success('Income stream updated');
    } else {
      const { error } = await supabase
        .from('income_streams' as any)
        .insert({ ...payload, order_index: streams.length });

      if (error) {
        toast.error('Failed to create');
        return;
      }
      toast.success('Income stream created');
    }

    setIsDialogOpen(false);
    setEditingStream(null);
    setFormData(emptyStream);
    fetchStreams();
  };

  const handleEdit = (stream: IncomeStream) => {
    setEditingStream(stream);
    setFormData({
      title: stream.title,
      description: stream.description || '',
      link: stream.link,
      category: stream.category,
      potential_earnings: stream.potential_earnings || '',
      is_featured: stream.is_featured,
      is_active: stream.is_active,
      image_url: stream.image_url || '',
      order_index: stream.order_index,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income stream?')) return;

    const { error } = await supabase
      .from('income_streams' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Income stream deleted');
    fetchStreams();
  };

  const toggleActive = async (stream: IncomeStream) => {
    const { error } = await supabase
      .from('income_streams' as any)
      .update({ is_active: !stream.is_active })
      .eq('id', stream.id);

    if (error) {
      toast.error('Failed to update');
      return;
    }
    fetchStreams();
  };

  const openNewDialog = () => {
    setEditingStream(null);
    setFormData(emptyStream);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stream
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStream ? 'Edit Income Stream' : 'New Income Stream'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Affiliate Marketing Program"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link *</Label>
                  <Input
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this income opportunity..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="affiliate">Affiliate</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="passive">Passive Income</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Potential Earnings</Label>
                    <Input
                      value={formData.potential_earnings}
                      onChange={(e) => setFormData({ ...formData, potential_earnings: e.target.value })}
                      placeholder="e.g., $500-$5000/month"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingStream ? 'Update' : 'Create'} Income Stream
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Manage Income Streams</h1>
        <p className="text-sm text-muted-foreground">Add and edit income opportunities</p>
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {streams.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No income streams yet. Add your first one!</p>
            </CardContent>
          </Card>
        ) : (
          streams.map((stream) => (
            <Card 
              key={stream.id} 
              className={`bg-card/50 ${!stream.is_active ? 'opacity-50' : ''}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{stream.title}</h3>
                      {stream.is_featured && (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
                          Featured
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {stream.category}
                      </Badge>
                    </div>
                    {stream.potential_earnings && (
                      <p className="text-sm text-primary">{stream.potential_earnings}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-1">{stream.link}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(stream)}
                    >
                      <div className={`w-2 h-2 rounded-full ${stream.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(stream)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(stream.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminIncomeStreams;
