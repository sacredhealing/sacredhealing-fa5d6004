import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsUploading(true);
    await uploadAvatar(file);
    setIsUploading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ full_name: fullName, bio });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">{t('profile.tapToChange')}</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('profile.fullName')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('profile.enterName')}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">{t('profile.bio')}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.enterBio')}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
