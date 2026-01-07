import { useState, useEffect } from 'react';
import { Gift, Search, X, Crown, BookOpen, Compass, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface GrantedAccess {
  id: string;
  user_id: string;
  access_type: string;
  access_id: string | null;
  tier: string | null;
  granted_at: string;
  expires_at: string | null;
  notes: string | null;
  is_active: boolean;
  profiles?: Profile;
}

interface Course {
  id: string;
  title: string;
}

interface SpiritualPath {
  id: string;
  title: string;
  slug: string;
}

const ACCESS_TYPES = [
  { value: 'membership', label: 'Membership', icon: Crown },
  { value: 'course', label: 'Course', icon: BookOpen },
  { value: 'path', label: 'Spiritual Path', icon: Compass },
  { value: 'program', label: 'Program', icon: Sparkles },
];

const MEMBERSHIP_TIERS = [
  { value: 'premium_monthly', label: 'Premium Monthly' },
  { value: 'premium_annual', label: 'Premium Annual' },
  { value: 'lifetime', label: 'Lifetime' },
];

const AdminAccessGrantTab = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [grantedAccess, setGrantedAccess] = useState<GrantedAccess[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paths, setPaths] = useState<SpiritualPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [accessType, setAccessType] = useState<string>('membership');
  const [accessId, setAccessId] = useState<string>('');
  const [tier, setTier] = useState<string>('premium_monthly');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profilesRes, accessRes, coursesRes, pathsRes] = await Promise.all([
      supabase.from('profiles').select('id, user_id, full_name, avatar_url').order('full_name'),
      supabase.from('admin_granted_access').select('*').order('granted_at', { ascending: false }),
      supabase.from('courses').select('id, title').order('title'),
      supabase.from('spiritual_paths').select('id, title, slug').order('title'),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (accessRes.data) setGrantedAccess(accessRes.data as GrantedAccess[]);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (pathsRes.data) setPaths(pathsRes.data);
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_id.includes(searchTerm)
  );

  const getUserProfile = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  const getAccessLabel = (access: GrantedAccess) => {
    if (access.access_type === 'membership') {
      return MEMBERSHIP_TIERS.find(t => t.value === access.tier)?.label || access.tier;
    }
    if (access.access_type === 'course') {
      return courses.find(c => c.id === access.access_id)?.title || 'All Courses';
    }
    if (access.access_type === 'path') {
      return paths.find(p => p.id === access.access_id)?.title || 'All Paths';
    }
    return access.access_id || 'All Access';
  };

  const grantAccess = async () => {
    if (!selectedUser || !user) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from('admin_granted_access').insert({
        user_id: selectedUser.user_id,
        access_type: accessType,
        access_id: accessType === 'membership' ? null : accessId || null,
        tier: accessType === 'membership' ? tier : null,
        granted_by: user.id,
        notes: notes || null,
        is_active: true,
      });

      if (error) throw error;

      toast.success(`Access granted to ${selectedUser.full_name || 'user'}`);
      setSelectedUser(null);
      setAccessId('');
      setNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast.error(error.message || 'Failed to grant access');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeAccess = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_granted_access')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Access revoked');
      fetchData();
    } catch (error: any) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };

  const deleteAccess = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_granted_access')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Access record deleted');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting access:', error);
      toast.error('Failed to delete access');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const activeAccess = grantedAccess.filter(a => a.is_active);
  const revokedAccess = grantedAccess.filter(a => !a.is_active);

  return (
    <div className="space-y-6">
      {/* Grant Access Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Grant Free Access
          </CardTitle>
          <CardDescription>
            Assign memberships, courses, or paths without payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Select User</Label>
            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium flex-1">{selectedUser.full_name || 'Unnamed User'}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {filteredProfiles.slice(0, 10).map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setSelectedUser(profile);
                          setSearchTerm('');
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{profile.full_name || 'Unnamed User'}</span>
                      </div>
                    ))}
                    {filteredProfiles.length === 0 && (
                      <p className="p-3 text-sm text-muted-foreground">No users found</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Access Type */}
          <div className="space-y-2">
            <Label>Access Type</Label>
            <Select value={accessType} onValueChange={setAccessType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Membership Tier */}
          {accessType === 'membership' && (
            <div className="space-y-2">
              <Label>Membership Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERSHIP_TIERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Course Selection */}
          {accessType === 'course' && (
            <div className="space-y-2">
              <Label>Select Course (optional - leave empty for all courses)</Label>
              <Select value={accessId} onValueChange={setAccessId}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Path Selection */}
          {accessType === 'path' && (
            <div className="space-y-2">
              <Label>Select Path (optional - leave empty for all paths)</Label>
              <Select value={accessId} onValueChange={setAccessId}>
                <SelectTrigger>
                  <SelectValue placeholder="All paths" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Paths</SelectItem>
                  {paths.map((path) => (
                    <SelectItem key={path.id} value={path.id}>
                      {path.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Reason for granting access..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            onClick={grantAccess}
            disabled={!selectedUser || submitting}
            className="w-full"
          >
            <Gift className="h-4 w-4 mr-2" />
            {submitting ? 'Granting...' : 'Grant Free Access'}
          </Button>
        </CardContent>
      </Card>

      {/* Granted Access List */}
      <Card>
        <CardHeader>
          <CardTitle>Granted Access</CardTitle>
          <CardDescription>
            {activeAccess.length} active, {revokedAccess.length} revoked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active ({activeAccess.length})</TabsTrigger>
              <TabsTrigger value="revoked">Revoked ({revokedAccess.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeAccess.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active granted access</p>
              ) : (
                <div className="space-y-3">
                  {activeAccess.map((access) => {
                    const profile = getUserProfile(access.user_id);
                    const TypeIcon = ACCESS_TYPES.find(t => t.value === access.access_type)?.icon || Gift;
                    
                    return (
                      <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(profile?.full_name || null)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{profile?.full_name || 'Unknown User'}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TypeIcon className="h-3 w-3" />
                              <span>{access.access_type}: {getAccessLabel(access)}</span>
                            </div>
                            {access.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{access.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Active</Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeAccess(access.id)}
                          >
                            Revoke
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="revoked">
              {revokedAccess.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No revoked access</p>
              ) : (
                <div className="space-y-3">
                  {revokedAccess.map((access) => {
                    const profile = getUserProfile(access.user_id);
                    const TypeIcon = ACCESS_TYPES.find(t => t.value === access.access_type)?.icon || Gift;
                    
                    return (
                      <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(profile?.full_name || null)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{profile?.full_name || 'Unknown User'}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TypeIcon className="h-3 w-3" />
                              <span>{access.access_type}: {getAccessLabel(access)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Revoked</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAccess(access.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccessGrantTab;