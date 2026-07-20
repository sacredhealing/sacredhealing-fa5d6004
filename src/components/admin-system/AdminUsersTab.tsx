import { useState, useEffect } from 'react';
import { User, Shield, ShieldCheck, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminUsersTab = ({ onOpenSignupQR }: { onOpenSignupQR?: () => void }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (profilesRes.error) {
      toast.error('Failed to fetch users');
    } else {
      setProfiles(profilesRes.data || []);
    }

    if (!rolesRes.error) {
      setUserRoles(rolesRes.data || []);
    }

    setLoading(false);
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter(r => r.user_id === userId).map(r => r.role);
  };

  const toggleAdminRole = async (userId: string) => {
    const hasAdmin = getUserRoles(userId).includes('admin');

    if (hasAdmin) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        toast.error('Failed to remove admin role');
      } else {
        toast.success('Admin role removed');
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: 'admin' }]);

      if (error) {
        toast.error('Failed to add admin role');
      } else {
        toast.success('Admin role added');
        fetchData();
      }
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {onOpenSignupQR && (
        <button
          type="button"
          onClick={onOpenSignupQR}
          className="w-full flex items-center justify-between gap-3 rounded-[20px] px-5 py-4 text-left bg-[#D4AF37]/[0.06] border border-[#D4AF37]/25 hover:bg-[#D4AF37]/[0.1] hover:border-[#D4AF37]/40 transition-all"
        >
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <div className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-[#D4AF37]">
                Signup QR Code
              </div>
              <div className="text-white/50 text-xs mt-0.5">
                Get the printable QR code to sign new users up in person
              </div>
            </div>
          </div>
          <span className="text-[#D4AF37] text-sm font-black">→</span>
        </button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : profiles.length === 0 ? (
            <p className="text-muted-foreground">No users yet</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => {
              const roles = getUserRoles(profile.user_id);
              const isAdmin = roles.includes('admin');

              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{profile.full_name || 'Unnamed User'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {roles.map((role) => (
                      <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                        {role}
                      </Badge>
                    ))}
                    <Button
                      variant={isAdmin ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => toggleAdminRole(profile.user_id)}
                    >
                      {isAdmin ? (
                        <>
                          <Shield className="h-4 w-4 mr-1" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Make Admin
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersTab;
