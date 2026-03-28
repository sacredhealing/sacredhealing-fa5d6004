import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface BirthDetailsFormProps {
  onSaved?: () => void;
  initialData?: {
    birth_name?: string | null;
    birth_date?: string | null;
    birth_time?: string | null;
    birth_place?: string | null;
  };
}

export const BirthDetailsForm: React.FC<BirthDetailsFormProps> = ({ onSaved, initialData }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    birth_name: initialData?.birth_name || '',
    birth_date: initialData?.birth_date || '',
    birth_time: initialData?.birth_time || '',
    birth_place: initialData?.birth_place || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t('vedicAstrology.toastSignIn'));
      return;
    }

    // Validation
    if (!formData.birth_name.trim()) {
      toast.error(t('vedicAstrology.toastName'));
      return;
    }

    if (!formData.birth_date) {
      toast.error(t('vedicAstrology.toastDob'));
      return;
    }

    if (!formData.birth_time) {
      toast.error(t('vedicAstrology.toastTime'));
      return;
    }

    if (!formData.birth_place.trim()) {
      toast.error(t('vedicAstrology.toastPlace'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            birth_name: formData.birth_name.trim(),
            birth_date: formData.birth_date,
            birth_time: formData.birth_time,
            birth_place: formData.birth_place.trim(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      toast.success(t('vedicAstrology.toastSaved'));
      onSaved?.();
    } catch (error: any) {
      console.error('Error saving birth details:', error);
      toast.error(error?.message || t('vedicAstrology.toastSaveFail'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          {t('vedicAstrology.formTitle')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('vedicAstrology.formIntro')}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birth_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('vedicAstrology.formFullNameLabel')}
            </Label>
            <Input
              id="birth_name"
              type="text"
              placeholder={t('vedicAstrology.formFullNamePlaceholder')}
              value={formData.birth_name}
              onChange={(e) => setFormData({ ...formData, birth_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('vedicAstrology.formDobLabel')}
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('vedicAstrology.formTimeLabel')}
              </Label>
              <Input
                id="birth_time"
                type="time"
                value={formData.birth_time}
                onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('vedicAstrology.formTimeHint')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_place" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('vedicAstrology.formPlaceLabel')}
            </Label>
            <Input
              id="birth_place"
              type="text"
              placeholder={t('vedicAstrology.formPlacePlaceholder')}
              value={formData.birth_place}
              onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('vedicAstrology.formPlaceHint')}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('vedicAstrology.formSaving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('vedicAstrology.formSubmit')}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t('vedicAstrology.formFooter')}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

