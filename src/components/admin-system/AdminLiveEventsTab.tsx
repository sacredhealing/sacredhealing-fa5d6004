import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_link: string | null;
  external_link: string | null;
  is_premium: boolean;
  max_participants: number | null;
  is_active: boolean;
  rsvp_count?: number;
}

const AdminLiveEventsTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'healing_circle',
    scheduled_at: '',
    duration_minutes: '60',
    zoom_link: '',
    external_link: '',
    is_premium: false,
    max_participants: '',
    is_active: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: eventsData, error } = await (supabase as any)
        .from('live_events')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      // Fetch RSVP counts
      const eventIds = eventsData?.map((e: any) => e.id) || [];
      const { data: rsvps } = await (supabase as any)
        .from('live_event_rsvps')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('rsvp_status', 'going');

      const countsMap = new Map<string, number>();
      rsvps?.forEach((r: any) => {
        countsMap.set(r.event_id, (countsMap.get(r.event_id) || 0) + 1);
      });

      const eventsWithCounts = (eventsData || []).map((event: any) => ({
        ...event,
        rsvp_count: countsMap.get(event.id) || 0,
      }));

      setEvents(eventsWithCounts as LiveEvent[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        scheduled_at: formData.scheduled_at,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        zoom_link: formData.zoom_link || null,
        external_link: formData.external_link || null,
        is_premium: formData.is_premium,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        is_active: formData.is_active,
        created_by: editingEvent ? undefined : user.id,
      };

      if (editingEvent) {
        const { error } = await (supabase as any)
          .from('live_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });
      } else {
        const { error } = await (supabase as any)
          .from('live_events')
          .insert(eventData);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save event',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (event: LiveEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      scheduled_at: new Date(event.scheduled_at).toISOString().slice(0, 16),
      duration_minutes: event.duration_minutes.toString(),
      zoom_link: event.zoom_link || '',
      external_link: event.external_link || '',
      is_premium: event.is_premium,
      max_participants: event.max_participants?.toString() || '',
      is_active: event.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await (supabase as any)
        .from('live_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'healing_circle',
      scheduled_at: '',
      duration_minutes: '60',
      zoom_link: '',
      external_link: '',
      is_premium: false,
      max_participants: '',
      is_active: true,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Events</h2>
          <p className="text-muted-foreground">Manage healing circles, meditations, and workshops</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingEvent(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Live Event' : 'Create Live Event'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Live Healing Circle"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Join us for a transformative healing experience..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healing_circle">Healing Circle</SelectItem>
                      <SelectItem value="meditation">Meditation</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="qna">Q&A</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Scheduled Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Zoom Link</Label>
                  <Input
                    type="url"
                    value={formData.zoom_link}
                    onChange={(e) => setFormData({ ...formData, zoom_link: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                <div>
                  <Label>External Link</Label>
                  <Input
                    type="url"
                    value={formData.external_link}
                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label>Max Participants (Optional)</Label>
                <Input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>Premium</Label>
                  <p className="text-xs text-muted-foreground">Requires premium membership</p>
                </div>
                <Switch
                  checked={formData.is_premium}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Event is visible to users</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEvent ? 'Update' : 'Create'} Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No events yet. Create your first live event to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const eventDate = new Date(event.scheduled_at);
            const isUpcoming = eventDate > new Date();
            const isPast = eventDate < new Date();

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {event.title}
                        {event.is_premium && (
                          <Badge variant="default">Premium</Badge>
                        )}
                        {!event.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <Badge variant={isPast ? 'secondary' : isUpcoming ? 'default' : 'destructive'}>
                          {isPast ? 'Past' : isUpcoming ? 'Upcoming' : 'Live Now'}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Scheduled</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {eventDate.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {eventDate.toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-semibold">{event.duration_minutes} min</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">RSVPs</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Radio className="w-4 h-4" />
                        {event.rsvp_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-semibold capitalize">{event.event_type.replace('_', ' ')}</p>
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

export default AdminLiveEventsTab;

