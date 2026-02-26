import React from 'react';
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
            Privacy & Security
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Privacy toggles */}
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

          <Separator className="my-2" />

          {/* Din integritet & säkerhet */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Din integritet & säkerhet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vi tar din trygghet på största allvar så att du kan fokusera helt på din healing. Din data lagras säkert i en professionell molndatabas som skyddas av modern kryptering och högsta säkerhetsstandard.
            </p>

            <p className="text-sm font-medium text-foreground">Så här skyddas din information:</p>

            <div className="space-y-3">
              <div className="flex gap-3">
                <Key size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Privat åtkomst</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Vi använder Row Level Security (RLS), vilket innebär att dina personliga uppgifter och födelsedata är helt låsta för utomstående. Endast du kan komma åt din information.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Database size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Varför lagras datan?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dina uppgifter om födelseplats och tid lagras enbart för att appen ska kunna räkna ut din unika vediska profil och ge dig personliga rekommendationer i realtid.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Trash2 size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Din kontroll</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Du äger din data. Om du väljer att lämna appen och radera ditt konto, rensas din information permanent från våra system i enlighet med GDPR.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic leading-relaxed pt-1">
              Dina uppgifter är en personlig nyckel till din resa hos oss – och vi ser till att den nyckeln stannar hos dig.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
