import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Eye, UserX, Lock } from 'lucide-react';

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyDialog: React.FC<PrivacyDialogProps> = ({ open, onOpenChange }) => {
  const [showProfile, setShowProfile] = React.useState(true);
  const [showActivity, setShowActivity] = React.useState(false);
  const [allowMessages, setAllowMessages] = React.useState(true);
  const [dataSharing, setDataSharing] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield size={20} className="text-primary" />
            Privacy & Security
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="show-profile" className="text-foreground">Public Profile</Label>
                <p className="text-xs text-muted-foreground">Others can see your profile</p>
              </div>
            </div>
            <Switch id="show-profile" checked={showProfile} onCheckedChange={setShowProfile} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserX size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="show-activity" className="text-foreground">Activity Status</Label>
                <p className="text-xs text-muted-foreground">Show when you're online</p>
              </div>
            </div>
            <Switch id="show-activity" checked={showActivity} onCheckedChange={setShowActivity} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="allow-messages" className="text-foreground">Allow Messages</Label>
                <p className="text-xs text-muted-foreground">Receive private messages</p>
              </div>
            </div>
            <Switch id="allow-messages" checked={allowMessages} onCheckedChange={setAllowMessages} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="data-sharing" className="text-foreground">Data Sharing</Label>
                <p className="text-xs text-muted-foreground">Share analytics data</p>
              </div>
            </div>
            <Switch id="data-sharing" checked={dataSharing} onCheckedChange={setDataSharing} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
