import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AvatarRequiredAlertProps {
  onUploadClick: () => void;
}

export const AvatarRequiredAlert: React.FC<AvatarRequiredAlertProps> = ({ onUploadClick }) => {
  const { t } = useTranslation();

  return (
    <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
      <Camera className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-500">{t('community.profileRequired')}</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {t('community.profileRequiredDesc')}
        <Button 
          variant="link" 
          className="p-0 h-auto text-primary ml-1"
          onClick={onUploadClick}
        >
          {t('community.uploadNow')}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
