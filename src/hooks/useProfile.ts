import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  streak_days: number;
  preferred_language: string | null;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, avatar_url, bio, streak_days, preferred_language')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
  });

  const updatePreferredLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_language: language })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { full_name?: string; bio?: string }) => {
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('No user');
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile picture updated!' });
    },
    onError: () => {
      toast({ title: 'Failed to upload picture', variant: 'destructive' });
    },
  });

  const updatePreferredLanguage = async (language: string) => {
    if (!user) return false;
    try {
      await updatePreferredLanguageMutation.mutateAsync(language);
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = async (updates: { full_name?: string; bio?: string }) => {
    if (!user) return false;
    try {
      await updateProfileMutation.mutateAsync(updates);
      return true;
    } catch {
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;
    try {
      return await uploadAvatarMutation.mutateAsync(file);
    } catch {
      return null;
    }
  };

  const hasAvatar = !!profile?.avatar_url;

  return {
    profile: profile ?? null,
    isLoading,
    updateProfile,
    updatePreferredLanguage,
    uploadAvatar,
    hasAvatar,
    refetch,
  };
};
