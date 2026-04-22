import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

/** Parse profile ISO date YYYY-MM-DD into editable parts (month/day without leading zeros). */
function splitIsoDate(iso: string | null | undefined): { y: string; m: string; d: string } {
  if (!iso || typeof iso !== 'string') return { y: '', m: '', d: '' };
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { y: '', m: '', d: '' };
  return {
    y: match[1],
    m: String(parseInt(match[2], 10)),
    d: String(parseInt(match[3], 10)),
  };
}

/** Build YYYY-MM-DD from typed parts; null if incomplete or not a real calendar date. */
function composeBirthDate(yStr: string, mStr: string, dStr: string): string | null {
  const y = yStr.trim();
  const m = mStr.trim();
  const d = dStr.trim();
  if (y.length !== 4 || !m || !d) return null;
  const yi = parseInt(y, 10);
  const mi = parseInt(m, 10);
  const di = parseInt(d, 10);
  if ([yi, mi, di].some((n) => Number.isNaN(n))) return null;
  const nowY = new Date().getFullYear();
  if (yi < 1900 || yi > nowY) return null;
  if (mi < 1 || mi > 12) return null;
  if (di < 1 || di > 31) return null;
  const dt = new Date(yi, mi - 1, di);
  if (dt.getFullYear() !== yi || dt.getMonth() !== mi - 1 || dt.getDate() !== di) return null;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (dt > endOfToday) return null;
  return `${yi}-${String(mi).padStart(2, '0')}-${String(di).padStart(2, '0')}`;
}

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
    birth_time: initialData?.birth_time || '',
    birth_place: initialData?.birth_place || '',
  });
  const [dateParts, setDateParts] = useState(() => splitIsoDate(initialData?.birth_date));

  useEffect(() => {
    setFormData({
      birth_name: initialData?.birth_name || '',
      birth_time: initialData?.birth_time || '',
      birth_place: initialData?.birth_place || '',
    });
    setDateParts(splitIsoDate(initialData?.birth_date));
  }, [
    initialData?.birth_name,
    initialData?.birth_date,
    initialData?.birth_time,
    initialData?.birth_place,
  ]);

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

    if (!dateParts.y || !dateParts.m || !dateParts.d) {
      toast.error(t('vedicAstrology.toastDob'));
      return;
    }
    const birth_date = composeBirthDate(dateParts.y, dateParts.m, dateParts.d);
    if (!birth_date) {
      toast.error(t('vedicAstrology.toastDobInvalid'));
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
            birth_date,
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
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('vedicAstrology.formDobLabel')}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="birth_year" className="text-xs font-normal text-muted-foreground">
                    {t('vedicAstrology.formDobYearLabel')}
                  </Label>
                  <Input
                    id="birth_year"
                    name="bday-year"
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-year"
                    placeholder={t('vedicAstrology.formDobYearPlaceholder')}
                    value={dateParts.y}
                    onChange={(e) =>
                      setDateParts((p) => ({ ...p, y: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                    }
                    maxLength={4}
                    required
                    aria-required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="birth_month" className="text-xs font-normal text-muted-foreground">
                    {t('vedicAstrology.formDobMonthLabel')}
                  </Label>
                  <Input
                    id="birth_month"
                    name="bday-month"
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-month"
                    placeholder={t('vedicAstrology.formDobMonthPlaceholder')}
                    value={dateParts.m}
                    onChange={(e) =>
                      setDateParts((p) => ({ ...p, m: e.target.value.replace(/\D/g, '').slice(0, 2) }))
                    }
                    maxLength={2}
                    required
                    aria-required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="birth_day" className="text-xs font-normal text-muted-foreground">
                    {t('vedicAstrology.formDobDayLabel')}
                  </Label>
                  <Input
                    id="birth_day"
                    name="bday-day"
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-day"
                    placeholder={t('vedicAstrology.formDobDayPlaceholder')}
                    value={dateParts.d}
                    onChange={(e) =>
                      setDateParts((p) => ({ ...p, d: e.target.value.replace(/\D/g, '').slice(0, 2) }))
                    }
                    maxLength={2}
                    required
                    aria-required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('vedicAstrology.formDobPartsHint')}</p>
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

