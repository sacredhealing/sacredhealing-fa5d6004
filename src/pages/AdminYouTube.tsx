import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Youtube, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface YouTubeChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  is_active: boolean;
  created_at: string;
}

const AdminYouTube: React.FC = () => {
  const { toast } = useToast();
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data } = await supabase
      .from('youtube_channels')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setChannels(data as unknown as YouTubeChannel[]);
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !channelName) return;

    setIsLoading(true);
    const { error } = await supabase.from('youtube_channels').insert({
      channel_id: channelId,
      channel_name: channelName,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'YouTube channel added!' });
      setChannelId('');
      setChannelName('');
      fetchChannels();
    }
    setIsLoading(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('youtube_channels')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchChannels();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this channel?')) return;

    const { error } = await supabase
      .from('youtube_channels')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetchChannels();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">YouTube Channels</h1>
            <p className="text-muted-foreground">Manage channels for Spiritual Education videos</p>
          </div>
        </div>

        {/* Add Channel Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add YouTube Channel
          </h2>

          <form onSubmit={handleAddChannel} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Channel Name</Label>
                <Input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Siddha Quantum Nexus TV"
                  required
                />
              </div>
              <div>
                <Label>Channel ID</Label>
                <Input
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UCxxxxxxxxxxxxx"
                  required
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>To find your Channel ID:</p>
              <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                <li>Go to your YouTube channel</li>
                <li>Click "About" or view channel settings</li>
                <li>Copy the Channel ID (starts with UC)</li>
              </ol>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Add Channel
            </Button>
          </form>
        </Card>

        {/* Channels List */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Connected Channels ({channels.length}/2)
          </h2>

          {channels.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No channels added yet</p>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{channel.channel_name}</h3>
                      <p className="text-sm text-muted-foreground">{channel.channel_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${channel.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${channel.id}`}
                        checked={channel.is_active}
                        onCheckedChange={(checked) => handleToggleActive(channel.id, checked)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(channel.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminYouTube;