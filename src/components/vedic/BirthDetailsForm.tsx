import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
      toast.error('Please sign in to save birth details');
      return;
    }

    // Validation
    if (!formData.birth_name.trim()) {
      toast.error('Please enter your full name at birth');
      return;
    }

    if (!formData.birth_date) {
      toast.error('Please enter your date of birth');
      return;
    }

    if (!formData.birth_time) {
      toast.error('Please enter your time of birth');
      return;
    }

    if (!formData.birth_place.trim()) {
      toast.error('Please enter your place of birth');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          birth_name: formData.birth_name.trim(),
          birth_date: formData.birth_date,
          birth_time: formData.birth_time,
          birth_place: formData.birth_place.trim(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Birth details saved! Your Vedic chart is being calculated...');
      onSaved?.();
    } catch (error: any) {
      console.error('Error saving birth details:', error);
      toast.error(error?.message || 'Failed to save birth details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Vedic Birth Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your birth information for accurate Vedic astrology calculations and daily guidance
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birth_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name at Birth *
            </Label>
            <Input
              id="birth_name"
              type="text"
              placeholder="Enter your full birth name"
              value={formData.birth_name}
              onChange={(e) => setFormData({ ...formData, birth_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth *
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
                Time of Birth *
              </Label>
              <Input
                id="birth_time"
                type="time"
                value={formData.birth_time}
                onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use 24-hour format (e.g., 14:30 for 2:30 PM)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_place" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Place of Birth *
            </Label>
            <Input
              id="birth_place"
              type="text"
              placeholder="City, Country (e.g., Stockholm, Sweden)"
              value={formData.birth_place}
              onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the city and country where you were born for accurate calculations
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
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Birth Details & Calculate Chart
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your birth details are encrypted and stored securely. They are only used for Vedic astrology calculations.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

