import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Lock, Unlock, Users, Sparkles, MessageCircle, Heart,
  Trash2, Pin, Edit2, Save, X, Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Circle {
  id: string;
  name: string;
  description: string | null;
  type: string;
  path_slug: string | null;
  is_premium: boolean;
  intention: string | null;
  is_locked: boolean;
  is_active: boolean;
  created_at: string;
}

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  profile?: {
    full_name: string | null;
  };
}

const AdminSacredCircles = () => {
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);

  const fetchCircles = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error) {
      setCircles(data || []);
    }
    setIsLoading(false);
  };

  const fetchMessages = async (roomId: string) => {
    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);

    const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    setMessages(messagesData?.map(msg => ({
      ...msg,
      profile: profiles?.find(p => p.user_id === msg.user_id)
    })) || []);
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  const toggleLock = async (circle: Circle) => {
    const { error } = await supabase
      .from('chat_rooms')
      .update({ is_locked: !circle.is_locked })
      .eq('id', circle.id);

    if (!error) {
      toast({ title: circle.is_locked ? 'Circle unlocked' : 'Circle locked' });
      fetchCircles();
    }
  };

  const toggleActive = async (circle: Circle) => {
    const { error } = await supabase
      .from('chat_rooms')
      .update({ is_active: !circle.is_active })
      .eq('id', circle.id);

    if (!error) {
      toast({ title: circle.is_active ? 'Circle hidden' : 'Circle visible' });
      fetchCircles();
    }
  };

  const saveCircle = async () => {
    if (!editingCircle) return;
    
    const { error } = await supabase
      .from('chat_rooms')
      .update({
        name: editingCircle.name,
        intention: editingCircle.intention,
        is_premium: editingCircle.is_premium,
      })
      .eq('id', editingCircle.id);

    if (!error) {
      toast({ title: 'Circle updated' });
      setEditingCircle(null);
      fetchCircles();
    }
  };

  const pinMessage = async (message: Message) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_pinned: !message.is_pinned })
      .eq('id', message.id);

    if (!error) {
      fetchMessages(message.room_id);
    }
  };

  const deleteMessage = async (message: Message) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', message.id);

    if (!error) {
      toast({ title: 'Message deleted' });
      fetchMessages(message.room_id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'guide': return <Sparkles className="h-4 w-4 text-primary" />;
      case 'path': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default: return <Heart className="h-4 w-4 text-pink-500" />;
    }
  };

  if (!isAdmin) {
    return <div className="p-4">Access denied</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sacred Circles Management</h2>
        <Badge variant="outline">
          <Users className="h-3 w-3 mr-1" />
          {circles.length} circles
        </Badge>
      </div>

      <div className="grid gap-4">
        {circles.map(circle => (
          <Card key={circle.id} className={!circle.is_active ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getIcon(circle.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{circle.name}</span>
                      <Badge variant="secondary" className="text-xs">{circle.type}</Badge>
                      {circle.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {!circle.is_active && <Badge variant="destructive" className="text-xs">Hidden</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {circle.intention || 'No intention set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCircle(circle);
                      fetchMessages(circle.id);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCircle(circle)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLock(circle)}
                  >
                    {circle.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                  <Switch
                    checked={circle.is_active}
                    onCheckedChange={() => toggleActive(circle)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCircle} onOpenChange={() => setEditingCircle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Circle</DialogTitle>
          </DialogHeader>
          {editingCircle && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editingCircle.name}
                  onChange={e => setEditingCircle({...editingCircle, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Intention</Label>
                <Textarea
                  value={editingCircle.intention || ''}
                  onChange={e => setEditingCircle({...editingCircle, intention: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingCircle.is_premium}
                  onCheckedChange={checked => setEditingCircle({...editingCircle, is_premium: checked})}
                />
                <Label>Premium Only</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingCircle(null)}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={saveCircle}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Messages Dialog */}
      <Dialog open={!!selectedCircle} onOpenChange={() => setSelectedCircle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCircle?.name} - Messages</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No messages yet</p>
            ) : (
              messages.map(msg => (
                <Card key={msg.id} className={msg.is_pinned ? 'border-primary' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{msg.profile?.full_name || 'Unknown'}</span>
                          {msg.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => pinMessage(msg)}>
                          <Pin className={`h-4 w-4 ${msg.is_pinned ? 'text-primary' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMessage(msg)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSacredCircles;
