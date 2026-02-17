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
  Trash2, Pin, Edit2, Save, X, Loader2, UserPlus, Search, Shield
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

interface CircleMember {
  id: string;
  room_id: string;
  user_id: string;
  role: string | null;
  joined_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PublicProfileLite {
  user_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

const AdminSacredCircles = () => {
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);
  const [membersCircle, setMembersCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfileLite[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchCircles = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error) {
      // Dedupe special groups by name (can be created more than once)
      const rows = (data || []) as Circle[];
      const oneByName = new Map<string, Circle>();
      const keep: Circle[] = [];
      for (const c of rows) {
        if (c.name === 'Andlig Transformation' || c.name === 'Stargate Community') {
          if (!oneByName.has(c.name)) oneByName.set(c.name, c);
        } else {
          keep.push(c);
        }
      }
      const deduped = [...keep, ...Array.from(oneByName.values())].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setCircles(deduped);
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

  const fetchMembers = async (roomId: string) => {
    setMembersLoading(true);
    try {
      const { data: memberRows, error } = await supabase
        .from('chat_members')
        .select('id, room_id, user_id, role, joined_at')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((memberRows || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const enriched: CircleMember[] = (memberRows || []).map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id) ?? { full_name: null, avatar_url: null }
      }));
      setMembers(enriched);
    } catch (e) {
      console.error('Error fetching members:', e);
      toast({ title: 'Error', description: 'Failed to load members', variant: 'destructive' });
    } finally {
      setMembersLoading(false);
    }
  };

  const addMember = async (roomId: string, userId: string) => {
    const trimmed = userId.trim();
    if (!trimmed) return;
    const { error } = await supabase.from('chat_members').insert({
      room_id: roomId,
      user_id: trimmed,
      role: 'member'
    });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already a member' });
      } else {
        toast({ title: 'Error', description: 'Failed to add member', variant: 'destructive' });
      }
      return;
    }
    toast({ title: 'Member added' });
    setAddUserId('');
    await fetchMembers(roomId);
  };

  const removeMember = async (roomId: string, userId: string) => {
    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
      return;
    }
    toast({ title: 'Member removed' });
    await fetchMembers(roomId);
  };

  const searchProfiles = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const { data, error } = await supabase
      .from('public_profiles')
      .select('user_id, full_name, avatar_url')
      .ilike('full_name', `%${q}%`)
      .limit(10);
    if (!error) setSearchResults((data || []) as PublicProfileLite[]);
    setSearchLoading(false);
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
                    variant="outline"
                    size="sm"
                    title="View messages (pin/delete)"
                    onClick={() => {
                      setSelectedCircle(circle);
                      fetchMessages(circle.id);
                    }}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Messages
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Add/remove members for this group"
                    onClick={() => {
                      setMembersCircle(circle);
                      setSearchName('');
                      setSearchResults([]);
                      setAddUserId('');
                      fetchMembers(circle.id);
                    }}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Members
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Edit name/intention/premium"
                    onClick={() => setEditingCircle(circle)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    title={circle.is_locked ? 'Unlock circle' : 'Lock circle'}
                    onClick={() => toggleLock(circle)}
                    className="gap-2"
                  >
                    {circle.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    {circle.is_locked ? 'Locked' : 'Unlocked'}
                  </Button>
                  <Switch
                    checked={circle.is_active}
                    onCheckedChange={() => toggleActive(circle)}
                    title={circle.is_active ? 'Visible (toggle to hide)' : 'Hidden (toggle to show)'}
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

      {/* Members Dialog */}
      <Dialog open={!!membersCircle} onOpenChange={() => setMembersCircle(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b border-border/40">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {membersCircle?.name} - Manage Members
            </DialogTitle>
          </DialogHeader>

          {membersCircle && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 pt-4">
              {/* Add Member Section - Prominent */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Add Member to Group</h3>
                </div>

                {/* Search by Name - Primary Method */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Search by Name (Recommended)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={searchName}
                          onChange={e => {
                            const v = e.target.value;
                            setSearchName(v);
                            if (v.length >= 2) searchProfiles(v);
                          }}
                          placeholder="Type name to search..."
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => searchProfiles(searchName)} 
                          className="gap-2"
                          disabled={searchName.trim().length < 2}
                        >
                          <Search className="h-4 w-4" />
                          Search
                        </Button>
                      </div>
                      {searchLoading && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Searching users...
                        </div>
                      )}
                      {searchResults.length > 0 && (
                        <div className="space-y-2 mt-3 max-h-60 overflow-y-auto">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Found {searchResults.length} user(s):</p>
                          {searchResults.map(p => (
                            <div key={p.user_id ?? Math.random()} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3 hover:bg-accent/50 transition-colors">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{p.full_name || 'Unknown User'}</div>
                                <div className="text-xs text-muted-foreground truncate font-mono mt-1">{p.user_id}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => p.user_id && addMember(membersCircle.id, p.user_id)}
                                className="gap-2 ml-3"
                                disabled={!p.user_id}
                              >
                                <UserPlus className="h-4 w-4" />
                                Add to Group
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Add by User ID - Alternative Method */}
                <Card className="border-border/40">
                  <CardContent className="p-4 space-y-3">
                    <Label className="text-sm font-medium">Or Add by User ID (UUID)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={addUserId}
                        onChange={e => setAddUserId(e.target.value)}
                        placeholder="Paste user_id UUID here..."
                        className="flex-1 font-mono text-sm"
                      />
                      <Button 
                        onClick={() => addMember(membersCircle.id, addUserId)} 
                        className="gap-2"
                        disabled={!addUserId.trim()}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Search by name above is easier. Use User ID only if you have it.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Current Members Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Shield className="h-4 w-4 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Current Members</h3>
                    <Badge variant="secondary" className="ml-2">{members.length}</Badge>
                  </div>
                </div>

                <Card className="border-border/40">
                  <CardContent className="p-4">
                    {membersLoading ? (
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 py-8">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No members yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Add members using the search above</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {members.map(m => (
                          <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3 hover:bg-accent/30 transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {m.profile?.full_name || 'Unknown User'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate font-mono mt-1">{m.user_id}</div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Badge variant="secondary" className="text-xs">{m.role || 'member'}</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeMember(m.room_id, m.user_id)}
                                className="gap-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSacredCircles;
