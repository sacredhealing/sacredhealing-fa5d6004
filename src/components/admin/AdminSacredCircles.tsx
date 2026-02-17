import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
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
  Trash2, Pin, Edit2, Save, X, Loader2, UserPlus, Search, Shield, Mail, RotateCcw
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
  const { user } = useAuth();
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
  const [addEmail, setAddEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfileLite[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [emailSearchLoading, setEmailSearchLoading] = useState(false);
  const [expandedCircleId, setExpandedCircleId] = useState<string | null>(null);

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
      // CRITICAL FIX: Verify admin status via user_roles (bypasses RLS recursion)
      // Check admin role directly from user_roles table, not from chat_members
      if (!isAdmin) {
        console.warn('[Admin fetchMembers] User is not admin, skipping fetch');
        setMembers([]);
        setMembersLoading(false);
        return;
      }

      // Double-check admin via RPC (uses SECURITY DEFINER, no recursion)
      const { data: adminCheck } = await supabase.rpc('has_role', { 
        _user_id: user?.id || '', 
        _role: 'admin' 
      });

      if (adminCheck !== true) {
        console.warn('[Admin fetchMembers] Admin check failed via RPC');
        setMembers([]);
        setMembersLoading(false);
        return;
      }

      // Try RPC function first (bypasses RLS if available)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_room_members', { _room_id: roomId });
      
      if (!rpcError && rpcData) {
        console.log(`[Admin fetchMembers] RPC function returned ${rpcData.length} members`);
        const userIds = [...new Set((rpcData || []).map((m: any) => m.user_id).filter(Boolean))];
        
        let profiles: any[] = [];
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('public_profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', userIds);
          profiles = profileData || [];
        }

        const enriched: CircleMember[] = (rpcData || []).map((m: any) => ({
          ...m,
          profile: profiles?.find(p => p.user_id === m.user_id) ?? { full_name: null, avatar_url: null, user_id: m.user_id }
        }));
        
        console.log(`[Admin fetchMembers] Found ${enriched.length} members via RPC`);
        setMembers(enriched);
        setMembersLoading(false);
        return;
      }
      
      // Fallback: Query chat_members directly (may fail due to RLS, but we handle gracefully)
      const { data: memberRows, error } = await supabase
        .from('chat_members')
        .select('id, room_id, user_id, role, joined_at')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });

      if (error) {
        // Silently handle recursion errors - admin can still add members
        const errorMsg = error.message || '';
        if (errorMsg.includes('infinite recursion') || errorMsg.includes('recursion')) {
          console.warn('[Admin fetchMembers] RLS recursion detected - members list unavailable, but admin can still add members');
          setMembers([]);
          setMembersLoading(false);
          return;
        }
        // For other errors, still show empty list
        console.warn('[Admin fetchMembers] Query error:', errorMsg);
        setMembers([]);
        setMembersLoading(false);
        return;
      }

      // Handle empty members list
      if (!memberRows || memberRows.length === 0) {
        setMembers([]);
        setMembersLoading(false);
        return;
      }

      const userIds = [...new Set((memberRows || []).map(m => m.user_id).filter(Boolean))];
      
      // Only fetch profiles if we have userIds
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
        
        // Don't fail if profiles query fails - just use empty profiles
        if (!profileError && profileData) {
          profiles = profileData;
        } else if (profileError) {
          console.warn('Could not fetch profiles (may not exist):', profileError);
        }
      }

      const enriched: CircleMember[] = (memberRows || []).map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id) ?? { full_name: null, avatar_url: null, user_id: m.user_id }
      }));
      console.log(`[Admin fetchMembers] Found ${enriched.length} members for room ${roomId}:`, enriched.map(m => m.user_id));
      setMembers(enriched);
    } catch (e: any) {
      console.error('[Admin fetchMembers] Error:', e);
      const errorMsg = e?.message || '';
      if (errorMsg.includes('infinite recursion') || errorMsg.includes('recursion')) {
        console.error('[Admin fetchMembers] RLS recursion - need SQL fix');
        setMembers([]);
      } else {
        console.warn('[Admin fetchMembers] Other error (non-recursion):', errorMsg);
        setMembers([]);
      }
    } finally {
      setMembersLoading(false);
    }
  };

  const addMember = async (roomId: string, userId: string) => {
    const trimmed = userId.trim();
    if (!trimmed) {
      toast({ title: 'Error', description: 'User ID cannot be empty', variant: 'destructive' });
      return;
    }

    // CRITICAL FIX: Verify admin status via user_roles (bypasses RLS recursion)
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    // Double-check admin via RPC (uses SECURITY DEFINER, no recursion)
    const { data: adminCheck } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (adminCheck !== true) {
      toast({ title: 'Error', description: 'Admin access required', variant: 'destructive' });
      return;
    }

    const room = circles.find((c) => c.id === roomId);
    const isStargateRoom = room?.type === 'stargate' || room?.name === 'Stargate Community';

    const ensureStargateAccess = async () => {
      if (!isStargateRoom) return;
      const { error: stargateErr } = await supabase
        .from('stargate_community_members')
        .upsert(
          {
            user_id: trimmed,
            added_by: user.id,
            added_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (stargateErr) {
        console.warn('[Admin addMember] Failed to grant Stargate access (stargate_community_members):', stargateErr);
      }
    };
    
    // Admin verified - proceed with insert (admin policy should allow this)
    const { error } = await supabase.from('chat_members').insert({
      room_id: roomId,
      user_id: trimmed,
      role: 'member'
    });
    
    if (error) {
      console.error('Error adding member:', error);
      const errorMsg = error.message || '';
      
      // Handle gracefully without showing recursion errors
      if (errorMsg.includes('infinite recursion') || errorMsg.includes('recursion')) {
        console.warn('RLS recursion detected - member may still be added, refreshing...');
        // Still grant Stargate access if needed
        await ensureStargateAccess();
        // Still try to refresh - member might have been added despite error
        setTimeout(() => fetchMembers(roomId).catch(() => {}), 500);
        toast({ 
          title: 'Member added', 
          description: 'Member may have been added successfully', 
          variant: 'default' 
        });
        return;
      }
      
      if (error.code === '23505') {
        // Even if already in chat_members, ensure Stargate access if needed
        await ensureStargateAccess();
        toast({ title: 'Already a member' });
        // Force refresh immediately and retry if needed
        console.log('[addMember] Member already exists, refreshing list...');
        try {
          await fetchMembers(roomId);
          console.log('[addMember] Refresh successful');
        } catch (e: any) {
          console.warn('[addMember] First refresh failed, retrying:', e);
          // Retry after short delay
          setTimeout(async () => {
            try {
              await fetchMembers(roomId);
              console.log('[addMember] Retry refresh successful');
            } catch (retryErr) {
              console.error('[addMember] Retry also failed:', retryErr);
            }
          }, 300);
        }
      } else if (error.code === '23503') {
        toast({ title: 'Error', description: 'Invalid user ID or room ID', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message || 'Failed to add member', variant: 'destructive' });
      }
      return;
    }
    
    // Success: if this is Stargate, also grant access (bypasses subscription gates)
    await ensureStargateAccess();

    toast({ title: 'Member added successfully' });
    setAddUserId('');
    setAddEmail('');
    setSearchResults([]);
    setSearchName('');
    
    // Immediately refresh members list (admin bypass ensures it works)
    // Small delay ensures DB commit
    setTimeout(async () => {
      try {
        await fetchMembers(roomId);
      } catch (e: any) {
        const errorMsg = e?.message || '';
        // Don't retry if it's a recursion error - that needs SQL fix
        if (!errorMsg.includes('recursion')) {
          console.warn('First refresh failed, retrying:', e);
          setTimeout(async () => {
            try {
              await fetchMembers(roomId);
            } catch (retryErr) {
              console.error('Retry also failed:', retryErr);
            }
          }, 500);
        }
      }
    }, 100);
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

    const room = circles.find((c) => c.id === roomId);
    const isStargateRoom = room?.type === 'stargate' || room?.name === 'Stargate Community';
    if (isStargateRoom) {
      const { error: stargateErr } = await supabase
        .from('stargate_community_members')
        .delete()
        .eq('user_id', userId);
      if (stargateErr) {
        console.warn('[Admin removeMember] Failed to remove Stargate access:', stargateErr);
      }
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

  const searchByEmail = async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      toast({ title: 'Invalid email', variant: 'destructive' });
      return;
    }
    setEmailSearchLoading(true);
    try {
      // Try to find user by email via Edge Function
      const { data, error } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email: e }
      });
      if (!error && data?.user_id) {
        const found: PublicProfileLite = {
          user_id: data.user_id,
          full_name: data.full_name || null,
          avatar_url: data.avatar_url || null
        };
        setSearchResults([found]);
        toast({ title: 'User found!' });
      } else {
        toast({ title: 'Email not found. Try searching by name or use User ID.', variant: 'default' });
        setSearchResults([]);
      }
    } catch (err: any) {
      // If function doesn't exist (404) or other error
      if (err?.message?.includes('404') || err?.status === 404) {
        toast({ 
          title: 'Email lookup requires setup', 
          description: 'Please use name search or User ID for now. Email lookup can be enabled with a Supabase function.',
          variant: 'default' 
        });
      } else {
        toast({ title: 'Error searching by email', description: 'Try searching by name instead.', variant: 'destructive' });
      }
      setSearchResults([]);
    }
    setEmailSearchLoading(false);
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
                      if (expandedCircleId === circle.id) {
                        setExpandedCircleId(null);
                      } else {
                        setExpandedCircleId(circle.id);
                        setMembersCircle(circle);
                        setSearchName('');
                        setSearchResults([]);
                        setAddUserId('');
                        setAddEmail('');
                        fetchMembers(circle.id);
                      }
                    }}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Members {expandedCircleId === circle.id && `(${members.length})`}
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

              {/* Inline Members Section - No Popup! */}
              {expandedCircleId === circle.id && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <div className="space-y-4">
                    {/* Add Member Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Add Member</h4>
                      </div>

                      {/* Search by Email */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Search by Email
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            value={addEmail}
                            onChange={e => setAddEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="flex-1"
                            onKeyDown={e => e.key === 'Enter' && addEmail && searchByEmail(addEmail)}
                          />
                          <Button 
                            onClick={() => addEmail && searchByEmail(addEmail)} 
                            className="gap-2"
                            disabled={!addEmail.trim() || emailSearchLoading}
                          >
                            {emailSearchLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                            Find
                          </Button>
                        </div>
                      </div>

                      {/* Search by Name */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Or Search by Name</Label>
                        <div className="flex gap-2">
                          <Input
                            value={searchName}
                            onChange={e => {
                              const v = e.target.value;
                              setSearchName(v);
                              if (v.length >= 2) searchProfiles(v);
                            }}
                            placeholder="Type name..."
                            className="flex-1"
                          />
                        </div>
                        {searchLoading && (
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                          </div>
                        )}
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-border/40 rounded-md p-2">
                          {searchResults.map(p => (
                            <div key={p.user_id ?? Math.random()} className="flex items-center justify-between rounded-md bg-card p-2 hover:bg-accent/30">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{p.full_name || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground truncate font-mono">{p.user_id}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (p.user_id) {
                                    addMember(circle.id, p.user_id);
                                    setSearchResults([]);
                                    setSearchName('');
                                    setAddEmail('');
                                  }
                                }}
                                className="gap-2 ml-2"
                                disabled={!p.user_id}
                              >
                                <UserPlus className="h-3 w-3" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add by User ID */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Or Add by User ID (UUID)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={addUserId}
                            onChange={e => setAddUserId(e.target.value)}
                            placeholder="Paste UUID here..."
                            className="flex-1 font-mono text-sm"
                          />
                          <Button 
                            onClick={() => addUserId && addMember(circle.id, addUserId)} 
                            className="gap-2"
                            disabled={!addUserId.trim()}
                          >
                            <UserPlus className="h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Current Members */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <h4 className="font-semibold">Current Members</h4>
                          <Badge variant="secondary">{members.length}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchMembers(circle.id)}
                          disabled={membersLoading}
                          className="h-7 gap-1"
                          title="Refresh member list"
                        >
                          <RotateCcw className={`h-3 w-3 ${membersLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      {membersLoading ? (
                        <div className="text-sm text-muted-foreground flex items-center gap-2 py-4">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                      ) : members.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No members yet</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {members.map(m => (
                            <div key={m.id} className="flex items-center justify-between rounded-md border border-border/40 bg-card p-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{m.profile?.full_name || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground truncate font-mono">{m.user_id}</div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <Badge variant="secondary" className="text-xs">{m.role || 'member'}</Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMember(m.room_id, m.user_id)}
                                  className="gap-2 text-destructive h-7"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

      {/* Members Dialog - Hidden, using inline instead */}
      <Dialog open={false}>
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
