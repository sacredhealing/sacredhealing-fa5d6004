import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Filter, Radio, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Event {
  id: string;
  project_id: string | null;
  title: string;
  event_type: string;
  date_time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
}

const AdminEventsTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    event_type: 'meeting',
    date_time: '',
    status: 'scheduled',
    notes: '',
  });

  const eventTypes = ['meeting', 'deadline', 'launch', 'review', 'presentation', 'live', 'release', 'other'];
  const eventStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'postponed'];

  useEffect(() => {
    fetchEvents();
    fetchProjects();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('admin_events')
      .select('*')
      .order('date_time', { ascending: true });

    if (error) {
      toast.error('Failed to fetch events');
    } else {
      setEvents(data || []);
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

  const filteredEvents = events.filter((event) => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'lives' && event.event_type === 'live') ||
      (activeTab === 'releases' && event.event_type === 'release');
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesStatus && matchesSearch;
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.date_time) {
      toast.error('Date & time is required');
      return;
    }

    const payload = {
      ...formData,
      project_id: formData.project_id || null,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('admin_events')
        .update(payload)
        .eq('id', editingEvent.id);

      if (error) {
        toast.error('Failed to update event');
      } else {
        toast.success('Event updated');
        fetchEvents();
      }
    } else {
      const { error } = await supabase
        .from('admin_events')
        .insert([payload]);

      if (error) {
        toast.error('Failed to create event');
      } else {
        toast.success('Event created');
        fetchEvents();
      }
    }

    resetForm();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      project_id: event.project_id || '',
      title: event.title,
      event_type: event.event_type,
      date_time: event.date_time.slice(0, 16),
      status: event.status,
      notes: event.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase
      .from('admin_events')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success('Event deleted');
      fetchEvents();
    }
  };

  const resetForm = () => {
    setFormData({ project_id: '', title: '', event_type: 'meeting', date_time: '', status: 'scheduled', notes: '' });
    setEditingEvent(null);
    setDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500/10 text-blue-500',
      'in-progress': 'bg-yellow-500/10 text-yellow-500',
      completed: 'bg-green-500/10 text-green-500',
      cancelled: 'bg-red-500/10 text-red-500',
      postponed: 'bg-orange-500/10 text-orange-500',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getProjectTitle = (projectId: string | null) => {
    if (!projectId) return 'No Project';
    return projects.find(p => p.id === projectId)?.title || 'Unknown';
  };

  const livesCount = events.filter(e => e.event_type === 'live').length;
  const releasesCount = events.filter(e => e.event_type === 'release').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Events</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
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
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.date_time}
                  onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((t) => (
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
                      {eventStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Event notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingEvent ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Events ({events.length})</TabsTrigger>
            <TabsTrigger value="lives" className="flex items-center gap-1">
              <Radio className="h-3 w-3" />
              Lives ({livesCount})
            </TabsTrigger>
            <TabsTrigger value="releases" className="flex items-center gap-1">
              <Rocket className="h-3 w-3" />
              Releases ({releasesCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {eventStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-muted-foreground">No events found</p>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{event.title}</h3>
                    <Badge variant="outline">{event.event_type}</Badge>
                    <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.date_time), 'MMM d, yyyy HH:mm')}
                    </span>
                    <span>{getProjectTitle(event.project_id)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
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

export default AdminEventsTab;
