import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Send, Bell, Trash2, Eye, EyeOff, Image, Link, Music, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  image_url: string | null;
  link_url: string | null;
  audio_url: string | null;
  recurring: string | null;
}

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [expiresIn, setExpiresIn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [recurring, setRecurring] = useState('');
  const [startsAt, setStartsAt] = useState('');

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let expires_at = null;
      if (expiresIn) {
        const hours = parseInt(expiresIn);
        expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }
      
      const starts_at = startsAt ? new Date(startsAt).toISOString() : new Date().toISOString();
      
      const { error } = await supabase.from('announcements').insert({
        title,
        message,
        type,
        expires_at,
        starts_at,
        image_url: imageUrl || null,
        link_url: linkUrl || null,
        audio_url: audioUrl || null,
        recurring: recurring || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setTitle('');
      setMessage('');
      setType('info');
      setExpiresIn('');
      setImageUrl('');
      setLinkUrl('');
      setAudioUrl('');
      setRecurring('');
      setStartsAt('');
      toast({ title: 'Announcement sent!', description: 'Users will see it when they open the app.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related dismissals (due to foreign key constraint)
      const { error: dismissalsError } = await supabase
        .from('announcement_dismissals')
        .delete()
        .eq('announcement_id', id);
      
      if (dismissalsError) {
        console.warn('Error deleting dismissals (may not exist):', dismissalsError);
        // Continue anyway - dismissals may not exist
      }

      // Then delete the announcement
      const { data, error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Announcement not found or already deleted');
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast({ title: 'Deleted', description: 'Announcement has been permanently deleted.' });
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      toast({ 
        title: 'Error deleting announcement', 
        description: error.message || 'Failed to delete announcement. Please check your permissions and try again.',
        variant: 'destructive' 
      });
    },
  });

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'promotion': return 'bg-primary/20 text-primary';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground text-sm">Send notices to your users</p>
          </div>
        </div>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              New Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Important update..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Image URL (optional)
              </Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Website Link (optional)
              </Label>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Audio URL (optional)
              </Label>
              <Input
                placeholder="https://example.com/audio.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recurring
                </Label>
                <Select value={recurring || "none"} onValueChange={(v) => setRecurring(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Publish Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Expires after</Label>
                <Select value={expiresIn || "never"} onValueChange={(v) => setExpiresIn(v === "never" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Never" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="72">3 days</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => createMutation.mutate()}
              disabled={!title || !message || createMutation.isPending}
            >
              <Bell className="h-4 w-4 mr-2" />
              Publish Announcement
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Announcements</h2>
          
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : announcements?.length === 0 ? (
            <p className="text-muted-foreground">No announcements yet</p>
          ) : (
            announcements?.map((ann) => (
              <Card key={ann.id} className={`bg-card/30 border-border/50 ${!ann.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(ann.type)}`}>
                          {ann.type}
                        </span>
                        {ann.recurring && (
                          <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {ann.recurring}
                          </span>
                        )}
                        {!ann.is_active && (
                          <span className="text-xs text-muted-foreground">Inactive</span>
                        )}
                      </div>
                      <h3 className="font-medium">{ann.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{ann.message}</p>
                      
                      {ann.image_url && (
                        <img src={ann.image_url} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ann.link_url && (
                          <a href={ann.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Link className="h-3 w-3" />
                            Link
                          </a>
                        )}
                        {ann.audio_url && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            Audio attached
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(ann.starts_at).toLocaleString()}
                        {ann.expires_at && ` • Expires: ${new Date(ann.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMutation.mutate({ id: ann.id, is_active: ann.is_active })}
                      >
                        {ann.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${ann.title}"? This action cannot be undone.`)) {
                            deleteMutation.mutate(ann.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
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
    </div>
  );
}
