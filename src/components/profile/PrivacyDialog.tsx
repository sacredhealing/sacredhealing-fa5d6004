import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Eye, UserX, Lock, Database, Key, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyDialog: React.FC<PrivacyDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const [showProfile, setShowProfile] = React.useState(true);
  const [showActivity, setShowActivity] = React.useState(false);
  const [allowMessages, setAllowMessages] = React.useState(true);
  const [dataSharing, setDataSharing] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield size={20} className="text-primary" />
            {t('privacyDialog.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="show-profile" className="text-foreground">{t('privacyDialog.publicProfile')}</Label>
                <p className="text-xs text-muted-foreground">{t('privacyDialog.publicProfileDesc')}</p>
              </div>
            </div>
            <Switch id="show-profile" checked={showProfile} onCheckedChange={setShowProfile} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserX size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="show-activity" className="text-foreground">{t('privacyDialog.activityStatus')}</Label>
                <p className="text-xs text-muted-foreground">{t('privacyDialog.activityStatusDesc')}</p>
              </div>
            </div>
            <Switch id="show-activity" checked={showActivity} onCheckedChange={setShowActivity} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="allow-messages" className="text-foreground">{t('privacyDialog.allowMessages')}</Label>
                <p className="text-xs text-muted-foreground">{t('privacyDialog.allowMessagesDesc')}</p>
              </div>
            </div>
            <Switch id="allow-messages" checked={allowMessages} onCheckedChange={setAllowMessages} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-muted-foreground" />
              <div>
                <Label htmlFor="data-sharing" className="text-foreground">{t('privacyDialog.dataSharing')}</Label>
                <p className="text-xs text-muted-foreground">{t('privacyDialog.dataSharingDesc')}</p>
              </div>
            </div>
            <Switch id="data-sharing" checked={dataSharing} onCheckedChange={setDataSharing} />
          </div>

          <Separator className="my-2" />

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">{t('privacyDialog.securityHeading')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('privacyDialog.securityIntro')}
            </p>

            <p className="text-sm font-medium text-foreground">{t('privacyDialog.howProtected')}</p>

            <div className="space-y-3">
              <div className="flex gap-3">
                <Key size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('privacyDialog.privateAccessTitle')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('privacyDialog.privateAccessDesc')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Database size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('privacyDialog.whyStoredTitle')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('privacyDialog.whyStoredDesc')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Trash2 size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('privacyDialog.yourControlTitle')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('privacyDialog.yourControlDesc')}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic leading-relaxed pt-1">
              {t('privacyDialog.closingNote')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
