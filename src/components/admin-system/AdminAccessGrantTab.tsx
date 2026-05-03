import React, { useState, useEffect } from 'react';
import { Gift, Search, X, Crown, BookOpen, Compass, Sparkles, Trash2, Shield, Headphones, Music2, Heart, Radio, Zap, Gem, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GOLD = '#D4AF37';
const CYAN = '#22D3EE';
const GLASS_BG = 'rgba(255,255,255,0.02)';
const GLASS_BD = 'rgba(255,255,255,0.05)';

function glassShell(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: GLASS_BG,
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: `1px solid ${GLASS_BD}`,
    borderRadius: 40,
    boxShadow: '0 0 48px rgba(212,175,55,0.07)',
    ...extra,
  };
}

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

/** Logical feature keys for program-style rows (access_type === 'program', access_id === key). */
const ACCESS_TYPES: { value: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
  { value: 'membership', label: 'Membership (tier ladder)', icon: Crown },
  { value: 'course', label: 'Course', icon: BookOpen },
  { value: 'path', label: 'Spiritual Path', icon: Compass },
  { value: 'program', label: 'Program (generic)', icon: Sparkles },
  { value: 'sri_yantra_shield', label: 'Sri Yantra Shield (1km Bio-Field)', icon: Shield },
  { value: 'creative_soul', label: 'Creative Soul Tool', icon: Sparkles },
  { value: 'creative_soul_meditation', label: 'Creative Soul Meditation', icon: Headphones },
  { value: 'siddha_oracle', label: 'Siddha Sound Oracle', icon: Brain },
  { value: 'stargate', label: 'Stargate Community', icon: Gem },
  { value: 'healing', label: 'Healing Programs', icon: Heart },
  { value: 'meditation_membership', label: 'Meditation Membership', icon: Radio },
  { value: 'music_membership', label: 'Music Membership', icon: Music2 },
  { value: 'transformation', label: 'Transformation Programs', icon: Zap },
];

/**
 * Stored in admin_granted_access.tier when access_type === 'membership'.
 * Must stay aligned with supabase/functions/check-membership-subscription ADMIN_TIER_MAP + src/lib/tierAccess.ts.
 */
const MEMBERSHIP_TIERS: { value: string; label: string; summary: string }[] = [
  {
    value: 'prana-flow',
    label: 'Prana-Flow',
    summary: 'Rank 1 — Ayurveda, Vastu, full Jyotish, full meditations, mantras, healing library.',
  },
  {
    value: 'siddha-quantum',
    label: 'Siddha-Quantum',
    summary: 'Rank 2 — All Prana-Flow features plus Siddha Portal, Digital Nadi, Sri Yantra Shield, Soul Vault.',
  },
  {
    value: 'akasha-infinity',
    label: 'Akasha-Infinity',
    summary: 'Rank 3 — All Siddha-Quantum features plus Quantum Apothecary, Virtual Pilgrimage, Palm Oracle, Akashic Decoder.',
  },
];

const TIER_LADDER = [
  { rank: 1, name: 'Prana-Flow', detail: 'Ayurveda · Vastu · Jyotish · Meditations · Mantras · Healing' },
  { rank: 2, name: 'Siddha-Quantum', detail: 'Prana + Siddha Portal · Digital Nadi · Sri Yantra · Soul Vault' },
  { rank: 3, name: 'Akasha-Infinity', detail: 'Siddha + Quantum Apothecary · Pilgrimage · Palm Oracle · Decoder' },
];

function logicalFeatureKey(access: GrantedAccess): string {
  if (access.access_type === 'program' && access.access_id) return access.access_id;
  return access.access_type;
}

const labelUpper = {
  fontSize: 8,
  fontWeight: 800,
  letterSpacing: '0.5em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.35)',
};

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
  const [tier, setTier] = useState<string>('prana-flow');
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

  const getUserProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const getAccessLabel = (access: GrantedAccess) => {
    if (access.access_type === 'membership') {
      return MEMBERSHIP_TIERS.find(t => t.value === access.tier)?.label || access.tier || 'Membership';
    }
    if (access.access_type === 'course') {
      return courses.find(c => c.id === access.access_id)?.title || access.access_id || 'All courses';
    }
    if (access.access_type === 'path') {
      return paths.find(p => p.id === access.access_id)?.title || access.access_id || 'All paths';
    }
    const key = logicalFeatureKey(access);
    const typeConfig = ACCESS_TYPES.find(t => t.value === key);
    return typeConfig?.label || access.access_id || access.access_type;
  };

  const grantAccess = async () => {
    if (!selectedUser || !user) return;
    setSubmitting(true);

    try {
      const allowedTypes = new Set(['membership', 'course', 'path', 'program']);
      const dbAccessType = allowedTypes.has(accessType) ? accessType : 'program';

      const accessIdValue =
        accessType === 'course' || accessType === 'path'
          ? (accessId?.trim() ? accessId : null)
          : null;

      // Use upsert to handle duplicate grants gracefully
      const { error } = await supabase.from('admin_granted_access').upsert({
        user_id: selectedUser.user_id,
        access_type: dbAccessType,
        access_id: accessIdValue ?? (allowedTypes.has(accessType) ? null : accessType),
        tier: accessType === 'membership' ? tier : null,
        granted_by: user.id,
        notes: notes || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,access_type,access_id' });

      if (error) throw error;

      if (accessType === 'sri_yantra_shield') {
        // sri_yantra_access is not in generated Database types
        const { error: sriError } = await supabase
          // @ts-expect-error dynamic table
          .from('sri_yantra_access')
          .upsert(
            {
              user_id: selectedUser.user_id,
              has_access: true,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: 'user_id' }
          );
        if (sriError) {
          console.warn('admin_granted_access saved but sri_yantra_access upsert failed:', sriError);
          toast.warning(`Access granted, but Sri Yantra table update failed: ${sriError.message}`);
        }
      }

      if (accessType === 'stargate') {
        const { error: sgError } = await (supabase as any)
          .from('stargate_community_members')
          .upsert({ user_id: selectedUser.user_id }, { onConflict: 'user_id' });
        if (sgError && !String(sgError.message || '').includes('does not exist')) {
          console.warn('admin_granted_access saved but stargate_community_members upsert failed:', sgError);
          toast.warning(
            `Stargate access is saved in grants. Community mirror failed: ${sgError.message}. User should still get access via admin grant.`
          );
        }
      }

      toast.success(`Access granted to ${selectedUser.full_name || 'user'}. They should see it within seconds (membership refetches automatically).`);
      setSelectedUser(null);
      setAccessId('');
      setNotes('');
      fetchData();
    } catch (error: unknown) {
      console.error('Error granting access:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to grant access');
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
    } catch (error: unknown) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };

  const deleteAccess = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_granted_access').delete().eq('id', id);

      if (error) throw error;

      toast.success('Access record deleted');
      fetchData();
    } catch (error: unknown) {
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

  const selectedTierInfo = MEMBERSHIP_TIERS.find(t => t.value === tier);

  if (loading) {
    return (
      <div className="flex justify-center py-20" style={{ color: GOLD }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase' }}>Loading Archive…</span>
      </div>
    );
  }

  const fieldClass =
    'rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 focus-visible:ring-[#D4AF37]/40';

  return (
    <div className="space-y-8" style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&display=swap');`}</style>

      {/* Tier reference — SQI 2050 */}
      <div style={glassShell({ padding: '28px 28px 26px' })}>
        <p style={{ ...labelUpper, marginBottom: 10 }}>SQI 2050 · Tier ladder</p>
        <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 8px', color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.25)' }}>
          Match grants to live entitlements
        </h2>
        <p style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', marginBottom: 22, maxWidth: 720 }}>
          Membership grants sync through the check-membership edge function into the same tier ranks the app uses for gates (see <code style={{ color: CYAN }}>src/lib/tierAccess.ts</code>). Feature grants use <code style={{ color: CYAN }}>program</code> + <code style={{ color: CYAN }}>access_id</code> in the database.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIER_LADDER.map(row => (
            <div
              key={row.rank}
              style={{
                borderRadius: 24,
                padding: '18px 16px',
                border: `1px solid ${row.rank === 3 ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.06)'}`,
                background: row.rank === 3 ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginBottom: 6 }}>
                Rank {row.rank}
              </p>
              <p style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>{row.name}</p>
              <p style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.55, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{row.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grant form */}
      <div style={glassShell({ padding: '28px 28px 32px' })}>
        <div className="mb-6 flex items-center gap-3">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.22)',
              boxShadow: '0 0 24px rgba(212,175,55,0.12)',
            }}
          >
            <Gift className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <p style={labelUpper}>Admin · Grant access</p>
            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Sovereign grant console</h3>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label style={labelUpper}>Select user</Label>
            {selectedUser ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <Avatar>
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-white/10 text-white">{getInitials(selectedUser.full_name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 font-semibold text-white/90">{selectedUser.full_name || 'Unnamed User'}</span>
                <Button variant="ghost" size="sm" className="text-white/50 hover:text-white" onClick={() => setSelectedUser(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    placeholder="Search by name or user id…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${fieldClass}`}
                  />
                </div>
                {searchTerm ? (
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-black/30">
                    {filteredProfiles.slice(0, 12).map((profile) => (
                      <div
                        key={profile.id}
                        className="flex cursor-pointer items-center gap-3 p-3 hover:bg-white/[0.06]"
                        onClick={() => {
                          setSelectedUser(profile);
                          setSearchTerm('');
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-white/10 text-xs text-white">{getInitials(profile.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white/85">{profile.full_name || 'Unnamed User'}</span>
                      </div>
                    ))}
                    {filteredProfiles.length === 0 ? (
                      <p className="p-3 text-sm text-white/40">No users found</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label style={labelUpper}>Access type</Label>
            <Select value={accessType} onValueChange={setAccessType}>
              <SelectTrigger className={`h-12 ${fieldClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
                {ACCESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="focus:bg-white/10">
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" style={{ color: GOLD }} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {accessType === 'membership' ? (
            <div className="space-y-2">
              <Label style={labelUpper}>Membership tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className={`h-12 ${fieldClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
                  {MEMBERSHIP_TIERS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="focus:bg-white/10">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTierInfo ? (
                <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{selectedTierInfo.summary}</p>
              ) : null}
            </div>
          ) : null}

          {accessType === 'course' ? (
            <div className="space-y-2">
              <Label style={labelUpper}>Course</Label>
              <Select value={accessId || 'ALL'} onValueChange={(v) => setAccessId(v === 'ALL' ? '' : v)}>
                <SelectTrigger className={`h-12 ${fieldClass}`}>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
                  <SelectItem value="ALL" className="focus:bg-white/10">
                    All courses
                  </SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="focus:bg-white/10">
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {accessType === 'path' ? (
            <div className="space-y-2">
              <Label style={labelUpper}>Spiritual path</Label>
              <Select value={accessId || 'ALL'} onValueChange={(v) => setAccessId(v === 'ALL' ? '' : v)}>
                <SelectTrigger className={`h-12 ${fieldClass}`}>
                  <SelectValue placeholder="All paths" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
                  <SelectItem value="ALL" className="focus:bg-white/10">
                    All paths
                  </SelectItem>
                  {paths.map((path) => (
                    <SelectItem key={path.id} value={path.id} className="focus:bg-white/10">
                      {path.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label style={labelUpper}>Notes</Label>
            <Textarea
              placeholder="Reason for granting access…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`min-h-[88px] ${fieldClass}`}
            />
          </div>

          <button
            type="button"
            onClick={() => void grantAccess()}
            disabled={!selectedUser || submitting}
            style={{
              width: '100%',
              padding: '14px 22px',
              borderRadius: 999,
              border: `1px solid rgba(212,175,55,0.45)`,
              background: 'linear-gradient(135deg,rgba(212,175,55,0.22),rgba(212,175,55,0.06))',
              color: GOLD,
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              cursor: !selectedUser || submitting ? 'not-allowed' : 'pointer',
              opacity: !selectedUser || submitting ? 0.45 : 1,
              boxShadow: '0 0 28px rgba(212,175,55,0.12)',
            }}
          >
            {submitting ? 'Granting…' : 'Grant access'}
          </button>
        </div>
      </div>

      {/* Granted list */}
      <div style={glassShell({ padding: '28px 28px 32px' })}>
        <p style={labelUpper}>Registry</p>
        <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', margin: '4px 0 16px' }}>Granted access</h3>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
          {activeAccess.length} active · {revokedAccess.length} revoked
        </p>

        <Tabs defaultValue="active">
          <TabsList className="mb-4 border border-white/10 bg-white/[0.04]">
            <TabsTrigger value="active" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
              Active ({activeAccess.length})
            </TabsTrigger>
            <TabsTrigger value="revoked" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">
              Revoked ({revokedAccess.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeAccess.length === 0 ? (
              <p className="py-10 text-center text-sm text-white/40">No active granted access</p>
            ) : (
              <div className="space-y-3">
                {activeAccess.map((access) => {
                  const profile = getUserProfile(access.user_id);
                  const key = logicalFeatureKey(access);
                  const TypeIcon = ACCESS_TYPES.find(t => t.value === key)?.icon || Gift;

                  return (
                    <div
                      key={access.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-white/10 text-white">{getInitials(profile?.full_name || null)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-white/90">{profile?.full_name || 'Unknown user'}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/45">
                            <TypeIcon className="h-3 w-3" style={{ color: GOLD }} />
                            <span>
                              {access.access_type === 'program' ? `program → ${access.access_id || '—'}` : access.access_type}: {getAccessLabel(access)}
                            </span>
                          </div>
                          {access.notes ? <p className="mt-1 text-xs text-white/35">{access.notes}</p> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="border-[#D4AF37]/30 bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/20">Active</Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-full bg-red-950/80 text-red-100 hover:bg-red-900"
                          onClick={() => void revokeAccess(access.id)}
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
              <p className="py-10 text-center text-sm text-white/40">No revoked access</p>
            ) : (
              <div className="space-y-3">
                {revokedAccess.map((access) => {
                  const profile = getUserProfile(access.user_id);
                  const key = logicalFeatureKey(access);
                  const TypeIcon = ACCESS_TYPES.find(t => t.value === key)?.icon || Gift;

                  return (
                    <div
                      key={access.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-white/10 text-white">{getInitials(profile?.full_name || null)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-white/80">{profile?.full_name || 'Unknown user'}</h4>
                          <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                            <TypeIcon className="h-3 w-3" />
                            <span>{getAccessLabel(access)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/10 text-white/60">
                          Revoked
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-white/50" onClick={() => void deleteAccess(access.id)}>
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
      </div>
    </div>
  );
};

export default AdminAccessGrantTab;
